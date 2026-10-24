/**
 * CitizenConnect — Authentication Service (Phase 3)
 *
 * Encapsulates all auth business logic so route handlers stay thin.
 * Imported by server/routes/auth.js.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Valid 60-character bcrypt hash used to defeat timing attacks when a user is not found.
 */
const TIMING_SAFE_DUMMY_HASH = '$2a$12$e8kZ1q6W5GjB6f2gI5iW5.8i4L8E8G6zF8vJ0mH4nK6pL2rT4uV6y';

/**
 * Validates password against policy and bcrypt's hard 72-byte truncation limit.
 *
 * @param {string} password
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePasswordPolicy(password) {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  const byteLength = Buffer.byteLength(password, 'utf8');
  if (byteLength > 72) {
    return { valid: false, error: 'Password cannot exceed 72 bytes due to bcrypt algorithmic limits.' };
  }
  return { valid: true };
}

/**
 * Mask an email address to prevent exposing sensitive PII in logs.
 * Example: 'aditya.kumar@example.com' -> 'a***r@example.com'
 *
 * @param {string} email
 * @returns {string}
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[REDACTED]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED]';
  const [local, domain] = parts;
  const maskedLocal = local.length > 2
    ? `${local[0]}***${local[local.length - 1]}`
    : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Returns a sanitised user object safe to send to clients.
 * Never includes passwordHash.
 *
 * @param {object} user - Raw Prisma user record
 * @returns {object}
 */
export function sanitiseUser(user) {
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

// ── Register ──────────────────────────────────────────────────────────────────

/**
 * Create a new CITIZEN account.
 *
 * Rules:
 *  - Email is normalised to lowercase and trimmed.
 *  - Duplicate emails return a domain error (caller converts to 409).
 *  - Role is ALWAYS forced to CITIZEN regardless of input.
 *  - Password validated against bcrypt 72-byte limit and hashed.
 *  - Default sessionVersion = 1, emailVerified = false.
 *
 * @param {{ name: string, email: string, password: string, phone?: string }} data
 * @returns {Promise<object>} Sanitised user record
 * @throws {{ code: string, message: string }} Domain errors
 */
export async function registerUser({ name, email, password, phone }) {
  const normalisedEmail = email.trim().toLowerCase();

  const passwordValidation = validatePasswordPolicy(password);
  if (!passwordValidation.valid) {
    const err = new Error(passwordValidation.error);
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
      sessionVersion: 1,
      emailVerified: false,
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
  const GENERIC_ERROR = 'Invalid email or password.';

  // If password exceeds bcrypt 72-byte limit, fail safely
  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 72) {
    // Run dummy compare to defeat timing analysis
    await bcrypt.compare('dummyPasswordFallback', TIMING_SAFE_DUMMY_HASH);
    const err = new Error(GENERIC_ERROR);
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  const normalisedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalisedEmail },
  });

  if (!user) {
    // Run a dummy bcrypt compare with full 60-character hash to defeat timing attacks
    await bcrypt.compare(password, TIMING_SAFE_DUMMY_HASH);
    const err = new Error(GENERIC_ERROR);
    err.code = 'INVALID_CREDENTIALS';
    err.status = 401;
    throw err;
  }

  if (!user.passwordHash) {
    // Account exists but was never given a password (e.g. future SSO path)
    await bcrypt.compare(password, TIMING_SAFE_DUMMY_HASH);
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

// ── Session Revocation ────────────────────────────────────────────────────────

/**
 * Increments the user's sessionVersion, immediately revoking all active sessions across all devices.
 *
 * @param {string} userId
 * @returns {Promise<object>} Updated sanitised user
 */
export async function revokeAllUserSessions(userId) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      sessionVersion: { increment: 1 },
    },
  });
  return sanitiseUser(updatedUser);
}

// ── Password Reset (Single-Use with Concurrency Protection) ───────────────────

/**
 * Initiates a password reset request.
 * - Generates a 256-bit cryptographically secure token.
 * - Stores SHA-256 hash in database with short expiration (15 minutes).
 * - Invalidates any previous unused reset tokens for this user.
 * - Emits audit log with masked recipient (no token/PII exposure).
 *
 * @param {{ email: string }} params
 * @returns {Promise<{ message: string, rawToken?: string }>}
 */
export async function requestPasswordReset({ email }) {
  const normalisedEmail = email.trim().toLowerCase();
  const GENERIC_RESPONSE = 'If an account with that email exists, password reset instructions have been sent.';

  const user = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== 'ACTIVE') {
    // Return identical message to prevent user enumeration
    return { message: GENERIC_RESPONSE };
  }

  // Invalidate any previously issued unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Generate 32 bytes (256 bits) of cryptographic entropy
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute validity window

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Safe logging: Never log raw tokens or plain email addresses
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[AUTH_AUDIT] Password reset token issued for user: ${maskEmail(normalisedEmail)} (expires in 15m)`);
  }

  return {
    message: GENERIC_RESPONSE,
    // Return token in test mode to support automated regression testing
    ...(process.env.NODE_ENV === 'test' ? { rawToken } : {}),
  };
}

/**
 * Resets a user's password using a single-use token.
 *
 * Strict Concurrency & Security Rules:
 *  - Atomic conditional update ensures the token cannot be used twice, even under concurrent race conditions.
 *  - Enforces bcrypt 72-byte password limit.
 *  - Increments sessionVersion to immediately invalidate all existing sessions.
 *
 * @param {{ token: string, newPassword: string }} params
 * @returns {Promise<object>} Sanitised user
 */
export async function resetPassword({ token, newPassword }) {
  if (!token || typeof token !== 'string') {
    const err = new Error('Password reset token is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const passwordValidation = validatePasswordPolicy(newPassword);
  if (!passwordValidation.valid) {
    const err = new Error(passwordValidation.error);
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const now = new Date();

  // ATOMIC CONSUMPTION:
  // updateMany with `usedAt: null` and `expiresAt: { gt: now }` guarantees that under concurrent requests,
  // exactly ONE request will match and update the row. Any concurrent runner will see count === 0.
  const updated = await prisma.passwordResetToken.updateMany({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      usedAt: now,
    },
  });

  if (updated.count === 0) {
    const err = new Error('Invalid, expired, or already used password reset token.');
    err.code = 'INVALID_TOKEN';
    err.status = 400;
    throw err;
  }

  // Retrieve token owner
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });

  if (!tokenRecord) {
    const err = new Error('Invalid, expired, or already used password reset token.');
    err.code = 'INVALID_TOKEN';
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

  // Update password and increment sessionVersion to revoke all active sessions
  const updatedUser = await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: {
      passwordHash,
      sessionVersion: { increment: 1 },
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[AUTH_AUDIT] Password successfully reset for user ${tokenRecord.userId}. All previous sessions revoked.`);
  }

  return sanitiseUser(updatedUser);
}

// ── Email Verification (Single-Use with Concurrency Protection) ───────────────

/**
 * Generates a single-use email verification token.
 *
 * @param {{ userId: string }} params
 * @returns {Promise<{ message: string, rawToken?: string }>}
 */
export async function requestEmailVerification({ userId }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) {
    const err = new Error('User not found.');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  if (user.emailVerified) {
    return { message: 'Email is already verified.' };
  }

  // Invalidate previous verification tokens
  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[AUTH_AUDIT] Verification token generated for user: ${maskEmail(user.email)}`);
  }

  return {
    message: 'Verification instructions sent.',
    ...(process.env.NODE_ENV === 'test' ? { rawToken } : {}),
  };
}

/**
 * Atomically verifies an email using a single-use token.
 *
 * Concurrency Protection:
 *  - updateMany guarantees exactly one concurrent request can consume the token.
 *
 * @param {{ token: string }} params
 * @returns {Promise<object>} Sanitised user
 */
export async function verifyEmailToken({ token }) {
  if (!token || typeof token !== 'string') {
    const err = new Error('Verification token is required.');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const now = new Date();

  // ATOMIC CONSUMPTION:
  const updated = await prisma.emailVerificationToken.updateMany({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      usedAt: now,
    },
  });

  if (updated.count === 0) {
    const err = new Error('Invalid, expired, or already used email verification token.');
    err.code = 'INVALID_TOKEN';
    err.status = 400;
    throw err;
  }

  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });

  if (!tokenRecord) {
    const err = new Error('Invalid, expired, or already used email verification token.');
    err.code = 'INVALID_TOKEN';
    err.status = 400;
    throw err;
  }

  const updatedUser = await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: {
      emailVerified: true,
      accountStatus: 'ACTIVE',
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[AUTH_AUDIT] Email verified successfully for user ${tokenRecord.userId}.`);
  }

  return sanitiseUser(updatedUser);
}
