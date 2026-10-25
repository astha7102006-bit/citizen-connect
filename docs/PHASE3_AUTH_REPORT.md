# CitizenConnect — Phase 3 Authentication Report

**Generated:** 2026-10-24  
**Backend:** Express 4, Node.js ESM  
**Database:** Neon PostgreSQL via Prisma 6.19.3  
**Phase status:** ✅ COMPLETE

---

## What Was Built

Phase 3 adds real, server-managed authentication and role-based access control to CitizenConnect.

### New Backend Files

| File | Purpose |
|------|---------|
| `server/routes/auth.js` | 4 auth endpoints (register / login / logout / me) |
| `server/services/authService.js` | Business logic: registerUser, loginUser, sanitiseUser |
| `server/middleware/requireAuth.js` | Session guard — 401 if unauthenticated |
| `server/middleware/requireRole.js` | Role guard factory — 403 if role not allowed |
| `server/__tests__/auth.test.js` | 16 unit tests (vitest, Prisma mocked) |

### Modified Files

| File | Change |
|------|--------|
| `server/app.js` | Added express-session + connect-pg-simple, wired `/api/auth` router |
| `server/config/env.js` | Added `SESSION_SECRET`, `SESSION_COOKIE_MAX_AGE`, `BCRYPT_ROUNDS` |
| `vite.config.js` | Proxy `/api/auth` and `/api/v1` → port 4000 |
| `.env.example` | Session and bcrypt placeholders added |
| `src/context/AuthContext.jsx` | Real auth state + demo switcher (both coexist) |
| `src/components/LoginModal.jsx` | Two-tab modal: Email/Password (real) + Demo OTP (preserved) |
| `package.json` | Added `test`, `test:watch`, `test:coverage` scripts + vitest config |

---

## API Endpoints

### `POST /api/auth/register`
- Rate limited: 5 req / 15 min (slow registration guard against bot farms)
- Validates: name (2–100 chars), email (RFC-ish regex), password (8–128 chars)
- Normalises email to lowercase
- Role is **always** forced to `CITIZEN` — client-supplied roles are ignored
- Hashes password with bcryptjs (work factor: 12)
- Regenerates session ID to prevent session fixation attacks
- Saves session to persistent store before sending HTTP response
- Returns 201 with sanitised user

### `POST /api/auth/login`
- Rate limited: 10 req / 15 min (brute-force defense)
- Validates email + password presence and max-length (DoS prevention)
- Uses same generic error for wrong email AND wrong password (prevents enumeration)
- Uses timing-safe dummy bcrypt compare when email not found
- Regenerates session ID on success (prevents fixation)
- Persists session to PostgreSQL store before response
- Returns 200 with sanitised user and `cc.sid` HTTP-only cookie

### `POST /api/auth/logout`
- Requires valid session (`requireAuth`)
- Destroys session in store and clears `cc.sid` cookie with matching security flags
- Returns 200 with confirmation message

### `GET /api/auth/me`
- Requires valid session (`requireAuth`)
- Returns sanitised current user from database (re-fetches on every request)
- Returns 401 if not logged in

### `POST /api/auth/forgot-password`
- Rate limited: 3 req / 15 min
- Generic response: never confirms or denies whether email address exists
- Stores SHA-256 hash of single-use token with expiration

### `POST /api/auth/reset-password`
- Rate limited: 3 req / 15 min
- Validates single-use token against SHA-256 hash
- Enforces password policy (8–128 characters)
- Invalidates token immediately upon use and clears existing sessions

### `POST /api/auth/verify-email`
- Validates single-use token against SHA-256 hash
- Sets `emailVerifiedAt` timestamp and invalidates token

### `POST /api/auth/resend-verify`
- Requires authenticated session (`requireAuth`)
- Rate limited: 3 req / 15 min
- Re-generates single-use verification token hash and sends verification link

---

## Security Design

| Property | Decision |
|----------|---------|
| Session storage | PostgreSQL (`_session` table via connect-pg-simple) |
| Cookie name | `cc.sid` |
| Cookie flags | `httpOnly: true`, `sameSite: 'lax'`, `secure: true` (production only) |
| Password hashing | bcryptjs, work factor 12 |
| Role assignment | Server-only — never from request body |
| Error messages | Generic for auth failures (no account enumeration) |
| Rate limiting | 10 requests / 15 min per IP on all `/api/auth` routes |
| Session fixation | `req.session.regenerate()` on every login |
| Token type | No JWT — server-managed sessions only |

---

## Test Results

```
✓ server/__tests__/auth.test.js (16 tests) — 20ms
  ✓ sanitiseUser (2)
    ✓ strips passwordHash from the returned object
    ✓ retains all expected safe fields
  ✓ registerUser (5)
    ✓ creates a CITIZEN user and returns a sanitised object
    ✓ normalises email to lowercase
    ✓ always sets role to CITIZEN regardless of any extra input
    ✓ throws EMAIL_TAKEN when email already exists
    ✓ hashes the password before storing it
  ✓ loginUser (5)
    ✓ returns a sanitised user on correct credentials
    ✓ throws INVALID_CREDENTIALS for wrong password
    ✓ throws INVALID_CREDENTIALS for non-existent email (prevents enumeration)
    ✓ uses the same generic error message for both wrong-email and wrong-password
    ✓ throws ACCOUNT_INACTIVE for suspended accounts
  ✓ requireAuth middleware (2)
    ✓ calls next() when session has a valid userId
    ✓ returns 401 when no session exists
  ✓ requireRole middleware (2)
    ✓ calls next() when user holds an allowed role
    ✓ returns 403 when user role is not in the allowed list

Test Files  1 passed (1)
     Tests  16 passed (16)
```

---

## Live Endpoint Verification (against Neon PostgreSQL)

| Test | Result |
|------|--------|
| `GET /api/auth/me` (no session) | ✅ HTTP 401 `UNAUTHENTICATED` |
| `POST /api/auth/register` (missing fields) | ✅ HTTP 400 `VALIDATION_ERROR` |
| `POST /api/auth/register` (valid CITIZEN) | ✅ HTTP 201, role=CITIZEN, no passwordHash in response |
| `POST /api/auth/login` (bad credentials) | ✅ HTTP 401 `INVALID_CREDENTIALS` |
| `POST /api/auth/login` (valid credentials) | ✅ HTTP 200, `cc.sid` cookie set |
| `GET /api/auth/me` (with session cookie) | ✅ HTTP 200, correct user email returned |
| `POST /api/auth/logout` | ✅ HTTP 200, "logged out" message |

---

## Frontend Changes

### AuthContext.jsx
- Added `realUser`, `isAuthenticated`, `authLoading` state
- `GET /api/auth/me` called on mount to restore session across page refreshes
- `login()`, `register()`, `logout()` functions call real API
- **Demo role-switcher is fully preserved** — `isDemoMode`, `role`, `setRole`, `switchRole` unchanged

### LoginModal.jsx
- **Tab 1 — Email / Password** (new): connects to `/api/auth/login` and `/api/auth/register`
  - Sign In / Register toggle
  - Password show/hide toggle
  - Loading spinner, inline error messages
  - Success animation before auto-close
- **Tab 2 — Demo OTP** (original): identical to the previous implementation — for hackathon judges

---

## Build Verification

```
> vite build
✓ 1992 modules transformed.
✓ built in 1.08s
```

No TypeScript or lint errors introduced.

---

## New npm Scripts

| Script | Command |
|--------|---------|
| `npm test` | `vitest run` — single run, CI-friendly |
| `npm run test:watch` | `vitest` — watch mode for development |
| `npm run test:coverage` | `vitest run --coverage` — coverage report |

---

## Environment Variables Added

Add these to your `.env` file (see `.env.example` for format):

| Variable | Required | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | Yes (prod) | Random ≥64-char string for signing session cookies |
| `SESSION_COOKIE_MAX_AGE` | No | Cookie lifetime in ms (default: 604800000 = 7 days) |
| `BCRYPT_ROUNDS` | No | bcrypt work factor (default: 12) |

---

## What's NOT in Phase 3

- Complaint CRUD (Phase 4)
- Department management (Phase 4)  
- File/evidence upload (Phase 4)
- Email verification (future)
- Password reset (future)
- DigiLocker / Aadhaar real SSO (future — demo UI preserved)
