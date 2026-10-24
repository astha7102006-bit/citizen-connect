/**
 * CitizenConnect — requireAuth Middleware (Phase 3)
 *
 * Checks that a valid server-side session exists.
 * Attaches the sanitised user object to req.user.
 * Returns 401 if the request is unauthenticated.
 */

import { prisma } from '../config/db.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware that enforces authentication.
 * Must be placed after session middleware in the middleware stack.
 */
export async function requireAuth(req, res, next) {
  const userId = req.session?.userId;
  const sessionVersion = req.session?.sessionVersion;

  if (!userId) {
    return sendError(res, 'Authentication required. Please log in to continue.', {
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  }

  // Reject sessions missing an explicit sessionVersion
  if (typeof sessionVersion !== 'number') {
    req.session?.destroy?.(() => {});
    res.clearCookie?.('cc.sid');
    return sendError(res, 'Session is invalid or expired. Please log in again.', {
      status: 401,
      code: 'SESSION_INVALID',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        departmentId: true,
        accountStatus: true,
        sessionVersion: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash intentionally omitted
      },
    });

    if (!user) {
      // Session references a deleted user — destroy and reject
      req.session?.destroy?.(() => {});
      res.clearCookie?.('cc.sid');
      return sendError(res, 'Session is no longer valid. Please log in again.', {
        status: 401,
        code: 'SESSION_INVALID',
      });
    }

    // Check if session version matches database record
    if (user.sessionVersion !== sessionVersion) {
      req.session?.destroy?.(() => {});
      res.clearCookie?.('cc.sid');
      return sendError(res, 'Session has been revoked or invalidated. Please log in again.', {
        status: 401,
        code: 'SESSION_REVOKED',
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return sendError(
        res,
        'Your account has been suspended or deactivated. Please contact support.',
        { status: 403, code: 'ACCOUNT_INACTIVE' }
      );
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Optional authentication middleware.
 * Attaches req.user if a valid, unrevoked session exists, but does not block unauthenticated requests.
 */
export async function optionalAuth(req, res, next) {
  const userId = req.session?.userId;
  const sessionVersion = req.session?.sessionVersion;

  if (!userId || typeof sessionVersion !== 'number') {
    req.user = null;
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        departmentId: true,
        accountStatus: true,
        sessionVersion: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user && user.accountStatus === 'ACTIVE' && user.sessionVersion === sessionVersion) {
      req.user = user;
    } else {
      req.user = null;
      if (user && user.sessionVersion !== sessionVersion) {
        req.session?.destroy?.(() => {});
        res.clearCookie?.('cc.sid');
      }
    }
    return next();
  } catch (_err) {
    req.user = null;
    return next();
  }
}
