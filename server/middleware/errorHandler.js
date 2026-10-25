/**
 * CitizenConnect — Centralised Error Handling Middleware
 *
 * Catches all errors thrown or passed via next(err) in route handlers.
 * Returns a consistent JSON envelope so the frontend always gets
 * { success: false, error: { code, message } }.
 *
 * Must be registered LAST (after all routes) in app.js.
 */

import { sendError } from '../utils/response.js';

/**
 * 404 handler — placed after all routes.
 */
export function notFoundHandler(req, res, _next) {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, {
    status: 404,
    code: 'NOT_FOUND',
  });
}

/**
 * Global error handler — catches anything passed to next(err).
 *
 * @param {Error} err
 */
// eslint-disable-next-line no-unused-vars
export function globalErrorHandler(err, req, res, _next) {
  // If headers were already sent, delegate to Express default handler
  if (res.headersSent) {
    return _next(err);
  }

  // Normalise status: respect err.status / err.statusCode if set
  const status = err.status ?? err.statusCode ?? 500;

  // Log server-side (never expose stack to clients in production)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error ${status}] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.error(`[Error ${status}] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  let clientMessage = err.message ?? 'An unexpected error occurred.';
  if (status >= 500 && (process.env.NODE_ENV === 'production' || err.name?.includes('Prisma'))) {
    clientMessage = 'An unexpected server error occurred. Please try again later.';
  }

  sendError(res, clientMessage, {
    status,
    code: err.code ?? 'INTERNAL_ERROR',
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
}
