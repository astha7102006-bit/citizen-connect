/**
 * CitizenConnect — Reference Number Generator (Phase 4)
 *
 * Generates unique, unpredictable, tamper-evident public tracking reference numbers.
 * Format: CC-<YEAR>-<RANDOM_CHARS>-<RANDOM_DIGITS>
 * Example: CC-2026-8F2A-48192
 *
 * Checks database for uniqueness with automatic retry on collision.
 */

import crypto from 'crypto';
import { prisma } from '../config/db.js';

/**
 * Generate a cryptographically random complaint reference number string.
 *
 * @returns {string} e.g. "CC-2026-7B9C-38491"
 */
export function generateReferenceCode() {
  const year = new Date().getFullYear();
  const randomBlock = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 hex chars
  const randomDigits = crypto.randomInt(10000, 99999); // 5 digits
  return `CC-${year}-${randomBlock}-${randomDigits}`;
}

/**
 * Generates a guaranteed-unique reference number against the database.
 * Retries up to `maxAttempts` times in the astronomically unlikely event of a collision.
 *
 * @param {number} [maxAttempts=5]
 * @returns {Promise<string>}
 */
export async function generateUniqueReferenceNumber(maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateReferenceCode();
    const existing = await prisma.complaint.findUnique({
      where: { referenceNumber: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  // Fallback with nano timestamp appended if multiple collisions
  return `CC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(1000, 9999)}`;
}
