/**
 * CitizenConnect — Centralised Environment Configuration
 *
 * Loads .env from the project root and validates required variables.
 * All server code imports from here — never from process.env directly.
 *
 * Security: SESSION_SECRET is validated for strength in production.
 * Weak or missing secrets cause a hard startup failure — never a silent fallback.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (two levels up from server/config/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isProduction = NODE_ENV === 'production';

// Known weak/placeholder secrets that must never reach production.
const KNOWN_WEAK_SECRETS = new Set([
  'dev-insecure-session-secret-replace-in-production',
  'replace-with-a-long-random-secret-min-64-chars',
  'secret',
  'changeme',
  'session-secret',
  'your-secret',
  'dev-secret',
  'development-secret',
]);

/**
 * Validates the session secret. Fails startup with a clear error in production
 * when the secret is absent, too short, or a known placeholder.
 * NEVER logs or exposes the secret value.
 */
function resolveSessionSecret() {
  const raw = process.env.SESSION_SECRET;

  if (isProduction) {
    if (!raw || raw.trim().length === 0) {
      throw new Error(
        '[SECURITY] SESSION_SECRET is not set. ' +
        'Set a strong, random secret (min 64 chars) in your environment or secret manager. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }
    if (KNOWN_WEAK_SECRETS.has(raw.trim())) {
      throw new Error(
        '[SECURITY] SESSION_SECRET is a known placeholder value and cannot be used in production. ' +
        'Replace it with a strong, randomly generated secret of at least 64 characters.'
      );
    }
    if (raw.trim().length < 32) {
      throw new Error(
        '[SECURITY] SESSION_SECRET is too short for production use. ' +
        'The secret must be at least 32 characters; 64 random bytes are recommended.'
      );
    }
    return raw.trim();
  }

  // Development: fall back to an explicit dev placeholder (safe only in local dev).
  return raw?.trim() || 'dev-insecure-session-secret-replace-in-production';
}

/**
 * In production, refuse to start if DATABASE_URL is missing,
 * since the session store (PostgreSQL-backed) will not work.
 */
function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL ?? '';
  if (isProduction && (!raw || raw.trim().length === 0)) {
    throw new Error(
      '[STARTUP] DATABASE_URL is required in production. ' +
      'The PostgreSQL session store cannot be initialised without a database connection.'
    );
  }
  return raw;
}

function optional(name, defaultValue = '') {
  return process.env[name] ?? defaultValue;
}

export const env = {
  // Server
  NODE_ENV,
  PORT: parseInt(optional('PORT', '4000'), 10),
  HOST: optional('HOST', '127.0.0.1'),

  // Trust-proxy count: 0 = no proxy, 1 = one reverse proxy (nginx/CloudFlare), etc.
  // Must be explicitly configured to match actual deployment topology.
  TRUST_PROXY: parseInt(optional('TRUST_PROXY', '0'), 10),

  // CORS — comma-separated list of allowed origins
  CORS_ORIGINS: optional(
    'CORS_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // AI-assist proxy (forwards to the existing aiServer.mjs)
  AI_SERVER_URL: optional('AI_SERVER_URL', 'http://127.0.0.1:5050'),
  AI_API_KEY: optional('CITIZENCONNECT_AI_API_KEY', ''),

  // Database (Phase 2+) — required in production
  DATABASE_URL: resolveDatabaseUrl(),

  // ── Auth / Session ──────────────────────────────────────────────────────────
  // Validated for strength in production; fails startup if weak or missing.
  SESSION_SECRET: resolveSessionSecret(),

  // Cookie max-age in milliseconds (default: 7 days)
  SESSION_COOKIE_MAX_AGE: parseInt(
    optional('SESSION_COOKIE_MAX_AGE', String(7 * 24 * 60 * 60 * 1000)),
    10
  ),
  // bcrypt work factor (default: 12)
  BCRYPT_ROUNDS: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),

  // Password policy
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // Email provider (optional — required for email verification & password reset)
  SMTP_HOST: optional('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_USER: optional('SMTP_USER', ''),
  SMTP_PASS: optional('SMTP_PASS', ''),
  SMTP_FROM: optional('SMTP_FROM', 'noreply@citizenconnect.in'),

  // Token lifetimes
  EMAIL_VERIFY_TOKEN_TTL_HOURS: parseInt(optional('EMAIL_VERIFY_TOKEN_TTL_HOURS', '24'), 10),
  PASSWORD_RESET_TOKEN_TTL_HOURS: parseInt(optional('PASSWORD_RESET_TOKEN_TTL_HOURS', '1'), 10),

  // Logging
  LOG_LEVEL: optional('LOG_LEVEL', 'dev'),
};
