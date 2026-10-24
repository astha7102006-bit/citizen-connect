/**
 * CitizenConnect — Complaints API Router (Phase 4)
 *
 * POST  /api/complaints                        — Create a complaint (citizen session required)
 * GET   /api/complaints                        — List authenticated citizen's complaints (paginated)
 * GET   /api/complaints/:id                    — View complaint details (owner or authorized staff only)
 * GET   /api/complaints/reference/:refNumber   — Track complaint (owner full view / public redacted view)
 * PATCH /api/complaints/:id                    — Edit eligible fields before processing (owner only)
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  createComplaint,
  getCitizenComplaints,
  getComplaintById,
  trackComplaintByReference,
  updateComplaint,
} from '../services/complaintService.js';
import {
  getComplaintTimeline,
  verifyComplaintTimeline,
} from '../services/timelineService.js';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

// Rate limiter for complaint submission: 30 complaints per 15 minutes per IP
const complaintSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many complaint submissions. Please try again after 15 minutes.',
    },
  },
});

// ── 1. POST /api/complaints ───────────────────────────────────────────────────
router.post('/', requireAuth, complaintSubmissionLimiter, async (req, res, next) => {
  try {
    const complaint = await createComplaint({
      user: req.user,
      body: req.body,
    });
    return sendSuccess(res, { complaint }, { status: 201 });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, {
        status: err.status,
        code: err.code || 'BAD_REQUEST',
        details: err.details,
      });
    }
    return next(err);
  }
});

// ── 2. GET /api/complaints ────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { complaints, meta } = await getCitizenComplaints({
      user: req.user,
      query: req.query,
    });
    return sendSuccess(res, { complaints }, { meta });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, {
        status: err.status,
        code: err.code || 'BAD_REQUEST',
      });
    }
    return next(err);
  }
});

// ── 3. GET /api/complaints/reference/:referenceNumber ─────────────────────────
// Note: Declared BEFORE /:id so Express does not match "reference" as an ID param
router.get('/reference/:referenceNumber', optionalAuth, async (req, res, next) => {
  try {
    const { referenceNumber } = req.params;
    if (!referenceNumber || referenceNumber.trim().length < 5) {
      return sendError(res, 'A valid tracking reference number is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const complaint = await trackComplaintByReference({
      referenceNumber,
      user: req.user,
    });

    return sendSuccess(res, { complaint });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, {
        status: err.status,
        code: err.code || 'NOT_FOUND',
      });
    }
    return next(err);
  }
});

// ── 4. GET /api/complaints/:id/timeline/verify ───────────────────────────────
router.get('/:id/timeline/verify', requireAuth, async (req, res, next) => {
  try {
    const result = await verifyComplaintTimeline({
      id: req.params.id,
      user: req.user,
    });
    return sendSuccess(res, result);
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, {
        status: err.status,
        code: err.code || 'BAD_REQUEST',
      });
    }
    return next(err);
  }
});

// ── 5. GET /api/complaints/:id/timeline ──────────────────────────────────────
router.get('/:id/timeline', requireAuth, async (req, res, next) => {
  try {
    const timeline = await getComplaintTimeline({
      id: req.params.id,
      user: req.user,
    });
    return sendSuccess(res, { timeline });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, {
        status: err.status,
        code: err.code || 'BAD_REQUEST',
      });
    }
    return next(err);
  }
});

// ── 6. GET /api/complaints/:id ────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const complaint = await getComplaintById({
      id: req.params.id,
      user: req.user,
    });
    return sendSuccess(res, { complaint });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, {
        status: err.status,
        code: err.code || 'BAD_REQUEST',
      });
    }
    return next(err);
  }
});

// ── 5. PATCH /api/complaints/:id ──────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const complaint = await updateComplaint({
      id: req.params.id,
      user: req.user,
      body: req.body,
    });
    return sendSuccess(res, { complaint });
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, {
        status: err.status,
        code: err.code || 'BAD_REQUEST',
      });
    }
    return next(err);
  }
});

export default router;
