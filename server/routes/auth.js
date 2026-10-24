/**
 * CitizenConnect — Auth Routes (Phase 3)
 *
 * POST /api/auth/register  — Public; creates CITIZEN accounts only
 * POST /api/auth/login     — Public; returns session cookie on success
 * POST /api/auth/logout    — Authenticated; destroys session
 * GET  /api/auth/me        — Authenticated; returns current user
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { registerUser, loginUser } from '../services/authService.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

// ── Rate limiter — 10 requests per 15 minutes per IP ──────────────────────────
const authLimiter = rateLimit({
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

function validatePassword(password) {
  // Minimum 8 characters
  return typeof password === 'string' && password.length >= 8;
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
    if (!validatePassword(password)) {
      return sendError(res, 'Password must be at least 8 characters long.', {
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await registerUser({ name, email, password, phone });

    // Automatically create a session on successful registration
    req.session.userId = user.id;
    req.session.role   = user.role;

    return sendSuccess(res, { user }, { status: 201 });
  } catch (err) {
    // Known domain errors
    if (err.code === 'EMAIL_TAKEN') {
      return sendError(res, err.message, { status: 409, code: 'EMAIL_TAKEN' });
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

    const user = await loginUser({ email, password });

    // Regenerate session ID on login to prevent fixation attacks
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = user.id;
      req.session.role   = user.role;

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

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  // req.user is populated by requireAuth
  return sendSuccess(res, { user: req.user });
});

export default router;
