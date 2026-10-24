/**
 * CitizenConnect — Timeline & Audit Verification Service (Phase 5)
 *
 * Implements tamper-evident audit trail management:
 * - Sequential event appending with monotonic numbering.
 * - Cryptographic SHA-256 hash linking rooted in GENESIS_HASH.
 * - Concurrency protection using Prisma transactions & row locking.
 * - Chain verification detecting broken links, altered event data, and sequence gaps.
 * - Strict role-based access control (citizen owner vs staff).
 * - Never rewrites or silently alters historical records.
 */

import { prisma } from '../config/db.js';
import { calculateEventHash, GENESIS_HASH } from '../utils/auditCrypto.js';

export const STAFF_ROLES = ['OFFICIAL', 'REVIEWER', 'ADMIN'];

/**
 * Validates a complaint event array against the cryptographic hash-chain rules.
 *
 * @param {Array<object>} events - Ascending chronological events
 * @param {string} [complaintId] - Target complaint identifier
 * @returns {object} Verification report
 */
export function verifyEventsChain(events = [], complaintId = null) {
  if (!events || events.length === 0) {
    return {
      isValid: false,
      error: 'Timeline contains no recorded events (genesis event missing).',
      verifiedCount: 0,
      totalCount: 0,
      genesisHash: GENESIS_HASH,
      headHash: null,
      failedIndex: 0,
      failedSequence: null,
      failedEventId: null,
    };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const current = events[i];
    const expectedSequence = i + 1;

    // Check 1: Sequential continuity
    if (current.sequence !== expectedSequence) {
      return {
        isValid: false,
        failedIndex: i,
        failedSequence: current.sequence,
        expectedSequence,
        failedEventId: current.eventId || current.id,
        eventType: current.eventType,
        error: `Sequence discontinuity at position ${i + 1}: expected sequence ${expectedSequence}, but found ${current.sequence}.`,
        verifiedCount: i,
        totalCount: events.length,
        headHash: expectedPrevHash,
        genesisHash: GENESIS_HASH,
      };
    }

    // Check 2: Previous hash link integrity
    if (current.previousHash !== expectedPrevHash) {
      return {
        isValid: false,
        failedIndex: i,
        failedSequence: current.sequence,
        failedEventId: current.eventId || current.id,
        eventType: current.eventType,
        error: `Broken chain link at sequence ${current.sequence} (${current.eventId || current.id}): expected previousHash '${expectedPrevHash}', but found '${current.previousHash}'.`,
        verifiedCount: i,
        totalCount: events.length,
        headHash: expectedPrevHash,
        genesisHash: GENESIS_HASH,
      };
    }

    // Check 3: Cryptographic content hash recalculation
    const eventBlockWithoutHash = {
      sequence: current.sequence,
      complaintId: current.complaintId || complaintId,
      eventType: current.eventType,
      actorId: current.actorId || null,
      actorRole: current.actorRole || null,
      title: current.title || null,
      details: current.details || '',
      timestamp: current.timestamp,
    };

    const computedHash = calculateEventHash(eventBlockWithoutHash, current.previousHash);

    if (computedHash !== current.hash) {
      return {
        isValid: false,
        failedIndex: i,
        failedSequence: current.sequence,
        failedEventId: current.eventId || current.id,
        eventType: current.eventType,
        error: `Cryptographic hash mismatch at sequence ${current.sequence} (${current.eventId || current.id}): computed hash '${computedHash}' does not match recorded hash '${current.hash}'. Event data was altered or corrupted.`,
        verifiedCount: i,
        totalCount: events.length,
        headHash: expectedPrevHash,
        genesisHash: GENESIS_HASH,
      };
    }

    // Advance head to current valid block
    expectedPrevHash = current.hash;
  }

  return {
    isValid: true,
    verifiedCount: events.length,
    totalCount: events.length,
    genesisHash: GENESIS_HASH,
    headHash: expectedPrevHash,
    algorithm: 'SHA-256',
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Appends a new ComplaintEvent to a complaint's audit timeline with concurrency protection.
 *
 * @param {object} params
 * @param {string} params.complaintId - Target Complaint ID (UUID)
 * @param {string} params.eventType - Valid EventType enum value
 * @param {string} params.title - Short summary of event
 * @param {string} params.details - Full procedural detail
 * @param {string} [params.actorId] - User ID of actor
 * @param {string} [params.actorName] - Snapshot of actor display name
 * @param {string} [params.actorRole] - e.g. "Citizen", "Official", "Reviewer", "System"
 * @param {string} [params.responsibleDepartment] - Department snapshot
 * @param {string} [params.previousStatus] - ComplaintStatus enum
 * @param {string} [params.newStatus] - ComplaintStatus enum
 * @param {string} [params.reason] - Required for transfers, closures, corrections
 * @param {object} [params.metadata] - Structured JSON attributes
 * @param {Date|string} [params.timestamp] - Event occurrence time
 * @param {object} [params.prismaTx] - Optional existing transaction
 * @returns {Promise<object>} The newly created ComplaintEvent record
 */
export async function appendComplaintEvent({
  complaintId,
  eventType,
  title,
  details,
  actorId = null,
  actorName = null,
  actorRole = null,
  responsibleDepartment = null,
  previousStatus = null,
  newStatus = null,
  reason = null,
  metadata = null,
  timestamp = null,
  prismaTx = null,
}) {
  if (!complaintId) {
    const err = new Error('complaintId is required to append an audit event.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }
  if (!eventType) {
    const err = new Error('eventType is required to append an audit event.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }
  if (!details || typeof details !== 'string') {
    const err = new Error('details string is required for audit trail completeness.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const runWithTx = async (tx) => {
    // 1. Lock complaint row to prevent race conditions during concurrent appends
    let complaint;
    if (typeof tx.$queryRaw === 'function') {
      try {
        const rows = await tx.$queryRaw`SELECT id, "referenceNumber", "isAnonymous", status FROM "complaints" WHERE id = ${complaintId} FOR UPDATE`;
        if (rows && rows.length > 0) {
          complaint = rows[0];
        }
      } catch {
        // Fallback if raw query is not supported in the active environment/mock
      }
    }

    if (!complaint) {
      complaint = await tx.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, referenceNumber: true, isAnonymous: true, status: true },
      });
    }

    if (!complaint) {
      const err = new Error('Complaint not found.');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }

    // 2. Fetch the latest event to find current tail
    const lastEvent = await tx.complaintEvent.findFirst({
      where: { complaintId },
      orderBy: { sequence: 'desc' },
    });

    const sequence = (lastEvent?.sequence || 0) + 1;
    const previousHash = lastEvent?.hash || GENESIS_HASH;
    const now = timestamp ? new Date(timestamp) : new Date();

    const shortRef = (complaint.referenceNumber || complaintId).replace(/[^A-Za-z0-9]/g, '').slice(-5);
    const eventId = `EVT-${shortRef}-${String(sequence).padStart(2, '0')}`;

    // 3. Prepare block payload for deterministic SHA-256 calculation
    const eventBlockWithoutHash = {
      sequence,
      complaintId,
      eventType,
      actorId: actorId || null,
      actorRole: actorRole || null,
      title: title || null,
      details: details.trim(),
      timestamp: now,
    };

    const hash = calculateEventHash(eventBlockWithoutHash, previousHash);

    // 4. Create the new event block
    const newEvent = await tx.complaintEvent.create({
      data: {
        sequence,
        eventId,
        complaintId,
        eventType,
        previousStatus: previousStatus || complaint.status || null,
        newStatus: newStatus || null,
        actorId: actorId || null,
        actorName: actorName || null,
        actorRole: actorRole || null,
        responsibleDepartment: responsibleDepartment || null,
        title: title ? title.trim() : null,
        details: details.trim(),
        reason: reason ? reason.trim() : null,
        previousHash,
        hash,
        metadata: metadata || null,
        timestamp: now,
      },
    });

    // 5. Update complaint status if newStatus provided
    if (newStatus && newStatus !== complaint.status) {
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status: newStatus },
      });
    }

    return newEvent;
  };

  if (prismaTx) {
    return runWithTx(prismaTx);
  }

  return prisma.$transaction(runWithTx);
}

/**
 * Retrieves the full chronological timeline for a complaint with role-based access control.
 *
 * @param {object} params
 * @param {string} params.id - Complaint ID (UUID) or Reference Number
 * @param {object} params.user - Authenticated session user
 * @returns {Promise<object>} Timeline payload
 */
export async function getComplaintTimeline({ id, user }) {
  if (!id) {
    const err = new Error('Complaint ID or reference number is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const normalized = id.trim();
  const complaint = await prisma.complaint.findFirst({
    where: {
      OR: [
        { id: normalized },
        { referenceNumber: normalized.toUpperCase() },
      ],
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      citizen: { select: { id: true, name: true, email: true, role: true } },
      events: { orderBy: { sequence: 'asc' } },
    },
  });

  if (!complaint) {
    const err = new Error('Complaint not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Authorization check
  const isOwner = complaint.citizenId === user.id;
  const isStaff = STAFF_ROLES.includes(user.role);

  if (!isOwner && !isStaff) {
    const err = new Error('You do not have permission to view this complaint timeline.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const isAnonymousRedacted = complaint.isAnonymous && !isStaff && !isOwner;

  return {
    complaintId: complaint.id,
    referenceNumber: complaint.referenceNumber,
    title: complaint.title,
    status: complaint.status,
    stage: complaint.stage,
    stageName: complaint.stageName,
    isAnonymous: complaint.isAnonymous,
    department: complaint.department,
    totalEvents: complaint.events.length,
    headHash: complaint.events[complaint.events.length - 1]?.hash || GENESIS_HASH,
    events: complaint.events.map((e) => ({
      id: e.id,
      sequence: e.sequence,
      eventId: e.eventId,
      eventType: e.eventType,
      previousStatus: e.previousStatus,
      newStatus: e.newStatus,
      actorId: isAnonymousRedacted ? null : e.actorId,
      actorName: isAnonymousRedacted ? 'Whistleblower (Protected)' : e.actorName,
      actorRole: e.actorRole,
      responsibleDepartment: e.responsibleDepartment,
      title: e.title,
      details: e.details,
      reason: e.reason,
      previousHash: e.previousHash,
      hash: e.hash,
      metadata: e.metadata,
      timestamp: e.timestamp,
      createdAt: e.createdAt,
    })),
  };
}

/**
 * Verifies the complete cryptographic audit chain for a complaint.
 *
 * @param {object} params
 * @param {string} params.id - Complaint ID (UUID) or Reference Number
 * @param {object} params.user - Authenticated session user
 * @returns {Promise<object>} Verification report
 */
export async function verifyComplaintTimeline({ id, user }) {
  if (!id) {
    const err = new Error('Complaint ID or reference number is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const normalized = id.trim();
  const complaint = await prisma.complaint.findFirst({
    where: {
      OR: [
        { id: normalized },
        { referenceNumber: normalized.toUpperCase() },
      ],
    },
    include: {
      events: { orderBy: { sequence: 'asc' } },
    },
  });

  if (!complaint) {
    const err = new Error('Complaint not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Authorization check
  const isOwner = complaint.citizenId === user.id;
  const isStaff = STAFF_ROLES.includes(user.role);

  if (!isOwner && !isStaff) {
    const err = new Error('You do not have permission to verify this complaint timeline.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const verification = verifyEventsChain(complaint.events, complaint.id);

  return {
    complaintId: complaint.id,
    referenceNumber: complaint.referenceNumber,
    verification,
  };
}
