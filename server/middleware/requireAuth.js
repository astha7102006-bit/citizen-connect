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

  if (!userId) {
    return sendError(res, 'Authentication required. Please log in to continue.', {
      status: 401,
      code: 'UNAUTHENTICATED',
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
        createdAt: true,
        updatedAt: true,
        // passwordHash intentionally omitted
      },
    });

    if (!user) {
      // Session references a deleted user — destroy and reject
      req.session.destroy(() => {});
      return sendError(res, 'Session is no longer valid. Please log in again.', {
        status: 401,
        code: 'SESSION_INVALID',
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
 * Attaches req.user if a valid session exists, but does not block unauthenticated requests.
 */
export async function optionalAuth(req, res, next) {
  const userId = req.session?.userId;
  if (!userId) {
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user && user.accountStatus === 'ACTIVE') {
      req.user = user;
    } else {
      req.user = null;
    }
    return next();
  } catch (_err) {
    req.user = null;
    return next();
  }
}
