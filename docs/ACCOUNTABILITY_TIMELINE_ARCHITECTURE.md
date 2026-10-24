# The Accountability Timeline — Architecture & Design Reference

> **Scope:** This document covers only the `AccountabilityTimeline` premium feature
> added in the "Prompt 11" implementation sprint. It does not replace `README.md`.

---

## 1. Feature Objective

CitizenConnect already stores an append-only, SHA-256-linked event chain per complaint.
The Accountability Timeline exposes that data as a rich, interactive, role-aware UI that answers six questions for every event:

| # | Question | Where shown |
|---|---|---|
| 1 | **What** happened? | Event title + description |
| 2 | **Who** performed the action? | Actor name + role badge |
| 3 | **When** did it happen? | ISO-parseable timestamp |
| 4 | **How long** had the complaint been at the previous stage? | Stage-duration chip `⏳ N days` |
| 5 | Was the action completed **on time**? | Overdue metric card + SLA banner |
| 6 | **What happens next?** | "What happens next?" inline block per event |

---

## 2. File Inventory

```
src/
├── services/
│   └── timelineEventService.js        ← Domain logic (pure JS, no React)
├── components/
│   └── timeline/
│       └── AccountabilityTimeline.jsx ← Master presentational component
└── features/
    └── timeline/
        └── TimelinePage.jsx           ← Standalone demo route `/timeline`
```

Integrated into existing pages as a **drop-in replacement** for legacy basic audit lists:

| Page | Role passed |
|---|---|
| `CitizenDashboardPage.jsx` | `citizen` |
| `TrackComplaintPage.jsx` | `citizen` |
| `OfficialInboxPage.jsx` | `official` |
| `ReviewerDashboardPage.jsx` | `reviewer` |
| `TimelinePage.jsx` | User-selectable (citizen / official / reviewer / public) |

---

## 3. The 18 Canonical Event Types

```
COMPLAINT_SUBMITTED           → Genesis block. previousHash = 64× "0".
ACKNOWLEDGEMENT_RECORDED      → SLA clock starts.
CITIZEN_EVIDENCE_ADDED        → Teal. SHA-256 byte fingerprint linked.
OFFICIAL_RESPONSE_RECEIVED    → Violet. Departmental statement sealed.
INVESTIGATION_STARTED         → Violet.
INVESTIGATION_PROGRESS_UPDATED→ Violet. May carry progressPercent metadata.
ADDITIONAL_INFO_REQUESTED     → Violet. Citizen must reply.
CITIZEN_INFO_PROVIDED         → Blue. Citizen answer appended.
DEPARTMENT_TRANSFER_REQUESTED → Indigo. Awaiting acceptance.
DEPARTMENT_TRANSFER_COMPLETED → Indigo. fromDepartment / toDepartment metadata.
DEADLINE_APPROACHING          → Saffron. Advisory only.
DEADLINE_MISSED               → Red. SLA breach counter incremented.
COMPLAINT_ESCALATED           → Saffron. escalatedFromLevel / escalatedToLevel.
REVIEWER_FINDING_RECORDED     → Green. determination: Substantiated | Not substantiated | …
COMPLAINT_CLOSED              → Green. reason mandatory.
APPEAL_SUBMITTED              → Blue. 30-day window.
COMPLAINT_REOPENED            → Green.
CORRECTION_RECORDED           → Green. Clarification appended by official/reviewer.
```

**Aliases** (`EVENT_TYPE_ALIASES`) map legacy seed-data keys such as
`EVIDENCE_ADDED`, `ACKNOWLEDGED`, `CLOSED`, `ESCALATED`, `FINDING_RECORDED`
to their canonical equivalents so old complaints continue to display correctly.

---

## 4. Visual Treatment — Never Colour Alone

Every category pair carries a Lucide icon **and** a text badge in addition to colour,
satisfying WCAG 1.4.1 (Use of Colour):

| Category | Colour family | Icon | Badge text |
|---|---|---|---|
| CITIZEN | Blue | `UserCheck` | Citizen Submission |
| EVIDENCE | Teal | `Paperclip` | Cryptographic Exhibit |
| OFFICIAL | Violet | `MessageSquare` | Official Response |
| TRANSFER | Indigo | `ArrowRightLeft` | Inter-Agency Routing |
| ESCALATION | Saffron (#E06820) | `TrendingUp` | Appellate Trigger |
| OVERDUE | Red | `AlertTriangle` | SLA Breach |
| VERIFIED_PROCEDURAL | Emerald | `CheckCircle2` | Compliance Logged |

---

## 5. Stage Duration Formula

For each event at index `i > 0`:

```
durationAtPriorStage = parsedDate(events[i]) − parsedDate(events[i−1])
```

`parseEventTimestamp()` handles both ISO-8601 and Indian locale strings
(`"15 Oct 2026, 11:25 AM"`). The result is displayed as a human-readable chip
(`⏳ 3 days`, `⏳ 2 days, 4 hrs`).

On a department transfer the prior tenure at the originating office is preserved
in the transfer event's own `durationLabel` chip, so no institutional accountability
is lost when a file is routed elsewhere.

---

## 6. Accountability Summary Metrics

Four cards computed by `computeTimelineAccountabilityMetrics()`:

| Metric | Formula |
|---|---|
| **Total Elapsed Time** | `simulatedDate − submissionDate` |
| **Current Stage Duration** | `simulatedDate − lastEventDate` |
| **Department Transfers** | Count of `DEPARTMENT_TRANSFER_COMPLETED / REQUESTED` events |
| **Overdue / Missed SLAs** | Count of `DEADLINE_MISSED` events + 1 if `slaDaysRemaining ≤ 0` and not closed |

---

## 7. Anomaly Detection Rules

`detectTimelineAnomalies(events)` scans every event for:

| Rule ID | Condition | Severity |
|---|---|---|
| MISSING_ACTOR | `actor`, `actorName`, and `actorRole` are all empty/falsy | High |
| MISSING_TIMESTAMP | `timestamp` is absent | High |
| MISSING_TRANSFER_REASON | Transfer event has no `reason` or `metadata.transferReason` | Medium |
| MISSING_CLOSURE_REASON | `COMPLAINT_CLOSED` event has no `reason` | Medium |
| CHRONOLOGICAL_INCONSISTENCY | Parsed date of event `i` is earlier than event `i−1` | High |

Anomalies trigger a **red banner** at the top of the timeline. Officials and reviewers
see a "Record Official Clarification" button that appends a `CORRECTION_RECORDED` event
— sealing the anomaly into the immutable chain without deleting the flagged event.

**Demo seed**: Complaint `CC-2026-UP-10482` (Hospital) carries one deliberate
`MISSING_ACTOR` anomaly at `EVT-10482-04` for demonstration.

---

## 8. Role-Based Privacy Filtering

`filterTimelineForRole(events, role)` applies the following rules:

| Role | Sees |
|---|---|
| `citizen` | All events **except** those marked `actorRole: 'Reviewer'` with internal metadata |
| `official` | Events minus complainant PII; reviewer-internal notes hidden |
| `reviewer` | Full unfiltered chain including anomaly metadata |
| `public` | Only events with `metadata.isPublicSafe !== false`; anomaly metadata stripped |

> **Note:** The current demo implementation applies conservative filtering.
> A production backend should enforce filtering server-side, not in the browser.

---

## 9. Department Transfer History Panel

`extractTransferHistory(events)` builds a structured array of every transfer event with:

- `fromDepartment` / `toDepartment`  
- `actor` (initiating officer)  
- `reason` (flagged if missing)  
- `statusText` (Awaiting acceptance / Completed & accepted)  
- `receivingDeadline`

Displayed in a dedicated **Transfers modal** accessible from the timeline header.

---

## 10. Cryptographic Integrity

The `AccountabilityTimeline` component includes a **"Verify Record Integrity"** button
that opens `RecordVerificationModal`, which calls `verifyComplaintAuditChain()` from
`auditCrypto.js`.

The chain verification algorithm:
1. For each event `i`: check `event.previousHash === hash(events[i−1])`.
2. Re-compute `SHA-256(canonicalJson(eventWithoutHash) + ":" + previousHash)`.
3. Compare recomputed hash with stored `event.hash`.
4. Report the first mismatching block with its index and event ID.

The **Admin Demo Tamper Test** modifies a single event's payload field and re-runs
verification, demonstrating that the mismatch is detected immediately.

---

## 11. Standalone Route

```
/timeline               → TimelinePage.jsx (defaults to CC-2026-DL-28491)
/timeline/:id           → Deep-link to specific complaint
/accountability-timeline → Alias
```

`TimelinePage` includes a **scenario picker** for the three seed complaints and a
**role persona switcher** (citizen / official / reviewer / public) so judges can
demonstrate every privacy level without switching user accounts.

---

## 12. Seed Complaint Scenarios

| ID | Complaint | Key features demonstrated |
|---|---|---|
| `CC-2026-DL-28491` | MCD Ward 14 demolition extortion | Department transfer, missed SLA, Level 2 escalation, official response |
| `CC-2026-MH-49102` | Police FIR refusal (Pune) | Audio evidence exhibit, ACP response, upcoming 3-day deadline |
| `CC-2026-UP-10482` | Ayushman Bharat card denial (Lucknow) | Deliberate MISSING_ACTOR anomaly, reviewer finding substantiated |

All three seed complaints have **pre-computed, verified SHA-256 hash chains**. The
hashes were generated with `temp_chains_export.js` (now deleted after verification)
and confirmed with `verifyComplaintAuditChain()` before being written into
`src/data/demoData.js`.

---

## 13. Pending Production Requirements

The following items are simulated in the browser demo and would require a real
backend in production:

- [ ] Server-side hash chain storage (immutable append-log, e.g. PostgreSQL with row-level audit triggers or a Merkle tree store)
- [ ] Server-enforced role-based event filtering
- [ ] Real file storage with byte-accurate SHA-256 fingerprints (currently simulated SHA values)
- [ ] Notification webhooks for deadline proximity (currently driven by `simulatedDate`)
- [ ] National CPGRAMS / state SAKALA API bridging for cross-platform status sync

---

*This document was created as part of the CitizenConnect Accountability Timeline
implementation. Last updated: 23 Oct 2026.*
