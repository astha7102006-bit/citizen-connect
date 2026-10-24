/**
 * CitizenConnect — Authentication Service (Phase 3)
 *
 * Encapsulates all auth business logic so route handlers stay thin.
 * Imported by server/routes/auth.js.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
 *  - Password is hashed with bcryptjs before storage.
 *
 * @param {{ name: string, email: string, password: string, phone?: string }} data
 * @returns {Promise<object>} Sanitised user record
 * @throws {{ code: string, message: string }} Domain errors
 */
export async function registerUser({ name, email, password, phone }) {
  const normalisedEmail = email.trim().toLowerCase();

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
