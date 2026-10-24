/**
 * CitizenConnect — Database Connection & Prisma Client Utility
 *
 * Provides a resilient singleton Prisma client instance and non-blocking
 * database connectivity checks. Designed so the backend can start and serve
 * health/mock traffic even if the PostgreSQL instance is not yet running.
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Global singleton to prevent multiple instances during development reloads
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Non-blocking database readiness probe.
 * Executes a lightweight `SELECT 1` query with a 3-second timeout guard.
 *
 * @returns {Promise<{
 *   isConfigured: boolean;
 *   isConnected: boolean;
 *   latencyMs: number | null;
 *   provider: string;
 *   databaseUrlRedacted: string;
 *   error: string | null;
 * }>}
 */
export async function checkDatabaseConnection(timeoutMs = 3000) {
  const isConfigured = Boolean(env.DATABASE_URL && env.DATABASE_URL.trim() !== '');

  // Redact password from DATABASE_URL for safe status reporting
  let databaseUrlRedacted = 'Not configured';
  if (isConfigured) {
    try {
      const parsed = new URL(env.DATABASE_URL);
      if (parsed.password) {
        parsed.password = '****';
      }
      databaseUrlRedacted = parsed.toString();
    } catch {
      databaseUrlRedacted = 'postgresql://[redacted]';
    }
  }

  if (!isConfigured) {
    return {
      isConfigured: false,
      isConnected: false,
      latencyMs: null,
      provider: 'postgresql',
      databaseUrlRedacted,
      error: 'DATABASE_URL environment variable is empty or not set.',
    };
  }

  const startTime = Date.now();

  try {
    // Race against timeout guard
    const queryPromise = prisma.$queryRaw`SELECT 1 as connected`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Database connection timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    await Promise.race([queryPromise, timeoutPromise]);
    const latencyMs = Date.now() - startTime;

    return {
      isConfigured: true,
      isConnected: true,
      latencyMs,
      provider: 'postgresql',
      databaseUrlRedacted,
      error: null,
    };
  } catch (err) {
    return {
      isConfigured: true,
      isConnected: false,
      latencyMs: null,
      provider: 'postgresql',
      databaseUrlRedacted,
      error: err.message || 'Failed to connect to PostgreSQL server.',
    };
  }
}

/**
 * Disconnect Prisma Client gracefully during application shutdown.
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error('[DB] Error during Prisma disconnect:', err.message);
  }
}

export default prisma;
