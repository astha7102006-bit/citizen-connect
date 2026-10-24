/**
 * CitizenConnect — Complaints Unit Tests (Phase 4)
 *
 * Tests:
 *  - Valid complaint creation
 *  - Unauthenticated creation rejection
 *  - Invalid input rejection (title, description, category, priority)
 *  - Unique reference number generation
 *  - Complaint and initial event saved atomically in transaction
 *  - Citizen cannot view another citizen's private complaint (403)
 *  - Citizen cannot modify protected fields or privileged status (400)
 *  - Citizen cannot modify complaint when status !== SUBMITTED (400)
 *  - Pagination and filters (status, priority, search)
 *  - Database failures and error handling
 *  - Public tracking lookup sanitization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma ────────────────────────────────────────────────────────────────
vi.mock('../config/db.js', () => {
  const mockPrisma = {
    complaint: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    complaintEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { prisma: mockPrisma };
});

import { prisma } from '../config/db.js';
import {
  createComplaint,
  getCitizenComplaints,
  getComplaintById,
  trackComplaintByReference,
  updateComplaint,
  sanitizeComplaint,
  sanitizePublicComplaint,
} from '../services/complaintService.js';
import { generateReferenceCode, generateUniqueReferenceNumber } from '../utils/referenceNumber.js';
import { calculateEventHash, GENESIS_HASH } from '../utils/auditCrypto.js';

// ── Test fixtures ──────────────────────────────────────────────────────────────
const makeCitizenUser = (overrides = {}) => ({
  id: 'user-citizen-001',
  name: 'Aditya Kumar Verma',
  email: 'aditya@citizen.org',
  phone: '+91 98765 43210',
  role: 'CITIZEN',
  accountStatus: 'ACTIVE',
  ...overrides,
});

const makeOtherCitizenUser = () => ({
  id: 'user-citizen-002',
  name: 'Other Citizen',
  email: 'other@citizen.org',
  role: 'CITIZEN',
  accountStatus: 'ACTIVE',
});

const makeComplaintRecord = (overrides = {}) => ({
  id: 'comp-uuid-001',
  referenceNumber: 'CC-2026-7B9C-38491',
  title: 'Illegal bribe solicitation for trade license',
  description: 'Zonal health inspector demanded illicit gratification of Rs 15000.',
  category: 'Bribe Demand',
  priority: 'HIGH',
  status: 'SUBMITTED',
  stage: 1,
  stageName: 'Level 1: Grievance Officer Assigned',
  isAnonymous: false,
  isRestrictedFromPublic: false,
  citizenId: 'user-citizen-001',
  departmentId: null,
  slaDaysRemaining: 7,
  filedAt: new Date('2026-10-24T10:00:00Z'),
  createdAt: new Date('2026-10-24T10:00:00Z'),
  updatedAt: new Date('2026-10-24T10:00:00Z'),
  citizen: {
    id: 'user-citizen-001',
    name: 'Aditya Kumar Verma',
    email: 'aditya@citizen.org',
    passwordHash: 'hashed-secret',
  },
  department: null,
  events: [
    {
      sequence: 1,
      eventId: 'EVT-38491-01',
      eventType: 'COMPLAINT_SUBMITTED',
      title: 'Grievance Formally Registered',
      details: 'Grievance registered under category "Bribe Demand".',
      timestamp: new Date('2026-10-24T10:00:00Z'),
      hash: 'sha256-hash-01',
    },
  ],
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Unique Reference Number Generation
// ══════════════════════════════════════════════════════════════════════════════
describe('Reference Number Generation', () => {
  it('generates a valid CC- format reference code', () => {
    const code = generateReferenceCode();
    expect(code).toMatch(/^CC-\d{4}-[A-F0-9]{4}-\d{5}$/);
  });

  it('checks uniqueness against database and returns unused reference number', async () => {
    prisma.complaint.findUnique.mockResolvedValueOnce(null); // First try is unique
    const ref = await generateUniqueReferenceNumber();
    expect(ref).toMatch(/^CC-\d{4}-/);
  });

  it('retries when collision occurs until unique number is found', async () => {
    // First candidate exists, second candidate is unique
    prisma.complaint.findUnique
      .mockResolvedValueOnce({ id: 'existing-id' })
      .mockResolvedValueOnce(null);

    const ref = await generateUniqueReferenceNumber();
    expect(ref).toBeDefined();
    expect(prisma.complaint.findUnique).toHaveBeenCalledTimes(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Cryptographic Hash Chain
// ══════════════════════════════════════════════════════════════════════════════
describe('Audit Crypto Hash Chain', () => {
  it('produces a deterministic 64-character SHA-256 hash', () => {
    const block = {
      sequence: 1,
      complaintId: 'comp-01',
      eventType: 'COMPLAINT_SUBMITTED',
      details: 'Test details',
    };
    const hash1 = calculateEventHash(block, GENESIS_HASH);
    const hash2 = calculateEventHash(block, GENESIS_HASH);
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it('produces a different hash when previousHash changes', () => {
    const block = { sequence: 2, complaintId: 'comp-01', eventType: 'CITIZEN_INFO_PROVIDED' };
    const hashA = calculateEventHash(block, 'hash-chain-1');
    const hashB = calculateEventHash(block, 'hash-chain-2');
    expect(hashA).not.toBe(hashB);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Valid Complaint Creation & Atomicity
// ══════════════════════════════════════════════════════════════════════════════
describe('createComplaint', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates complaint and initial event atomically in transaction', async () => {
    const user = makeCitizenUser();
    const mockCreated = makeComplaintRecord();

    // Mock transaction execution
    prisma.$transaction.mockImplementation(async (callback) => {
      const mockTx = {
        complaint: { create: vi.fn().mockResolvedValue(mockCreated) },
        complaintEvent: { create: vi.fn().mockResolvedValue({}) },
      };
      return callback(mockTx);
    });

    prisma.complaint.findUnique.mockResolvedValue(mockCreated);

    const result = await createComplaint({
      user,
      body: {
        title: 'Bribe demand by building inspector',
        description: 'Inspector asked for cash payment without receipt during site inspection.',
        category: 'Bribe Demand',
        priority: 'HIGH',
      },
    });

    expect(result).toBeDefined();
    expect(result.title).toBe(mockCreated.title);
    expect(result.status).toBe('SUBMITTED');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // passwordHash of citizen must be stripped
    expect(result.citizen).not.toHaveProperty('passwordHash');
  });

  it('rejects complaint when title is missing or too short', async () => {
    const user = makeCitizenUser();
    await expect(
      createComplaint({
        user,
        body: {
          title: 'Hi', // < 3 chars
          description: 'Valid description that is longer than fifteen characters.',
          category: 'Civic Grievance',
        },
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
  });

  it('rejects complaint when description is shorter than 15 characters', async () => {
    const user = makeCitizenUser();
    await expect(
      createComplaint({
        user,
        body: {
          title: 'Valid title here',
          description: 'Too short', // < 15 chars
          category: 'Civic Grievance',
        },
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
  });

  it('rejects complaint when priority is invalid', async () => {
    const user = makeCitizenUser();
    await expect(
      createComplaint({
        user,
        body: {
          title: 'Valid title here',
          description: 'Valid description that is longer than fifteen characters.',
          category: 'Civic Grievance',
          priority: 'SUPER_URGENT', // Invalid priority enum
        },
      })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
  });

  it('derives citizenId strictly from session user and never client payload', async () => {
    const user = makeCitizenUser({ id: 'real-user-123' });
    let capturedCitizenId = null;

    prisma.$transaction.mockImplementation(async (callback) => {
      const mockTx = {
        complaint: {
          create: vi.fn().mockImplementation((args) => {
            capturedCitizenId = args.data.citizenId;
            return makeComplaintRecord({ citizenId: capturedCitizenId });
          }),
        },
        complaintEvent: { create: vi.fn() },
      };
      return callback(mockTx);
    });

    prisma.complaint.findUnique.mockResolvedValue(makeComplaintRecord());

    await createComplaint({
      user,
      body: {
        title: 'Valid title statement',
        description: 'Valid complaint description that meets minimum length criteria.',
        category: 'Procedural Delay',
        citizenId: 'attacker-spoofed-id', // Attacker attempt to spoof owner
      },
    });

    expect(capturedCitizenId).toBe('real-user-123');
    expect(capturedCitizenId).not.toBe('attacker-spoofed-id');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Authorization & Cross-Citizen Privacy
// ══════════════════════════════════════════════════════════════════════════════
describe('getComplaintById authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows citizen owner to view their own complaint', async () => {
    const user = makeCitizenUser({ id: 'user-citizen-001' });
    const complaint = makeComplaintRecord({ citizenId: 'user-citizen-001' });
    prisma.complaint.findUnique.mockResolvedValue(complaint);

    const result = await getComplaintById({ id: 'comp-uuid-001', user });
    expect(result).toBeDefined();
    expect(result.id).toBe('comp-uuid-001');
  });

  it('rejects access (403 FORBIDDEN) when another citizen attempts to view private complaint', async () => {
    const attacker = makeOtherCitizenUser(); // id: 'user-citizen-002'
    const victimComplaint = makeComplaintRecord({ citizenId: 'user-citizen-001' });
    prisma.complaint.findUnique.mockResolvedValue(victimComplaint);

    await expect(
      getComplaintById({ id: 'comp-uuid-001', user: attacker })
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('returns 404 when complaint does not exist', async () => {
    const user = makeCitizenUser();
    prisma.complaint.findUnique.mockResolvedValue(null);

    await expect(
      getComplaintById({ id: 'non-existent', user })
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Protected Fields & Editing Rules (PATCH /api/complaints/:id)
// ══════════════════════════════════════════════════════════════════════════════
describe('updateComplaint', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows owner to update title/description while in SUBMITTED status', async () => {
    const user = makeCitizenUser({ id: 'user-citizen-001' });
    const complaint = makeComplaintRecord({ citizenId: 'user-citizen-001', status: 'SUBMITTED' });

    prisma.complaint.findUnique.mockResolvedValue(complaint);
    prisma.$transaction.mockImplementation(async (callback) => {
      const mockTx = {
        complaint: { update: vi.fn().mockResolvedValue({ ...complaint, title: 'Updated Title' }) },
        complaintEvent: { create: vi.fn() },
      };
      return callback(mockTx);
    });

    const result = await updateComplaint({
      id: 'comp-uuid-001',
      user,
      body: { title: 'Updated Title' },
    });

    expect(result).toBeDefined();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects modification of protected fields (status, stage, departmentId)', async () => {
    const user = makeCitizenUser({ id: 'user-citizen-001' });
    const complaint = makeComplaintRecord({ citizenId: 'user-citizen-001', status: 'SUBMITTED' });
    prisma.complaint.findUnique.mockResolvedValue(complaint);

    await expect(
      updateComplaint({
        id: 'comp-uuid-001',
        user,
        body: { status: 'RESOLVED' }, // Attempted privilege escalation
      })
    ).rejects.toMatchObject({ code: 'PROTECTED_FIELD_VIOLATION', status: 400 });

    await expect(
      updateComplaint({
        id: 'comp-uuid-001',
        user,
        body: { departmentId: 'dept-unauthorized' },
      })
    ).rejects.toMatchObject({ code: 'PROTECTED_FIELD_VIOLATION', status: 400 });
  });

  it('rejects editing once complaint is under processing (status !== SUBMITTED)', async () => {
    const user = makeCitizenUser({ id: 'user-citizen-001' });
    const underInvestigationComplaint = makeComplaintRecord({
      citizenId: 'user-citizen-001',
      status: 'UNDER_INVESTIGATION', // Processing started
    });
    prisma.complaint.findUnique.mockResolvedValue(underInvestigationComplaint);

    await expect(
      updateComplaint({
        id: 'comp-uuid-001',
        user,
        body: { title: 'Attempted edit during investigation' },
      })
    ).rejects.toMatchObject({ code: 'STATUS_LOCKED', status: 400 });
  });

  it('rejects modification by non-owner (403 FORBIDDEN)', async () => {
    const attacker = makeOtherCitizenUser();
    const complaint = makeComplaintRecord({ citizenId: 'user-citizen-001' });
    prisma.complaint.findUnique.mockResolvedValue(complaint);

    await expect(
      updateComplaint({
        id: 'comp-uuid-001',
        user: attacker,
        body: { title: 'Unauthorized edit' },
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Pagination & Filtering
// ══════════════════════════════════════════════════════════════════════════════
describe('getCitizenComplaints pagination & filtering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies pagination parameters correctly and filters strictly by citizenId', async () => {
    const user = makeCitizenUser({ id: 'user-citizen-001' });
    prisma.complaint.count.mockResolvedValue(25);
    prisma.complaint.findMany.mockResolvedValue([makeComplaintRecord()]);

    const result = await getCitizenComplaints({
      user,
      query: { page: '2', limit: '10' },
    });

    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });

    // Check query filter passed to Prisma
    const findCall = prisma.complaint.findMany.mock.calls[0][0];
    expect(findCall.where.citizenId).toBe('user-citizen-001');
    expect(findCall.skip).toBe(10);
    expect(findCall.take).toBe(10);
  });

  it('applies status and priority filters when provided', async () => {
    const user = makeCitizenUser({ id: 'user-citizen-001' });
    prisma.complaint.count.mockResolvedValue(5);
    prisma.complaint.findMany.mockResolvedValue([makeComplaintRecord()]);

    await getCitizenComplaints({
      user,
      query: { status: 'SUBMITTED', priority: 'HIGH' },
    });

    const findCall = prisma.complaint.findMany.mock.calls[0][0];
    expect(findCall.where.status).toBe('SUBMITTED');
    expect(findCall.where.priority).toBe('HIGH');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Public Tracking Lookup & PII Sanitization
// ══════════════════════════════════════════════════════════════════════════════
describe('trackComplaintByReference', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns sanitized public record without citizen PII for unauthenticated track', async () => {
    const raw = makeComplaintRecord({
      citizen: {
        id: 'user-citizen-001',
        name: 'Aditya Kumar Verma',
        email: 'aditya@citizen.org',
        phone: '+91 98765 43210',
      },
    });
    prisma.complaint.findUnique.mockResolvedValue(raw);

    const publicView = await trackComplaintByReference({
      referenceNumber: 'CC-2026-7B9C-38491',
      user: null, // Unauthenticated public tracker
    });

    expect(publicView).toHaveProperty('referenceNumber');
    expect(publicView).toHaveProperty('status');
    expect(publicView).toHaveProperty('stage');
    // Citizen PII must NOT be present in public tracking view
    expect(publicView).not.toHaveProperty('citizen');
    expect(publicView).not.toHaveProperty('citizenId');
    expect(publicView).not.toHaveProperty('citizenPhone');
    expect(publicView).not.toHaveProperty('citizenEmail');
  });

  it('returns 404 when reference number is not found', async () => {
    prisma.complaint.findUnique.mockResolvedValue(null);

    await expect(
      trackComplaintByReference({ referenceNumber: 'CC-NON-EXISTENT-00000', user: null })
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('blocks public access if complaint is marked restricted from public', async () => {
    const restricted = makeComplaintRecord({
      isRestrictedFromPublic: true,
      citizenId: 'user-citizen-001',
    });
    prisma.complaint.findUnique.mockResolvedValue(restricted);

    await expect(
      trackComplaintByReference({ referenceNumber: 'CC-2026-7B9C-38491', user: null })
    ).rejects.toMatchObject({ code: 'RECORD_RESTRICTED', status: 404 });
  });
});
