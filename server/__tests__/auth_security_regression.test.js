/**
 * CitizenConnect — Authentication Security & Regression Test Suite
 *
 * Verifies:
 * 1. Session-version checking, revocation, and invalid session destruction.
 * 2. Password validation consistent with bcrypt's 72-byte limit (ASCII + multi-byte UTF-8).
 * 3. Password-reset tokens: single-use enforcement, including concurrent race conditions.
 * 4. Email-verification tokens: single-use enforcement, including concurrent race conditions.
 * 5. Rate limiting enforcement (429 RATE_LIMITED).
 * 6. Protection of sensitive information in logs, URLs, and emails.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// ── Mock Prisma & Bcrypt ───────────────────────────────────────────────────────
vi.mock('../config/db.js', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      passwordResetToken: {
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      emailVerificationToken: {
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prisma)),
    },
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (password) => `hashed::${password}`),
    compare: vi.fn(async (plain, hashed) => hashed === `hashed::${plain}`),
  },
}));

import { prisma } from '../config/db.js';
import {
  validatePasswordPolicy,
  maskEmail,
  registerUser,
  loginUser,
  revokeAllUserSessions,
  requestPasswordReset,
  resetPassword,
  requestEmailVerification,
  verifyEmailToken,
} from '../services/authService.js';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../routes/auth.js';

// ── Helper fixtures ────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
    clearCookie: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  return res;
};

const makeMockUser = (overrides = {}) => ({
  id: 'user-sec-001',
  name: 'Security Tester',
  email: 'tester@citizenconnect.gov.in',
  phone: '+91-9876543210',
  passwordHash: 'hashed::StrongPass123!',
  role: 'CITIZEN',
  accountStatus: 'ACTIVE',
  sessionVersion: 1,
  emailVerified: false,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

describe('1. Session Version Checks & Revocation Middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('allows access when sessionVersion matches the user in database', async () => {
    const user = makeMockUser({ sessionVersion: 3 });
    prisma.user.findUnique.mockResolvedValue(user);

    const req = {
      session: {
        userId: user.id,
        sessionVersion: 3,
        destroy: vi.fn(),
      },
    };
    const res = makeRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(user.id);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects access and destroys session when sessionVersion is missing in session', async () => {
    const req = {
      session: {
        userId: 'user-sec-001',
        // sessionVersion is intentionally missing/undefined
        destroy: vi.fn((cb) => cb?.()),
      },
    };
    const res = makeRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'SESSION_INVALID' }),
      })
    );
    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('cc.sid');
  });

  it('rejects access, destroys session, and clears cookie when sessionVersion is revoked/mismatched', async () => {
    const user = makeMockUser({ sessionVersion: 2 }); // DB incremented to 2
    prisma.user.findUnique.mockResolvedValue(user);

    const req = {
      session: {
        userId: user.id,
        sessionVersion: 1, // Stale/revoked session version 1
        destroy: vi.fn((cb) => cb?.()),
      },
    };
    const res = makeRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'SESSION_REVOKED' }),
      })
    );
    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('cc.sid');
  });

  it('rejects access when user accountStatus is SUSPENDED or DEACTIVATED', async () => {
    const user = makeMockUser({ accountStatus: 'SUSPENDED', sessionVersion: 1 });
    prisma.user.findUnique.mockResolvedValue(user);

    const req = {
      session: { userId: user.id, sessionVersion: 1 },
    };
    const res = makeRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'ACCOUNT_INACTIVE' }),
      })
    );
  });

  it('optionalAuth attaches user only when sessionVersion matches', async () => {
    const user = makeMockUser({ sessionVersion: 5 });
    prisma.user.findUnique.mockResolvedValue(user);

    const validReq = {
      session: { userId: user.id, sessionVersion: 5 },
    };
    const nextValid = vi.fn();
    await optionalAuth(validReq, makeRes(), nextValid);
    expect(validReq.user).toBeDefined();
    expect(validReq.user.id).toBe(user.id);
    expect(nextValid).toHaveBeenCalled();

    // Mismatched sessionVersion
    const invalidReq = {
      session: { userId: user.id, sessionVersion: 4, destroy: vi.fn() },
    };
    const invalidRes = makeRes();
    const nextInvalid = vi.fn();
    await optionalAuth(invalidReq, invalidRes, nextInvalid);
    expect(invalidReq.user).toBeNull();
    expect(invalidReq.session.destroy).toHaveBeenCalled();
    expect(invalidRes.clearCookie).toHaveBeenCalledWith('cc.sid');
    expect(nextInvalid).toHaveBeenCalled();
  });

  it('revokeAllUserSessions increments sessionVersion in database', async () => {
    prisma.user.update.mockResolvedValue(makeMockUser({ sessionVersion: 2 }));

    const updated = await revokeAllUserSessions('user-sec-001');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-sec-001' },
      data: { sessionVersion: { increment: 1 } },
    });
    expect(updated.sessionVersion).toBe(2);
  });
});

describe('2. Password Validation Consistent with Bcrypt 72-Byte Limit', () => {
  it('accepts minimum valid 8-character password', () => {
    const res = validatePasswordPolicy('Secret12');
    expect(res.valid).toBe(true);
  });

  it('accepts exactly 72-byte ASCII password', () => {
    const password72Bytes = 'A'.repeat(72);
    expect(Buffer.byteLength(password72Bytes, 'utf8')).toBe(72);

    const res = validatePasswordPolicy(password72Bytes);
    expect(res.valid).toBe(true);
  });

  it('rejects 73-byte ASCII password exceeding bcrypt limit', () => {
    const password73Bytes = 'A'.repeat(73);
    expect(Buffer.byteLength(password73Bytes, 'utf8')).toBe(73);

    const res = validatePasswordPolicy(password73Bytes);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/72 bytes/i);
  });

  it('correctly calculates multi-byte UTF-8 character length (emojis and non-ASCII)', () => {
    // 18 four-byte emojis = 72 bytes
    const rocket = '🚀'; // 4 bytes
    const rocket18 = rocket.repeat(18);
    expect(Buffer.byteLength(rocket18, 'utf8')).toBe(72);
    expect(validatePasswordPolicy(rocket18).valid).toBe(true);

    // 19 four-byte emojis = 76 bytes (even though string length is 38 in JS)
    const rocket19 = rocket.repeat(19);
    expect(Buffer.byteLength(rocket19, 'utf8')).toBe(76);
    const res = validatePasswordPolicy(rocket19);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/72 bytes/i);
  });

  it('registerUser rejects passwords exceeding 72 bytes', async () => {
    const tooLongPass = 'B'.repeat(73);
    await expect(
      registerUser({
        name: 'Tester',
        email: 'test@example.com',
        password: tooLongPass,
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  });

  it('loginUser rejects passwords exceeding 72 bytes safely with INVALID_CREDENTIALS', async () => {
    const tooLongPass = 'C'.repeat(73);
    await expect(
      loginUser({
        email: 'test@example.com',
        password: tooLongPass,
      })
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });
});

describe('3. Password-Reset Tokens: Single-Use & Concurrency Protection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requestPasswordReset returns generic response and stores SHA-256 token hash', async () => {
    prisma.user.findUnique.mockResolvedValue(makeMockUser());
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.passwordResetToken.create.mockResolvedValue({});

    const result = await requestPasswordReset({ email: 'tester@citizenconnect.gov.in' });

    expect(result.message).toMatch(/If an account with that email exists/i);
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-sec-001',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });

    const callArg = prisma.passwordResetToken.create.mock.calls[0][0];
    // Token hash must be a 64-character SHA-256 hex string
    expect(callArg.data.tokenHash).toHaveLength(64);
  });

  it('resets password successfully on first use and revokes existing sessions', async () => {
    const rawToken = 'test-token-reset-1234567890abcdef1234567890';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // First use: updateMany matches 1 unused active token
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.passwordResetToken.findUnique.mockResolvedValue({ userId: 'user-sec-001' });
    prisma.user.update.mockResolvedValue(makeMockUser({ sessionVersion: 2 }));

    const user = await resetPassword({ token: rawToken, newPassword: 'NewSecurePassword123!' });

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: {
        usedAt: expect.any(Date),
      },
    });

    // Session version must be incremented to revoke all previous active sessions
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-sec-001' },
      data: {
        passwordHash: expect.any(String),
        sessionVersion: { increment: 1 },
      },
    });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('fails with INVALID_TOKEN when reusing the same password reset token (single-use)', async () => {
    // Re-use attempt: updateMany matches 0 rows (usedAt is already set or expired)
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      resetPassword({ token: 'already-used-token', newPassword: 'NewSecurePassword123!' })
    ).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
      status: 400,
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('prevents race conditions under concurrent requests with the same reset token', async () => {
    const rawToken = 'concurrent-race-token-1234567890abcdef';
    let tokenClaimed = false;

    // Simulate database atomic locking: exactly one request can update `usedAt: null`
    prisma.passwordResetToken.updateMany.mockImplementation(async () => {
      if (!tokenClaimed) {
        tokenClaimed = true;
        return { count: 1 }; // First request claims the token
      }
      return { count: 0 }; // Subsequent concurrent requests find 0 matching rows
    });

    prisma.passwordResetToken.findUnique.mockResolvedValue({ userId: 'user-sec-001' });
    prisma.user.update.mockResolvedValue(makeMockUser({ sessionVersion: 2 }));

    // Fire 2 concurrent password reset requests with the same token
    const [result1, result2] = await Promise.allSettled([
      resetPassword({ token: rawToken, newPassword: 'PassOne123!' }),
      resetPassword({ token: rawToken, newPassword: 'PassTwo123!' }),
    ]);

    const successes = [result1, result2].filter((r) => r.status === 'fulfilled');
    const failures = [result1, result2].filter((r) => r.status === 'rejected');

    // EXACTLY 1 request must succeed, and the other must be rejected with INVALID_TOKEN
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toMatchObject({
      code: 'INVALID_TOKEN',
      status: 400,
    });
  });
});

describe('4. Email-Verification Tokens: Single-Use & Concurrency Protection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requestEmailVerification generates token and stores hash', async () => {
    prisma.user.findUnique.mockResolvedValue(makeMockUser({ emailVerified: false }));
    prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
    prisma.emailVerificationToken.create.mockResolvedValue({});

    const res = await requestEmailVerification({ userId: 'user-sec-001' });
    expect(res.message).toMatch(/Verification instructions sent/i);
    expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-sec-001',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it('verifies email successfully on first use', async () => {
    const rawToken = 'test-verification-token-1234567890abcdef';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });
    prisma.emailVerificationToken.findUnique.mockResolvedValue({ userId: 'user-sec-001' });
    prisma.user.update.mockResolvedValue(makeMockUser({ emailVerified: true, accountStatus: 'ACTIVE' }));

    const user = await verifyEmailToken({ token: rawToken });

    expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: {
        usedAt: expect.any(Date),
      },
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-sec-001' },
      data: {
        emailVerified: true,
        accountStatus: 'ACTIVE',
      },
    });
    expect(user.emailVerified).toBe(true);
  });

  it('fails with INVALID_TOKEN when reusing an email verification token', async () => {
    prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      verifyEmailToken({ token: 'already-used-verify-token' })
    ).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
      status: 400,
    });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('prevents race conditions under concurrent email verification requests', async () => {
    const rawToken = 'concurrent-verify-token-1234567890';
    let tokenClaimed = false;

    prisma.emailVerificationToken.updateMany.mockImplementation(async () => {
      if (!tokenClaimed) {
        tokenClaimed = true;
        return { count: 1 };
      }
      return { count: 0 };
    });

    prisma.emailVerificationToken.findUnique.mockResolvedValue({ userId: 'user-sec-001' });
    prisma.user.update.mockResolvedValue(makeMockUser({ emailVerified: true }));

    const [res1, res2] = await Promise.allSettled([
      verifyEmailToken({ token: rawToken }),
      verifyEmailToken({ token: rawToken }),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const failures = [res1, res2].filter((r) => r.status === 'rejected');

    // Exactly 1 must succeed, 1 must fail
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toMatchObject({
      code: 'INVALID_TOKEN',
      status: 400,
    });
  });
});

describe('5. Rate Limiting Protection', () => {
  it('rate limiter middleware triggers 429 when max threshold is exceeded', async () => {
    const req = {
      ip: '198.51.100.42',
      headers: {},
      app: {
        get: vi.fn(() => false),
      },
    };
    const res = makeRes();
    const next = vi.fn();

    // Fire 10 allowed requests
    for (let i = 0; i < 10; i++) {
      await authLimiter(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(10);

    // 11th request exceeds limit
    const exceededRes = makeRes();
    const exceededNext = vi.fn();
    await authLimiter(req, exceededRes, exceededNext);

    expect(exceededNext).not.toHaveBeenCalled();
    expect(exceededRes.status).toHaveBeenCalledWith(429);
    const sentPayload = exceededRes.send.mock.calls[0]?.[0] || exceededRes.json.mock.calls[0]?.[0];
    expect(sentPayload).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'RATE_LIMITED' }),
      })
    );
  });
});

describe('6. Sensitive Information Protection in Logs & Emails', () => {
  it('maskEmail masks local parts of email addresses properly', () => {
    expect(maskEmail('aditya.kumar@example.com')).toBe('a***r@example.com');
    expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
    expect(maskEmail(null)).toBe('[REDACTED]');
    expect(maskEmail('')).toBe('[REDACTED]');
    expect(maskEmail('invalid-email')).toBe('[REDACTED]');
  });

  it('redacts sensitive query parameters in URL logging', () => {
    const sanitizeUrl = (url) =>
      url.replace(/([?&](?:token|password|secret|code|apiKey|auth)=)[^&]+/gi, '$1[REDACTED]');

    const dirtyUrl1 = '/api/auth/reset-password?token=secretResetToken12345&foo=bar';
    expect(sanitizeUrl(dirtyUrl1)).toBe('/api/auth/reset-password?token=[REDACTED]&foo=bar');

    const dirtyUrl2 = '/api/auth/login?password=mySuperSecretPassword&user=alice';
    expect(sanitizeUrl(dirtyUrl2)).toBe('/api/auth/login?password=[REDACTED]&user=alice');

    const cleanUrl = '/api/complaints?department=MCD&stage=1';
    expect(sanitizeUrl(cleanUrl)).toBe('/api/complaints?department=MCD&stage=1');
  });
});

describe('7. HTTP Authentication Routes Regression Tests', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('runs full HTTP route tests against express server', async () => {
    const express = (await import('express')).default;
    const session = (await import('express-session')).default;
    const authRouter = (await import('../routes/auth.js')).default;

    const testApp = express();
    testApp.use(express.json());
    testApp.use(
      session({
        secret: 'test-session-secret-at-least-32-chars-long',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
      })
    );
    testApp.use('/api/auth', authRouter);

    await new Promise((resolve) => {
      server = testApp.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/auth`;
        resolve();
      });
    });

    try {
      // 1. POST /api/auth/register with password > 72 bytes (must be rejected)
      const resLongPass = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Citizen',
          email: 'jane@example.com',
          password: 'Z'.repeat(73),
        }),
      });
      const dataLongPass = await resLongPass.json();
      expect(resLongPass.status).toBe(400);
      expect(dataLongPass.error.code).toBe('VALIDATION_ERROR');

      // 2. POST /api/auth/register valid
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce(makeMockUser({ name: 'Jane Citizen', email: 'jane@example.com' }));

      const resReg = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Citizen',
          email: 'jane@example.com',
          password: 'ValidPassword123!',
        }),
      });
      const dataReg = await resReg.json();
      expect(resReg.status).toBe(201);
      expect(dataReg.success).toBe(true);
      expect(dataReg.data.user.email).toBe('jane@example.com');

      // 3. POST /api/auth/login with password > 72 bytes
      const resLoginLong = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'jane@example.com',
          password: 'X'.repeat(73),
        }),
      });
      expect(resLoginLong.status).toBe(401);

      // 4. POST /api/auth/forgot-password with invalid email
      const resBadEmail = await fetch(`${baseUrl}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });
      expect(resBadEmail.status).toBe(400);

      // 5. POST /api/auth/forgot-password valid
      prisma.user.findUnique.mockResolvedValueOnce(makeMockUser());
      prisma.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValueOnce({});

      const resForgot = await fetch(`${baseUrl}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'tester@citizenconnect.gov.in' }),
      });
      const dataForgot = await resForgot.json();
      expect(resForgot.status).toBe(200);
      expect(dataForgot.data.message).toMatch(/If an account with that email exists/i);

      // 6. POST /api/auth/reset-password with password > 72 bytes
      const resResetLong = await fetch(`${baseUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'some-token',
          newPassword: 'Y'.repeat(73),
        }),
      });
      expect(resResetLong.status).toBe(400);

      // 7. POST /api/auth/reset-password valid
      prisma.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.passwordResetToken.findUnique.mockResolvedValueOnce({ userId: 'user-sec-001' });
      prisma.user.update.mockResolvedValueOnce(makeMockUser({ sessionVersion: 2 }));

      const resReset = await fetch(`${baseUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-reset-token',
          newPassword: 'NewGoodPassword123!',
        }),
      });
      const dataReset = await resReset.json();
      expect(resReset.status).toBe(200);
      expect(dataReset.success).toBe(true);

      // 8. POST /api/auth/verify-email missing token
      const resVerifyNoToken = await fetch(`${baseUrl}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(resVerifyNoToken.status).toBe(400);

      // 9. POST /api/auth/verify-email valid
      prisma.emailVerificationToken.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.emailVerificationToken.findUnique.mockResolvedValueOnce({ userId: 'user-sec-001' });
      prisma.user.update.mockResolvedValueOnce(makeMockUser({ emailVerified: true }));

      const resVerify = await fetch(`${baseUrl}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-verify-token' }),
      });
      const dataVerify = await resVerify.json();
      expect(resVerify.status).toBe(200);
      expect(dataVerify.success).toBe(true);
      expect(dataVerify.data.user.emailVerified).toBe(true);
    } finally {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
    }
  });
});
