/**
 * CitizenConnect — Centralised API Response Helpers
 *
 * All route handlers use these helpers so the response envelope is
 * consistent across every endpoint from day one.
 */

/**
 * Send a successful JSON response.
 *
 * Shape:
 *   { success: true, data: <payload>, meta?: <optional> }
 *
 * @param {import('express').Response} res
 * @param {*} data  - The actual payload
 * @param {object} [options]
 * @param {number} [options.status=200]
 * @param {object} [options.meta]     - Pagination, counts, etc.
 */
export function sendSuccess(res, data, { status = 200, meta } = {}) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

/**
 * Send an error JSON response.
 *
 * Shape:
 *   { success: false, error: { code, message, details? } }
 *
 * @param {import('express').Response} res
 * @param {string} message      - Human-readable message (safe for clients)
 * @param {object} [options]
 * @param {number} [options.status=500]
 * @param {string} [options.code]     - Machine-readable error code
 * @param {*}      [options.details]  - Extra context (dev-only)
 */
export function sendError(res, message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
  const body = {
    success: false,
    error: { code, message },
  };
  // Only expose internal details outside production
  if (details !== undefined && process.env.NODE_ENV !== 'production') {
    body.error.details = details;
  }
  return res.status(status).json(body);
}
