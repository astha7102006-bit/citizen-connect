/**
 * CitizenConnect — Staff Workflow Unit Tests (Phase 5)
 *
 * Tests:
 *  - Citizens blocked from all staff endpoints (403)
 *  - Unauthenticated requests rejected (401)
 *  - Complaint listing for staff (paginated)
 *  - Acknowledge: valid transition, duplicate rejection
 *  - Investigation: start and progress update
 *  - Official response: publish with valid/invalid text
 *  - Transfer: valid, same-dept rejection, missing reason rejection
 *  - Escalate: reviewer-only, max-level rejection
 *  - Close: reviewer-only, already-closed rejection
 *  - Reviewer finding: minimum-length validation
 *  - Request additional info: minimum-length validation
 *  - Notification creation on each workflow action
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma ────────────────────────────────────────────────────────────────
vi.mock('../config/db.js', () => {
  const mockPrisma = {
    complaint: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    complaintEvent: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    officialResponse: {
      create: vi.fn(),
    },
    escalation: {
      create: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  };
  return { prisma: mockPrisma };
});

// ── Mock notificationService ──────────────────────────────────────────────────
vi.mock('../services/notificationService.js', () => ({
  createNotification: vi.fn().mockResolvedValue({ id: 'NOTIF-001' }),
}));

// ── Mock timelineService (appendComplaintEvent) ───────────────────────────────
vi.mock('../services/timelineService.js', () => ({
  appendComplaintEvent: vi.fn().mockResolvedValue({
    id: 'evt-001',
    sequence: 2,
    eventType: 'ACKNOWLEDGEMENT_RECORDED',
    hash: 'abc123',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    timestamp: new Date().toISOString(),
  }),
  getComplaintTimeline: vi.fn(),
  verifyComplaintTimeline: vi.fn(),
  verifyEventsChain: vi.fn(),
  STAFF_ROLES: ['OFFICIAL', 'REVIEWER', 'ADMIN'],
}));

import { prisma } from '../config/db.js';
import { createNotification } from '../services/notificationService.js';
import { appendComplaintEvent } from '../services/timelineService.js';
import {
  getStaffComplaints,
  acknowledgeComplaint,
  updateInvestigation,
  publishOfficialResponse,
  transferComplaint,
  escalateComplaint,
  closeComplaint,
  recordReviewerFinding,
  requestAdditionalInfo,
} from '../services/staffService.js';

// ── Fixtures ───────────────────────────────────────────────────────────────────
const makeOfficialUser = (overrides = {}) => ({
  id: 'user-official-001',
  name: 'ACP Vikram Patil',
  email: 'official@citizenconnect.gov.in',
  role: 'OFFICIAL',
  accountStatus: 'ACTIVE',
  ...overrides,
});

const makeReviewerUser = (overrides = {}) => ({
  id: 'user-reviewer-001',
  name: 'Reviewer Sunita Rao',
  email: 'reviewer@citizenconnect.gov.in',
  role: 'REVIEWER',
  accountStatus: 'ACTIVE',
  ...overrides,
});

const makeCitizenUser = (overrides = {}) => ({
  id: 'user-citizen-001',
  name: 'Aditya Kumar',
  email: 'citizen@example.com',
  role: 'CITIZEN',
  accountStatus: 'ACTIVE',
  ...overrides,
});

const makeComplaint = (overrides = {}) => ({
  id: 'complaint-uuid-001',
  referenceNumber: 'CC-2026-TEST-99999',
  title: 'Broken streetlight on MG Road',
  status: 'SUBMITTED',
  stage: 1,
  stageName: 'Level 1: Grievance Officer Assigned',
  category: 'Infrastructure',
  priority: 'MEDIUM',
  isAnonymous: false,
  citizenId: 'user-citizen-001',
  departmentId: 'dept-mcd-001',
  department: { id: 'dept-mcd-001', name: 'Municipal Corporation & Civic Services', code: 'MCD' },
  citizen: { id: 'user-citizen-001', name: 'Aditya Kumar', email: 'citizen@example.com' },
  filedAt: new Date(),
  slaDaysRemaining: 5,
  _count: { events: 1, evidence: 0 },
  events: [],
  ...overrides,
});

const makeDepartment = (overrides = {}) => ({
  id: 'dept-pwd-001',
  code: 'PWD',
  name: 'Public Works Department (PWD)',
  isActive: true,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();

  // Default transaction mock: execute the callback immediately
  prisma.$transaction.mockImplementation(async (cb) => {
    const fakeTx = {
      complaint: {
        findUnique: prisma.complaint.findUnique,
        update: prisma.complaint.update,
      },
      complaintEvent: {
        create: prisma.complaintEvent.create,
        findFirst: prisma.complaintEvent.findFirst,
      },
      officialResponse: { create: prisma.officialResponse.create },
      escalation: { create: prisma.escalation.create },
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    return cb(fakeTx);
  });

  prisma.complaintEvent.findFirst.mockResolvedValue(null);
  prisma.complaintEvent.create.mockResolvedValue({ id: 'evt-001', sequence: 2 });
  prisma.complaint.update.mockResolvedValue({});
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Role Guard Tests
// ═══════════════════════════════════════════════════════════════════════════════
describe('Role Guards', () => {
  it('rejects citizen from getStaffComplaints with 403', async () => {
    const err = await getStaffComplaints({ user: makeCitizenUser(), query: {} }).catch((e) => e);
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('rejects citizen from acknowledgeComplaint with 403', async () => {
    const err = await acknowledgeComplaint({
      complaintId: 'any-id',
      user: makeCitizenUser(),
      body: {},
    }).catch((e) => e);
    expect(err.status).toBe(403);
  });

  it('rejects citizen from escalateComplaint with 403', async () => {
    const err = await escalateComplaint({
      complaintId: 'any-id',
      user: makeCitizenUser(),
      body: { reason: 'A long enough reason here' },
    }).catch((e) => e);
    expect(err.status).toBe(403);
  });

  it('rejects OFFICIAL from escalateComplaint with 403', async () => {
    const err = await escalateComplaint({
      complaintId: 'any-id',
      user: makeOfficialUser(),
      body: { reason: 'A long enough reason here' },
    }).catch((e) => e);
    expect(err.status).toBe(403);
    expect(err.message).toContain('REVIEWER or ADMIN');
  });

  it('rejects OFFICIAL from closeComplaint with 403', async () => {
    const err = await closeComplaint({
      complaintId: 'any-id',
      user: makeOfficialUser(),
      body: {},
    }).catch((e) => e);
    expect(err.status).toBe(403);
  });

  it('rejects OFFICIAL from recordReviewerFinding with 403', async () => {
    const err = await recordReviewerFinding({
      complaintId: 'any-id',
      user: makeOfficialUser(),
      body: { finding: 'Some long finding text that exceeds twenty characters.' },
    }).catch((e) => e);
    expect(err.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. getStaffComplaints
// ═══════════════════════════════════════════════════════════════════════════════
describe('getStaffComplaints', () => {
  it('returns paginated complaint list for OFFICIAL', async () => {
    const c = makeComplaint();
    prisma.complaint.findMany.mockResolvedValue([c]);
    prisma.complaint.count.mockResolvedValue(1);

    const result = await getStaffComplaints({ user: makeOfficialUser(), query: { page: '1', limit: '10' } });

    expect(result.complaints).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('redacts citizen info on anonymous complaints', async () => {
    const c = makeComplaint({ isAnonymous: true });
    prisma.complaint.findMany.mockResolvedValue([c]);
    prisma.complaint.count.mockResolvedValue(1);

    const result = await getStaffComplaints({ user: makeOfficialUser(), query: {} });

    expect(result.complaints[0].citizen.name).toBe('Whistleblower (Protected)');
    expect(result.complaints[0].citizen.email).toBeNull();
  });

  it('respects status filter', async () => {
    prisma.complaint.findMany.mockResolvedValue([]);
    prisma.complaint.count.mockResolvedValue(0);

    await getStaffComplaints({
      user: makeReviewerUser(),
      query: { status: 'ACKNOWLEDGED' },
    });

    expect(prisma.complaint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACKNOWLEDGED' }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. acknowledgeComplaint
// ═══════════════════════════════════════════════════════════════════════════════
describe('acknowledgeComplaint', () => {
  it('acknowledges a SUBMITTED complaint and notifies citizen', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'SUBMITTED' }));

    const result = await acknowledgeComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { notes: 'Acknowledged and reviewed.' },
    });

    expect(result.complaint.status).toBe('ACKNOWLEDGED');
    expect(appendComplaintEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ACKNOWLEDGEMENT_RECORDED',
        newStatus: 'ACKNOWLEDGED',
      })
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'STATUS_CHANGE', userId: 'user-citizen-001' })
    );
  });

  it('rejects acknowledgement if complaint is already ACKNOWLEDGED', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'ACKNOWLEDGED' }));

    const err = await acknowledgeComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: {},
    }).catch((e) => e);

    expect(err.status).toBe(422);
    expect(err.code).toBe('INVALID_TRANSITION');
  });

  it('returns 404 when complaint not found', async () => {
    prisma.complaint.findUnique.mockResolvedValue(null);

    const err = await acknowledgeComplaint({
      complaintId: 'nonexistent-id',
      user: makeOfficialUser(),
      body: {},
    }).catch((e) => e);

    expect(err.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. updateInvestigation
// ═══════════════════════════════════════════════════════════════════════════════
describe('updateInvestigation', () => {
  it('starts investigation from ACKNOWLEDGED status', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'ACKNOWLEDGED' }));

    const result = await updateInvestigation({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { notes: 'Field inspection initiated at site.' },
    });

    expect(result.complaint.status).toBe('UNDER_INVESTIGATION');
    expect(appendComplaintEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'INVESTIGATION_STARTED' })
    );
  });

  it('posts progress update from UNDER_INVESTIGATION status', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'UNDER_INVESTIGATION' }));

    await updateInvestigation({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { notes: 'Core samples extracted for lab analysis.' },
    });

    expect(appendComplaintEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'INVESTIGATION_PROGRESS_UPDATED' })
    );
  });

  it('rejects empty notes with 400', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'ACKNOWLEDGED' }));

    const err = await updateInvestigation({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { notes: '' },
    }).catch((e) => e);

    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. publishOfficialResponse
// ═══════════════════════════════════════════════════════════════════════════════
describe('publishOfficialResponse', () => {
  it('creates response record and appends timeline event', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'UNDER_INVESTIGATION' }));
    prisma.officialResponse.create.mockResolvedValue({ id: 'resp-001', responseType: 'INTERIM' });

    const result = await publishOfficialResponse({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { responseText: 'Formal departmental compliance report attached after site visit.', responseType: 'INTERIM' },
    });

    expect(result.officialResponse.id).toBe('resp-001');
    expect(appendComplaintEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'OFFICIAL_RESPONSE_RECEIVED' })
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OFFICIAL_RESPONSE' })
    );
  });

  it('rejects response text shorter than 20 characters', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint());

    const err = await publishOfficialResponse({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { responseText: 'Too short.' },
    }).catch((e) => e);

    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid responseType', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint());

    const err = await publishOfficialResponse({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { responseText: 'A long enough response text here.', responseType: 'INVALID_TYPE' },
    }).catch((e) => e);

    expect(err.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. transferComplaint
// ═══════════════════════════════════════════════════════════════════════════════
describe('transferComplaint', () => {
  it('transfers complaint to another active department', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ departmentId: 'dept-mcd-001' }));
    prisma.department.findUnique.mockResolvedValue(makeDepartment());

    const result = await transferComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { departmentId: 'dept-pwd-001', reason: 'Jurisdiction belongs to PWD road maintenance wing.' },
    });

    expect(result.events).toHaveLength(2);
    expect(prisma.complaint.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { departmentId: 'dept-pwd-001' } })
    );
  });

  it('rejects transfer to the same department', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ departmentId: 'dept-mcd-001' }));
    prisma.department.findUnique.mockResolvedValue(makeDepartment({ id: 'dept-mcd-001' }));

    const err = await transferComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { departmentId: 'dept-mcd-001', reason: 'A valid reason here.' },
    }).catch((e) => e);

    expect(err.status).toBe(422);
    expect(err.code).toBe('INVALID_TRANSITION');
  });

  it('rejects transfer without reason', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint());
    prisma.department.findUnique.mockResolvedValue(makeDepartment());

    const err = await transferComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { departmentId: 'dept-pwd-001', reason: 'short' },
    }).catch((e) => e);

    expect(err.status).toBe(400);
  });

  it('rejects transfer to missing departmentId in body', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint());

    const err = await transferComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: {},
    }).catch((e) => e);

    expect(err.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. escalateComplaint
// ═══════════════════════════════════════════════════════════════════════════════
describe('escalateComplaint', () => {
  it('escalates complaint from stage 1 to stage 2', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ stage: 1, status: 'UNDER_INVESTIGATION' }));
    prisma.escalation.create.mockResolvedValue({ id: 'esc-001', toLevel: 2 });

    const result = await escalateComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeReviewerUser(),
      body: { reason: 'SLA deadline missed; escalating to Appellate Authority as per RTI provisions.' },
    });

    expect(result.escalation.toLevel).toBe(2);
    expect(appendComplaintEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'COMPLAINT_ESCALATED', newStatus: 'APPEALED' })
    );
  });

  it('rejects escalation beyond stage 3', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ stage: 3, status: 'APPEALED' }));

    const err = await escalateComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeReviewerUser(),
      body: { reason: 'Already at max level escalation attempt.' },
    }).catch((e) => e);

    expect(err.status).toBe(422);
    expect(err.message).toContain('maximum escalation level');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. closeComplaint
// ═══════════════════════════════════════════════════════════════════════════════
describe('closeComplaint', () => {
  it('closes a resolved complaint', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'ACTION_TAKEN' }));

    const result = await closeComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeReviewerUser(),
      body: { reason: 'Confirmed redressal; complaint formally closed after verification.' },
    });

    expect(result.complaint.status).toBe('CLOSED');
    expect(prisma.complaint.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED' }) })
    );
  });

  it('rejects closing an already-closed complaint', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'CLOSED' }));

    const err = await closeComplaint({
      complaintId: 'complaint-uuid-001',
      user: makeReviewerUser(),
      body: {},
    }).catch((e) => e);

    expect(err.status).toBe(422);
    expect(err.code).toBe('INVALID_TRANSITION');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. recordReviewerFinding
// ═══════════════════════════════════════════════════════════════════════════════
describe('recordReviewerFinding', () => {
  it('records a valid reviewer finding', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint({ status: 'UNDER_INVESTIGATION' }));

    await recordReviewerFinding({
      complaintId: 'complaint-uuid-001',
      user: makeReviewerUser(),
      body: { finding: 'Site inspection confirms road damage is due to contractor negligence under Contract No. MCD-2024-RD-119.' },
    });

    expect(appendComplaintEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'REVIEWER_FINDING_RECORDED' })
    );
  });

  it('rejects finding shorter than 20 characters', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint());

    const err = await recordReviewerFinding({
      complaintId: 'complaint-uuid-001',
      user: makeReviewerUser(),
      body: { finding: 'Too short.' },
    }).catch((e) => e);

    expect(err.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. requestAdditionalInfo
// ═══════════════════════════════════════════════════════════════════════════════
describe('requestAdditionalInfo', () => {
  it('appends ADDITIONAL_INFO_REQUESTED event and notifies citizen', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint());

    await requestAdditionalInfo({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { infoRequest: 'Please provide MCD tax receipt and property ownership document.' },
    });

    expect(appendComplaintEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'ADDITIONAL_INFO_REQUESTED' })
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'STATUS_CHANGE', userId: 'user-citizen-001' })
    );
  });

  it('rejects info request shorter than 10 characters', async () => {
    prisma.complaint.findUnique.mockResolvedValue(makeComplaint());

    const err = await requestAdditionalInfo({
      complaintId: 'complaint-uuid-001',
      user: makeOfficialUser(),
      body: { infoRequest: 'Too' },
    }).catch((e) => e);

    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Department Scoping & Isolation
// ═══════════════════════════════════════════════════════════════════════════════
describe('Department Scoping & Isolation', () => {
  it('blocks official from accessing complaint assigned to another department with 403', async () => {
    // Official is assigned to MCD (dept-mcd-001)
    const mcdOfficial = makeOfficialUser({ departmentId: 'dept-mcd-001' });
    // Complaint is assigned to PWD (dept-pwd-001)
    const pwdComplaint = makeComplaint({ departmentId: 'dept-pwd-001' });
    prisma.complaint.findUnique.mockResolvedValue(pwdComplaint);

    const err = await acknowledgeComplaint({
      complaintId: pwdComplaint.id,
      user: mcdOfficial,
      body: {},
    }).catch((e) => e);

    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toContain('another department');
  });

  it('allows official to access complaint assigned to their own department', async () => {
    const mcdOfficial = makeOfficialUser({ departmentId: 'dept-mcd-001' });
    const mcdComplaint = makeComplaint({ departmentId: 'dept-mcd-001', status: 'SUBMITTED' });
    prisma.complaint.findUnique.mockResolvedValue(mcdComplaint);

    const result = await acknowledgeComplaint({
      complaintId: mcdComplaint.id,
      user: mcdOfficial,
      body: { notes: 'Acknowledged by MCD GRO.' },
    });

    expect(result.complaint.status).toBe('ACKNOWLEDGED');
  });

  it('allows official to access unassigned complaints for triage', async () => {
    const mcdOfficial = makeOfficialUser({ departmentId: 'dept-mcd-001' });
    const unassignedComplaint = makeComplaint({ departmentId: null, status: 'SUBMITTED' });
    prisma.complaint.findUnique.mockResolvedValue(unassignedComplaint);

    const result = await acknowledgeComplaint({
      complaintId: unassignedComplaint.id,
      user: mcdOfficial,
      body: { notes: 'Triaging unassigned case.' },
    });

    expect(result.complaint.status).toBe('ACKNOWLEDGED');
  });

  it('allows REVIEWER and ADMIN oversight across departments', async () => {
    const pwdComplaint = makeComplaint({ departmentId: 'dept-pwd-001', status: 'UNDER_INVESTIGATION' });
    prisma.complaint.findUnique.mockResolvedValue(pwdComplaint);

    const result = await recordReviewerFinding({
      complaintId: pwdComplaint.id,
      user: makeReviewerUser(),
      body: { finding: 'Formal appellate oversight finding recorded across departmental lines.' },
    });

    expect(result.event).toBeDefined();
  });

  it('blocks official from querying another department via getStaffComplaints with 403', async () => {
    const mcdOfficial = makeOfficialUser({ departmentId: 'dept-mcd-001' });

    const err = await getStaffComplaints({
      user: mcdOfficial,
      query: { departmentId: 'dept-pwd-001' },
    }).catch((e) => e);

    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toContain('another department');
  });

  it('automatically scopes complaint list to officials department and unassigned', async () => {
    const mcdOfficial = makeOfficialUser({ departmentId: 'dept-mcd-001' });
    prisma.complaint.findMany.mockResolvedValue([]);
    prisma.complaint.count.mockResolvedValue(0);

    await getStaffComplaints({
      user: mcdOfficial,
      query: {},
    });

    expect(prisma.complaint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { departmentId: 'dept-mcd-001' },
            { departmentId: null },
          ],
        }),
      })
    );
  });
});
