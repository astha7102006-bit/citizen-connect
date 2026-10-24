/**
 * CitizenConnect — Auth Routes (Phase 3 + Security Hardening)
 *
 * POST /api/auth/register        — Public; creates CITIZEN accounts only
 * POST /api/auth/login           — Public; returns session cookie on success
 * POST /api/auth/logout          — Authenticated; destroys session and clears cookie
 * GET  /api/auth/me              — Authenticated; returns current user
 * POST /api/auth/forgot-password — Public; initiates password-reset flow
 * POST /api/auth/reset-password  — Public; completes password reset with token
 * POST /api/auth/verify-email    — Public; verifies email with token
 * POST /api/auth/resend-verify   — Authenticated; resends email verification link
 *
 * Security hardening:
 * - Separate, tighter rate limits for login vs registration.
 * - Session ID regenerated on BOTH login and registration (session fixation).
 * - Session saved to store before responding (prevents phantom sessions).
 * - Password max-length enforced (prevent DoS via bcrypt).
 * - Logout clears cookie with matching options.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  registerUser,
  loginUser,
  initiatePasswordReset,
  completePasswordReset,
  verifyEmail,
  resendVerificationEmail,
} from '../services/authService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { env } from '../config/env.js';

const router = Router();

const isTest = process.env.NODE_ENV === 'test';

// ── Rate limiters ──────────────────────────────────────────────────────────────
// Login: 10 per 15 min (tighter — high-value brute-force target)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, 'Too many login attempts. Please wait 15 minutes before trying again.', {
      status: 429,
      code: 'RATE_LIMITED',
    }),
  skipSuccessfulRequests: false,
});

// Registration: 5 per 15 min (slower — prevent mass account creation)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, 'Too many registration attempts. Please wait 15 minutes before trying again.', {
      status: 429,
      code: 'RATE_LIMITED',
    }),
  skipSuccessfulRequests: false,
});

// Password reset / email verification: 3 per 15 min
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, 'Too many requests. Please wait 15 minutes before trying again.', {
      status: 429,
      code: 'RATE_LIMITED',
    }),
});

// ── Input validation helpers ──────────────────────────────────────────────────

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < env.PASSWORD_MIN_LENGTH) return false;
  // Hard cap prevents DoS via bcrypt against extremely long strings
  if (password.length > env.PASSWORD_MAX_LENGTH) return false;
  return true;
}

function validateName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Regenerates the session ID (prevents session fixation), assigns user data,
 * then saves the session to the store before resolving.
 *
 * Returns a Promise that resolves to the session ID or rejects on failure.
 */
function regenerateAndSaveSession(req, { userId, role }) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenErr) => {
      if (regenErr) return reject(regenErr);

      req.session.userId = userId;
      req.session.role = role;

      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr);
        resolve(req.session.id);
      });
    });
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res, next) => {
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
    if (!validatePassword(password)) {
      const msg =
        password.length > env.PASSWORD_MAX_LENGTH
          ? `Password must not exceed ${env.PASSWORD_MAX_LENGTH} characters.`
          : `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters long.`;
      return sendError(res, msg, { status: 400, code: 'VALIDATION_ERROR' });
    }

    const user = await registerUser({ name, email, password, phone });

    // Regenerate session ID to prevent session fixation, then persist.
    // If regeneration or save fails, do NOT create a partial session.
    try {
      await regenerateAndSaveSession(req, { userId: user.id, role: user.role });
    } catch (sessionErr) {
      // Registration succeeded but session establishment failed.
      // Return success without a session cookie — user will log in manually.
      console.error('[Auth] Session setup failed after registration:', sessionErr.message);
      return sendSuccess(res, { user, sessionEstablished: false }, { status: 201 });
    }

    return sendSuccess(res, { user, sessionEstablished: true }, { status: 201 });
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return sendError(res, err.message, { status: 409, code: 'EMAIL_TAKEN' });
    }
    return next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    // Enforce password max-length before bcrypt to prevent DoS
    if (typeof password === 'string' && password.length > env.PASSWORD_MAX_LENGTH) {
      return sendError(res, 'Invalid email or password.', {
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    const user = await loginUser({ email, password });

    // Regenerate session ID to prevent fixation, then persist.
    try {
      await regenerateAndSaveSession(req, { userId: user.id, role: user.role });
    } catch (sessionErr) {
      return next(sessionErr);
    }

    return sendSuccess(res, { user });
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

    // Clear the session cookie with matching options to ensure client removes it
    res.clearCookie('cc.sid', {
      httpOnly: true,
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
    });
    return sendSuccess(res, { message: 'You have been logged out successfully.' });
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  return sendSuccess(res, { user: req.user });
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
// Initiates password reset flow. Always returns generic success to prevent
// user enumeration — whether or not the email exists.
router.post('/forgot-password', resetLimiter, async (req, res, _next) => {
  try {
    const { email } = req.body ?? {};

    if (!validateEmail(email ?? '')) {
      return sendError(res, 'A valid email address is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    await initiatePasswordReset({ email: email.trim().toLowerCase() });

    // Always return a generic message — do not reveal whether email exists
    return sendSuccess(res, {
      message:
        'If an account with that email exists, a password reset link has been sent. ' +
        'Please check your inbox and spam folder.',
    });
  } catch (err) {
    // Log internally but do not expose the real error
    console.error('[Auth] forgot-password error:', err.message);
    return sendSuccess(res, {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
// Completes a password reset using a one-time token.
router.post('/reset-password', resetLimiter, async (req, res, next) => {
  try {
    const { token, password } = req.body ?? {};

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return sendError(res, 'A valid reset token is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    if (!validatePassword(password ?? '')) {
      return sendError(res, `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters long and no more than ${env.PASSWORD_MAX_LENGTH} characters.`, {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    await completePasswordReset({ token: token.trim(), password });

    // Destroy any existing session — force re-login after password change
    if (req.session) {
      req.session.destroy(() => {});
    }

    return sendSuccess(res, {
      message: 'Your password has been reset successfully. Please log in with your new password.',
    });
  } catch (err) {
    if (err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED') {
      return sendError(res, err.message, { status: 400, code: err.code });
    }
    return next(err);
  }
});

// ── POST /api/auth/verify-email ───────────────────────────────────────────────
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body ?? {};

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return sendError(res, 'A valid verification token is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    await verifyEmail({ token: token.trim() });

    return sendSuccess(res, {
      message: 'Your email address has been verified successfully.',
    });
  } catch (err) {
    if (err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED') {
      return sendError(res, err.message, { status: 400, code: err.code });
    }
    return next(err);
  }
});

// ── POST /api/auth/resend-verify ─────────────────────────────────────────────
router.post('/resend-verify', resetLimiter, requireAuth, async (req, res, next) => {
  try {
    await resendVerificationEmail({ userId: req.user.id, email: req.user.email });

    return sendSuccess(res, {
      message: 'A new verification email has been sent. Please check your inbox.',
    });
  } catch (err) {
    if (err.code === 'ALREADY_VERIFIED') {
      return sendError(res, err.message, { status: 400, code: 'ALREADY_VERIFIED' });
    }
    return next(err);
  }
});

export default router;
