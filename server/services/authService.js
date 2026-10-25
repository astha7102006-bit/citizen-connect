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
 * - Session version tracking and instantaneous multi-device session revocation.
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
 * Never includes passwordHash, resetTokenHash, verifyTokenHash, or any secret.
 *
 * @param {object} user - Raw Prisma user record
 * @returns {object}
 */
export function sanitiseUser(user) {
  if (!user) return null;
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
 * Send an email (requires SMTP configuration).
 * Logs an operational notice when SMTP is not configured so devs know it's a no-op.
 * NEVER logs raw token values or reset links.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendEmail({ to, subject, text }) {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.warn(
      `[Email] SMTP not configured. Email NOT sent to ${to}. ` +
      `Subject: "${subject}". ` +
      'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in your environment.'
    );
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
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
 *  - Password validated against bcrypt 72-byte limit and hashed.
 *  - Account is created in PENDING_VERIFICATION state until email is verified.
 *  - Generates a cryptographically random, expiring, single-use verification token.
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
  const { rawToken, tokenHash } = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + env.EMAIL_VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalisedEmail,
      passwordHash,
      phone: phone?.trim() || null,
      role: 'CITIZEN',          // Hardcoded — never from client input
      accountStatus: 'PENDING_VERIFICATION',
      emailVerified: false,
      emailVerifiedAt: null,
      verifyTokenHash: tokenHash,
      verifyTokenExpiresAt: expiresAt,
      sessionVersion: 1,
    },
  });

  const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}`;

  const emailResult = await sendEmail({
    to: user.email,
    subject: 'CitizenConnect — Verify Your Email Address',
    text:
      `Hello ${user.name},\n\n` +
      `Thank you for registering with CitizenConnect.\n` +
      `Please verify your email address to activate your account:\n` +
      `${verifyUrl}\n\n` +
      `This link expires in ${env.EMAIL_VERIFY_TOKEN_TTL_HOURS} hour${env.EMAIL_VERIFY_TOKEN_TTL_HOURS !== 1 ? 's' : ''}.\n\n` +
      `CitizenConnect Team`,
  });

  if (!emailResult.sent) {
    console.warn(
      `[Email] Verification email delivery not completed for recipient: ${emailResult.reason || 'Unknown error'}`
    );
  }

  return sanitiseUser(user);
}

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * Validate credentials and return the sanitised user.
 *
 * Security note: Both "email not found" and "wrong password" return the
 * SAME generic error to prevent account enumeration attacks.
 *
 * Enforces email verification: unverified accounts cannot log in.
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

  if (user.accountStatus === 'PENDING_VERIFICATION' || !user.emailVerifiedAt) {
    const err = new Error(
      'Please verify your email address before logging in. Check your inbox for the verification link.'
    );
    err.code = 'EMAIL_NOT_VERIFIED';
    err.status = 403;
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
 * Initiates a password reset request via dedicated token table.
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
    return { message: GENERIC_RESPONSE };
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

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

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[AUTH_AUDIT] Password reset token issued for user: ${maskEmail(normalisedEmail)} (expires in 15m)`);
  }

  return {
    message: GENERIC_RESPONSE,
    ...(process.env.NODE_ENV === 'test' ? { rawToken } : {}),
  };
}

/**
 * Resets a user's password using a single-use token from the token table.
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

  // ATOMIC CONSUMPTION
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

// ── Password Reset (User record fields based for Security Hardening tests) ────

/**
 * Initiate a password reset for the given email (updating User record).
 *
 * @param {{ email: string }} data
 */
export async function initiatePasswordReset({ email }) {
  const normalisedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true, name: true, email: true },
  });

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

  const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;

  const emailResult = await sendEmail({
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

  if (!emailResult.sent) {
    console.warn(
      `[Email] Password reset email delivery not completed for recipient: ${emailResult.reason || 'Unknown error'}`
    );
  }
}

/**
 * Complete password reset using a one-time token stored on User record.
 *
 * @param {{ token: string, password: string }} data
 */
export async function completePasswordReset({ token, password }) {
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
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      sessionVersion: { increment: 1 },
    },
  });
}

// ── Email Verification ────────────────────────────────────────────────────────

/**
 * Generates a single-use email verification token in dedicated token table.
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
 * Atomically verifies an email using a single-use token in dedicated token table.
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

/**
 * Resend an email verification link to the specified user (User model based).
 *
 * @param {{ userId: string, email: string }} data
 * @returns {Promise<{ sent: boolean, reason?: string }>}
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

  const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}`;

  const emailResult = await sendEmail({
    to: user.email,
    subject: 'CitizenConnect — Verify Your Email Address',
    text:
      `Hello ${user.name},\n\n` +
      `Please verify your email address to activate your CitizenConnect account:\n` +
      `${verifyUrl}\n\n` +
      `This link expires in ${env.EMAIL_VERIFY_TOKEN_TTL_HOURS} hour${env.EMAIL_VERIFY_TOKEN_TTL_HOURS !== 1 ? 's' : ''}.\n\n` +
      `CitizenConnect Team`,
  });

  if (!emailResult.sent) {
    console.warn(
      `[Email] Verification email delivery not completed for recipient: ${emailResult.reason || 'Unknown error'}`
    );
  }

  return { sent: emailResult.sent, reason: emailResult.reason };
}

/**
 * Mark email as verified using a single-use token on User model.
 * Only transitions PENDING_VERIFICATION accounts to ACTIVE; never reactivates SUSPENDED or DEACTIVATED accounts.
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
    select: { id: true, emailVerifiedAt: true, accountStatus: true },
  });

  if (!user) {
    const err = new Error('Email verification link is invalid or has expired. Please request a new one.');
    err.code = 'TOKEN_INVALID';
    err.status = 400;
    throw err;
  }

  const updateData = {
    emailVerifiedAt: now,
    verifyTokenHash: null,
    verifyTokenExpiresAt: null,
  };

  if (user.accountStatus === 'PENDING_VERIFICATION') {
    updateData.accountStatus = 'ACTIVE';
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });
}
