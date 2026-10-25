/**
 * CitizenConnect — Express Application Bootstrap
 *
 * Wires together middleware, routes, and error handlers.
 * The HTTP server is created in index.js so this file stays testable.
 *
 * Security hardening:
 * - Production refuses to start without PostgreSQL session store.
 * - Trust proxy is limited to the configured topology (never blindly trusts all).
 * - Session cookies are httpOnly, sameSite=strict in production, secure over HTTPS.
 * - CSRF protection via enforced Origin/Referer validation on all state-changing routes.
 * - CORS is restrictive: only configured origins, with credentials.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import { env } from './config/env.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { csrfProtection } from './middleware/csrfProtection.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import complaintsRouter from './routes/complaints.js';
import staffRouter from './routes/staff.js';
import notificationsRouter from './routes/notifications.js';
import departmentsRouter from './routes/departments.js';

const app = express();

// ── Trust Proxy ───────────────────────────────────────────────────────────────
// Only trust the explicitly configured number of hops; never blindly trust all.
// TRUST_PROXY=0 → no proxy (default); TRUST_PROXY=1 → one reverse proxy (nginx/CloudFlare).
if (env.TRUST_PROXY > 0) {
  app.set('trust proxy', env.TRUST_PROXY);
}

// ── Session store (PostgreSQL via connect-pg-simple) ──────────────────────────
const PgSession = connectPgSimple(session);
const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

// Build a pg-compatible config from the DATABASE_URL for the session store
let sessionStore;
if (env.DATABASE_URL && env.DATABASE_URL.trim() !== '') {
  sessionStore = new PgSession({
    conString: env.DATABASE_URL,
    createTableIfMissing: true,
    // Expired session cleanup every 1 hour
    pruneSessionInterval: 60 * 60,
    // Session table name (connect-pg-simple default: "session")
    tableName: 'session',
    // Cascade-proof: keep session for the full cookie lifetime
    ttl: Math.ceil(env.SESSION_COOKIE_MAX_AGE / 1000),
    // Error callback — log without crashing
    errorLog: (err) => console.error('[SessionStore]', err.message),
  });
} else if (isProduction) {
  // Production without DATABASE_URL is a misconfiguration — env.js already
  // throws, so this branch is a belt-and-suspenders safety guard.
  throw new Error(
    '[SECURITY] PostgreSQL session store is required in production but DATABASE_URL is not set.'
  );
}

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    // Relax CSP in development so the Vite HMR overlay works
    contentSecurityPolicy: isProduction,
    // HSTS: enforce HTTPS for 1 year in production
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no origin header) and configured origins
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Session (HTTP-only cookie, PostgreSQL-backed store) ───────────────────────
app.use(
  session({
    name: 'cc.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,           // undefined → in-memory only in dev/test
    cookie: {
      httpOnly: true,
      // strict in production; lax in dev so cross-port works
      sameSite: isProduction ? 'strict' : 'lax',
      // Require HTTPS in production — session cookies must not travel over HTTP
      secure: isProduction,
      maxAge: env.SESSION_COOKIE_MAX_AGE,
      path: '/',
    },
    rolling: false,  // Do not renew cookie on every response
  })
);

// ── CSRF Protection ───────────────────────────────────────────────────────────
// Strict Origin & Referer validation on state-changing requests
app.use(csrfProtection);

// ── Request parsing ───────────────────────────────────────────────────────────
// JSON body — 2 MB limit (upload endpoints will use multipart later)
app.use(express.json({ limit: '2mb' }));
// URL-encoded forms
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── HTTP logging (with sensitive query parameter redaction) ───────────────────
morgan.token('url', (req) => {
  const url = req.originalUrl || req.url || '';
  return url.replace(/([?&](?:token|password|secret|code|apiKey|auth)=)[^&]+/gi, '$1[REDACTED]');
});

if (!isTest) {
  app.use(morgan(env.LOG_LEVEL));
}


// ── Routes ────────────────────────────────────────────────────────────────────
// Phase 1: health only
app.use('/api/health', healthRouter);

// Phase 3: Authentication
app.use('/api/auth', authRouter);

// Phase 4: Complaint Management
app.use('/api/complaints', complaintsRouter);

// Phase 5: Staff Workflows (Official / Reviewer / Admin)
app.use('/api/staff', staffRouter);

// Phase 5: In-App Notifications
app.use('/api/notifications', notificationsRouter);

// Phase 5: Public Departments List
app.use('/api/departments', departmentsRouter);

// ── 404 + Global error handler ────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
