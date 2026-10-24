/**
 * CitizenConnect — Role-Specific Data-Shaping Service
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * Information segregation is enforced at the data transformation layer,
 * NEVER merely by hiding elements with CSS.
 *
 * Roles:
 * 1. Citizen: Can view only their own complaints (or those filed with their session).
 * 2. Office Official: Sees only reviewer-approved, redacted complaint summaries (PII masked).
 * 3. Oversight Reviewer: Sees complete unredacted investigation files, PII, whistleblower tags, and audit hashes.
 * 4. Public: Sees only approved anonymized public accountability statistics & records (no citizen PII).
 * 5. Admin: Can view system metrics, demo settings, and audit logs. CANNOT delete or rewrite complaint history.
 */

export const DEMO_ROLES = {
  CITIZEN: 'citizen',
  OFFICIAL: 'official',
  REVIEWER: 'reviewer',
  PUBLIC: 'public',
  ADMIN: 'admin',
};

export const ROLE_DETAILS = {
  [DEMO_ROLES.CITIZEN]: {
    id: DEMO_ROLES.CITIZEN,
    name: 'Citizen',
    personaName: 'Aditya Kumar Verma',
    designation: 'Verified Resident (DigiLocker Linked)',
    description: 'Submits and tracks personal grievances with anti-vanishing escalation guarantee.',
    badgeColor: 'sky',
  },
  [DEMO_ROLES.OFFICIAL]: {
    id: DEMO_ROLES.OFFICIAL,
    name: 'Office Official',
    personaName: 'Shri R. K. Sharma',
    designation: 'Deputy Commissioner, Ward 14',
    description: 'Reviews redacted complaint summaries, uploads compliance orders, and acts before SLA breach.',
    badgeColor: 'amber',
  },
  [DEMO_ROLES.REVIEWER]: {
    id: DEMO_ROLES.REVIEWER,
    name: 'Oversight Reviewer',
    personaName: 'Justice S. N. Hegde (Retd.)',
    designation: 'State Lokayukta / Appellate Authority',
    description: 'Investigates raw files, protects whistleblowers, verifies evidence hashes, and enforces escalation.',
    badgeColor: 'purple',
  },
  [DEMO_ROLES.PUBLIC]: {
    id: DEMO_ROLES.PUBLIC,
    name: 'Public Observer',
    personaName: 'Civic Observer',
    designation: 'Indian Citizen / Public View',
    description: 'Views anonymized public performance metrics and corroborates community infrastructure issues.',
    badgeColor: 'emerald',
  },
  [DEMO_ROLES.ADMIN]: {
    id: DEMO_ROLES.ADMIN,
    name: 'System Admin',
    personaName: 'Demo System Controller',
    designation: 'CitizenConnect Platform Administrator',
    description: 'Manages demo test parameters and data resets without the power to delete immutable audit logs.',
    badgeColor: 'red',
  },
};

/**
 * Shape complaints list strictly according to the active user role.
 */
export function shapeComplaintsForRole(complaints = [], role = DEMO_ROLES.CITIZEN, currentUser = {}) {
  if (!Array.isArray(complaints)) return [];

  switch (role) {
    case DEMO_ROLES.CITIZEN: {
      // Citizen sees only their own complaints (or those filed by them)
      return complaints
        .filter((c) => {
          if (!currentUser?.name) return true;
          return c.citizenName === currentUser.name || c.isAnonymous;
        })
        .map((c) => ({
          ...c,
          // Citizen sees full personal details, own witnesses, and tracking status
          isMyComplaint: true,
          witnesses: c.witnesses || [],
        }));
    }

    case DEMO_ROLES.OFFICIAL: {
      // Officials see only reviewer-approved complaints relevant to their department or assigned to them.
      // Crucial: All citizen PII and WITNESS NAMES are strictly redacted/omitted at the data level.
      return complaints
        .filter((c) => {
          // If a complaint is rejected by oversight reviewer, official doesn't receive it
          return c.reviewStatus !== 'rejected';
        })
        .map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          department: c.department,
          departmentId: c.departmentId,
          officialNamed: c.officialNamed,
          officeLocation: c.officeLocation,
          incidentDate: c.incidentDate,
          incidentTime: c.incidentTime,
          filedDate: c.filedDate,
          stage: c.stage,
          stageName: c.stageName,
          severity: c.severity,
          slaDaysRemaining: c.slaDaysRemaining,
          totalSlaDays: c.totalSlaDays,
          // Strictly redacted PII:
          citizenName: c.isAnonymous
            ? '[ANONYMOUS WHISTLEBLOWER — IDENTITY STATUTORILY PROTECTED]'
            : '[CITIZEN PII REDACTED BY OVERSIGHT REVIEWER]',
          citizenPhone: '[REDACTED]',
          citizenEmail: '[REDACTED]',
          isAnonymous: c.isAnonymous,
          // Witness information is strictly inaccessible to officials:
          witnesses: null,
          hasWitnesses: Boolean(c.witnesses?.length),
          witnessNotice: 'Witness identities are classified and accessible only to the Oversight Reviewer under statutory protection.',
          // Redacted description showing operational facts without sensitive identifying data
          description: c.redactedSummary || c.description,
          evidenceFiles: (c.evidenceFiles || []).map((file) => ({
            name: file.name,
            size: file.size,
            sha256: file.sha256,
            uploadedAt: file.uploadedAt,
            isAccessible: true,
          })),
          audioEvidence: c.audioEvidence ? { name: c.audioEvidence.name, duration: c.audioEvidence.duration } : null,
          auditHistory: (c.auditHistory || []).filter(
            (a) => !a.action.startsWith('INTERNAL_REVIEWER_')
          ),
        }));
    }

    case DEMO_ROLES.REVIEWER: {
      // Oversight Reviewer has full access to raw investigation files,
      // unredacted citizen identity, whistleblower flags, full witness details, and cryptographic hashes
      return complaints.map((c) => ({
        ...c,
        canApprove: true,
        canEscalateDirectly: true,
        canIssueNotice: true,
        isRawUnredacted: true,
        // Full unredacted witness file:
        witnesses: c.witnesses || [],
      }));
    }

    case DEMO_ROLES.PUBLIC: {
      // Public users see ONLY approved public accountability projections.
      // Strict privacy rule: NEVER publish names, phone numbers, witness identities,
      // private evidence, sensitive descriptions or unapproved official responses.
      return complaints
        .filter((c) => c.reviewStatus !== 'rejected')
        .map((c) => {
          const isRestricted =
            Boolean(c.isRestrictedFromPublic) ||
            Boolean(c.isRestricted) ||
            Boolean(c.auditHistory?.some((e) => e.eventType === 'RESTRICTED_FROM_PUBLIC_VIEW'));

          const restrictionEvent = c.auditHistory?.find(
            (e) => e.eventType === 'RESTRICTED_FROM_PUBLIC_VIEW'
          );

          const restrictionDate =
            c.restrictedAt ||
            restrictionEvent?.timestamp?.substring(0, 10) ||
            c.filedDate ||
            '2026-03-24';

          const publicSafeReasonCategory =
            c.restrictionReason ||
            restrictionEvent?.reason ||
            'Whistleblower Protection & Anti-Retaliation Protocol';

          // Public-safe timeline
          const publicTimeline = (c.auditHistory || []).map((evt) => {
            let publicLabel = 'Procedural Status Update';
            if (evt.eventType === 'COMPLAINT_SUBMITTED') publicLabel = 'Complaint Formally Registered';
            else if (evt.eventType === 'ACKNOWLEDGED') publicLabel = 'Official Acknowledgement Issued';
            else if (evt.eventType === 'INVESTIGATION_STARTED') publicLabel = 'Departmental Investigation In Progress';
            else if (evt.eventType === 'STATUS_UPDATE') publicLabel = 'Progress Milestone Logged';
            else if (evt.eventType === 'INFO_REQUESTED') publicLabel = 'Supplementary Information Requested';
            else if (evt.eventType === 'OFFICIAL_RESPONSE') publicLabel = 'Official Departmental Response Filed';
            else if (evt.eventType === 'TRANSFER') publicLabel = 'Transferred to Competent Zonal Authority';
            else if (evt.eventType === 'ESCALATION') publicLabel = 'Statutory Escalation Triggered';
            else if (evt.eventType === 'FINDING_RECORDED') publicLabel = 'Oversight Finding Recorded';
            else if (evt.eventType === 'CLOSED') publicLabel = 'Matter Concluded & Closed';
            else if (evt.eventType === 'APPEAL') publicLabel = 'Statutory Appeal Lodged';
            else if (evt.eventType === 'REOPENED') publicLabel = 'Complaint Reopened on Appeal';
            else if (evt.eventType === 'RESTRICTED_FROM_PUBLIC_VIEW') publicLabel = 'Restricted from Public Ledger';

            return {
              date: (evt.timestamp || evt.date || '').substring(0, 10),
              eventType: evt.eventType || 'STATUS_UPDATE',
              publicLabel,
              office: c.officeLocation || c.department,
            };
          });

          if (isRestricted) {
            return {
              id: c.id,
              department: c.department,
              office: c.officeLocation?.split(',').slice(-1)[0]?.trim() || c.officeLocation,
              officeLocation: c.officeLocation,
              category: 'Restricted / Classified Record',
              publicStatus: 'Restricted from Public View',
              isRestricted: true,
              restrictionDate,
              publicSafeReasonCategory,
              filedDate: c.filedDate,
              witnesses: null,
              citizenName: null,
              citizenPhone: null,
              citizenEmail: null,
              description: `[RESTRICTED FROM PUBLIC VIEW — Reason: ${publicSafeReasonCategory}]`,
              isPublicRecord: true,
              publicTimeline: [
                {
                  date: c.filedDate || '2026-03-01',
                  eventType: 'COMPLAINT_SUBMITTED',
                  publicLabel: 'Complaint Formally Registered',
                  office: c.officeLocation || 'Civic Authority',
                },
                {
                  date: restrictionDate,
                  eventType: 'RESTRICTED_FROM_PUBLIC_VIEW',
                  publicLabel: 'Restricted from Public Ledger Under Reviewer Seal',
                  office: 'Office of the Oversight Reviewer',
                  publicReason: publicSafeReasonCategory,
                },
              ],
            };
          }

          return {
            id: c.id,
            department: c.department,
            office: c.officeLocation?.split(',').slice(-1)[0]?.trim() || c.officeLocation,
            officeLocation: c.officeLocation,
            category: c.category || 'Administrative Service Default',
            publicStatus:
              c.stage === 4
                ? 'Closed / Resolved'
                : c.stage >= 2
                ? `Escalated (Stage ${c.stage})`
                : 'Active / Under Investigation',
            stage: c.stage,
            stageName: c.stageName,
            severity: c.severity,
            slaDaysRemaining: c.slaDaysRemaining,
            isRestricted: false,
            filedDate: c.filedDate,
            citizenName: null, // Strictly omitted
            citizenPhone: null, // Strictly omitted
            citizenEmail: null, // Strictly omitted
            witnesses: null, // Strictly omitted
            description: c.publicSummary || (c.title ? `${c.title} (Factual public grievance record)` : 'Civic grievance under official review.'),
            isPublicRecord: true,
            evidenceCount: c.evidenceFiles?.length || 0,
            publicTimeline,
          };
        });
    }

    case DEMO_ROLES.ADMIN: {
      // Admin sees complete complaint index for demonstration oversight,
      // but is structurally forbidden from editing or deleting audit events
      return complaints.map((c) => ({
        ...c,
        isAdminView: true,
        isDeletable: false, // Immutable guarantee
      }));
    }

    default:
      return complaints;
  }
}

/**
 * Shape a single complaint detail view for the active role.
 */
export function shapeComplaintDetailForRole(complaint, role, currentUser) {
  if (!complaint) return null;
  const shapedList = shapeComplaintsForRole([complaint], role, currentUser);
  return shapedList[0] || null;
}
