/**
 * CitizenConnect — Cryptographic Audit Trail Utilities (Phase 4)
 *
 * Implements SHA-256 hash-chain verification for ComplaintEvents.
 * Ensures an immutable, tamper-evident audit history from creation to resolution.
 */

import crypto from 'crypto';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Calculates a deterministic SHA-256 hash for a ComplaintEvent block.
 *
 * @param {object} eventBlock - The event attributes without hash
 * @param {string} previousHash - SHA-256 hash of previous event block
 * @returns {string} 64-character hexadecimal SHA-256 hash
 */
export function calculateEventHash(eventBlock, previousHash = GENESIS_HASH) {
  const payload = {
    sequence: eventBlock.sequence,
    complaintId: eventBlock.complaintId,
    eventType: eventBlock.eventType,
    actorId: eventBlock.actorId || null,
    actorRole: eventBlock.actorRole || null,
    title: eventBlock.title || null,
    details: eventBlock.details || '',
    timestamp: eventBlock.timestamp ? new Date(eventBlock.timestamp).toISOString() : '',
    previousHash,
  };

  const serialized = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
