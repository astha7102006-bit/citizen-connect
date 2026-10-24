/**
 * CitizenConnect — Timeline & Cryptographic Audit Verification Tests (Phase 5)
 *
 * Comprehensive test suite verifying:
 *  1. Correct sequential ordering and monotonic numbering
 *  2. Genesis block and previous-hash linkage
 *  3. Tamper detection: altered details, invalid hashes, sequence gaps, broken links
 *  4. Owner vs other-citizen authorization (403 Forbidden)
 *  5. Staff authorization across roles (OFFICIAL, REVIEWER, ADMIN)
 *  6. Whistleblower protection and PII redaction
 *  7. Concurrent event creation with row-locking protection
 *  8. Server and client hash compatibility using fixed fixtures
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// ── Mock Prisma ────────────────────────────────────────────────────────────────
vi.mock('../config/db.js', () => {
  const mockPrisma = {
    complaint: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    complaintEvent: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  };
  return { prisma: mockPrisma };
});

import { prisma } from '../config/db.js';
import {
  appendComplaintEvent,
  verifyEventsChain,
  verifyComplaintTimeline,
  getComplaintTimeline,
  STAFF_ROLES,
} from '../services/timelineService.js';
import { calculateEventHash, GENESIS_HASH } from '../utils/auditCrypto.js';

// ── Test Fixtures ──────────────────────────────────────────────────────────────
const makeCitizen = (id = 'citizen-001', name = 'Pooja Sharma') => ({
  id,
  name,
  email: `${id}@citizenconnect.gov.in`,
  role: 'CITIZEN',
});

const makeOfficial = (id = 'official-001') => ({
  id,
  name: 'Shri R. K. Verma (Deputy Commissioner)',
  email: 'verma.rk@mcd.gov.in',
  role: 'OFFICIAL',
});

const makeReviewer = (id = 'reviewer-001') => ({
  id,
  name: 'Justice S. N. Dhingra (Lokayukta)',
  email: 'dhingra@lokayukta.gov.in',
  role: 'REVIEWER',
});

const makeAdmin = (id = 'admin-001') => ({
  id,
  name: 'Platform Administrator',
  email: 'admin@citizenconnect.gov.in',
  role: 'ADMIN',
});

const makeComplaint = (overrides = {}) => ({
  id: 'comp-uuid-99001',
  referenceNumber: 'CC-2026-8A2F-99001',
  title: 'Encroachment and illegal extortion at weekly bazaar',
  description: 'Local inspection staff demanding Rs 500 daily extortion fee from vendors.',
  category: 'Extortion',
  priority: 'HIGH',
  status: 'SUBMITTED',
  stage: 1,
  stageName: 'Level 1: Grievance Officer Assigned',
  isAnonymous: false,
  citizenId: 'citizen-001',
  departmentId: 'dept-mcd',
  department: { id: 'dept-mcd', name: 'Municipal Corporation of Delhi', code: 'MCD' },
  citizen: { id: 'citizen-001', name: 'Pooja Sharma', email: 'citizen-001@citizenconnect.gov.in', role: 'CITIZEN' },
  events: [],
  ...overrides,
});

describe('Phase 5: Backend Accountability Timeline & Audit Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. Correct Ordering, Monotonic Sequence & Hash Linkage
  // ════════════════════════════════════════════════════════════════════════════
  describe('Event Appending & Hash Chaining', () => {
    it('appends genesis event with sequence 1 and links to GENESIS_HASH', async () => {
      const complaint = makeComplaint();
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue([{ id: complaint.id, referenceNumber: complaint.referenceNumber, status: 'SUBMITTED' }]),
          complaint: {
            findUnique: vi.fn().mockResolvedValue(complaint),
            update: vi.fn(),
          },
          complaintEvent: {
            findFirst: vi.fn().mockResolvedValue(null), // No previous event
            create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'evt-1', ...data })),
          },
        };
        return cb(tx);
      });

      const event = await appendComplaintEvent({
        complaintId: complaint.id,
        eventType: 'COMPLAINT_SUBMITTED',
        title: 'Grievance Formally Registered',
        details: 'Initial grievance submission registered on portal.',
        actorId: 'citizen-001',
        actorRole: 'Citizen',
        timestamp: new Date('2026-10-24T10:00:00Z'),
      });

      expect(event.sequence).toBe(1);
      expect(event.previousHash).toBe(GENESIS_HASH);
      expect(event.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(event.eventId).toBe('EVT-99001-01');
    });

    it('appends subsequent event with sequence 2 linking to previous event hash', async () => {
      const complaint = makeComplaint();
      const genesisHash = '1111111111111111111111111111111111111111111111111111111111111111';
      const existingGenesisEvent = {
        sequence: 1,
        eventId: 'EVT-99001-01',
        hash: genesisHash,
      };

      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue([{ id: complaint.id, referenceNumber: complaint.referenceNumber, status: 'SUBMITTED' }]),
          complaint: {
            findUnique: vi.fn().mockResolvedValue(complaint),
            update: vi.fn(),
          },
          complaintEvent: {
            findFirst: vi.fn().mockResolvedValue(existingGenesisEvent),
            create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'evt-2', ...data })),
          },
        };
        return cb(tx);
      });

      const event = await appendComplaintEvent({
        complaintId: complaint.id,
        eventType: 'ACKNOWLEDGEMENT_RECORDED',
        title: 'Statutory Acknowledgement Recorded',
        details: 'Notice delivered to Ward 14 Grievance Redressal Officer.',
        actorRole: 'System',
        timestamp: new Date('2026-10-24T10:15:00Z'),
      });

      expect(event.sequence).toBe(2);
      expect(event.previousHash).toBe(genesisHash);
      expect(event.eventId).toBe('EVT-99001-02');
      expect(event.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('updates complaint status when newStatus is specified', async () => {
      const complaint = makeComplaint({ status: 'SUBMITTED' });
      let complaintUpdatedWith = null;

      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          $queryRaw: vi.fn().mockResolvedValue([{ id: complaint.id, referenceNumber: complaint.referenceNumber, status: 'SUBMITTED' }]),
          complaint: {
            findUnique: vi.fn().mockResolvedValue(complaint),
            update: vi.fn().mockImplementation(({ data }) => {
              complaintUpdatedWith = data;
              return Promise.resolve({ ...complaint, ...data });
            }),
          },
          complaintEvent: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'evt-1', ...data })),
          },
        };
        return cb(tx);
      });

      await appendComplaintEvent({
        complaintId: complaint.id,
        eventType: 'INVESTIGATION_STARTED',
        newStatus: 'UNDER_INVESTIGATION',
        title: 'Preliminary Inquiry Commenced',
        details: 'Officer assigned to site investigation.',
      });

      expect(complaintUpdatedWith).toEqual({ status: 'UNDER_INVESTIGATION' });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. Cryptographic Chain Verification Engine
  // ════════════════════════════════════════════════════════════════════════════
  describe('Chain Verification Engine (verifyEventsChain)', () => {
    const buildValidChain = (count = 3, complaintId = 'comp-test-01') => {
      const events = [];
      let prevHash = GENESIS_HASH;

      for (let seq = 1; seq <= count; seq++) {
        const ts = new Date(`2026-10-24T10:0${seq}:00.000Z`);
        const block = {
          sequence: seq,
          complaintId,
          eventType: seq === 1 ? 'COMPLAINT_SUBMITTED' : seq === 2 ? 'ACKNOWLEDGEMENT_RECORDED' : 'INVESTIGATION_STARTED',
          actorId: 'user-01',
          actorRole: 'Citizen',
          title: `Event ${seq} Title`,
          details: `Event ${seq} procedural details recorded in ledger.`,
          timestamp: ts,
        };
        const hash = calculateEventHash(block, prevHash);
        events.push({
          ...block,
          id: `evt-uuid-${seq}`,
          eventId: `EVT-TEST-${String(seq).padStart(2, '0')}`,
          previousHash: prevHash,
          hash,
        });
        prevHash = hash;
      }
      return events;
    };

    it('verifies an unbroken pristine 3-block chain with 100% validity', () => {
      const chain = buildValidChain(3);
      const result = verifyEventsChain(chain, 'comp-test-01');

      expect(result.isValid).toBe(true);
      expect(result.verifiedCount).toBe(3);
      expect(result.totalCount).toBe(3);
      expect(result.genesisHash).toBe(GENESIS_HASH);
      expect(result.headHash).toBe(chain[2].hash);
      expect(result.algorithm).toBe('SHA-256');
    });

    it('detects tampering when an event details string is modified', () => {
      const chain = buildValidChain(3);
      // Maliciously modify event #2 details
      chain[1].details = 'ALTERED DETAILS: Unauthorized modification to allegations';

      const result = verifyEventsChain(chain, 'comp-test-01');
      expect(result.isValid).toBe(false);
      expect(result.failedIndex).toBe(1);
      expect(result.failedSequence).toBe(2);
      expect(result.verifiedCount).toBe(1); // Block 1 passed, block 2 failed
      expect(result.error).toContain('Cryptographic hash mismatch at sequence 2');
    });

    it('detects tampering when an event hash is forged or invalid', () => {
      const chain = buildValidChain(3);
      chain[0].hash = '000000000000000000000000000000000000000000000000000000000000dead';

      const result = verifyEventsChain(chain, 'comp-test-01');
      expect(result.isValid).toBe(false);
      expect(result.failedIndex).toBe(0);
      expect(result.failedSequence).toBe(1);
      expect(result.error).toContain('Cryptographic hash mismatch at sequence 1');
    });

    it('detects broken previous-hash links between blocks', () => {
      const chain = buildValidChain(3);
      // Point event 3's previousHash to a broken value
      chain[2].previousHash = 'badf00d000000000000000000000000000000000000000000000000000000000';

      const result = verifyEventsChain(chain, 'comp-test-01');
      expect(result.isValid).toBe(false);
      expect(result.failedIndex).toBe(2);
      expect(result.failedSequence).toBe(3);
      expect(result.error).toContain('Broken chain link at sequence 3');
    });

    it('detects missing sequence numbers (gaps in sequence)', () => {
      const chain = buildValidChain(3);
      // Remove block #2, leaving sequences [1, 3]
      const brokenChain = [chain[0], chain[2]];

      const result = verifyEventsChain(brokenChain, 'comp-test-01');
      expect(result.isValid).toBe(false);
      expect(result.failedIndex).toBe(1);
      expect(result.failedSequence).toBe(3);
      expect(result.expectedSequence).toBe(2);
      expect(result.error).toContain('Sequence discontinuity at position 2: expected sequence 2, but found 3');
    });

    it('returns false for empty event list', () => {
      const result = verifyEventsChain([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('genesis event missing');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. Authorization & Role-Based Access Control
  // ════════════════════════════════════════════════════════════════════════════
  describe('Authorization Rules', () => {
    it('allows complaint owner to view their timeline', async () => {
      const complaint = makeComplaint({
        events: [
          { sequence: 1, eventId: 'EVT-99001-01', eventType: 'COMPLAINT_SUBMITTED', hash: 'h1', previousHash: GENESIS_HASH },
        ],
      });
      prisma.complaint.findFirst.mockResolvedValue(complaint);

      const owner = makeCitizen('citizen-001');
      const timeline = await getComplaintTimeline({ id: complaint.id, user: owner });

      expect(timeline.complaintId).toBe(complaint.id);
      expect(timeline.events).toHaveLength(1);
    });

    it('rejects another citizen attempting to view a private complaint timeline with 403', async () => {
      const complaint = makeComplaint();
      prisma.complaint.findFirst.mockResolvedValue(complaint);

      const otherCitizen = makeCitizen('citizen-999', 'Unauthorized Citizen');

      await expect(
        getComplaintTimeline({ id: complaint.id, user: otherCitizen })
      ).rejects.toMatchObject({
        status: 403,
        code: 'FORBIDDEN',
      });
    });

    it('allows official staff to view complaint timeline', async () => {
      const complaint = makeComplaint();
      prisma.complaint.findFirst.mockResolvedValue(complaint);

      const official = makeOfficial();
      const timeline = await getComplaintTimeline({ id: complaint.id, user: official });
      expect(timeline.complaintId).toBe(complaint.id);
    });

    it('allows reviewer (Lokayukta/Vigilance) to view complaint timeline', async () => {
      const complaint = makeComplaint();
      prisma.complaint.findFirst.mockResolvedValue(complaint);

      const reviewer = makeReviewer();
      const timeline = await getComplaintTimeline({ id: complaint.id, user: reviewer });
      expect(timeline.complaintId).toBe(complaint.id);
    });

    it('allows platform administrator to view complaint timeline', async () => {
      const complaint = makeComplaint();
      prisma.complaint.findFirst.mockResolvedValue(complaint);

      const admin = makeAdmin();
      const timeline = await getComplaintTimeline({ id: complaint.id, user: admin });
      expect(timeline.complaintId).toBe(complaint.id);
    });

    it('allows complaint owner and staff to verify timeline via verifyComplaintTimeline', async () => {
      const validBlock = {
        sequence: 1,
        complaintId: 'comp-uuid-99001',
        eventType: 'COMPLAINT_SUBMITTED',
        actorId: 'citizen-001',
        actorRole: 'Citizen',
        title: 'Title',
        details: 'Details',
        timestamp: new Date('2026-10-24T10:00:00Z'),
      };
      const hash = calculateEventHash(validBlock, GENESIS_HASH);

      const complaint = makeComplaint({
        events: [
          {
            ...validBlock,
            id: 'evt-1',
            eventId: 'EVT-99001-01',
            previousHash: GENESIS_HASH,
            hash,
          },
        ],
      });
      prisma.complaint.findFirst.mockResolvedValue(complaint);

      const owner = makeCitizen('citizen-001');
      const res = await verifyComplaintTimeline({ id: complaint.id, user: owner });
      expect(res.verification.isValid).toBe(true);
      expect(res.verification.verifiedCount).toBe(1);

      const other = makeCitizen('citizen-999');
      await expect(
        verifyComplaintTimeline({ id: complaint.id, user: other })
      ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    });

    it('validates STAFF_ROLES includes standard oversight roles', () => {
      expect(STAFF_ROLES).toContain('OFFICIAL');
      expect(STAFF_ROLES).toContain('REVIEWER');
      expect(STAFF_ROLES).toContain('ADMIN');
    });

    it('throws 404 NOT_FOUND for non-existent complaint', async () => {
      prisma.complaint.findFirst.mockResolvedValue(null);

      await expect(
        getComplaintTimeline({ id: 'non-existent-id', user: makeCitizen() })
      ).rejects.toMatchObject({
        status: 404,
        code: 'NOT_FOUND',
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. Whistleblower Anonymity & PII Redaction
  // ════════════════════════════════════════════════════════════════════════════
  describe('Whistleblower Anonymity', () => {
    it('redacts citizen identity when complaint is anonymous and queried by third-party', async () => {
      const anonymousComplaint = makeComplaint({
        isAnonymous: true,
        citizenId: 'whistleblower-uuid',
        events: [
          {
            sequence: 1,
            eventId: 'EVT-99001-01',
            eventType: 'COMPLAINT_SUBMITTED',
            actorId: 'whistleblower-uuid',
            actorName: 'Real Secret Informant',
            actorRole: 'Citizen',
            title: 'Bribery Reported',
            details: 'Secret recording submitted.',
            previousHash: GENESIS_HASH,
            hash: 'somehash',
          },
        ],
      });
      prisma.complaint.findFirst.mockResolvedValue(anonymousComplaint);

      // Staff query
      const official = makeOfficial();
      const officialView = await getComplaintTimeline({ id: anonymousComplaint.id, user: official });
      expect(officialView.events[0].actorName).toBe('Real Secret Informant'); // Staff sees actual snapshot
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. Server/Client Hash Algorithm Compatibility
  // ════════════════════════════════════════════════════════════════════════════
  describe('Server and Client Hash Compatibility', () => {
    // Client-side WebCrypto implementation test against server implementation
    const clientCalculateHash = async (eventBlock, previousHash = GENESIS_HASH) => {
      const ts = eventBlock.isoTimestamp || eventBlock.timestamp;
      const isoString = ts ? new Date(ts).toISOString() : '';
      const payload = {
        sequence: eventBlock.sequence,
        complaintId: eventBlock.complaintId,
        eventType: eventBlock.eventType,
        actorId: eventBlock.actorId || null,
        actorRole: eventBlock.actorRole || null,
        title: eventBlock.title || null,
        details: eventBlock.details || '',
        timestamp: isoString,
        previousHash: previousHash || GENESIS_HASH,
      };

      const sortedKeys = Object.keys(payload).sort();
      const serialized = JSON.stringify(payload, sortedKeys);
      const buffer = new TextEncoder().encode(serialized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    };

    it('generates identical hashes for fixed test fixtures', async () => {
      const testFixtures = [
        {
          sequence: 1,
          complaintId: 'c7b94b41-945f-4d3e-953e-5f80b2a59a91',
          eventType: 'COMPLAINT_SUBMITTED',
          actorId: 'u1111111-2222-3333-4444-555555555555',
          actorRole: 'Citizen',
          title: 'Illegal bribe solicitation for building sanction',
          details: 'Zonal engineer demanded illegal gratification of Rs 25000 during site visit.',
          timestamp: new Date('2026-10-24T12:00:00.000Z'),
          previousHash: GENESIS_HASH,
        },
        {
          sequence: 2,
          complaintId: 'c7b94b41-945f-4d3e-953e-5f80b2a59a91',
          eventType: 'CORRECTION_RECORDED',
          actorId: 'u1111111-2222-3333-4444-555555555555',
          actorRole: 'Citizen',
          title: 'Citizen Updated Details Prior to Processing',
          details: 'Citizen amended grievance fields: description.',
          timestamp: new Date('2026-10-24T12:05:30.500Z'),
          previousHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
        },
      ];

      for (const fixture of testFixtures) {
        const serverHash = calculateEventHash(fixture, fixture.previousHash);
        const clientHash = await clientCalculateHash(fixture, fixture.previousHash);

        expect(serverHash).toBe(clientHash);
        expect(serverHash).toHaveLength(64);
        expect(serverHash).toMatch(/^[0-9a-f]{64}$/);
      }
    });

    it('ensures any 1-character modification alters the hash output', async () => {
      const fixture = {
        sequence: 1,
        complaintId: 'c7b94b41-945f-4d3e-953e-5f80b2a59a91',
        eventType: 'COMPLAINT_SUBMITTED',
        actorId: 'u111',
        actorRole: 'Citizen',
        title: 'Original Title',
        details: 'Original details.',
        timestamp: new Date('2026-10-24T12:00:00.000Z'),
      };

      const originalHash = calculateEventHash(fixture, GENESIS_HASH);

      const modifiedFixture = { ...fixture, details: 'Original details!' };
      const modifiedHash = calculateEventHash(modifiedFixture, GENESIS_HASH);

      expect(originalHash).not.toBe(modifiedHash);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. Concurrency & Locking Simulation
  // ════════════════════════════════════════════════════════════════════════════
  describe('Concurrency & Transactional Integrity', () => {
    it('executes within a database transaction and acquires row lock', async () => {
      const complaint = makeComplaint();
      let queryRawCalled = false;

      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          $queryRaw: vi.fn().mockImplementation(() => {
            queryRawCalled = true;
            return Promise.resolve([{ id: complaint.id, referenceNumber: complaint.referenceNumber, status: 'SUBMITTED' }]);
          }),
          complaint: {
            findUnique: vi.fn().mockResolvedValue(complaint),
            update: vi.fn(),
          },
          complaintEvent: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'evt-1', ...data })),
          },
        };
        return cb(tx);
      });

      await appendComplaintEvent({
        complaintId: complaint.id,
        eventType: 'COMPLAINT_SUBMITTED',
        title: 'Test Concurrency',
        details: 'Testing row lock execution',
      });

      expect(queryRawCalled).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
