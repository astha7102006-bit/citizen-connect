/**
 * CitizenConnect — /api/health Routes
 *
 * Provides:
 * 1. GET /api/health — Fast non-blocking health check confirming HTTP server uptime.
 *    Always returns HTTP 200 even if the database is offline or unconfigured.
 * 2. GET /api/health/db — Deep probe checking PostgreSQL connection readiness via Prisma.
 */

import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';
import { env } from '../config/env.js';
import { checkDatabaseConnection } from '../config/db.js';

const router = Router();

// Record startup timestamp
const startedAt = new Date().toISOString();

/**
 * Fast Health Ping (Liveness Probe)
 * Never throws, never waits on external databases.
 */
router.get('/', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    environment: env.NODE_ENV,
    version: '1.0.0',
    service: 'CitizenConnect API',
    databaseConfigured: Boolean(env.DATABASE_URL && env.DATABASE_URL.trim() !== ''),
    startedAt,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

/**
 * Database Readiness Probe
 * Probes the PostgreSQL connection safely without crashing on failure.
 */
router.get('/db', async (_req, res) => {
  const dbHealth = await checkDatabaseConnection(7000);

  const payload = {
    status: dbHealth.isConnected ? 'ok' : 'degraded',
    service: 'CitizenConnect API — Database Readiness',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: dbHealth,
  };

  // Return HTTP 200 with status info so clients can inspect diagnostics
  sendSuccess(res, payload, { status: dbHealth.isConnected ? 200 : 503 });
});

export default router;
