/**
 * CitizenConnect — Centralised Environment Configuration
 *
 * Loads .env from the project root and validates required variables.
 * All server code imports from here — never from process.env directly.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (two levels up from server/config/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name) {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

function optional(name, defaultValue = '') {
  return process.env[name] ?? defaultValue;
}

export const env = {
  // Server
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4000'), 10),
  HOST: optional('HOST', '127.0.0.1'),

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

  // Database (Phase 2+)
  DATABASE_URL: optional('DATABASE_URL', ''),

  // ── Auth / Session (Phase 3) ────────────────────────────────────────────────
  // Strong random string — required in production, defaults to a weak dev value
  SESSION_SECRET: optional(
    'SESSION_SECRET',
    'dev-insecure-session-secret-replace-in-production'
  ),
  // Cookie max-age in milliseconds (default: 7 days)
  SESSION_COOKIE_MAX_AGE: parseInt(
    optional('SESSION_COOKIE_MAX_AGE', String(7 * 24 * 60 * 60 * 1000)),
    10
  ),
  // bcrypt work factor (default: 12)
  BCRYPT_ROUNDS: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),

  // Logging
  LOG_LEVEL: optional('LOG_LEVEL', 'dev'),
};
