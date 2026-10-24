/**
 * CitizenConnect — Auth Routes (Phase 3)
 *
 * POST /api/auth/register          — Public; creates CITIZEN accounts only
 * POST /api/auth/login             — Public; returns session cookie on success
 * POST /api/auth/logout            — Authenticated; destroys session
 * POST /api/auth/revoke-sessions   — Authenticated; revokes all sessions across all devices
 * POST /api/auth/forgot-password   — Public; initiates password reset
 * POST /api/auth/reset-password    — Public; single-use atomic password reset
 * POST /api/auth/send-verification — Authenticated; sends email verification token
 * POST /api/auth/verify-email      — Public; single-use atomic email verification
 * GET  /api/auth/me                — Authenticated; returns current user
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  registerUser,
  loginUser,
  revokeAllUserSessions,
  requestPasswordReset,
  resetPassword,
  requestEmailVerification,
  verifyEmailToken,
  validatePasswordPolicy,
} from '../services/authService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

// ── Rate limiter — 10 requests per 15 minutes per IP ──────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait 15 minutes before trying again.',
    },
  },
  skipSuccessfulRequests: false,
});

// ── Input validation helpers ──────────────────────────────────────────────────

function validateEmail(email) {
  // RFC 5322-ish simple regex — sufficient for registration guard
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body ?? {};

    // Field presence check
    const missing = [];
    if (!name)     missing.push('name');
    if (!email)    missing.push('email');
    if (!password) missing.push('password');
    if (missing.length) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}.`, {
        status: 400,
        code: 'VALIDATION_ERROR',
        details: { missing },
      });
    }

    // Format validation
    if (!validateName(name)) {
      return sendError(res, 'Name must be between 2 and 100 characters.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    if (!validateEmail(email)) {
      return sendError(res, 'A valid email address is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const passwordValidation = validatePasswordPolicy(password);
    if (!passwordValidation.valid) {
      return sendError(res, passwordValidation.error, {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await registerUser({ name, email, password, phone });

    // Regenerate session ID to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = user.id;
      req.session.role   = user.role;
      req.session.sessionVersion = user.sessionVersion;

      return sendSuccess(res, { user }, { status: 201 });
    });
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return sendError(res, err.message, { status: 409, code: 'EMAIL_TAKEN' });
    }
    if (err.code === 'VALIDATION_ERROR') {
      return sendError(res, err.message, { status: 400, code: 'VALIDATION_ERROR' });
    }
    return next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    // Reject passwords exceeding bcrypt's 72-byte limit immediately
    if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 72) {
      return sendError(res, 'Invalid email or password.', {
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    const user = await loginUser({ email, password });

    // Regenerate session ID on login to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = user.id;
      req.session.role   = user.role;
      req.session.sessionVersion = user.sessionVersion;

      return sendSuccess(res, { user });
    });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return sendError(res, err.message, { status: 401, code: 'INVALID_CREDENTIALS' });
    }
    if (err.code === 'ACCOUNT_INACTIVE') {
      return sendError(res, err.message, { status: 403, code: 'ACCOUNT_INACTIVE' });
    }
    return next(err);
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);

    // Clear the session cookie
    res.clearCookie('cc.sid');
    return sendSuccess(res, { message: 'You have been logged out successfully.' });
  });
});

// ── POST /api/auth/revoke-sessions ───────────────────────────────────────────
router.post('/revoke-sessions', requireAuth, async (req, res, next) => {
  try {
    await revokeAllUserSessions(req.user.id);

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('cc.sid');
      return sendSuccess(res, { message: 'All active sessions have been revoked.' });
    });
  } catch (err) {
    return next(err);
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body ?? {};

    if (!email || !validateEmail(email)) {
      return sendError(res, 'A valid email address is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await requestPasswordReset({ email });
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = req.body ?? {};

    if (!token) {
      return sendError(res, 'Password reset token is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    if (!newPassword) {
      return sendError(res, 'New password is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const passwordValidation = validatePasswordPolicy(newPassword);
    if (!passwordValidation.valid) {
      return sendError(res, passwordValidation.error, {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await resetPassword({ token, newPassword });
    return sendSuccess(res, {
      user,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (err) {
    if (err.code === 'INVALID_TOKEN') {
      return sendError(res, err.message, { status: 400, code: 'INVALID_TOKEN' });
    }
    if (err.code === 'VALIDATION_ERROR') {
      return sendError(res, err.message, { status: 400, code: 'VALIDATION_ERROR' });
    }
    return next(err);
  }
});

// ── POST /api/auth/send-verification ─────────────────────────────────────────
router.post('/send-verification', requireAuth, async (req, res, next) => {
  try {
    const result = await requestEmailVerification({ userId: req.user.id });
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
});

// ── POST /api/auth/verify-email ──────────────────────────────────────────────
router.post('/verify-email', authLimiter, async (req, res, next) => {
  try {
    const { token } = req.body ?? {};

    if (!token) {
      return sendError(res, 'Verification token is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await verifyEmailToken({ token });
    return sendSuccess(res, {
      user,
      message: 'Email verified successfully.',
    });
  } catch (err) {
    if (err.code === 'INVALID_TOKEN') {
      return sendError(res, err.message, { status: 400, code: 'INVALID_TOKEN' });
    }
    if (err.code === 'VALIDATION_ERROR') {
      return sendError(res, err.message, { status: 400, code: 'VALIDATION_ERROR' });
    }
    return next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  // req.user is populated by requireAuth
  return sendSuccess(res, { user: req.user });
});

export default router;
