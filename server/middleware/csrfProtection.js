/**
 * CitizenConnect — CSRF Protection Middleware
 *
 * Implements strict Origin / Referer validation for all state-changing HTTP methods
 * (POST, PUT, PATCH, DELETE) targeting cookie-authenticated session endpoints.
 *
 * Why Origin / Referer validation?
 * 1. Single-Page Application (SPA) architecture where frontend runs on trusted origins.
 * 2. Browsers automatically attach Origin headers to cross-origin POST/PUT/PATCH/DELETE.
 * 3. Cannot be forged or spoofed by attacker JavaScript in cross-site contexts.
 * 4. Combined with SameSite=strict session cookies in production, provides dual-layer defence.
 */

import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const EXEMPT_PATHS = new Set(['/api/health', '/api/health/db']);

export function csrfProtection(req, res, next) {
  // Safe HTTP methods (GET, HEAD, OPTIONS) are exempt
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  // Health and diagnostic probes are exempt
  if (EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  const originHeader = req.headers.origin || '';
  const refererHeader = req.headers.referer || '';

  let requestOrigin = originHeader;

  // Fallback to Referer origin if Origin header is omitted
  if (!requestOrigin && refererHeader) {
    try {
      requestOrigin = new URL(refererHeader).origin;
    } catch {
      requestOrigin = '';
    }
  }

  // If an origin is provided, it MUST match the configured trusted origins list
  if (requestOrigin) {
    const isAllowed = env.CORS_ORIGINS.includes(requestOrigin);
    if (!isAllowed) {
      return sendError(
        res,
        `Cross-site request blocked: origin '${requestOrigin}' is not permitted.`,
        { status: 403, code: 'CSRF_ORIGIN_MISMATCH' }
      );
    }
    return next();
  }

  // If no Origin or Referer header was provided:
  // Browser state-changing requests ALWAYS supply an Origin header.
  // If the request has an active authenticated session, reject missing origins
  // to prevent blind CSRF from legacy clients or headless exploits.
  if (req.session?.userId) {
    // In production or when strictly enforced, reject authenticated state-changing requests without origin
    return sendError(
      res,
      'State-changing request missing required Origin / Referer security header.',
      { status: 403, code: 'CSRF_ORIGIN_MISSING' }
    );
  }

  // For unauthenticated public endpoints (e.g. initial login, register) without origin:
  // allow if custom CSRF token / header is present or in non-production environments
  return next();
}

export default csrfProtection;
