/**
 * CitizenConnect — Staff & Official Workflow API Router (Phase 5)
 *
 * All routes require authentication and a staff role (OFFICIAL, REVIEWER, ADMIN).
 *
 * GET  /api/staff/complaints                        — List complaints (staff view)
 * POST /api/staff/complaints/:id/acknowledge        — Acknowledge a complaint
 * POST /api/staff/complaints/:id/investigation      — Start or update investigation
 * POST /api/staff/complaints/:id/response           — Publish official response
 * POST /api/staff/complaints/:id/transfer           — Transfer to another department
 * POST /api/staff/complaints/:id/escalate           — Escalate to higher authority
 * POST /api/staff/complaints/:id/close              — Close a resolved complaint
 * POST /api/staff/complaints/:id/finding            — Record reviewer finding
 * POST /api/staff/complaints/:id/request-info       — Request additional info from citizen
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { sendSuccess, sendError } from '../utils/response.js';
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

const router = Router();

// All staff routes require authentication + at least OFFICIAL role
const staffGuard = [requireAuth, requireRole('OFFICIAL', 'REVIEWER', 'ADMIN')];

// ── GET /api/staff/complaints ──────────────────────────────────────────────────
router.get('/complaints', ...staffGuard, async (req, res, next) => {
  try {
    const result = await getStaffComplaints({ user: req.user, query: req.query });
    return sendSuccess(res, result, { meta: result.meta });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
    }
    return next(err);
  }
});

// ── POST /api/staff/complaints/:id/acknowledge ────────────────────────────────
router.post('/complaints/:id/acknowledge', ...staffGuard, async (req, res, next) => {
  try {
    const result = await acknowledgeComplaint({
      complaintId: req.params.id,
      user: req.user,
      body: req.body,
    });
    return sendSuccess(res, result, { status: 200 });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
    }
    return next(err);
  }
});

// ── POST /api/staff/complaints/:id/investigation ──────────────────────────────
router.post('/complaints/:id/investigation', ...staffGuard, async (req, res, next) => {
  try {
    const result = await updateInvestigation({
      complaintId: req.params.id,
      user: req.user,
      body: req.body,
    });
    return sendSuccess(res, result, { status: 200 });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
    }
    return next(err);
  }
});

// ── POST /api/staff/complaints/:id/response ───────────────────────────────────
router.post('/complaints/:id/response', ...staffGuard, async (req, res, next) => {
  try {
    const result = await publishOfficialResponse({
      complaintId: req.params.id,
      user: req.user,
      body: req.body,
    });
    return sendSuccess(res, result, { status: 201 });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
    }
    return next(err);
  }
});

// ── POST /api/staff/complaints/:id/transfer ───────────────────────────────────
router.post('/complaints/:id/transfer', ...staffGuard, async (req, res, next) => {
  try {
    const result = await transferComplaint({
      complaintId: req.params.id,
      user: req.user,
      body: req.body,
    });
    return sendSuccess(res, result, { status: 200 });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
    }
    return next(err);
  }
});

// ── POST /api/staff/complaints/:id/escalate ───────────────────────────────────
// REVIEWER and ADMIN only
router.post(
  '/complaints/:id/escalate',
  requireAuth,
  requireRole('REVIEWER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const result = await escalateComplaint({
        complaintId: req.params.id,
        user: req.user,
        body: req.body,
      });
      return sendSuccess(res, result, { status: 200 });
    } catch (err) {
      if (err.status) {
        return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
      }
      return next(err);
    }
  }
);

// ── POST /api/staff/complaints/:id/close ─────────────────────────────────────
// REVIEWER and ADMIN only
router.post(
  '/complaints/:id/close',
  requireAuth,
  requireRole('REVIEWER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const result = await closeComplaint({
        complaintId: req.params.id,
        user: req.user,
        body: req.body,
      });
      return sendSuccess(res, result, { status: 200 });
    } catch (err) {
      if (err.status) {
        return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
      }
      return next(err);
    }
  }
);

// ── POST /api/staff/complaints/:id/finding ───────────────────────────────────
// REVIEWER and ADMIN only
router.post(
  '/complaints/:id/finding',
  requireAuth,
  requireRole('REVIEWER', 'ADMIN'),
  async (req, res, next) => {
    try {
      const result = await recordReviewerFinding({
        complaintId: req.params.id,
        user: req.user,
        body: req.body,
      });
      return sendSuccess(res, result, { status: 201 });
    } catch (err) {
      if (err.status) {
        return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
      }
      return next(err);
    }
  }
);

// ── POST /api/staff/complaints/:id/request-info ───────────────────────────────
router.post('/complaints/:id/request-info', ...staffGuard, async (req, res, next) => {
  try {
    const result = await requestAdditionalInfo({
      complaintId: req.params.id,
      user: req.user,
      body: req.body,
    });
    return sendSuccess(res, result, { status: 200 });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, { status: err.status, code: err.code || 'BAD_REQUEST' });
    }
    return next(err);
  }
});

export default router;
