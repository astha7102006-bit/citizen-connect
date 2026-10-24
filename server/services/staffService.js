/**
 * CitizenConnect — Staff & Official Workflow Service (Phase 5)
 *
 * Business logic for staff operations:
 * - Acknowledging complaints
 * - Starting/updating investigations
 * - Publishing official responses
 * - Department transfers
 * - Escalations
 * - Closing complaints
 * - Reviewer findings
 *
 * All operations append immutable audit events via timelineService.
 * Notification hooks call notificationService for in-app alerts.
 *
 * NOTE: User model does not have a departmentId field. OFFICIAL role
 * currently sees all complaints (no department filtering by user record).
 * This is a known schema limitation documented in FINAL_COMPLETION_REPORT.md.
 */

import { prisma } from '../config/db.js';
import { appendComplaintEvent } from './timelineService.js';
import { createNotification } from './notificationService.js';

const STAFF_ROLES = ['OFFICIAL', 'REVIEWER', 'ADMIN'];

/**
 * Verify the complaint exists and the requesting user is authorized staff.
 * Enforces role guards and department-level access control:
 * - Citizens: Blocked with 403 FORBIDDEN.
 * - OFFICIAL: Permitted only for their assigned department or unassigned triage complaints.
 *   Attempts to access complaints assigned to other departments are rejected with 403.
 * - REVIEWER / ADMIN: Authorized for cross-departmental oversight.
 * Returns the complaint or throws a structured error.
 */
async function getComplaintForStaff(complaintId, user, include = {}) {
  if (!STAFF_ROLES.includes(user.role)) {
    const err = new Error('You do not have permission to perform this action.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      department: { select: { id: true, name: true, code: true } },
      citizen: { select: { id: true, name: true, email: true } },
      ...include,
    },
  });

  if (!complaint) {
    const err = new Error('Complaint not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Department-level authorization check for OFFICIAL role
  if (user.role === 'OFFICIAL' && user.departmentId) {
    if (complaint.departmentId && complaint.departmentId !== user.departmentId) {
      const err = new Error('You do not have permission to access complaints assigned to another department.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
  }

  return complaint;
}

// ── 1. List Complaints for Staff ───────────────────────────────────────────────

/**
 * Returns paginated complaints for authorized staff with strict department scoping.
 * - OFFICIAL: Automatically scoped to their assigned department and unassigned complaints.
 *   Querying another department explicitly returns 403 FORBIDDEN.
 * - REVIEWER / ADMIN: Cross-departmental view across all public grievances.
 *
 * @param {object} params
 * @param {object} params.user
 * @param {object} [params.query] - { page, limit, status, priority, search, departmentId }
 */
export async function getStaffComplaints({ user, query = {} }) {
  if (!STAFF_ROLES.includes(user.role)) {
    const err = new Error('Staff access required.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  // OFFICIAL cannot query another department
  if (user.role === 'OFFICIAL' && user.departmentId && query.departmentId) {
    if (query.departmentId !== user.departmentId) {
      const err = new Error('You do not have permission to access complaints assigned to another department.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    where.status = query.status;
  }
  if (query.priority) {
    where.priority = query.priority;
  }

  // Department scoping
  if (user.role === 'OFFICIAL' && user.departmentId) {
    where.OR = [
      { departmentId: user.departmentId },
      { departmentId: null },
    ];
  } else if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.search) {
    const term = query.search.trim();
    const searchConditions = [
      { title: { contains: term, mode: 'insensitive' } },
      { referenceNumber: { contains: term, mode: 'insensitive' } },
      { category: { contains: term, mode: 'insensitive' } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: 'desc' }, { filedAt: 'asc' }],
      include: {
        department: { select: { id: true, name: true, code: true } },
        citizen: {
          select: {
            id: true,
            name: true,
            // email intentionally included for staff but not public
            email: true,
          },
        },
        events: {
          orderBy: { sequence: 'desc' },
          take: 1,
        },
        _count: { select: { events: true, evidence: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  return {
    complaints: complaints.map((c) => ({
      id: c.id,
      referenceNumber: c.referenceNumber,
      title: c.title,
      category: c.category,
      status: c.status,
      priority: c.priority,
      stage: c.stage,
      stageName: c.stageName,
      isAnonymous: c.isAnonymous,
      filedAt: c.filedAt,
      slaDaysRemaining: c.slaDaysRemaining,
      targetCompletionDate: c.targetCompletionDate,
      department: c.department,
      // Staff can see citizen name, but not on anonymous complaints
      citizen: c.isAnonymous
        ? { id: null, name: 'Whistleblower (Protected)', email: null }
        : c.citizen,
      latestEvent: c.events[0] || null,
      eventCount: c._count.events,
      evidenceCount: c._count.evidence,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ── 2. Acknowledge Complaint ───────────────────────────────────────────────────

/**
 * Acknowledges a complaint, updating status to ACKNOWLEDGED and appending event.
 */
export async function acknowledgeComplaint({ complaintId, user, body }) {
  const complaint = await getComplaintForStaff(complaintId, user);

  if (complaint.status !== 'SUBMITTED') {
    const err = new Error(
      `Complaint is already in '${complaint.status}' status and cannot be acknowledged again.`
    );
    err.code = 'INVALID_TRANSITION';
    err.status = 422;
    throw err;
  }

  const notes = (body?.notes || '').trim() ||
    'Complaint officially acknowledged by departmental grievance officer. Assigned for preliminary inquiry.';

  const event = await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: { status: 'ACKNOWLEDGED' },
    });

    return appendComplaintEvent({
      complaintId,
      eventType: 'ACKNOWLEDGEMENT_RECORDED',
      title: 'Complaint Acknowledged by Official',
      details: notes,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      responsibleDepartment: complaint.department?.name || null,
      previousStatus: 'SUBMITTED',
      newStatus: 'ACKNOWLEDGED',
      prismaTx: tx,
    });
  });

  // Notify citizen
  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'STATUS_CHANGE',
      title: 'Complaint Acknowledged',
      message: `Your complaint "${complaint.title}" (${complaint.referenceNumber}) has been officially acknowledged.`,
      metadata: { referenceNumber: complaint.referenceNumber, newStatus: 'ACKNOWLEDGED' },
    });
  }

  return { complaint: { id: complaintId, status: 'ACKNOWLEDGED' }, event };
}

// ── 3. Update Investigation Status ────────────────────────────────────────────

/**
 * Marks a complaint as under investigation or updates investigation progress.
 */
export async function updateInvestigation({ complaintId, user, body }) {
  const complaint = await getComplaintForStaff(complaintId, user);

  const notes = (body?.notes || '').trim();
  if (!notes) {
    const err = new Error('Investigation notes are required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const isStarting = complaint.status === 'ACKNOWLEDGED' || complaint.status === 'SUBMITTED';
  const eventType = isStarting ? 'INVESTIGATION_STARTED' : 'INVESTIGATION_PROGRESS_UPDATED';
  const newStatus = 'UNDER_INVESTIGATION';

  const details = body?.targetDate
    ? `${notes} Target completion date: ${body.targetDate}.`
    : notes;

  const event = await appendComplaintEvent({
    complaintId,
    eventType,
    title: isStarting ? 'Investigation Started' : 'Investigation Progress Updated',
    details,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    responsibleDepartment: complaint.department?.name || null,
    previousStatus: complaint.status,
    newStatus,
    metadata: body?.targetDate ? { targetDate: body.targetDate } : null,
  });

  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'STATUS_CHANGE',
      title: isStarting ? 'Investigation Started' : 'Investigation Update',
      message: `Your complaint "${complaint.title}" (${complaint.referenceNumber}) is ${isStarting ? 'now under investigation' : 'being actively investigated'}.`,
      metadata: { referenceNumber: complaint.referenceNumber },
    });
  }

  return { complaint: { id: complaintId, status: newStatus }, event };
}

// ── 4. Publish Official Response ──────────────────────────────────────────────

/**
 * Creates an OfficialResponse record and appends the audit event.
 */
export async function publishOfficialResponse({ complaintId, user, body }) {
  const complaint = await getComplaintForStaff(complaintId, user);

  const responseText = (body?.responseText || '').trim();
  if (!responseText || responseText.length < 20) {
    const err = new Error('Official response text must be at least 20 characters.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const responseType = body?.responseType || 'INTERIM';
  const validTypes = ['INTERIM', 'FINAL_REDRESSAL', 'CLARIFICATION', 'TRANSFER_JUSTIFICATION'];
  if (!validTypes.includes(responseType)) {
    const err = new Error(`Invalid responseType. Must be one of: ${validTypes.join(', ')}.`);
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const { officialResponse, event } = await prisma.$transaction(async (tx) => {
    const response = await tx.officialResponse.create({
      data: {
        complaintId,
        authorId: user.id,
        authorName: user.name,
        authorDesignation: body?.designation || null,
        responseText,
        responseType,
        status: 'PUBLISHED',
        isApprovedByReviewer: user.role === 'REVIEWER' || user.role === 'ADMIN' ? true : false,
        hearingDate: body?.hearingDate ? new Date(body.hearingDate) : null,
      },
    });

    const newStatus = responseType === 'FINAL_REDRESSAL' ? 'ACTION_TAKEN' : null;

    const ev = await appendComplaintEvent({
      complaintId,
      eventType: 'OFFICIAL_RESPONSE_RECEIVED',
      title: `Official ${responseType.replace(/_/g, ' ')} Response Published`,
      details: responseText,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      responsibleDepartment: complaint.department?.name || null,
      previousStatus: complaint.status,
      newStatus,
      metadata: { officialResponseId: response.id, responseType },
      prismaTx: tx,
    });

    return { officialResponse: response, event: ev };
  });

  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'OFFICIAL_RESPONSE',
      title: 'Official Response Published',
      message: `An official response has been published on your complaint "${complaint.title}" (${complaint.referenceNumber}).`,
      metadata: { referenceNumber: complaint.referenceNumber, responseType },
    });
  }

  return { officialResponse, event };
}

// ── 5. Transfer Complaint to Another Department ───────────────────────────────

/**
 * Transfers a complaint to a different department, appending two timeline events.
 */
export async function transferComplaint({ complaintId, user, body }) {
  const complaint = await getComplaintForStaff(complaintId, user);

  const targetDepartmentId = body?.departmentId;
  const reason = (body?.reason || '').trim();

  if (!targetDepartmentId) {
    const err = new Error('Target departmentId is required for transfer.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }
  if (!reason || reason.length < 10) {
    const err = new Error('A statutory transfer reason (at least 10 characters) is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const targetDept = await prisma.department.findUnique({
    where: { id: targetDepartmentId },
  });

  if (!targetDept || !targetDept.isActive) {
    const err = new Error('Target department not found or is inactive.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (targetDepartmentId === complaint.departmentId) {
    const err = new Error('Complaint is already assigned to this department.');
    err.code = 'INVALID_TRANSITION';
    err.status = 422;
    throw err;
  }

  const fromDeptName = complaint.department?.name || 'Unassigned';
  const toDeptName = targetDept.name;

  const events = await prisma.$transaction(async (tx) => {
    // Event 1: Transfer Requested
    const reqEvent = await appendComplaintEvent({
      complaintId,
      eventType: 'DEPARTMENT_TRANSFER_REQUESTED',
      title: 'Department Transfer Requested',
      details: `Transfer requested from "${fromDeptName}" to "${toDeptName}". Reason: ${reason}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      responsibleDepartment: fromDeptName,
      reason,
      metadata: { fromDepartment: fromDeptName, toDepartment: toDeptName, fromDepartmentId: complaint.departmentId },
      prismaTx: tx,
    });

    // Update complaint department
    await tx.complaint.update({
      where: { id: complaintId },
      data: { departmentId: targetDepartmentId },
    });

    // Event 2: Transfer Completed
    const compEvent = await appendComplaintEvent({
      complaintId,
      eventType: 'DEPARTMENT_TRANSFER_COMPLETED',
      title: 'Department Transfer Completed',
      details: `Complaint officially transferred to "${toDeptName}". Previous responsible department: "${fromDeptName}".`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      responsibleDepartment: toDeptName,
      metadata: { fromDepartment: fromDeptName, toDepartment: toDeptName },
      prismaTx: tx,
    });

    return [reqEvent, compEvent];
  });

  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'TRANSFER',
      title: 'Complaint Transferred',
      message: `Your complaint "${complaint.title}" (${complaint.referenceNumber}) has been transferred to ${toDeptName}.`,
      metadata: { referenceNumber: complaint.referenceNumber, toDepartment: toDeptName },
    });
  }

  return {
    complaint: { id: complaintId, departmentId: targetDepartmentId, department: targetDept },
    events,
  };
}

// ── 6. Escalate Complaint ─────────────────────────────────────────────────────

/**
 * Creates an Escalation record and appends the audit event.
 * Only REVIEWER or ADMIN may escalate.
 */
export async function escalateComplaint({ complaintId, user, body }) {
  if (!['REVIEWER', 'ADMIN'].includes(user.role)) {
    const err = new Error('Only REVIEWER or ADMIN may escalate complaints.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const complaint = await getComplaintForStaff(complaintId, user);

  const reason = (body?.reason || '').trim();
  if (!reason || reason.length < 10) {
    const err = new Error('Escalation reason (at least 10 characters) is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const currentStage = complaint.stage || 1;
  const toLevel = currentStage + 1;

  if (toLevel > 3) {
    const err = new Error('Complaint has already reached the maximum escalation level (Lokayukta/ACB).');
    err.code = 'INVALID_TRANSITION';
    err.status = 422;
    throw err;
  }

  const stageNames = {
    2: 'Level 2: Appellate Authority',
    3: 'Level 3: Lokayukta / ACB',
  };
  const triggerType = body?.triggerType || 'MANUAL_REVIEW_ESCALATION';

  const { escalation, event } = await prisma.$transaction(async (tx) => {
    const esc = await tx.escalation.create({
      data: {
        complaintId,
        escalationLevel: toLevel,
        fromLevel: currentStage,
        toLevel,
        reason,
        triggerType,
        status: 'ACTIVE',
        deadlineTimestamp: body?.deadline ? new Date(body.deadline) : null,
      },
    });

    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        stage: toLevel,
        stageName: stageNames[toLevel],
        status: 'APPEALED',
      },
    });

    const ev = await appendComplaintEvent({
      complaintId,
      eventType: 'COMPLAINT_ESCALATED',
      title: `Complaint Escalated to ${stageNames[toLevel]}`,
      details: `Complaint escalated from Level ${currentStage} to Level ${toLevel}. Reason: ${reason}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      responsibleDepartment: complaint.department?.name || null,
      previousStatus: complaint.status,
      newStatus: 'APPEALED',
      reason,
      metadata: { escalationId: esc.id, fromLevel: currentStage, toLevel, triggerType },
      prismaTx: tx,
    });

    return { escalation: esc, event: ev };
  });

  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'ESCALATION',
      title: 'Complaint Escalated',
      message: `Your complaint "${complaint.title}" (${complaint.referenceNumber}) has been escalated to ${stageNames[toLevel]}.`,
      metadata: { referenceNumber: complaint.referenceNumber, toLevel },
    });
  }

  return { escalation, event };
}

// ── 7. Close Complaint ────────────────────────────────────────────────────────

/**
 * Closes a complaint, appending the COMPLAINT_CLOSED event.
 * Only REVIEWER or ADMIN can close.
 */
export async function closeComplaint({ complaintId, user, body }) {
  if (!['REVIEWER', 'ADMIN'].includes(user.role)) {
    const err = new Error('Only REVIEWER or ADMIN may close complaints.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const complaint = await getComplaintForStaff(complaintId, user);

  if (complaint.status === 'CLOSED') {
    const err = new Error('Complaint is already closed.');
    err.code = 'INVALID_TRANSITION';
    err.status = 422;
    throw err;
  }

  const reason = (body?.reason || '').trim() || 'Complaint closed after review and redressal.';

  const event = await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'CLOSED',
        resolvedAt: new Date(),
      },
    });

    return appendComplaintEvent({
      complaintId,
      eventType: 'COMPLAINT_CLOSED',
      title: 'Complaint Closed',
      details: `Complaint has been formally closed. ${reason}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      responsibleDepartment: complaint.department?.name || null,
      previousStatus: complaint.status,
      newStatus: 'CLOSED',
      reason,
      prismaTx: tx,
    });
  });

  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'STATUS_CHANGE',
      title: 'Complaint Closed',
      message: `Your complaint "${complaint.title}" (${complaint.referenceNumber}) has been closed.`,
      metadata: { referenceNumber: complaint.referenceNumber, reason },
    });
  }

  return { complaint: { id: complaintId, status: 'CLOSED' }, event };
}

// ── 8. Record Reviewer Finding ────────────────────────────────────────────────

/**
 * Records a formal reviewer finding, appending a REVIEWER_FINDING_RECORDED event.
 * Only REVIEWER or ADMIN can record findings.
 */
export async function recordReviewerFinding({ complaintId, user, body }) {
  if (!['REVIEWER', 'ADMIN'].includes(user.role)) {
    const err = new Error('Only REVIEWER or ADMIN may record official findings.');
    err.code = 'FORBIDDEN';
    err.status = 403;
    throw err;
  }

  const complaint = await getComplaintForStaff(complaintId, user);

  const finding = (body?.finding || '').trim();
  if (!finding || finding.length < 20) {
    const err = new Error('Reviewer finding must be at least 20 characters.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const event = await appendComplaintEvent({
    complaintId,
    eventType: 'REVIEWER_FINDING_RECORDED',
    title: 'Reviewer Finding Recorded',
    details: finding,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    responsibleDepartment: complaint.department?.name || null,
    metadata: body?.metadata || null,
  });

  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'OFFICIAL_RESPONSE',
      title: 'Reviewer Finding Recorded',
      message: `A formal reviewer finding has been recorded on your complaint "${complaint.title}" (${complaint.referenceNumber}).`,
      metadata: { referenceNumber: complaint.referenceNumber },
    });
  }

  return { event };
}

// ── 9. Request Additional Information ─────────────────────────────────────────

/**
 * Appends an ADDITIONAL_INFO_REQUESTED event.
 */
export async function requestAdditionalInfo({ complaintId, user, body }) {
  const complaint = await getComplaintForStaff(complaintId, user);

  const infoRequest = (body?.infoRequest || '').trim();
  if (!infoRequest || infoRequest.length < 10) {
    const err = new Error('Information request details (at least 10 characters) are required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const event = await appendComplaintEvent({
    complaintId,
    eventType: 'ADDITIONAL_INFO_REQUESTED',
    title: 'Additional Information Requested from Citizen',
    details: infoRequest,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    responsibleDepartment: complaint.department?.name || null,
    metadata: body?.deadline ? { responseDeadline: body.deadline } : null,
  });

  if (complaint.citizenId) {
    await createNotification({
      userId: complaint.citizenId,
      complaintId,
      type: 'STATUS_CHANGE',
      title: 'Additional Information Required',
      message: `The grievance officer has requested additional information for your complaint "${complaint.title}" (${complaint.referenceNumber}).`,
      metadata: { referenceNumber: complaint.referenceNumber },
    });
  }

  return { event };
}
