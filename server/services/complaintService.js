/**
 * CitizenConnect — Complaint Service (Phase 4)
 *
 * Encapsulates core business logic, atomic transactions, validation,
 * access control, and audit hash-chain creation for grievances.
 */

import { prisma } from '../config/db.js';
import { generateUniqueReferenceNumber } from '../utils/referenceNumber.js';
import { calculateEventHash, GENESIS_HASH } from '../utils/auditCrypto.js';

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES = [
  'SUBMITTED',
  'ACKNOWLEDGED',
  'UNDER_INVESTIGATION',
  'ACTION_TAKEN',
  'RESOLVED',
  'CLOSED',
  'APPEALED',
];

const STAFF_ROLES = ['OFFICIAL', 'REVIEWER', 'ADMIN'];

/**
 * Sanitizes a complaint object safe for citizen responses.
 * Removes internal fields and passwords from user relations.
 */
export function sanitizeComplaint(complaint) {
  if (!complaint) return null;
  const safe = { ...complaint };
  if (safe.citizen) {
    // eslint-disable-next-line no-unused-vars
    const { passwordHash, ...safeCitizen } = safe.citizen;
    safe.citizen = safeCitizen;
  }
  return safe;
}

/**
 * Strips PII and internal storage metadata for public / unauthenticated tracking.
 */
export function sanitizePublicComplaint(complaint) {
  if (!complaint) return null;
  return {
    id: complaint.id,
    referenceNumber: complaint.referenceNumber,
    title: complaint.title,
    category: complaint.category,
    status: complaint.status,
    stage: complaint.stage,
    stageName: complaint.stageName,
    priority: complaint.priority,
    filedAt: complaint.filedAt,
    slaDaysRemaining: complaint.slaDaysRemaining,
    department: complaint.department
      ? {
          id: complaint.department.id,
          name: complaint.department.name,
          code: complaint.department.code,
        }
      : null,
    events: (complaint.events || []).map((e) => ({
      sequence: e.sequence,
      eventId: e.eventId,
      eventType: e.eventType,
      title: e.title,
      details: e.details,
      timestamp: e.timestamp,
      hash: e.hash,
    })),
  };
}

// ── 1. Create Complaint ────────────────────────────────────────────────────────

/**
 * Create a new Citizen Complaint with atomic initial ComplaintEvent.
 *
 * Rules:
 *  - Citizen identity is ALWAYS derived from user session.
 *  - Reference number is generated server-side.
 *  - Initial ComplaintEvent is saved in the SAME transaction.
 *  - Citizens cannot assign department, status, or stage.
 *
 * @param {object} params
 * @param {object} params.user - Authenticated session user
 * @param {object} params.body - Request payload
 * @returns {Promise<object>} Created complaint
 */
export async function createComplaint({ user, body }) {
  const { title, description, category, priority, isAnonymous } = body ?? {};

  // Validation
  const errors = [];
  if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 200) {
    errors.push('Title is required and must be between 3 and 200 characters.');
  }
  if (!description || typeof description !== 'string' || description.trim().length < 15 || description.trim().length > 10000) {
    errors.push('Description is required and must be between 15 and 10,000 characters.');
  }
  if (!category || typeof category !== 'string' || category.trim().length < 2 || category.trim().length > 100) {
    errors.push('Category is required and must be between 2 and 100 characters.');
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    err.details = { errors };
    throw err;
  }

  const cleanPriority = priority || 'MEDIUM';
  const cleanIsAnonymous = Boolean(isAnonymous);

  // Generate unique public reference
  const referenceNumber = await generateUniqueReferenceNumber();

  // Execute in atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create complaint record
    const complaint = await tx.complaint.create({
      data: {
        referenceNumber,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        priority: cleanPriority,
        status: 'SUBMITTED',
        stage: 1,
        stageName: 'Level 1: Grievance Officer Assigned',
        isAnonymous: cleanIsAnonymous,
        citizenId: user.id, // Derived strictly from authenticated session
        departmentId: null, // Department assignment only via authorized workflow in later phases
        slaDaysRemaining: 7,
      },
    });

    // 2. Prepare Genesis Audit Event Block
    const now = new Date();
    const eventShortRef = referenceNumber.replace(/[^A-Za-z0-9]/g, '').slice(-5);
    const eventId = `EVT-${eventShortRef}-01`;

    const eventBlockWithoutHash = {
      sequence: 1,
      complaintId: complaint.id,
      eventType: 'COMPLAINT_SUBMITTED',
      actorId: user.id,
      actorRole: 'Citizen',
      title: 'Grievance Formally Registered',
      details: `Grievance registered under category "${complaint.category}". Initial statutory SLA window (7 days) activated.`,
      timestamp: now,
    };

    const hash = calculateEventHash(eventBlockWithoutHash, GENESIS_HASH);

    // 3. Create Genesis ComplaintEvent
    await tx.complaintEvent.create({
      data: {
        sequence: 1,
        eventId,
        complaintId: complaint.id,
        eventType: 'COMPLAINT_SUBMITTED',
        newStatus: 'SUBMITTED',
        actorId: user.id,
        actorName: cleanIsAnonymous ? 'Whistleblower (Protected)' : user.name,
        actorRole: 'Citizen',
        title: 'Grievance Formally Registered',
        details: eventBlockWithoutHash.details,
        previousHash: GENESIS_HASH,
        hash,
        metadata: {
          isAnonymous: cleanIsAnonymous,
          submissionChannel: 'CitizenConnect Web Portal',
        },
        timestamp: now,
      },
    });

    return complaint;
  });

  // Re-fetch with relations for complete response
  const full = await prisma.complaint.findUnique({
    where: { id: result.id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      events: { orderBy: { sequence: 'asc' } },
    },
  });

  return sanitizeComplaint(full);
}

// ── 2. Get Citizen Complaints ──────────────────────────────────────────────────

/**
 * Returns complaints for the authenticated citizen with pagination and filters.
 *
 * @param {object} params
 * @param {object} params.user - Authenticated session user
 * @param {object} params.query - Query params: page, limit, status, category, priority, search
 * @returns {Promise<{ complaints: object[], meta: object }>}
 */
export async function getCitizenComplaints({ user, query }) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(query.limit || '10', 10)));
  const skip = (page - 1) * limit;

  // Authorization: Citizens can only see their own complaints
  const where = {
    citizenId: user.id,
  };

  // Optional filters
  if (query.status && VALID_STATUSES.includes(query.status)) {
    where.status = query.status;
  }
  if (query.priority && VALID_PRIORITIES.includes(query.priority)) {
    where.priority = query.priority;
  }
  if (query.category && typeof query.category === 'string') {
    where.category = { contains: query.category.trim(), mode: 'insensitive' };
  }
  if (query.search && typeof query.search === 'string') {
    const term = query.search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { referenceNumber: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { events: true, evidence: true } },
      },
    }),
  ]);

  return {
    complaints: complaints.map(sanitizeComplaint),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

// ── 3. Get Complaint by ID ─────────────────────────────────────────────────────

/**
 * Return an individual complaint if authorized.
 *
 * @param {object} params
 * @param {string} params.id - Complaint ID (UUID)
 * @param {object} params.user - Authenticated session user
 * @returns {Promise<object>} Complaint record
 */
export async function getComplaintById({ id, user }) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      department: true,
      citizen: { select: { id: true, name: true, email: true, phone: true, role: true } },
      events: { orderBy: { sequence: 'asc' } },
      evidence: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          contentType: true,
          fileSize: true,
          sha256Fingerprint: true,
          verificationStatus: true,
          isRedacted: true,
          uploadedAt: true,
          // storageKey intentionally omitted
        },
      },
      officialResponses: { orderBy: { submittedAt: 'desc' } },
      escalations: { orderBy: { createdAt: 'desc' } },
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
    const err = new Error('You do not have permission to view this complaint.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  return sanitizeComplaint(complaint);
}

// ── 4. Track Complaint by Reference Number ─────────────────────────────────────

/**
 * Public/Private tracking lookup.
 * If requester is the verified complaint owner or staff, returns full details.
 * If public or different user, returns sanitized public view without PII.
 *
 * @param {object} params
 * @param {string} params.referenceNumber - e.g. "CC-2026-7B9C-38491"
 * @param {object} [params.user] - Optional authenticated user
 * @returns {Promise<object>}
 */
export async function trackComplaintByReference({ referenceNumber, user }) {
  const normalizedRef = referenceNumber.trim().toUpperCase();

  const complaint = await prisma.complaint.findUnique({
    where: { referenceNumber: normalizedRef },
    include: {
      department: true,
      events: { orderBy: { sequence: 'asc' } },
      officialResponses: {
        where: { status: 'PUBLISHED' },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!complaint) {
    const err = new Error(`No complaint found with reference number: ${normalizedRef}`);
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // If restricted from public records
  if (complaint.isRestrictedFromPublic) {
    const isOwner = user && complaint.citizenId === user.id;
    const isStaff = user && STAFF_ROLES.includes(user.role);
    if (!isOwner && !isStaff) {
      const err = new Error('This complaint record is restricted from public viewing.');
      err.code = 'RECORD_RESTRICTED';
      err.status = 404;
      throw err;
    }
  }

  const isOwner = user && complaint.citizenId === user.id;
  const isStaff = user && STAFF_ROLES.includes(user.role);

  if (isOwner || isStaff) {
    return sanitizeComplaint(complaint);
  }

  // Public safe view
  return sanitizePublicComplaint(complaint);
}

// ── 5. Update Complaint (Eligible Citizen Edits Only) ───────────────────────────

/**
 * Permits only explicitly allowed edits by the complaint owner prior to processing.
 *
 * @param {object} params
 * @param {string} params.id - Complaint ID
 * @param {object} params.user - Authenticated user
 * @param {object} params.body - Request updates
 * @returns {Promise<object>} Updated complaint
 */
export async function updateComplaint({ id, user, body }) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      events: { orderBy: { sequence: 'desc' }, take: 1 },
    },
  });

  if (!complaint) {
    const err = new Error('Complaint not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Only the complaint owner can edit
  if (complaint.citizenId !== user.id) {
    const err = new Error('You do not have permission to modify this complaint.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  // Edits permitted ONLY before official processing begins (status must be SUBMITTED)
  if (complaint.status !== 'SUBMITTED') {
    const err = new Error(
      `Complaint cannot be edited once under processing (Current status: ${complaint.status}).`
    );
    err.code = 'STATUS_LOCKED';
    err.status = 400;
    throw err;
  }

  // Check for attempted privilege escalation or protected field modifications
  const protectedFields = [
    'status',
    'stage',
    'stageName',
    'departmentId',
    'citizenId',
    'referenceNumber',
    'isRestrictedFromPublic',
    'restrictionReason',
    'slaDaysRemaining',
    'resolvedAt',
  ];
  for (const field of protectedFields) {
    if (body[field] !== undefined) {
      const err = new Error(`Modification of protected field "${field}" is prohibited.`);
      err.code = 'PROTECTED_FIELD_VIOLATION';
      err.status = 400;
      throw err;
    }
  }

  // Allowed editable fields
  const updates = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 200) {
      const err = new Error('Title must be between 3 and 200 characters.');
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }
    updates.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.trim().length < 15 || body.description.trim().length > 10000) {
      const err = new Error('Description must be between 15 and 10,000 characters.');
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }
    updates.description = body.description.trim();
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || body.category.trim().length < 2 || body.category.trim().length > 100) {
      const err = new Error('Category must be between 2 and 100 characters.');
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }
    updates.category = body.category.trim();
  }

  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(body.priority)) {
      const err = new Error(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
      err.code = 'VALIDATION_ERROR';
      err.status = 400;
      throw err;
    }
    updates.priority = body.priority;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error('No valid editable fields provided.');
    err.code = 'NO_CHANGES';
    err.status = 400;
    throw err;
  }

  // Execute in transaction: update complaint and append CORRECTION_RECORDED event
  const updatedComplaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id },
      data: updates,
    });

    const lastEvent = complaint.events[0];
    const nextSequence = (lastEvent?.sequence || 1) + 1;
    const previousHash = lastEvent?.hash || GENESIS_HASH;
    const now = new Date();

    const eventBlockWithoutHash = {
      sequence: nextSequence,
      complaintId: id,
      eventType: 'CORRECTION_RECORDED',
      actorId: user.id,
      actorRole: 'Citizen',
      title: 'Citizen Updated Details Prior to Processing',
      details: `Citizen amended grievance fields: ${Object.keys(updates).join(', ')}.`,
      timestamp: now,
    };

    const hash = calculateEventHash(eventBlockWithoutHash, previousHash);

    await tx.complaintEvent.create({
      data: {
        sequence: nextSequence,
        eventId: `EVT-${complaint.referenceNumber.replace(/[^A-Za-z0-9]/g, '').slice(-5)}-${String(nextSequence).padStart(2, '0')}`,
        complaintId: id,
        eventType: 'CORRECTION_RECORDED',
        actorId: user.id,
        actorName: complaint.isAnonymous ? 'Whistleblower (Protected)' : user.name,
        actorRole: 'Citizen',
        title: eventBlockWithoutHash.title,
        details: eventBlockWithoutHash.details,
        previousHash,
        hash,
        timestamp: now,
      },
    });

    return updated;
  });

  const full = await prisma.complaint.findUnique({
    where: { id: updatedComplaint.id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      events: { orderBy: { sequence: 'asc' } },
    },
  });

  return sanitizeComplaint(full);
}
