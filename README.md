# CitizenConnect — Sovereign Civic Accountability & Anti-Vanishing Platform

> **"Build a platform where a complaint against an official can’t quietly vanish; it moves up the chain on time, and the citizen can find free legal help."**

CitizenConnect is a decentralized civic accountability web platform engineered to solve the chronic problem of disappearing public grievances, bureaucratic inertia, and opaque official maladministration. Built with React 19, Vite, Tailwind CSS, Three.js, and a sovereign Node.js AI backend, the platform implements mathematical immutability guarantees, role-isolated data redaction, autonomous statutory escalation, and constitutional legal aid bridges under Article 39A of the Constitution of India.

---

## 1. The Problem & Intended Users

### The Problem
In conventional administrative grievance portals (e.g. municipal grievance apps, departmental desks), citizen complaints frequently stall in indefinite "Under Process" statuses. Citizens face:
1. **The "Vanishing File" Dilemma:** Inactive tickets are quietly closed or ignored without accountability.
2. **Whistleblower Retaliation:** Accused officials often receive raw complainant details, phone numbers, and witness identities, leading to coercion or harassment.
3. **Statutory Time Breaches:** Deadlines prescribed under citizen charters and Right to Services acts lapse without legal consequences.
4. **Lack of Legal Recourse:** Citizens are left unaware of statutory remedies (RTI, Lokayukta, CPGRAMS, High Court Writs) or free legal aid entitlements.

### Intended Users
- **Indian Citizens & Whistleblowers:** Filing administrative grievances with anti-vanishing guarantees, identity masking, and verified legal representation.
- **Office Officials & Inquiry Officers:** Receiving reviewer-redacted summaries to take action, post progress notes, or submit compliance orders without access to sensitive complainant PII.
- **Oversight Reviewers (Lokayukta / Appellate Authorities):** Inspecting raw unredacted dossiers, confidential witness rosters, and advisory AI flags to record formal findings.
- **Public Observers & Civic Researchers:** Accessing sanitized public accountability records and statistical department responsiveness ratings.
- **Platform Administrators:** Managing demonstration clocks, simulating SLA timer advancements, and running cryptographic tamper diagnostics without the power to delete or rewrite complaint history.

---

## 2. Platform Architecture & Key Features (14 Screens)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CitizenConnect Architecture                     │
├────────────────────────────────────────────────────────────────────────┤
│  [UI Layer: React 19 + Tailwind CSS + Three.js 3D Tricolor Canvas]     │
├───────────────────┬───────────────────┬────────────────────────────────┤
│  Role Projections │ Data Shaping Layer│ Cryptographic Ledger           │
│  (Citizen/Official│ (Strict PII &     │ (Canonical JSON SHA-256 Chain, │
│  Reviewer/Public) │  Witness Masking) │  Byte Fingerprints)            │
├───────────────────┴───────────────────┴────────────────────────────────┤
│  Autonomous SLA Clock & Statutory Escalation State Machine             │
│  (Tier 1: GRO 7d → Tier 2: Appellate 15d → Tier 3: Lokayukta 30d)     │
├────────────────────────────────────────────────────────────────────────┤
│  Sovereign Node.js AI Backend (Port 5050 / Sovereign Fallback Engine) │
├────────────────────────────────────────────────────────────────────────┤
│  Constitutional Legal Bridge (NALSA 15100, DLSA Sec 12, Tele-Law)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Complete Screen Directory:
1. **Home / Landing Page (`/`):** High-resolution Sansad Bhavan background (Golden Hour light mode / illuminated night dark mode), 3D interactive waving Indian Tricolor on a stationary flagpole, emergency notice, and live civic statistics.
2. **Report a Complaint (`/report` or `/wizard`):** 10-step guided complaint wizard with category selection, department dropdown, incident timestamp/location, witness envelope, audio recording, voice input, and simulated DigiLocker/Aadhaar OTP handshake.
3. **Low-Bandwidth Written Route (`/written-complaint`):** Single-page, low-bandwidth text filing route with offline-tolerant submission and solemn legal declaration.
4. **Quick Report (`/quick-report`):** Fast triage filing card for urgent public utility reports.
5. **Track Complaint (`/track`):** Public tracking portal displaying SLA countdowns, statutory escalation tiers, and direct cryptographic chain verification.
6. **Citizen Dashboard (`/citizen-dashboard`):** Citizen grievance roster, complete audit timeline, SLA timetable, Action Required alert for information requests, and pro-bono counsel linkages.
7. **Office Official Inbox (`/official-inbox`):** Departmental desk showing PII-redacted summaries. Allows officials to acknowledge, mark inquiry in progress, request info, submit official responses, or challenge records.
8. **Oversight Reviewer Dashboard (`/reviewer-dashboard`):** Unredacted investigation file clearance, confidential witness envelopes, AI advisory flags (duplicate evidence, coordinated filings, date mismatches), and statutory finding recorder (`Substantiated`, `Not Substantiated`, `No Finding Possible`).
9. **Public Accountability Records (`/public-records`):** Open public ledger with dedicated privacy projections. Search complaints by ID without exposing citizen identities; inspect restricted records showing only restriction date & legal reason category.
10. **Department & Office Profiles (`/public-records` tab):** Statistical accountability indicators, median acknowledgement and response times, and review determinations.
11. **Legal Help & Pro-Bono Aid (`/legal-help`):** Section 12 Legal Services Authorities Act eligibility screener, NALSA 15100 toll-free helpline, DLSA directory, and fictional demo lawyer listings tagged by fee model.
12. **Next Steps & Statutory Remedies (`/legal-remedies`):** Practical legal options (RTI, CPGRAMS, State Right to Services, State ACB, Lokayukta, Police Complaints Authority, NHRC/SHRC, High Court Mandamus) with verified deadlines, document checklists, and official source links.
13. **Accountability Methodology (`/methodology`):** Architectural whitepaper detailing the mathematical indicator formula, eligible records, 12-month rolling window, and 10-case minimum threshold rule.
14. **Admin Demo Controls (`/admin-demo`):** Demonstration date advancement (+1, +7, +30 days), explicit baseline reset confirmation, 3-mode cryptographic tamper test harness, append-only admin audit log, and simulated integration monitors.
15. **Accessibility & Settings (`/settings`):** English / हिन्दी language selector, three text-size levels (16px, 18px, 20px), high-contrast mode (WCAG AAA), read-aloud speech synthesis with voice selection, reduced motion support, and statutory acronym glossary.

---

## 3. Cryptographic Audit Chain & Tamper-Evident Verification

Every complaint maintains an ordered, append-only cryptographic event ledger:

$$\text{Hash}_n = \text{SHA-256}\Big(\text{CanonicalJSON}\big(\text{Hash}_{n-1} + \text{EventContent}_n\big)\Big)$$

- **Deterministic Canonical Serialization:** Fields are deterministically sorted alphabetically before hashing, preventing whitespace or key-order malleability across browsers.
- **Genesis Block:** Block #1 points to a pre-defined genesis hash:
  `0000000000000000000000000000000000000000000000000000000000000000`.
- **Evidence Byte Fingerprints:** All attached documents (PDFs, images, audio recordings) have their actual raw bytes hashed via `crypto.subtle.digest('SHA-256', bytes)` upon upload. The resulting fingerprint is sealed into the corresponding audit block.
- **Tamper Verification Modal:** Recomputes the full hash chain and evidence fingerprints from genesis to tip. If an attacker modifies even a single character in local storage, verification fails, highlighting the exact corrupt block index and mismatching hashes.
- **Immutable Guarantee:** Neither citizens, officials, reviewers, nor administrators have the ability to delete or rewrite prior events. Corrections, withdrawals, and restrictions are appended as new audit blocks.

---

## 4. Statutory Escalation Engine & Investigation Pauses

To enforce accountability, CitizenConnect implements an autonomous state machine based on Indian citizen charters and State Right to Services legislation:

| Escalation Tier | Statutory Authority | Mandatory SLA Window | Autonomous Legal Trigger |
|---|---|---|---|
| **Level 1** | Ward Grievance Redressal Officer (GRO) | 7 Working Days | Automatically initiated upon filing |
| **Level 2** | First Appellate Authority (Joint/Addl Commissioner) | 15 Working Days | Auto-advances if Level 1 officer fails to record action |
| **Level 3** | State Lokayukta / Anti-Corruption Bureau | 30 Working Days | Formal ombudsman inquiry referral |
| **Level 4** | High Court of the State (Article 226) | Immediate | Pro-bono counsel file Constitutional Writ of Mandamus |

### Investigation Pauses & Info Requests
- When an inquiry officer issues a formal **Information Request**, the complaint enters an **Action Required** state.
- The SLA clock pauses for up to 7 calendar days to give the citizen time to furnish requested records without unfairly penalizing the department.
- When the citizen submits the supplemental data, an append-only `CORRECTION` event is logged, and the SLA timer resumes.

---

## 5. Sovereign AI Synthesizer & Ethical Boundaries

CitizenConnect operates a sovereign local Node.js AI backend (`server/aiServer.mjs`) on port 5050.

### Capabilities:
- **Field Extraction:** Automatically extracts incident category, department, date/time, office location, named officials, and bribe amounts from unstructured narrative text.
- **Chronological Timeline:** Reconstructs a sequential timeline of events described in the complaint.
- **Evidence Inventory:** Maps referenced documents and calculates preliminary integrity hashes.
- **Advisory Flags:** Detects missing mandatory information, inconsistent dates, and narrative coordination.

### Ethical Boundaries & Limitations:
1. **Advisory Only — Never Proof:** AI flags are strictly labeled *"Worth a closer look — Advisory only, never proof"*.
2. **No Automated Rejection:** AI outputs are never permitted to dismiss, reject, or deprioritize a citizen's complaint.
3. **Reviewer In-The-Loop:** Formal findings can only be recorded by a human oversight reviewer.
4. **Sovereign Offline Fallback:** If external cloud AI keys (e.g. Gemini) are missing or disabled, the server seamlessly switches to its built-in rule-based deterministic parsing engine with zero downtime.

---

## 6. Privacy, Role-Based Redaction & Misuse Prevention

Information segregation is enforced at the **data transformation layer** (`dataShaping.js`), never merely by hiding elements with CSS:

| Role | Complainant Identity | Witnesses | Complaint Body | Evidence Access |
|---|---|---|---|---|
| **Citizen** | Own identity visible | Own witnesses visible | Full statement | Own uploaded files |
| **Official** | Masked / Redacted | `null` (strictly omitted) | Reviewer-approved summary | Redacted files only |
| **Reviewer** | Full unredacted file | Full witness contact details | Full unredacted narrative | Full evidence vault & hashes |
| **Public** | Anonymized (`Verified Resident`) | `null` (strictly omitted) | Public-safe summary | Counts only |

### Restricted Records Handling:
When a case is marked restricted under reviewer seal (e.g. whistleblower case `CC-2026-KA-71829`), public visitors see **only**:
- **Restriction Date:** e.g., `12 Oct 2026`
- **Public-Safe Reason Category:** e.g., *"Whistleblower Identity Protection & Anti-Retaliation Protocol"*
- **Status:** `"Restricted from Public View"`
- Zero narrative details, zero phone numbers, and zero witness records.

---

## 7. Public Accountability Indicator Methodology

The Accountability Indicator (0–100%) evaluates an administrative office based on demonstrated performance:

$$\text{Accountability Score} = (0.35 \times R) + (0.40 \times S) + (0.25 \times Q)$$

- **$R$ (Responsiveness Rate - 35%):** Timeliness of formal written acknowledgement ($\le 48$ hours).
- **$S$ (SLA Compliance Rate - 40%):** Grievances concluded without SLA timer lapse or autonomous escalation.
- **$Q$ (Resolution Quality - 25%):** Quality metric: $100\% - \left(\frac{\text{Substantiated Misconduct Findings}}{\text{Total Closed Complaints}} \times 100\%\right)$.
- **Allegations $\neq$ Misconduct:** Raw complaint volume is never treated as proof of guilt. High volume often reflects civic engagement or population size. Only formal, reviewer-substantiated findings penalize the score.
- **10-Case Minimum Threshold Rule:** If an office has fewer than 10 closed complaints during the 12-month rolling window, the indicator is explicitly suppressed with the notice:
  > *"Data Insufficient — Minimum 10 closed complaints required to compute statistical indicator (currently X closed)."*

---

## 8. Legal Remedies & Free Legal Aid (NALSA / Section 12)

### Statutory Remedies Covered:
1. **Right to Information (RTI):** Section 6(1) of RTI Act, 2005 (`rtionline.gov.in`).
2. **RTI First Appeal:** Section 19(1) of RTI Act, 2005 (`cic.gov.in`).
3. **CPGRAMS:** Central Public Grievance Redress and Monitoring System (`pgportal.gov.in`).
4. **State Right to Services (RTS) Guarantee:** Public Service Guarantee Acts in 20+ states with penalties on defaulting officials.
5. **State Anti-Corruption Bureau (ACB):** Prevention of Corruption Act, 1988 (`cvc.gov.in`).
6. **State Lokayukta / Lokpal:** Independent ombudsman under the Lokpal Act, 2013 (`lokpal.gov.in`).
7. **Police Complaints Authority (PCA):** State/District PCAs under Supreme Court *Prakash Singh* directives.
8. **National & State Human Rights Commissions:** Protection of Human Rights Act, 1993 (`nhrc.nic.in`).
9. **Constitutional Writ of Mandamus:** Article 226 High Court judicial orders.

### Free Legal Aid Entitlements (Section 12, Legal Services Authorities Act, 1987):
- **Eligible Groups:** Women and children, SC/ST citizens, persons with disabilities, victims of trafficking or begar, industrial workmen, persons in custody, disaster victims, and citizens earning below state income thresholds.
- **Income Caveat:** Income criteria must be verified with the relevant State Legal Services Authority.
- **Free Institutional Channels:**
  - **DLSA Front Office:** Located inside every District Court in India.
  - **NALSA Helpline 15100:** 24x7 Pan-India toll-free legal tele-consultation.
  - **Tele-Law (`tele-law.in`):** Department of Justice video-counseling via Common Service Centres.
  - **Nyaya Bandhu (`pro-bono.in`):** Pro bono advocate representation network.
  - **Law School Legal Aid Clinics:** Free university drafting and counseling cells.
- **Fictional Demo Directory:** Clearly tags lawyers as *"Government legal aid"*, *"Free consultation"*, or *"Paid"*, with explicit disclaimers confirming they are demonstration simulations.

---

## 9. "Prepare My Case Summary" Feature

Available on `/legal-help`, `/legal-remedies`, and `/citizen-dashboard`, this tool generates a print-ready formal legal brief containing:
- Unique Case ID, submission timestamp, and jurisdiction.
- Factual narrative and official redacted notice.
- Current statutory escalation stage and SLA tracking.
- Evidence inventory with SHA-256 byte fingerprints.
- Chronological append-only audit trail with event hashes.
- Reviewer findings and recommended statutory remedies.
- Complainant and counsel signature blocks with clean `@media print` styling.

---

## 10. Universal Accessibility & Multilingual Support

- **Bilingual Interface:** Toggle between English and हिन्दी, with complete translations for legal terminology and statutory acronyms.
- **Recognized Acronyms:** RTI, FIR, Lokayukta, DLSA, BNSS, CPGRAMS, and ACB retained with plain-language definitions.
- **Text Scaling:** Three levels (Normal 16px, Medium 18px, Large 20px).
- **High-Contrast Mode:** 125% contrast ratio with solid borders and bright amber focus rings.
- **Browser Read-Aloud:** Native SpeechSynthesis engine with voice selection and speed control.
- **Reduced-Motion Support:** Pauses 3D flag ripples and UI animations.
- **Touch Targets:** Minimum 48px height (`btn-touch-target`).
- **Responsive Layout:** Optimized down to 360px mobile width with zero horizontal overflow.
- **Emergency Notice on Every Page:** *"If you are in danger right now, call 112."*

---

## 11. Local Setup, Commands & Deployment

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation & Local Run

```bash
# 1. Clone or navigate to the project directory
cd Hac_cashe

# 2. Install dependencies
npm install

# 3. Start the Sovereign Local AI Backend Server (Port 5050)
npm run ai-server

# 4. In a separate terminal, start the Vite Development Server (Port 5173)
npm run dev
```

Open your browser at: `http://127.0.0.1:5173/`

### Environment Variables (Optional)
Create a `.env` file in the root directory if configuring cloud AI fallback:

```env
# Optional: Google Gemini API key for cloud AI fallback in server/aiServer.mjs
GEMINI_API_KEY=your_gemini_api_key_here

# AI Server Port (default: 5050)
PORT=5050
```
*(If no API key is provided, the sovereign backend automatically runs in deterministic mock synthesis mode with full functionality.)*

### Production Build & Preview
```bash
# Compile optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Vercel / Netlify Deployment

1. **Vercel Deployment:**
   - Connect your GitHub repository to Vercel.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Client-side routing is pre-configured via the root `vercel.json`:
     ```json
     {
       "rewrites": [
         {
           "source": "/(.*)",
           "destination": "/index.html"
         }
       ]
     }
     ```
2. **Netlify Deployment:**
   - Pre-configured via `public/_redirects`:
     ```text
     /*    /index.html   200
     ```

---

## 12. Final Requirement Checklist & Honest Limitations

### Requirement Status:

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | Parliament background & 3D flag animation | **Complete** | Three.js WebGL canvas with Ashoka Chakra; golden hour & night illumination. |
| 2 | Role Switcher & Strict Data Shaping | **Complete** | Citizen, Official, Reviewer, Public, Admin. Data masked at transformation layer. |
| 3 | 10-Step Wizard & Low-Bandwidth Written Route | **Complete** | Step-by-step progress, OTP handshake, audio recorder, voice input, declaration. |
| 4 | Sovereign AI Synthesizer & Advisory Flags | **Complete** | Sovereign Node backend on port 5050. Flags are advisory only, never proof. |
| 5 | Append-Only SHA-256 Audit Chain | **Complete** | Canonical JSON hashing, evidence byte fingerprints, genesis block pointer. |
| 6 | Tamper Testing Suite & Integrity Verification | **Complete** | 3 tamper vectors + clean restore. Recomputes chain and detects corrupt blocks. |
| 7 | Three Accountability Dashboards | **Complete** | Citizen Dashboard, Official Redacted Inbox, Reviewer Oversight Console. |
| 8 | Next Steps & Statutory Remedies | **Complete** | RTI, CPGRAMS, RTS, ACB, Lokayukta, PCA, NHRC, Mandamus with verified deadlines. |
| 9 | Free Legal Aid Screener (Section 12) | **Complete** | NALSA 15100, DLSA, Tele-Law, Nyaya Bandhu, searchable lawyer directory. |
| 10 | Prepare My Case Summary Feature | **Complete** | Print-ready legal brief with SHA-256 fingerprints and dual signature blocks. |
| 11 | Searchable Public Records Ledger | **Complete** | Zero-PII public projection; restricted records show only date & legal reason. |
| 12 | Department Accountability Indicator | **Complete** | Computed from responsiveness, SLA compliance, and findings. 10-case threshold rule. |
| 13 | Admin Demo Controls & Clock Advance | **Complete** | Simulated date shift (+1, +7, +30d), append-only admin log, explicit reset confirmation. |
| 14 | Universal Accessibility & Settings | **Complete** | 3 text scales (16/18/20px), high contrast (AAA), speech synthesis, reduced motion. |
| 15 | Bilingual English / हिंदी Interface | **Complete** | Full toggles, Hindi terminology, and official acronym glossary retained. |
| 16 | Mandatory Emergency Notice (112) | **Complete** | Displayed prominently across every route and layout banner. |

### Honest Limitations:
1. **Browser Storage Demonstration:** In this client-side demonstration, the cryptographic chain is persisted in browser `localStorage`. While tamper-evident (any modification breaks the hash chain upon verification), it does not guarantee permanent server-side non-repudiation until deployed with a hardened distributed backend.
2. **Simulated Government Integrations:** Integrations with DigiLocker, UIDAI Aadhaar OTP, and CPGRAMS are high-fidelity sandbox simulations designed for demonstration purposes without calling live government production APIs.
3. **Fictional Advocate Directory:** All lawyer listings and consultation callbacks are fictional demo entries designed to showcase fee-tier segregation and pro-bono routing.
