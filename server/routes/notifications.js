/**
 * CitizenConnect — In-App Notifications API Router (Phase 5)
 *
 * GET   /api/notifications          — List notifications for authenticated user
 * PATCH /api/notifications/:id/read — Mark a notification as read
 * GET   /api/notifications/unread-count — Unread notification count
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../services/notificationService.js';

const router = Router();

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await getUserNotifications({
      userId: req.user.id,
      page,
      limit,
    });

    return sendSuccess(res, { notifications: result.notifications }, { meta: result.meta });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/notifications/unread-count ──────────────────────────────────────
// Note: declared before /:id so Express doesn't match "unread-count" as an id
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const result = await getUserNotifications({
      userId: req.user.id,
      page: 1,
      limit: 1,
    });
    return sendSuccess(res, { unreadCount: result.meta.unreadCount });
  } catch (err) {
    return next(err);
  }
});

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notif = await markNotificationAsRead({
      notificationId: req.params.id,
      userId: req.user.id,
    });

    if (!notif) {
      return sendError(res, 'Notification not found or does not belong to you.', {
        status: 404,
        code: 'NOT_FOUND',
      });
    }

    return sendSuccess(res, { notification: notif });
  } catch (err) {
    return next(err);
  }
});

export default router;
