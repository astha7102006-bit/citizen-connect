/**
 * CitizenConnect — HTTP Server Entry Point
 *
 * Keeps the Express app (app.js) separate from the server bootstrap
 * so app.js stays fully unit-testable without binding a port.
 */

import app from './app.js';
import { env } from './config/env.js';
import { disconnectDatabase } from './config/db.js';

const server = app.listen(env.PORT, env.HOST, () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════╗');
  console.log('  ║   CitizenConnect API Server — Ready    ║');
  console.log('  ╚════════════════════════════════════════╝');
  console.log(`  ➜  Environment : ${env.NODE_ENV}`);
  console.log(`  ➜  Listening   : http://${env.HOST}:${env.PORT}`);
  console.log(`  ➜  Health      : http://${env.HOST}:${env.PORT}/api/health`);
  console.log('');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully…`);
  await disconnectDatabase();
  server.close(() => {
    console.log('[Server] All connections closed. Exiting.');
    process.exit(0);
  });

  // Force-exit if connections hang longer than 10 s
  setTimeout(() => {
    console.error('[Server] Force-exiting after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections so the process doesn't crash silently
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});
