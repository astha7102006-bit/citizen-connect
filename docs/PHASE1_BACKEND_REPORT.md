# Phase 1 — Backend Foundation: Audit Report

> Generated: 23 Oct 2026 · Environment: Windows · Node: v24.19.0

---

## 1. Pre-Existing Project Audit

### Frontend Stack (unchanged)
| Item | Value |
|---|---|
| Framework | React 19.3 + Vite 8.3 |
| Styling | Tailwind CSS 4 |
| Router | react-router-dom 7 |
| 3-D | three.js 0.186 |
| Linter | oxlint |
| Package manager | npm (package-lock.json present) |
| Build output | `dist/` via `npm run build` |

### Pre-existing "backend" (`server/aiServer.mjs`)
A **plain Node.js `http` server** on port **5050** serving two routes:

| Route | Method | Purpose |
|---|---|---|
| `/api/ai/health` | GET | Demo health ping |
| `/api/ai/extract` | POST | Regex-based complaint narrative extraction |

This is a standalone demo tool, **not** a structured REST API. It has no middleware, no auth, no error envelope, no env config, and no body-size guard (only a raw `>1e7` check). It is preserved exactly as-is.

### Existing API surface in the frontend
| File | Call | Target |
|---|---|---|
| `AiDraftReviewCard.jsx` | `fetch('/api/ai/extract', …)` | `aiServer.mjs` port 5050 |
| `AdminDemoPage.jsx` | Display only — no actual fetch | Reference text |

**All other data is 100% mock** stored in `localStorage` via `DataContext.jsx` (24 `localStorage` read/write points confirmed). No database, no authentication, no session management.

### TypeScript
No `tsconfig.json` exists. `@types/react` is installed as a dev-dep for IDE hints only. The project is **plain JS + JSX**. The new backend is written in modern ESM JS for consistency — no TypeScript compilation step required for Phase 1.

### Environment files
No `.env` existed. No secrets were present. `.env.example` created; `.env` excluded by `.gitignore`.

### Git
Single commit (`36f8d44`) belongs to a prior unrelated project (FridgeWise). Remote points to `github.com/Anjali291-gif/Animated_fridgewines.git`. CitizenConnect codebase has **zero commits**. Nothing was committed or pushed.

---

## 2. Backend Architecture — Decision

| Option | Verdict | Reason |
|---|---|---|
| Extend `aiServer.mjs` | ❌ Rejected | Raw `http`, no middleware stack, ESM but not structured |
| NestJS | ❌ Overkill | Requires TypeScript compilation pipeline; adds complexity before Phase 2 needs are clear |
| Fastify | ⚠️ Possible | Good perf, but smaller ecosystem familiarity |
| **Express 4 + ESM** | ✅ **Chosen** | Matches existing `"type": "module"` in `package.json`; no compilation step; largest ecosystem; Vite proxy already pre-configured for port 5050 — easiest to extend with a second proxy rule for port 4000 |

**Port separation strategy:**
- Port **5173** — Vite dev server (frontend, HMR)  
- Port **4000** — Express API server (Phase 1+, all future REST endpoints)  
- Port **5050** — `aiServer.mjs` (existing AI extraction, untouched)

The Vite proxy now routes `/api/health` → 4000 and `/api/ai/*` → 5050, so the frontend never needs hardcoded backend ports.

---

## 3. Files Created / Modified

### New files
```
server/
├── index.js              ← HTTP server bootstrap (graceful shutdown, unhandledRejection)
├── app.js                ← Express app: middleware stack, route wiring, error handlers
├── config/
│   └── env.js            ← Single source of truth for all env vars (dotenv + validation)
├── middleware/
│   └── errorHandler.js   ← notFoundHandler + globalErrorHandler (consistent JSON envelope)
├── routes/
│   └── health.js         ← GET /api/health — returns status, uptime, env, timestamp
└── utils/
    └── response.js       ← sendSuccess() / sendError() helpers (used by all route handlers)
```

### Modified files
| File | Change |
|---|---|
| `package.json` | Added `server`, `server:dev`, `ai-server:dev`, `health` scripts; added express/cors/helmet/morgan/dotenv deps; kept ALL existing scripts |
| `vite.config.js` | Split proxy: `/api/health` → 4000, `/api/ai` → 5050 (was a single `/api` → 5050 rule) |
| `.gitignore` | Expanded: added `.env`, `.env.*.local`, `coverage/`, `build/`, `*.tsbuildinfo`, `Thumbs.db` |
| `.env.example` | Created from scratch — placeholder values only, no secrets |

### Untouched
- `server/aiServer.mjs` — preserved exactly as-is  
- All `src/` frontend files — zero changes  
- `README.md`, `docs/` — zero changes  
- Git remotes, branches, history — zero changes  

---

## 4. Commands

### Frontend only
```bash
npm run dev          # Vite dev server on http://127.0.0.1:5173
npm run build        # Production bundle → dist/
npm run preview      # Serve dist/ locally
npm run lint         # oxlint
```

### Backend (Express API — Phase 1)
```bash
npm run server       # Start Express API server (node server/index.js)
npm run server:dev   # Start with nodemon auto-reload on server/ changes
```

### AI Server (existing — unchanged)
```bash
npm run ai-server      # Start aiServer.mjs on port 5050
npm run ai-server:dev  # Start with nodemon auto-reload
```

### Health check (quick script)
```bash
npm run health       # Fetches /api/health and prints JSON
```

---

## 5. Verified Test Results

| Check | Result |
|---|---|
| `GET http://127.0.0.1:4000/api/health` | ✅ HTTP 200 — `{ success: true, data: { status: "ok", … } }` |
| `GET http://127.0.0.1:4000/api/nonexistent` | ✅ HTTP 404 — `{ success: false, error: { code: "NOT_FOUND", … } }` |
| `npm run build` (frontend) | ✅ Built in 890 ms, 0 errors |
| `npm run lint` | ⚠️ 7 pre-existing errors (unused vars + unhandled async in ReviewerDashboard / LoginModal) — **all pre-date Phase 1**. Zero new errors introduced. |
| `server/aiServer.mjs` (existing AI server) | ✅ Still starts and serves `/api/ai/health` + `/api/ai/extract` |

### Health endpoint live response
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "development",
    "version": "1.0.0",
    "service": "CitizenConnect API",
    "startedAt": "2026-10-23T16:34:14.144Z",
    "timestamp": "2026-10-23T16:34:36.050Z",
    "uptimeSeconds": 22
  }
}
```

---

## 6. Features Still Mock-Only (Phase 2+)

| Feature | Current state | Needs in Phase 2 |
|---|---|---|
| Complaint CRUD | `localStorage` via `DataContext` | `POST/GET/PATCH /api/v1/complaints` + PostgreSQL |
| Authentication | Demo role switcher (`AuthContext`) | JWT / session, password hashing (bcrypt) |
| User accounts | Hardcoded demo names | `users` table + registration/login endpoints |
| Evidence file storage | Fake SHA-256, no real upload | Multipart upload, cloud storage (S3 / GCS), real fingerprinting |
| Audit chain persistence | `localStorage` only | Append-only DB audit log, backend hash verification |
| Email / SMS notifications | Not implemented | Phase 3 |
| CPGRAMS / Sakala API bridge | Not implemented | Phase 3+ |
| Public records API | Static demo data | `GET /api/v1/public/complaints` with privacy projection |
| Escalation cron | Simulated via `simulatedDate` | Scheduled job (node-cron or pg_cron) |

---

## 7. Manual Setup Before Phase 2

1. **Copy `.env.example` → `.env`** and set real values (nothing needs changing for Phase 1 to work).
2. **Install PostgreSQL** (local or Docker) when starting Phase 2 database work.
3. **Set `JWT_SECRET`** (min 64 random chars) before adding authentication endpoints.
4. Pre-existing lint errors in `ReviewerDashboardPage.jsx` and `LoginModal.jsx` should be resolved when those files are next touched.
5. The chunk-size warning in Vite (`1,437 kB JS`) is cosmetic — consider code-splitting with `React.lazy()` in a future sprint.
