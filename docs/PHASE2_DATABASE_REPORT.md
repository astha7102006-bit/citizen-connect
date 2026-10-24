# Phase 2 — Database Architecture & Persistent Data Models Report

> **Project:** CitizenConnect — Citizen-Government Accountability Platform  
> **Phase:** Phase 2 (Database Architecture & Relational Schema)  
> **Date:** 24 October 2026  
> **ORM Engine:** Prisma ORM v6.19.3  
> **Database Engine:** PostgreSQL  

---

## 1. Executive Summary

In Phase 2, the relational database foundation for CitizenConnect has been designed and implemented using **Prisma ORM (v6.19.3)** targeted at **PostgreSQL**. The schema defines all seven core domain entities with referential integrity, cascading and retention rules, unique constraints, cryptographic ledger fields, and audit indexing.

A resilient database utility module (`server/config/db.js`) and database readiness health check (`GET /api/health/db`) have been integrated into the Phase 1 Express API without breaking the existing frontend or blocking non-database operations when PostgreSQL is unconfigured or offline.

---

## 2. Relational Schema Architecture

The complete schema is located in `prisma/schema.prisma` with the following 7 models:

### 2.1 Entity Relationship Diagram

```
┌──────────────┐          1:N           ┌──────────────────────┐
│     User     ├───────────────────────►│      Complaint       │
│  (Citizen /  │                        │ (Status, Stage, SLA) │
│   Official / │                        └──────────┬───────────┘
│   Reviewer)  │                                   │
└──────┬───────┘                                   │ 1:N
       │                                           ├──────────────────────────┐
       │ 1:N (Author/Uploader)                     ▼                          ▼
       ├──────────────────────────────►┌───────────────────────┐ ┌──────────────────────┐
       │                               │    ComplaintEvent     │ │       Evidence       │
       │                               │ (Audit Trail & Hash)  │ │ (SHA-256 Fingerprint)│
       │                               └───────────────────────┘ └──────────────────────┘
       │                                           ▲                          ▲
       │                                           │ 1:N                      │ 1:N
       ├───────────────────────────────────────────┴──────────────────────────┘
       │                                           │
       │                                           ▼
       │ 1:N (Authored)                ┌───────────────────────┐ ┌──────────────────────┐
       └──────────────────────────────►│   OfficialResponse    │ │      Escalation      │
                                       │(Show-cause/Redressal) │ │(SLA Lapse/Appellate) │
                                       └───────────────────────┘ └──────────────────────┘
                                                   ▲
                                                   │ N:1
                                       ┌───────────┴───────────┐
                                       │      Department       │
                                       │ (MCD, PWD, POL, etc.) │
                                       └───────────────────────┘
```

---

### 2.2 Core Models Breakdown

#### 1. `User` (`users` table)
- **Primary Key:** `id` (UUID)
- **Identity Fields:** `name` (String), `email` (String, `@unique`), `phone` (String, optional)
- **Security:** `passwordHash` (String, nullable placeholder for Phase 3 bcrypt hashing)
- **Access Control:** `role` enum (`CITIZEN`, `OFFICIAL`, `REVIEWER`, `ADMIN`), `accountStatus` enum (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`, `PENDING_VERIFICATION`)
- **Audit Timestamps:** `createdAt`, `updatedAt`
- **Relations:** 
  - `complaints`: Citizen submitted complaints (`onDelete: SetNull`)
  - `eventsAuthored`: Audit log actions authored by user (`onDelete: SetNull`)
  - `uploadedEvidence`: Exhibits uploaded (`onDelete: SetNull`)
  - `officialResponses`: Redressal responses authored (`onDelete: SetNull`)

#### 2. `Department` (`departments` table)
- **Primary Key:** `id` (UUID)
- **Code:** `code` (String, `@unique`, e.g., `MCD`, `PWD`, `POL`, `HFW`)
- **Metadata:** `name` (String), `description` (Text), `contactEmail`, `contactPhone`, `officeLocation`, `isActive` (Boolean)
- **SLA Benchmarks:** `slaDaysLevel1` (default 7), `slaDaysLevel2` (default 15), `slaDaysLevel3` (default 30)
- **Relations:** `complaints` assigned to department (`onDelete: Restrict` prevents accidental deletion of active jurisdictions)

#### 3. `Complaint` (`complaints` table)
- **Primary Key:** `id` (UUID)
- **Public Reference:** `referenceNumber` (String, `@unique`, e.g., `CC-2026-DL-28491`)
- **Grievance Details:** `title` (String), `description` (Text), `category` (String), `priority` enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- **Procedural State:** `status` enum (`SUBMITTED`, `ACKNOWLEDGED`, `UNDER_INVESTIGATION`, `ACTION_TAKEN`, `RESOLVED`, `CLOSED`, `APPEALED`), `stage` (Int 1-4), `stageName` (String)
- **Privacy & Protection:** `isAnonymous` (Boolean), `isRestrictedFromPublic` (Boolean), `restrictionReason` (Text), `restrictedAt` (DateTime)
- **Department Transfer Resilience:** `departmentId` links to current department. When department changes, all historical events, evidence exhibits, and escalation records remain associated with the complaint.
- **SLA Clock:** `slaDaysRemaining` (Int), `targetCompletionDate` (DateTime), `resolvedAt` (DateTime)

#### 4. `ComplaintEvent` (`complaint_events` table)
- **Primary Key:** `id` (UUID)
- **Sequential Integrity:** `sequence` (Int), `eventId` (String, e.g., `EVT-28491-01`), unique constraint `@@unique([complaintId, sequence])`
- **Action Type:** `eventType` enum (18 canonical accountability event types)
- **Status Transition:** `previousStatus`, `newStatus`
- **Actor & Jurisdiction Snapshot:** `actorId` (nullable User link), `actorName`, `actorRole`, `responsibleDepartment` (retains prior department tenure upon transfer)
- **Explanatory Ground:** `title`, `details` (Text), `reason` (Text — required for transfers and closures)
- **Cryptographic Hash Chain:** `previousHash` (64-char parent link), `hash` (SHA-256 block hash)
- **Structured Metadata:** `metadata` (JSON for file fingerprints, hearing dates, transfer routes)
- **Cascade Behavior:** `onDelete: Cascade` with complaint

#### 5. `Evidence` (`evidence` table)
- **Primary Key:** `id` (UUID)
- **File Metadata:** `fileName` (sanitized storage name), `originalName` (client name), `contentType` (MIME type), `fileSize` (BigInt in bytes), `storageKey` (disk/cloud path)
- **Cryptographic Integrity:** `sha256Fingerprint` (unique byte fingerprint)
- **Verification & Privacy:** `verificationStatus` enum (`PENDING`, `VERIFIED`, `REJECTED`, `FLAGGED_DUPLICATE`), `isRedacted` (Boolean), `redactedStorageKey` (path to privacy-safe copy for officials)
- **Context Metadata:** `metadata` (JSON for GPS location, EXIF timestamp, audio duration)

#### 6. `OfficialResponse` (`official_responses` table)
- **Primary Key:** `id` (UUID)
- **Officer Details:** `authorId` (User link), `authorName`, `authorDesignation`
- **Response Content:** `responseText` (Text), `responseType` enum (`INTERIM`, `FINAL_REDRESSAL`, `CLARIFICATION`, `TRANSFER_JUSTIFICATION`)
- **Review & Redaction:** `status` enum (`DRAFT`, `REVIEW_PENDING`, `APPROVED`, `PUBLISHED`, `CONTESTED`), `isApprovedByReviewer` (Boolean)
- **Procedural Dates:** `hearingDate` (DateTime), `contestedReason` (Text if challenged)

#### 7. `Escalation` (`escalations` table)
- **Primary Key:** `id` (UUID)
- **Appellate Tier:** `escalationLevel` (Int 2 or 3), `fromLevel` (Int), `toLevel` (Int)
- **Trigger:** `reason` (Text), `triggerType` enum (`AUTOMATIC_SLA_LAPSE`, `CITIZEN_APPEAL`, `MANUAL_REVIEW_ESCALATION`), `triggerTimestamp` (DateTime)
- **Statutory Limits:** `deadlineTimestamp` (DateTime), `status` enum (`ACTIVE`, `RESOLVED`, `SUPERSEDED`, `CANCELLED`), `resolutionNotes` (Text), `resolvedAt` (DateTime)

---

## 3. Environment Configuration

### `.env.example` Update
```bash
# ─── Database (PostgreSQL via Prisma ORM) ───────────────────────────────────
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
# For local development:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/citizenconnect_dev?schema=public"
```

A local `.env` file was created with this default string for CLI tooling and schema verification. As configured in `.gitignore`, `.env` is never committed to Git.

---

## 4. Database Utility Module & Health Checks

### `server/config/db.js`
- **Singleton Pattern:** Instantiates `PrismaClient` and binds to `globalThis` in development to prevent connection exhaustion during hot reloads.
- **Probe Function (`checkDatabaseConnection(timeoutMs)`):**
  - Executes `SELECT 1 as connected` with a 2500ms timeout guard.
  - Automatically redacts passwords from the database URL in diagnostics output.
  - Never throws or crashes the server when the database is offline or unprovisioned.
- **Graceful Teardown (`disconnectDatabase()`):** Disconnects Prisma client cleanly when `SIGINT` or `SIGTERM` signals are received.

### Endpoint Verification Results

#### 1. Baseline Health Check: `GET /api/health`
```http
GET http://127.0.0.1:4000/api/health
Status: 200 OK
```
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "development",
    "version": "1.0.0",
    "service": "CitizenConnect API",
    "databaseConfigured": true,
    "startedAt": "2026-10-24T06:52:32.267Z",
    "timestamp": "2026-10-24T06:52:36.412Z",
    "uptimeSeconds": 10
  }
}
```
*Result:* Returns HTTP 200 immediately without waiting on database connectivity.

#### 2. Database Readiness & Live Connection: `GET /api/health/db`
```http
GET http://127.0.0.1:4000/api/health/db
Status: 200 OK
```
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "CitizenConnect API — Database Readiness",
    "environment": "development",
    "timestamp": "2026-10-24T08:02:26.628Z",
    "database": {
      "isConfigured": true,
      "isConnected": true,
      "latencyMs": 2621,
      "provider": "postgresql",
      "databaseUrlRedacted": "postgresql://neondb_owner:****@ep-bold-glade-b4w5eyp0.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
      "error": null
    }
  }
}
```
*Result:* Connected directly to remote Neon PostgreSQL with SSL. Live ping succeeded and password safely redacted.

---

## 5. Verification & Tests Run

| Test / Command | Expected | Actual Result |
|---|---|---|
| `npx prisma validate` | Validates schema syntax & relations | ✅ `The schema at prisma\schema.prisma is valid 🚀` |
| `npx prisma format` | Formats indentation & field ordering | ✅ Formatted in 27ms |
| `npx prisma generate` | Compiles `@prisma/client` types | ✅ Generated Prisma Client (v6.19.3) in 114ms |
| `npx prisma migrate dev` | Applies SQL migration to remote PostgreSQL | ✅ Migration `20261024075009_init_citizenconnect_models` created & applied |
| Remote Table Verification | Verifies all 7 domain tables in `information_schema.tables` | ✅ `users`, `departments`, `complaints`, `complaint_events`, `evidence`, `official_responses`, `escalations` (9 FK constraints) |
| `npm run health` | Express API health test | ✅ HTTP 200 OK |
| `npm run health:db` | Database connection probe | ✅ HTTP 200 OK (`isConnected: true`, `status: "ok"`) |
| `npm run build` | Vite frontend production build | ✅ Built in 1.82s, 0 errors |
| `npm run lint` | oxlint verification | ✅ 0 new errors in any backend/database file |

---

## 6. Setup & Migration Instructions for Operators

When provisioning a PostgreSQL instance (e.g. locally, Docker, AWS RDS, Supabase, Neon):

### Step 1: Configure Environment
Set `DATABASE_URL` in your `.env` file:
```bash
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database_name>?schema=public"
```

### Step 2: Run Prisma Migrations
Run the migration command to apply the schema to the database:
```bash
npm run prisma:migrate
# Or directly:
npx prisma migrate dev --name init_citizenconnect_models
```

### Step 3: Verify Connection
Test the live connection probe:
```bash
npm run health:db
```
When PostgreSQL is online, `GET /api/health/db` will return `isConnected: true` with connection latency in milliseconds.

### Step 4: Explore Data via Prisma Studio (Optional)
```bash
npm run prisma:studio
```
Opens interactive GUI at `http://localhost:5555` to view and query tables.

---

## 7. Status of Later Phases (Intentionally Excluded)

As specified in Phase 2 scope, the following are scheduled for subsequent phases:
- **Phase 3:** Authentication endpoints (`/api/v1/auth`), JWT issuing, password hashing (bcrypt), RBAC authorization middleware.
- **Phase 4:** Complaint submission, lifecycle CRUD, and department transfer APIs.
- **Phase 5:** Evidence file uploads (multipart/form-data) and real SHA-256 byte streaming.
- **Phase 6:** Automated SLA deadline escalation daemon and CPGRAMS/Sakala synchronizers.
- **Phase 7:** Frontend state transition from `localStorage` to REST API endpoints.

---

*Report prepared by Senior Backend Engineer, CitizenConnect. Phase 2 complete.*
