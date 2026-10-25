/**
 * CitizenConnect — Auth Routes (Phase 3 + Security Hardening)
 *
 * POST /api/auth/register          — Public; creates CITIZEN accounts only
 * POST /api/auth/login             — Public; returns session cookie on success
 * POST /api/auth/logout            — Authenticated; destroys session and clears cookie
 * POST /api/auth/revoke-sessions   — Authenticated; revokes all sessions across all devices
 * POST /api/auth/forgot-password   — Public; initiates password reset
 * POST /api/auth/reset-password    — Public; single-use atomic password reset
 * POST /api/auth/send-verification — Authenticated; sends email verification token
 * POST /api/auth/resend-verify     — Authenticated/Public; resends email verification link
 * POST /api/auth/verify-email      — Public; single-use atomic email verification
 * GET  /api/auth/me                — Authenticated; returns current user
 *
 * Security hardening:
 * - Rate limiting on login, registration, password reset, and email verification.
 * - Session ID regenerated on login (session fixation prevention).
 * - Session saved to store before responding.
 * - Password max-length enforced (prevent DoS via bcrypt).
 * - Logout clears cookie with matching options.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  registerUser,
  loginUser,
  revokeAllUserSessions,
  requestPasswordReset,
  resetPassword,
  initiatePasswordReset,
  completePasswordReset,
  requestEmailVerification,
  resendVerificationEmail,
  verifyEmailToken,
  verifyEmail,
  validatePasswordPolicy,
} from '../services/authService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';

const router = Router();
const isTest = process.env.NODE_ENV === 'test';

// ── Rate limiters ──────────────────────────────────────────────────────────────

// General auth limiter — 10 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, 'Too many login attempts. Please wait 15 minutes before trying again.', {
      status: 429,
      code: 'RATE_LIMITED',
    }),
  skipSuccessfulRequests: false,
});

// Login limiter — 10 per 15 min
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

// Registration limiter — 5 per 15 min
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

// Reset limiter — 3 per 15 min
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
  if (password.length < 8) return false;
  if (Buffer.byteLength(password, 'utf8') > 72) return false;
  return true;
}

function validateName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
}

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Regenerates the session ID (prevents session fixation), assigns user data,
 * stores the active sessionVersion, then saves the session to the store before resolving.
 *
 * Returns a Promise that resolves to the session ID or rejects on failure.
 */
function regenerateAndSaveSession(req, { userId, role, sessionVersion = 1 }) {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      return resolve();
    }
    if (typeof req.session.regenerate !== 'function') {
      req.session.userId = userId;
      req.session.role = role;
      req.session.sessionVersion = sessionVersion;
      if (typeof req.session.save === 'function') {
        return req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve(req.session.id)));
      }
      return resolve();
    }

    req.session.regenerate((regenErr) => {
      if (regenErr) return reject(regenErr);

      req.session.userId = userId;
      req.session.role = role;
      req.session.sessionVersion = sessionVersion;

      if (typeof req.session.save === 'function') {
        req.session.save((saveErr) => {
          if (saveErr) return reject(saveErr);
          resolve(req.session.id);
        });
      } else {
        resolve(req.session.id);
      }
    });
  });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body ?? {};

    // Field presence check
    const missing = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
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

    // New accounts are created in PENDING_VERIFICATION state.
    // They cannot log in or hold an authenticated session until email verification completes.
    return sendSuccess(
      res,
      {
        user,
        sessionEstablished: false,
        requiresVerification: true,
        message: 'Account created successfully. Please check your email to verify your account before logging in.',
      },
      { status: 201 }
    );
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return sendError(res, err.message, { status: 409, code: 'EMAIL_TAKEN' });
    }
    if (err.code === 'VALIDATION_ERROR') {
      return sendError(res, err.message, { status: 400, code: 'VALIDATION_ERROR' });
    }
    if (err.code === 'P2021' || err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientInitializationError') {
      return sendError(res, 'Registration service is temporarily unavailable. Please try again shortly.', {
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
      });
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
    if (typeof password === 'string' && (password.length > 72 || Buffer.byteLength(password, 'utf8') > 72)) {
      return sendError(res, 'Invalid email or password.', {
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    const user = await loginUser({ email, password });

    // Regenerate session ID to prevent fixation, store sessionVersion, then persist.
    try {
      await regenerateAndSaveSession(req, {
        userId: user.id,
        role: user.role,
        sessionVersion: user.sessionVersion || 1,
      });
    } catch (sessionErr) {
      return next(sessionErr);
    }

    return sendSuccess(res, { user });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return sendError(res, err.message, { status: 401, code: 'INVALID_CREDENTIALS' });
    }
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return sendError(res, err.message, { status: 403, code: 'EMAIL_NOT_VERIFIED' });
    }
    if (err.code === 'ACCOUNT_INACTIVE') {
      return sendError(res, err.message, { status: 403, code: 'ACCOUNT_INACTIVE' });
    }
    if (err.code === 'P2021' || err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientInitializationError') {
      return sendError(res, 'Authentication service is temporarily unavailable. Please try again shortly.', {
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
      });
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

    const normalisedEmail = email.trim().toLowerCase();
    const result = await requestPasswordReset({ email: normalisedEmail });
    return sendSuccess(res, result);
  } catch (err) {
    return next(err);
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token } = req.body ?? {};
    const newPassword = req.body?.newPassword || req.body?.password;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
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

    const user = await resetPassword({ token: token.trim(), newPassword });

    // Destroy existing session to force re-login
    if (req.session) {
      req.session.destroy(() => {});
    }

    return sendSuccess(res, {
      user,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (err) {
    if (err.code === 'INVALID_TOKEN' || err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED') {
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

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return sendError(res, 'Verification token is required.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await verifyEmailToken({ token: token.trim() });
    return sendSuccess(res, {
      user,
      message: 'Email verified successfully.',
    });
  } catch (err) {
    if (err.code === 'INVALID_TOKEN' || err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED') {
      return sendError(res, err.message, { status: 400, code: 'INVALID_TOKEN' });
    }
    if (err.code === 'VALIDATION_ERROR') {
      return sendError(res, err.message, { status: 400, code: 'VALIDATION_ERROR' });
    }
    return next(err);
  }
});

// ── POST /api/auth/resend-verify ─────────────────────────────────────────────
router.post('/resend-verify', resetLimiter, async (req, res, next) => {
  try {
    const rawEmail = req.body?.email;
    let userId = req.session?.userId;
    let email = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });
      if (user) {
        email = user.email;
      } else {
        userId = null;
      }
    }

    if (!userId && rawEmail && validateEmail(rawEmail)) {
      const user = await prisma.user.findUnique({
        where: { email: rawEmail.trim().toLowerCase() },
        select: { id: true, email: true },
      });
      if (user) {
        userId = user.id;
        email = user.email;
      }
    }

    if (!userId) {
      // Return generic success to avoid enumeration
      return sendSuccess(res, {
        message: 'If an unverified account with that email exists, a new verification link has been sent.',
      });
    }

    const delivery = await resendVerificationEmail({ userId, email });

    if (!delivery.sent && delivery.reason === 'SMTP_NOT_CONFIGURED') {
      return sendSuccess(res, {
        message: 'Verification request recorded. Email service is not yet configured on this server.',
        delivered: false,
      });
    }

    return sendSuccess(res, {
      message: 'A new verification email has been sent. Please check your inbox.',
      delivered: delivery.sent,
    });
  } catch (err) {
    if (err.code === 'ALREADY_VERIFIED') {
      return sendError(res, err.message, { status: 400, code: 'ALREADY_VERIFIED' });
    }
    return next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  return sendSuccess(res, { user: req.user });
});

export default router;
