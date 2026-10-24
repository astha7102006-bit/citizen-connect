/**
 * CitizenConnect — Express Application Bootstrap
 *
 * Wires together middleware, routes, and error handlers.
 * The HTTP server is created in index.js so this file stays testable.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import { env } from './config/env.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import complaintsRouter from './routes/complaints.js';
import staffRouter from './routes/staff.js';
import notificationsRouter from './routes/notifications.js';
import departmentsRouter from './routes/departments.js';

const app = express();

// ── Session store (PostgreSQL via connect-pg-simple) ──────────────────────────
const PgSession = connectPgSimple(session);

// Build a pg-compatible config from the DATABASE_URL for the session store
const pgStoreConfig = env.DATABASE_URL
  ? { conString: env.DATABASE_URL, createTableIfMissing: true }
  : null;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    // Relax CSP in development so the Vite HMR overlay works
    contentSecurityPolicy: env.NODE_ENV === 'production',
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no origin) and configured origins
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
    store: pgStoreConfig ? new PgSession(pgStoreConfig) : undefined,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: env.SESSION_COOKIE_MAX_AGE,
    },
  })
);

// ── Request parsing ───────────────────────────────────────────────────────────
// JSON body — 2 MB limit (upload endpoints will use multipart later)
app.use(express.json({ limit: '2mb' }));
// URL-encoded forms
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── HTTP logging (with sensitive query parameter redaction) ───────────────────
// Redact sensitive query parameters (token, password, secret, key) so they are never leaked in logs
morgan.token('url', (req) => {
  const url = req.originalUrl || req.url || '';
  return url.replace(/([?&](?:token|password|secret|code|apiKey|auth)=)[^&]+/gi, '$1[REDACTED]');
});

if (env.NODE_ENV !== 'test') {
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
