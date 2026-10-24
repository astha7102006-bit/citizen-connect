# CitizenConnect — Phase 4 Complaint Management & Database Integration Report

**Generated:** 2026-10-24  
**Backend:** Express 4, Node.js ESM (Port 4000)  
**Database:** Neon PostgreSQL via Prisma 6.19.3  
**Status:** ✅ Complete & Verified

---

## 1. Overview & Objectives Achieved

Phase 4 bridges citizen grievance registration and persistent database workflows on CitizenConnect. Complaints are now securely stored, retrieved, tracked, and amended using real relational records in Neon PostgreSQL, backed by SHA-256 cryptographic hash-chains for tamper-evident accountability.

### Core Guarantees Implemented:
1. **Server-Generated Unpredictable Tracking Codes**: Reference numbers follow the format `CC-<YEAR>-<RANDOM_HEX>-<RANDOM_DIGITS>` (e.g. `CC-2026-555B-84668`) and are strictly checked for uniqueness. Client-supplied IDs are never trusted.
2. **Atomic Complaint & Genesis Event Creation**: Every grievance is registered in a database transaction (`prisma.$transaction`) alongside an initial `ComplaintEvent` (`sequence: 1`, `COMPLAINT_SUBMITTED`, SHA-256 genesis hash).
3. **Session-Derived Citizen Identity**: Citizens can only file grievances under their authenticated session user. Spoofing `citizenId` or role is strictly blocked.
4. **Strict Cross-Citizen Privacy (RBAC)**: A citizen cannot access another citizen's private complaint details (returns `HTTP 403 FORBIDDEN`).
5. **Protected Status & Department Integrity**: Citizens cannot modify official fields (`status`, `stage`, `departmentId`, `slaDaysRemaining`). Edits are limited to `title`, `description`, `category`, and `priority` only while the complaint is in `SUBMITTED` status before official processing starts.
6. **Public vs. Authenticated Dual Tracking**: Non-owners and unauthenticated citizens tracking via reference numbers receive sanitized public records with all PII and internal metadata redacted. Owners and staff receive full detail views.
7. **Canonical Department Seeding**: 10 real public departments were seeded into the `departments` table (MCD, PWD, REV, DISCOM, WSSB, RTO, POL, HFW, EDU, PDS) with official contact info and SLA schedules.

---

## 2. API Endpoints Specification

### 2.1 `POST /api/complaints`
- **Access**: Private (Authenticated Citizens)
- **Rate Limit**: 30 requests per 15 minutes per IP
- **Description**: Registers a new grievance in Neon PostgreSQL and creates the genesis audit event.
- **Payload**:
  ```json
  {
    "title": "Illegal bribe solicitation for building sanction",
    "description": "Zonal engineer demanded illegal gratification of Rs 25000 during inspection on site.",
    "category": "Bribe Demand",
    "priority": "HIGH",
    "isAnonymous": false
  }
  ```
- **Response**: `HTTP 201 Created`
  ```json
  {
    "success": true,
    "data": {
      "complaint": {
        "id": "e8d91c10-82a4-4a25-9e66-db931a297e61",
        "referenceNumber": "CC-2026-555B-84668",
        "title": "Illegal bribe solicitation for building sanction",
        "category": "Bribe Demand",
        "priority": "HIGH",
        "status": "SUBMITTED",
        "stage": 1,
        "stageName": "Level 1: Grievance Officer Assigned",
        "slaDaysRemaining": 7,
        "isAnonymous": false,
        "events": [
          {
            "sequence": 1,
            "eventId": "EVT-84668-01",
            "eventType": "COMPLAINT_SUBMITTED",
            "title": "Grievance Formally Registered",
            "hash": "4a9e...e71c"
          }
        ]
      }
    }
  }
  ```

### 2.2 `GET /api/complaints`
- **Access**: Private (Authenticated Citizens)
- **Description**: Returns paginated complaints belonging strictly to the authenticated user (`where: { citizenId: user.id }`).
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 50)
  - `status`: Filter by `ComplaintStatus` enum (`SUBMITTED`, `ACKNOWLEDGED`, `UNDER_INVESTIGATION`, etc.)
  - `priority`: Filter by `ComplaintPriority` enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `category`: Substring search on grievance category
  - `search`: Substring search on `title` or `referenceNumber`
- **Response**: `HTTP 200 OK` with pagination metadata:
  ```json
  {
    "success": true,
    "data": { "complaints": [...] },
    "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
  }
  ```

### 2.3 `GET /api/complaints/:id`
- **Access**: Private (Owner or Staff `OFFICIAL`/`REVIEWER`/`ADMIN`)
- **Description**: Retrieves full complaint dossier including events, evidence metadata, official responses, and department details.
- **Authorization Enforcement**: If non-owner citizen attempts access: `HTTP 403 FORBIDDEN` (`FORBIDDEN`).

### 2.4 `GET /api/complaints/reference/:referenceNumber`
- **Access**: Public / Dual-Mode
- **Description**: Allows anyone with a valid reference number to inspect case status without exposing citizen PII.
- **Public Redaction Rules**:
  - If requester is unauthenticated or not the owner: Citizen name, email, phone, and internal database foreign keys are completely excluded.
  - If complaint is marked `isRestrictedFromPublic`: returns `HTTP 404 NOT_FOUND` (`RECORD_RESTRICTED`).
  - If requester is the verified owner or authorized staff: returns complete private record.

### 2.5 `PATCH /api/complaints/:id`
- **Access**: Private (Complaint Owner Only)
- **Description**: Permits amendments to `title`, `description`, `category`, and `priority` before processing begins.
- **Security Rules**:
  - Allowed only while `status === 'SUBMITTED'`. If already under investigation or acknowledged, returns `HTTP 400` (`STATUS_LOCKED`).
  - Prohibits modification of `status`, `stage`, `departmentId`, `citizenId`, `referenceNumber` (returns `HTTP 400` `PROTECTED_FIELD_VIOLATION`).
  - Automatically appends a `CORRECTION_RECORDED` event to the blockchain audit trail.

---

## 3. Cryptographic Audit Hash-Chain

All complaint events maintain a cryptographic chain:
- **Genesis Block**: Seeded with `previousHash: "0000000000000000000000000000000000000000000000000000000000000000"`.
- **Event Hash**: Calculated using SHA-256 over:
  `{ sequence, complaintId, eventType, actorId, actorRole, title, details, timestamp, previousHash }`.
- **Sequencing**: Strictly monotonic per complaint (`1, 2, 3...`).

---

## 4. Frontend Integration

1. **`src/context/DataContext.jsx`**:
   - Integrated with `useAuth` to detect real database sessions.
   - `submitComplaint`: Sends real `POST /api/complaints` requests when authenticated, returning the server-generated reference number.
   - `fetchRealComplaints`: Loads persistent citizen complaints from PostgreSQL on login and refresh.
   - `trackRealComplaint`: Queries `/api/complaints/reference/:refNumber` with fallback to demo data.
2. **`src/features/complaints/FileComplaintPage.jsx`**:
   - `handleSubmit` converted to `async`.
   - Server-side validation and network errors are caught and surfaced inline.
   - Upon success, displays the live database tracking reference ID (`CC-2026-XXXX-XXXXX`).
3. **`src/features/dashboard/CitizenDashboardPage.jsx`**:
   - Displays real complaints from PostgreSQL for authenticated citizens.
   - Shows live database status badge, real timestamps, and verified audit events.
4. **`src/features/complaints/TrackComplaintPage.jsx` & `TrackStatusModal.jsx`**:
   - Search queries backend tracking endpoint first, enabling real-time lookup across page refreshes.

---

## 5. Verification & Test Results

### 5.1 Unit Tests (Vitest)
```
✓ server/__tests__/complaints.test.js (22 tests) — 20ms
  ✓ Reference Number Generation (3)
    ✓ generates a valid CC- format reference code
    ✓ checks uniqueness against database and returns unused reference number
    ✓ retries when collision occurs until unique number is found
  ✓ Audit Crypto Hash Chain (2)
    ✓ produces a deterministic 64-character SHA-256 hash
    ✓ produces a different hash when previousHash changes
  ✓ createComplaint (5)
    ✓ creates complaint and initial event atomically in transaction
    ✓ rejects complaint when title is missing or too short
    ✓ rejects complaint when description is shorter than 15 characters
    ✓ rejects complaint when priority is invalid
    ✓ derives citizenId strictly from session user and never client payload
  ✓ getComplaintById authorization (3)
    ✓ allows citizen owner to view their own complaint
    ✓ rejects access (403 FORBIDDEN) when another citizen attempts to view private complaint
    ✓ returns 404 when complaint does not exist
  ✓ updateComplaint (4)
    ✓ allows owner to update title/description while in SUBMITTED status
    ✓ rejects modification of protected fields (status, stage, departmentId)
    ✓ rejects editing once complaint is under processing (status !== SUBMITTED)
    ✓ rejects modification by non-owner (403 FORBIDDEN)
  ✓ getCitizenComplaints pagination & filtering (2)
    ✓ applies pagination parameters correctly and filters strictly by citizenId
    ✓ applies status and priority filters when provided
  ✓ trackComplaintByReference (3)
    ✓ returns sanitized public record without citizen PII for unauthenticated track
    ✓ returns 404 when reference number is not found
    ✓ blocks public access if complaint is marked restricted from public
✓ server/__tests__/auth.test.js (16 tests) — 47ms

Test Files  2 passed (2)
     Tests  38 passed (38) — 100% Pass Rate
```

### 5.2 Live Database Integration Verification (Neon PostgreSQL)
All 12 live end-to-end integration scenarios executed successfully against the running API server (`task-2264`):
1. `GET /api/health` → `200 ok`
2. `GET /api/health/db` → `200 isConnected: true (latency ~537ms)`
3. Register Citizen User A → `201 Created`, session cookie set
4. `POST /api/complaints` without auth → `401 UNAUTHENTICATED`
5. `POST /api/complaints` with invalid fields → `400 VALIDATION_ERROR`
6. `POST /api/complaints` valid → `201 Created` with `referenceNumber: CC-2026-555B-84668`, `status: SUBMITTED`, `events: 1`
7. `GET /api/complaints` → `200 OK` (Count: 1, Total: 1)
8. `GET /api/complaints/:id` as owner → `200 OK`
9. Register Citizen User B & cross-access User A's complaint → `403 FORBIDDEN`
10. `PATCH /api/complaints/:id` attempting `status: RESOLVED` → `400 PROTECTED_FIELD_VIOLATION`
11. `PATCH /api/complaints/:id` amending `title` → `200 OK` (events: 2, `CORRECTION_RECORDED` appended)
12. Public track via reference number → `200 OK` (`HasCitizenPII: false`)

### 5.3 Frontend Build Verification
```
> vite build
✓ 1992 modules transformed.
✓ built in 1.03s
dist/index.html                     0.96 kB
dist/assets/index-CQM3z1WL.css    131.62 kB
dist/assets/index-DrCR7nHq.js   1,878.05 kB
```

---

## 6. Files Created & Modified

### Created:
- `server/utils/referenceNumber.js` — Cryptographic unique reference number generator
- `server/utils/auditCrypto.js` — SHA-256 hash-chain calculator for complaint events
- `server/services/complaintService.js` — Business logic, transactions, validation & sanitizers
- `server/routes/complaints.js` — 5 REST endpoints with rate limiting & error handling
- `server/scripts/seedDepartments.js` — Idempotent canonical department seeder
- `server/__tests__/complaints.test.js` — 22 comprehensive unit tests
- `docs/PHASE4_COMPLAINTS_REPORT.md` — This report

### Modified:
- `prisma/schema.prisma` — Added `Session` model for connect-pg-simple; made `departmentId` optional on `Complaint` for unassigned initial triage
- `server/app.js` — Mounted `/api/complaints` router
- `server/middleware/requireAuth.js` — Added `optionalAuth` middleware for public tracking
- `vite.config.js` — Added `/api/complaints` proxy target to Express backend
- `src/context/DataContext.jsx` — Added backend complaint state, API calls, and sync logic
- `src/features/complaints/FileComplaintPage.jsx` — Connected submission to backend API
- `src/features/dashboard/CitizenDashboardPage.jsx` — Prioritized persistent database complaints
- `src/features/complaints/TrackComplaintPage.jsx` — Integrated live reference number tracking
- `src/components/TrackStatusModal.jsx` — Added live lookup by reference number
- `src/features/complaints/WrittenComplaintPage.jsx` — Handled async complaint submission
- `src/features/complaints/ComplaintWizardPage.jsx` — Handled async complaint submission

---

## 7. Next Steps (Phase 5 Handoff)

- **Department Assignment Workflows**: Official and reviewer interfaces to assign complaints to departments.
- **Evidence File Storage**: Integrate S3 / local multipart storage for binary attachments.
- **Official Status Transitions**: Dedicated official endpoints for transitioning complaints to `ACKNOWLEDGED`, `UNDER_INVESTIGATION`, `ACTION_TAKEN`, and `RESOLVED`.
