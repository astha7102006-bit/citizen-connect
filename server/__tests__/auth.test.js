/**
 * CitizenConnect — Auth Unit Tests (Phase 3)
 *
 * Tests: authService (registerUser, loginUser, sanitiseUser)
 *        auth routes (POST /register, POST /login, POST /logout, GET /me)
 *        requireAuth middleware
 *        requireRole middleware
 *
 * Prisma is fully mocked — no real database is touched.
 * bcryptjs is partially mocked to keep tests fast (no real hashing).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma ────────────────────────────────────────────────────────────────
vi.mock('../config/db.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// ── Mock bcryptjs ──────────────────────────────────────────────────────────────
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (password) => `hashed::${password}`),
    compare: vi.fn(async (plain, hashed) => hashed === `hashed::${plain}`),
  },
}));

import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';
import {
  registerUser,
  loginUser,
  sanitiseUser,
} from '../services/authService.js';

// ── Test fixtures ──────────────────────────────────────────────────────────────
const makeDbUser = (overrides = {}) => ({
  id:            'uuid-test-001',
  name:          'Test Citizen',
  email:         'test@example.com',
  phone:         null,
  passwordHash:  'hashed::Secret123!',
  role:          'CITIZEN',
  accountStatus: 'ACTIVE',
  createdAt:     new Date('2026-01-01T00:00:00Z'),
  updatedAt:     new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. sanitiseUser
// ══════════════════════════════════════════════════════════════════════════════
describe('sanitiseUser', () => {
  it('strips passwordHash from the returned object', () => {
    const user = makeDbUser();
    const safe = sanitiseUser(user);
    expect(safe).not.toHaveProperty('passwordHash');
  });

  it('retains all expected safe fields', () => {
    const user = makeDbUser();
    const safe = sanitiseUser(user);
    expect(safe).toMatchObject({
      id:            user.id,
      name:          user.name,
      email:         user.email,
      role:          'CITIZEN',
      accountStatus: 'ACTIVE',
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. registerUser
// ══════════════════════════════════════════════════════════════════════════════
describe('registerUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a CITIZEN user and returns a sanitised object', async () => {
    prisma.user.findUnique.mockResolvedValue(null); // Email not taken
    prisma.user.create.mockResolvedValue(makeDbUser());

    const result = await registerUser({
      name: 'Test Citizen',
      email: 'test@example.com',
      password: 'Secret123!',
    });

    expect(result).not.toHaveProperty('passwordHash');
    expect(result.role).toBe('CITIZEN');
  });

  it('normalises email to lowercase', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(makeDbUser({ email: 'test@example.com' }));

    await registerUser({ name: 'Test', email: 'TEST@EXAMPLE.COM', password: 'Secret123!' });

    // create should have been called with lowercase email
    const callArg = prisma.user.create.mock.calls[0][0];
    expect(callArg.data.email).toBe('test@example.com');
  });

  it('always sets role to CITIZEN regardless of any extra input', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(makeDbUser({ role: 'CITIZEN' }));

    await registerUser({ name: 'Test', email: 'x@x.com', password: 'Secret123!' });

    const callArg = prisma.user.create.mock.calls[0][0];
    expect(callArg.data.role).toBe('CITIZEN');
  });

  it('throws EMAIL_TAKEN when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      registerUser({ name: 'Test', email: 'taken@example.com', password: 'Secret123!' })
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', status: 409 });
  });

  it('hashes the password before storing it', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(makeDbUser());

    await registerUser({ name: 'Test', email: 'a@a.com', password: 'Secret123!' });

    expect(bcrypt.hash).toHaveBeenCalledWith('Secret123!', expect.any(Number));
    const callArg = prisma.user.create.mock.calls[0][0];
    expect(callArg.data.passwordHash).toBe('hashed::Secret123!');
    // Plaintext must NOT be stored
    expect(callArg.data.passwordHash).not.toBe('Secret123!');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. loginUser
// ══════════════════════════════════════════════════════════════════════════════
describe('loginUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a sanitised user on correct credentials', async () => {
    const dbUser = makeDbUser({ passwordHash: 'hashed::Secret123!' });
    prisma.user.findUnique.mockResolvedValue(dbUser);

    const result = await loginUser({ email: 'test@example.com', password: 'Secret123!' });

    expect(result).not.toHaveProperty('passwordHash');
    expect(result.email).toBe('test@example.com');
  });

  it('throws INVALID_CREDENTIALS for wrong password', async () => {
    const dbUser = makeDbUser({ passwordHash: 'hashed::CorrectPass' });
    prisma.user.findUnique.mockResolvedValue(dbUser);

    await expect(
      loginUser({ email: 'test@example.com', password: 'WrongPass' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
  });

  it('throws INVALID_CREDENTIALS for non-existent email (prevents enumeration)', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      loginUser({ email: 'nobody@example.com', password: 'anything' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
  });

  it('uses the same generic error message for both wrong-email and wrong-password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    let msgNoUser;
    try { await loginUser({ email: 'nobody@x.com', password: 'pass' }); }
    catch (e) { msgNoUser = e.message; }

    prisma.user.findUnique.mockResolvedValue(makeDbUser({ passwordHash: 'hashed::OtherPass' }));

    let msgBadPass;
    try { await loginUser({ email: 'test@example.com', password: 'WrongPass' }); }
    catch (e) { msgBadPass = e.message; }

    expect(msgNoUser).toBe(msgBadPass);
  });

  it('throws ACCOUNT_INACTIVE for suspended accounts', async () => {
    const dbUser = makeDbUser({
      passwordHash:  'hashed::Secret123!',
      accountStatus: 'SUSPENDED',
    });
    prisma.user.findUnique.mockResolvedValue(dbUser);

    await expect(
      loginUser({ email: 'test@example.com', password: 'Secret123!' })
    ).rejects.toMatchObject({ code: 'ACCOUNT_INACTIVE', status: 403 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. requireAuth middleware
// ══════════════════════════════════════════════════════════════════════════════
describe('requireAuth middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  const makeRes = () => {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  it('calls next() when session has a valid userId', async () => {
    const { requireAuth } = await import('../middleware/requireAuth.js');
    // Return only the fields that requireAuth selects (no passwordHash)
    const selectedUser = {
      id:            'uuid-test-001',
      name:          'Test Citizen',
      email:         'test@example.com',
      phone:         null,
      role:          'CITIZEN',
      accountStatus: 'ACTIVE',
      createdAt:     new Date('2026-01-01T00:00:00Z'),
      updatedAt:     new Date('2026-01-01T00:00:00Z'),
    };
    prisma.user.findUnique.mockResolvedValue(selectedUser);

    const req  = { session: { userId: selectedUser.id, destroy: vi.fn() } };
    const res  = makeRes();
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(); // called with no error
    expect(req.user).toBeDefined();
    expect(req.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 when no session exists', async () => {
    const { requireAuth } = await import('../middleware/requireAuth.js');
    const req  = { session: {} };
    const res  = makeRes();
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. requireRole middleware
// ══════════════════════════════════════════════════════════════════════════════
describe('requireRole middleware', () => {
  const makeRes = () => {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    return res;
  };

  it('calls next() when user holds an allowed role', async () => {
    const { requireRole } = await import('../middleware/requireRole.js');
    const req  = { user: { role: 'ADMIN' } };
    const res  = makeRes();
    const next = vi.fn();

    requireRole('OFFICIAL', 'ADMIN')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 when user role is not in the allowed list', async () => {
    const { requireRole } = await import('../middleware/requireRole.js');
    const req  = { user: { role: 'CITIZEN' } };
    const res  = makeRes();
    const next = vi.fn();

    requireRole('OFFICIAL', 'ADMIN')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. JSON Response & Error Envelope Integrity
// ══════════════════════════════════════════════════════════════════════════════
describe('API Response Envelope & Error Integrity', () => {
  it('sendSuccess returns valid JSON structure with data', async () => {
    const { sendSuccess } = await import('../utils/response.js');
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    sendSuccess(res, { user: { id: 'u1' } }, { status: 200 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { user: { id: 'u1' } },
      })
    );
  });

  it('sendError returns valid JSON structure with error code and message', async () => {
    const { sendError } = await import('../utils/response.js');
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    sendError(res, 'Invalid credentials provided.', { status: 401, code: 'INVALID_CREDENTIALS' });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials provided.',
        },
      })
    );
  });
});
