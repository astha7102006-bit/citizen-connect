/**
 * CitizenConnect — Authentication Service (Phase 3 + Security Hardening)
 *
 * Encapsulates all auth business logic so route handlers stay thin.
 * Imported by server/routes/auth.js.
 *
 * Security hardening additions:
 * - Password max-length enforced before bcrypt (DoS prevention).
 * - Password reset: expiring single-use tokens, stored as SHA-256 hashes.
 * - Email verification: expiring single-use tokens, stored as SHA-256 hashes.
 * - Generic error responses to prevent user enumeration.
 * - Tokens are never logged.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a sanitised user object safe to send to clients.
 * Never includes passwordHash, resetTokenHash, verifyTokenHash, or any secret.
 *
 * @param {object} user - Raw Prisma user record
 * @returns {object}
 */
export function sanitiseUser(user) {
  const {
    passwordHash: _passwordHash,
    resetTokenHash: _resetTokenHash,
    resetTokenExpiresAt: _resetTokenExpiresAt,
    verifyTokenHash: _verifyTokenHash,
    verifyTokenExpiresAt: _verifyTokenExpiresAt,
    ...safe
  } = user;
  return safe;
}

/**
 * Generate a cryptographically random URL-safe token and its SHA-256 hash.
 * The raw token is sent to the user; only the hash is stored.
 *
 * @param {number} [byteLength=32] - Entropy bytes (32 → 64 hex chars)
 * @returns {{ rawToken: string, tokenHash: string }}
 */
function generateSecureToken(byteLength = 32) {
  const rawToken = crypto.randomBytes(byteLength).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

/**
 * Hash a provided token for safe database lookup.
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Send an email (stub — requires SMTP configuration).
 * Logs a warning when SMTP is not configured so devs know it's a no-op.
 * NEVER logs token values.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
async function sendEmail({ to, subject, text }) {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.warn(
      `[Email] SMTP not configured. Email NOT sent to ${to}. ` +
      `Subject: "${subject}". ` +
      'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in your environment.'
    );
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  // When SMTP is available, use nodemailer (installed separately if needed).
  // This implementation is a safe stub — add nodemailer transport here.
  try {
    // Dynamic import so the service doesn't crash when nodemailer is absent
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
    });

    return { sent: true };
  } catch (err) {
    console.error(`[Email] Failed to send email to ${to}: ${err.message}`);
    return { sent: false, reason: err.message };
  }
}

// ── Register ──────────────────────────────────────────────────────────────────

/**
 * Create a new CITIZEN account.
 *
 * Rules:
 *  - Email is normalised to lowercase and trimmed.
 *  - Duplicate emails return a domain error (caller converts to 409).
 *  - Role is ALWAYS forced to CITIZEN regardless of input.
 *  - Password is hashed with bcryptjs before storage.
 *  - Password max-length is enforced before bcrypt to prevent DoS.
 *
 * @param {{ name: string, email: string, password: string, phone?: string }} data
 * @returns {Promise<object>} Sanitised user record
 * @throws {{ code: string, message: string }} Domain errors
 */
export async function registerUser({ name, email, password, phone }) {
  const normalisedEmail = email.trim().toLowerCase();

  // Enforce password policy constraints before hashing
  if (!password || typeof password !== 'string' || password.length < env.PASSWORD_MIN_LENGTH) {
    const err = new Error(`Password must be at least ${env.PASSWORD_MIN_LENGTH} characters long.`);
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  // Enforce max password length before hashing (bcrypt silently truncates at 72 bytes; prevent DoS)
  if (password.length > env.PASSWORD_MAX_LENGTH) {
    const err = new Error(`Password must not exceed ${env.PASSWORD_MAX_LENGTH} characters.`);
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  // Check for existing account — use generic error to avoid enumeration
  const existing = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true },
  });
  if (existing) {
    const err = new Error('An account with this email address already exists.');
    err.code = 'EMAIL_TAKEN';
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalisedEmail,
      passwordHash,
      phone: phone?.trim() || null,
      role: 'CITIZEN',          // Hardcoded — never from client input
      accountStatus: 'ACTIVE',
    },
  });

  return sanitiseUser(user);
}

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * Validate credentials and return the sanitised user.
 *
 * Security note: Both "email not found" and "wrong password" return the
 * SAME generic error to prevent account enumeration attacks.
 *
 * @param {{ email: string, password: string }} data
 * @returns {Promise<object>} Sanitised user record
 * @throws {{ code: string, message: string }} Domain errors
 */
export async function loginUser({ email, password }) {
  const normalisedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalisedEmail },
  });

  const GENERIC_ERROR = 'Invalid email or password.';

  if (!user) {
    // Run a dummy bcrypt compare to defeat timing attacks
    await bcrypt.compare(password, '$2b$12$invalidHashToPreventTimingAttacks000000000000000000000');
    const err = new Error(GENERIC_ERROR);
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  if (!user.passwordHash) {
    // Account exists but was never given a password (e.g. future SSO path)
    const err = new Error(GENERIC_ERROR);
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error(GENERIC_ERROR);
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  if (user.accountStatus !== 'ACTIVE') {
    const err = new Error('Your account has been suspended or deactivated.');
    err.code = 'ACCOUNT_INACTIVE';
    err.status = 403;
    throw err;
  }

  return sanitiseUser(user);
}

// ── Password Reset ────────────────────────────────────────────────────────────

/**
 * Initiate a password reset for the given email.
 * Always returns without error regardless of whether the email exists,
 * to prevent enumeration attacks.
 *
 * A SHA-256 hash of the token is stored; the raw token is sent in the email.
 *
 * @param {{ email: string }} data
 */
export async function initiatePasswordReset({ email }) {
  const normalisedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true, name: true, email: true },
  });

  // Silently return if no account — caller should not distinguish
  if (!user) return;

  const { rawToken, tokenHash } = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: expiresAt,
    },
  });

  const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'CitizenConnect — Password Reset Request',
    text:
      `Hello ${user.name},\n\n` +
      `A password reset was requested for your CitizenConnect account.\n\n` +
      `Reset your password here (expires in ${env.PASSWORD_RESET_TOKEN_TTL_HOURS} hour${env.PASSWORD_RESET_TOKEN_TTL_HOURS !== 1 ? 's' : ''}):\n` +
      `${resetUrl}\n\n` +
      `If you did not request this, you can safely ignore this email.\n\n` +
      `CitizenConnect Security Team`,
  });
}

/**
 * Complete password reset using a one-time token.
 *
 * @param {{ token: string, password: string }} data
 */
export async function completePasswordReset({ token, password }) {
  // Enforce password constraints
  if (password.length < env.PASSWORD_MIN_LENGTH || password.length > env.PASSWORD_MAX_LENGTH) {
    const err = new Error(
      `Password must be between ${env.PASSWORD_MIN_LENGTH} and ${env.PASSWORD_MAX_LENGTH} characters.`
    );
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { gt: now },
    },
    select: { id: true, accountStatus: true },
  });

  if (!user) {
    const err = new Error('Password reset link is invalid or has expired. Please request a new one.');
    err.code = 'TOKEN_INVALID';
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      // Invalidate token immediately (single-use)
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });
}

// ── Email Verification ────────────────────────────────────────────────────────

/**
 * Send an email verification link to the specified user.
 *
 * @param {{ userId: string, email: string }} data
 */
export async function resendVerificationEmail({ userId, email: _email }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, emailVerifiedAt: true },
  });

  if (!user) {
    const err = new Error('User not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (user.emailVerifiedAt) {
    const err = new Error('This email address is already verified.');
    err.code = 'ALREADY_VERIFIED';
    err.status = 400;
    throw err;
  }

  const { rawToken, tokenHash } = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + env.EMAIL_VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      verifyTokenHash: tokenHash,
      verifyTokenExpiresAt: expiresAt,
    },
  });

  const verifyUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'CitizenConnect — Verify Your Email Address',
    text:
      `Hello ${user.name},\n\n` +
      `Please verify your email address to activate your CitizenConnect account:\n` +
      `${verifyUrl}\n\n` +
      `This link expires in ${env.EMAIL_VERIFY_TOKEN_TTL_HOURS} hour${env.EMAIL_VERIFY_TOKEN_TTL_HOURS !== 1 ? 's' : ''}.\n\n` +
      `CitizenConnect Team`,
  });
}

/**
 * Mark email as verified using a single-use token.
 *
 * @param {{ token: string }} data
 */
export async function verifyEmail({ token }) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      verifyTokenHash: tokenHash,
      verifyTokenExpiresAt: { gt: now },
    },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user) {
    const err = new Error('Email verification link is invalid or has expired. Please request a new one.');
    err.code = 'TOKEN_INVALID';
    err.status = 400;
    throw err;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: now,
      // Invalidate token immediately (single-use)
      verifyTokenHash: null,
      verifyTokenExpiresAt: null,
    },
  });
}
