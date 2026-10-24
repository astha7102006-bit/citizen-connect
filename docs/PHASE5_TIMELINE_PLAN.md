# CitizenConnect — Phase 5 Accountability Timeline: Planning & Audit Review

**Document Version:** 1.0.0  
**Phase:** 5 (Planning & Audit Review)  
**Date:** 2026-10-24  
**Target Architecture:** Vite + React (Frontend), Express 4 (Node.js ESM), Neon PostgreSQL (Prisma 6.19.3)  

---

## 1. Executive Summary & Goals

The **Accountability Timeline** is the foundational transparency and tamper-evident engine of CitizenConnect. Its primary objective is to record every civic grievance lifecycle event—from initial filing to departmental handovers, evidence additions, official responses, statutory deadline milestones, and appellate escalations—as an **immutable, cryptographically linked (SHA-256) audit log**.

### Core Goals:
1. **Unbroken Chronological Audit Trail**: Every status change, correction, transfer, response, and escalation must append a strictly sequenced `ComplaintEvent` block.
2. **Cryptographic Tamper-Evidence**: Each event references the SHA-256 hash of its predecessor (`previousHash`), forming an immutable chain rooted in the genesis event (`GENESIS_HASH`).
3. **Department Handover Accountability**: Retain prior departmental duration and tenure so agencies cannot reset statutory Service Level Agreement (SLA) timers by shunting grievances between departments.
4. **Multi-Tiered Access & Privacy**: Provide full forensic logs to authorized citizens and oversight officials while rigorously redacting whistleblower identities and private citizen data on public reference tracking views.
5. **Seamless UI Integration**: Bridge the existing rich React UI (`AccountabilityTimeline.jsx`, `TimelinePage.jsx`) to real Neon PostgreSQL records without regressions.

---

## 2. Audit of Existing Assets & Reusability Analysis

### 2.1 Existing Database Models (`prisma/schema.prisma`)
The database schema already defines a robust, high-fidelity relational model for grievance events:

- **`ComplaintEvent` Model** (`prisma/schema.prisma` lines 152–184):
  - `id`: UUID primary key.
  - `sequence`: Integer monotonically increasing per complaint (`1, 2, 3...`).
  - `eventId`: Human-readable identifier (e.g., `EVT-84668-01`).
  - `complaintId`: Foreign key to `Complaint`.
  - `eventType`: `EventType` enum.
  - `previousStatus` / `newStatus`: `ComplaintStatus` enums tracking state transitions.
  - `actorId`, `actorName`, `actorRole`: Snapshot of the user performing the action.
  - `responsibleDepartment`: Snapshot of the department holding jurisdiction when the event occurred.
  - `title`: Short summary of the action.
  - `details`: Long-form event description.
  - `reason`: Justification (mandatory for transfers, rejections, closures, and amendments).
  - `previousHash`: 64-char hex string (defaults to `0000...0000` for genesis).
  - `hash`: SHA-256 hash calculated over the canonical event block.
  - `metadata`: Flexible JSON field for attachments, SLA countdown data, and anomaly flags.
  - `timestamp`: Temporal anchor of the event.
  - **Constraints**: `@@unique([complaintId, sequence])` and `@@index([complaintId])`.

- **`EventType` Enum** (`prisma/schema.prisma` lines 47–66):
  Contains all **18 standard event types**:
  1. `COMPLAINT_SUBMITTED`
  2. `ACKNOWLEDGEMENT_RECORDED`
  3. `CITIZEN_EVIDENCE_ADDED`
  4. `OFFICIAL_RESPONSE_RECEIVED`
  5. `INVESTIGATION_STARTED`
  6. `INVESTIGATION_PROGRESS_UPDATED`
  7. `ADDITIONAL_INFO_REQUESTED`
  8. `CITIZEN_INFO_PROVIDED`
  9. `DEPARTMENT_TRANSFER_REQUESTED`
  10. `DEPARTMENT_TRANSFER_COMPLETED`
  11. `DEADLINE_APPROACHING`
  12. `DEADLINE_MISSED`
  13. `COMPLAINT_ESCALATED`
  14. `REVIEWER_FINDING_RECORDED`
  15. `COMPLAINT_CLOSED`
  16. `APPEAL_SUBMITTED`
  17. `COMPLAINT_REOPENED`
  18. `CORRECTION_RECORDED`

- **Complementary Models**:
  - `OfficialResponse`: Stores formal department memoranda, justifications, and drafts.
  - `Escalation`: Tracks auto-escalation tiers, triggers (`SLA_BREACH`, `CITIZEN_APPEAL`), and oversight assignments.
  - `Evidence`: Stores exhibits, SHA-256 file fingerprints, and mime types.

### 2.2 Existing Backend Logic (`server/`)
- **`server/utils/auditCrypto.js`**:
  - `GENESIS_HASH`: 64 zeroes.
  - `calculateEventHash(eventBlock, previousHash)`: Computes deterministic SHA-256 hash over canonical payload keys (`sequence`, `complaintId`, `eventType`, `actorId`, `actorRole`, `title`, `details`, `timestamp`, `previousHash`).
- **`server/services/complaintService.js`**:
  - `createComplaint()`: Atomically registers complaints and their `sequence: 1` genesis event in a PostgreSQL transaction.
  - `getComplaintById()`: Queries complaint details and eager-loads `events: { orderBy: { sequence: 'asc' } }`.
  - `trackComplaintByReference()`: Dual tracking resolver returning full event history for owners/staff and sanitized records for public queries.
  - `updateComplaint()`: Appends `CORRECTION_RECORDED` (`sequence: 2+`) atomically when an owner edits complaint details before processing begins.
- **`server/routes/complaints.js`**:
  - Validated Express router with session auth, rate limiting, and RBAC middleware.

### 2.3 Existing Frontend Components (`src/`)
- **`src/components/timeline/AccountabilityTimeline.jsx`**:
  - Production-ready visual timeline supporting all 18 event types, category filters (Citizen, Evidence, Official, Transfer, Escalation, Review), accordion expansion, copyable SHA-256 hashes, stage duration labels, and anomaly alerts.
  - Fully supports light/dark themes and Hindi/English localization.
- **`src/features/timeline/TimelinePage.jsx`**:
  - Interactive timeline page with scenario selectors, role previewers, and reference number search.
- **`src/services/timelineEventService.js`**:
  - Utilities for visual configurations, stage duration calculations, transfer extraction, and automated anomaly detection (`detectTimelineAnomalies`).
- **`src/components/audit/RecordVerificationModal.jsx`**:
  - Interactive UI modal that re-computes hashes across the event chain to demonstrate real-time cryptographic integrity.

---

## 3. Gap Analysis: Missing Event Types, Fields & Services

| Area | Current State | Target State | Required Action |
| :--- | :--- | :--- | :--- |
| **Active Event Emitters** | Only `COMPLAINT_SUBMITTED` and `CORRECTION_RECORDED` are generated by real backend APIs. | All 18 events can be triggered via service actions (evidence upload, officer response, department reassignment, escalation). | Implement dedicated service methods for event appending. |
| **Dedicated Timeline Endpoint** | Events are embedded inside `GET /api/complaints/:id` and `/reference/:ref`. | Dedicated `GET /api/complaints/:id/timeline` and `GET /api/complaints/:id/timeline/verify` endpoints. | Add lightweight, targeted timeline routes with cryptographic integrity validation. |
| **Department Transfer Logic** | Department can be updated via administrative models, but transfer event creation is manual. | Changing department creates `DEPARTMENT_TRANSFER_REQUESTED` and `DEPARTMENT_TRANSFER_COMPLETED` events, snapshots `responsibleDepartment`, and retains prior elapsed time. | Build atomic transfer transaction service. |
| **Hash Standardization** | Backend hashes 9 canonical fields; frontend demo code in `src/services/auditCrypto.js` used a variation. | Single synchronized canonical hash format across server and client. | Standardize `calculateEventHash` specification across backend and frontend verification modal. |
| **Frontend Real Data Mapping** | `DataContext.jsx:mapDbComplaint` maps partial event fields. | Map all fields (`responsibleDepartment`, `newStatus`, `previousStatus`, `reason`, `metadata`, `durationLabel`). | Enrich `mapDbComplaint` to pass complete data to `AccountabilityTimeline.jsx`. |
| **SLA & Deadline Milestones** | Simulated in frontend demo state. | Backend calculates SLA deadlines from `filedAt` and department turnaround policies, emitting `DEADLINE_APPROACHING` / `DEADLINE_MISSED`. | Integrate server-side deadline calculation engine. |

---

## 4. Architectural Design & Implementation Plan

### 4.1 Chronological Event Flow & State Transitions

```
[Citizen Submits]
       │
       ▼
1. COMPLAINT_SUBMITTED (Genesis, Sequence 1)
       │
       ▼
2. ACKNOWLEDGEMENT_RECORDED (Sequence 2)
       │
       ├─────────────────────────────────────────────┐
       ▼                                             ▼
3. CITIZEN_EVIDENCE_ADDED             9. DEPARTMENT_TRANSFER_REQUESTED
       │                                             │
       ▼                                             ▼
5. INVESTIGATION_STARTED              10. DEPARTMENT_TRANSFER_COMPLETED
       │                                 (Retains prior tenure & SLA clock)
       ▼                                             │
6. INVESTIGATION_PROGRESS_UPDATED <──────────────────┘
       │
       ├─────────────────────────────────────────────┐
       ▼                                             ▼
7. ADDITIONAL_INFO_REQUESTED          11. DEADLINE_APPROACHING (SLA Alert)
       │                                             │
       ▼                                             ▼
8. CITIZEN_INFO_PROVIDED              12. DEADLINE_MISSED (SLA Breach)
       │                                             │
       ▼                                             ▼
4. OFFICIAL_RESPONSE_RECEIVED         13. COMPLAINT_ESCALATED (Tier 2/3)
       │                                             │
       ├─────────────────────────────────────────────┘
       ▼
14. REVIEWER_FINDING_RECORDED
       │
       ▼
15. COMPLAINT_CLOSED (With statutory reason & appeal notice)
       │
       ├─────────────────────────────────────────────┐
       ▼                                             ▼
16. APPEAL_SUBMITTED                          [Archive Locked]
       │
       ▼
17. COMPLAINT_REOPENED
```

*(Note: `18. CORRECTION_RECORDED` can occur whenever allowed factual corrections or clarifications are logged).*

### 4.2 Hash Chain Integrity Engine
For any event block $E_i$ at sequence $i$:
- If $i = 1$: $\text{previousHash} = \text{GENESIS\_HASH} = \text{"0000...0000"}$
- If $i > 1$: $\text{previousHash} = \text{hash}(E_{i-1})$
- $\text{hash}(E_i) = \text{SHA-256}(\text{CanonicalJson}(\{ \text{sequence}, \text{complaintId}, \text{eventType}, \text{actorId}, \text{actorRole}, \text{title}, \text{details}, \text{timestamp}, \text{previousHash} \}))$

```
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│ Event 1 (Genesis)       │       │ Event 2                 │       │ Event 3                 │
│ Seq: 1                  │       │ Seq: 2                  │       │ Seq: 3                  │
│ PrevHash: 0000...0000   │◄──────┼─PrevHash: Hash(Event 1) │◄──────┼─PrevHash: Hash(Event 2) │
│ Hash: 8f3c...91b2       │       │ Hash: 4e1a...76c0       │       │ Hash: 99ba...002f       │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

### 4.3 Department Transfer History Preservation
When a complaint transfers from Department A to Department B:
1. `Complaint.departmentId` is updated to Department B.
2. An event of type `DEPARTMENT_TRANSFER_COMPLETED` is appended.
3. The event captures:
   - `responsibleDepartment`: "Department A -> Department B"
   - `reason`: Transfer justification (e.g., "Out of civic jurisdiction; routed to PWD for road repairs").
   - `metadata`: `{ originatingDepartmentId, targetDepartmentId, tenureDurationMs, previousStageTime }`
4. The timeline visualization explicitly groups past events under Department A's banner, ensuring Department A remains publicly accountable for any delays during its tenure.

---

## 5. Security, Authorization & Privacy Specifications

### 5.1 Access Matrix
| Role | View Complaint Timeline | View Internal Notes | View Whistleblower Identity | Verify Hash Chain |
| :--- | :---: | :---: | :---: | :---: |
| **Unauthenticated (Public Reference)** | ✅ Sanitized only | ❌ | ❌ (Redacted) | ✅ |
| **Citizen (Complaint Owner)** | ✅ Full | ❌ (Unless published) | ✅ Self | ✅ |
| **Citizen (Non-Owner)** | ❌ (HTTP 403) | ❌ | ❌ | ❌ |
| **Official (Department Staff)** | ✅ Full | ✅ Department Only | ❌ (If anonymous) | ✅ |
| **Reviewer / Vigilance / Lokayukta** | ✅ Full | ✅ All | ❌ (Protected) | ✅ |
| **Platform Administrator** | ✅ Full | ✅ All | ❌ (Encrypted/Redacted) | ✅ |

### 5.2 Whistleblower Protection Implementation
When `complaint.isAnonymous === true`:
- For all public reference queries and unauthorized viewers:
  - `actorName` is replaced with `"Whistleblower (Protected)"`
  - `actorId` is set to `null`
  - Any contact or identification fields in `metadata` are sanitized before transmission.

---

## 6. Migration & Database Integrity Risks

1. **Schema Migration Risk**: **Zero Risk**.
   - The `ComplaintEvent` table, `EventType` enum, and relational indices were deployed and verified in Phase 2 (`init_foundation` migration).
   - In Phase 4, `departmentId` was made optional on `Complaint` to allow unassigned intake. No further schema alterations are needed.
2. **Database Data Preservation**:
   - Existing real complaints created during Phase 4 have valid genesis events (`sequence: 1`) and edit correction events (`sequence: 2`).
   - Appending new events requires only strictly atomic sequential writes (`prisma.$transaction`).
3. **Concurrency Conflict Prevention**:
   - The unique constraint `@@unique([complaintId, sequence])` ensures no duplicate sequences can be created.
   - Event creation services will lock the complaint record or execute within serializable transactions to compute `sequence = lastEvent.sequence + 1` safely.

---

## 7. Step-by-Step Implementation Roadmap (Phase 5 Execution)

### Step 1: Backend Service Enhancements
1. Create `server/services/timelineService.js`:
   - `appendEvent(complaintId, eventData)`: Atomic sequential appender with hash computation.
   - `getTimelineForComplaint(complaintId, user)`: Retrieve, enrich, and filter events based on user permissions.
   - `verifyTimelineIntegrity(complaintId)`: Recalculate hash chain and pinpoint any corrupted/tampered blocks.
   - `transferDepartment(complaintId, newDepartmentId, reason, actor)`: Atomic department reassignment with snapshot events.

### Step 2: API Route Layer
1. Add routes to `server/routes/complaints.js` (or a dedicated `server/routes/timeline.js`):
   - `GET /api/complaints/:id/timeline` — Authenticated timeline retrieval.
   - `GET /api/complaints/reference/:refNumber/timeline` — Public sanitized timeline retrieval.
   - `GET /api/complaints/:id/timeline/verify` — Cryptographic proof verification.

### Step 3: Frontend Data & UI Wiring
1. Update `src/context/DataContext.jsx`:
   - Extend `mapDbComplaint` to include all event properties (`responsibleDepartment`, `newStatus`, `previousStatus`, `reason`, `durationLabel`, `metadata`).
   - Add `fetchComplaintTimeline(idOrRef)` to pull real-time timeline data on demand.
2. Update `src/components/timeline/AccountabilityTimeline.jsx`:
   - Ensure dynamic stage durations calculate seamlessly using `new Date(evt.timestamp)`.
   - Connect the "Verify Record Integrity" button to use the unified hash calculation.
3. Update `src/features/timeline/TimelinePage.jsx`:
   - Enable live searching of real reference numbers (e.g., `CC-2026-XXXX-XXXXX`) alongside demo scenarios.

---

## 8. Verification & Test Plan

### Automated Vitest Test Suite (`server/__tests__/timeline.test.js`)
1. **Hash Chain Verification**:
   - Verify genesis event has `previousHash === GENESIS_HASH`.
   - Verify event $N$'s `previousHash === event $(N-1)$'s `hash`.
   - Tamper with event details or timestamp and assert that verification returns `isValid: false` and identifies the tampered sequence.
2. **Sequential Integrity**:
   - Attempt to append conflicting sequences concurrently and assert `@@unique([complaintId, sequence])` rejects collisions.
3. **Department Handover & Tenure**:
   - Perform a department transfer and verify `responsibleDepartment` snapshot and transfer events are correctly chained.
4. **Access Control & Anonymity**:
   - Verify unauthenticated public reference request strips citizen details and private event metadata.
   - Verify anonymous complaint redacts citizen name across all events.
   - Verify third-party authenticated citizen cannot query private complaint timeline.

### Manual Verification Matrix
1. Open citizen dashboard, select an existing real complaint, and verify the timeline renders with its genesis event.
2. Perform a PATCH edit and verify that `CORRECTION_RECORDED` appears as sequence 2 with its proper time interval.
3. Open `RecordVerificationModal` and click "Verify Integrity" — assert 100% green cryptographic confirmation.
4. Copy reference number, open incognito tab, and view the public tracking page — assert no citizen PII appears on the timeline.
