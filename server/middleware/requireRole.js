/**
 * CitizenConnect — requireRole Middleware Factory (Phase 3)
 *
 * Usage:
 *   router.get('/admin-only', requireAuth, requireRole('ADMIN'), handler);
 *   router.get('/staff',      requireAuth, requireRole('OFFICIAL','REVIEWER','ADMIN'), handler);
 *
 * Must be placed AFTER requireAuth so req.user is populated.
 * Returns 403 if the authenticated user does not hold one of the allowed roles.
 */

import { sendError } from '../utils/response.js';

/**
 * Factory that returns an Express middleware enforcing role-based access.
 *
 * @param  {...string} allowedRoles - One or more UserRole enum values.
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const userRole = req.user?.role;

    if (!userRole) {
      // requireAuth must precede requireRole
      return sendError(res, 'Authentication required.', {
        status: 401,
        code: 'UNAUTHENTICATED',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return sendError(
        res,
        'You do not have permission to perform this action.',
        { status: 403, code: 'FORBIDDEN' }
      );
    }

    return next();
  };
}
