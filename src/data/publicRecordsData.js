/**
 * CitizenConnect — Public Accountability Records & Open Ledger Data
 *
 * All data presented here is strictly FICTIONAL DEMO DATA.
 *
 * PRIVACY GUARANTEE:
 * Public projections NEVER include citizen names, phone numbers, email addresses,
 * witness identities, raw sensitive descriptions, private evidence files, or
 * unapproved internal communications.
 */

// ─── 1. PUBLIC-SAFE DATA PROJECTION ──────────────────────────────────────────
export function shapePublicSafeRecord(complaint) {
  if (!complaint) return null;

  const isRestricted =
    Boolean(complaint.isRestrictedFromPublic) ||
    Boolean(complaint.isRestricted) ||
    Boolean(complaint.auditHistory?.some((e) => e.eventType === 'RESTRICTED_FROM_PUBLIC_VIEW'));

  // Restriction event (if any)
  const restrictionEvent = complaint.auditHistory?.find(
    (e) => e.eventType === 'RESTRICTED_FROM_PUBLIC_VIEW'
  );

  // Fallback public safe reason category
  const publicSafeReasonCategory =
    complaint.restrictionReason ||
    restrictionEvent?.reason ||
    'Whistleblower Identity Protection & Anti-Retaliation Protocol';

  const restrictionDate =
    complaint.restrictedAt ||
    restrictionEvent?.timestamp?.substring(0, 10) ||
    complaint.filedDate ||
    '2026-03-20';

  if (isRestricted) {
    return {
      id: complaint.id,
      department: complaint.department,
      office: complaint.officeLocation || complaint.department,
      category: 'Classified / Restricted Record',
      publicStatus: 'Restricted from Public View',
      isRestricted: true,
      restrictionDate,
      publicSafeReasonCategory,
      publicTimeline: [
        {
          date: complaint.filedDate || '2026-03-01',
          eventType: 'COMPLAINT_SUBMITTED',
          publicLabel: 'Complaint Formally Registered',
          office: complaint.officeLocation || 'Civic Authority',
        },
        {
          date: restrictionDate,
          eventType: 'RESTRICTED_FROM_PUBLIC_VIEW',
          publicLabel: 'Public Visibility Restricted Under Reviewer Seal',
          office: 'Office of the Oversight Reviewer',
          publicReason: publicSafeReasonCategory,
        },
      ],
    };
  }

  // Generate public-safe timeline without any private remarks
  const publicTimeline = (complaint.auditHistory || []).map((evt) => {
    let publicLabel = 'Procedural Status Update';
    if (evt.eventType === 'COMPLAINT_SUBMITTED') publicLabel = 'Complaint Formally Registered';
    else if (evt.eventType === 'ACKNOWLEDGED') publicLabel = 'Official Acknowledgement Issued';
    else if (evt.eventType === 'INVESTIGATION_STARTED') publicLabel = 'Departmental Investigation In Progress';
    else if (evt.eventType === 'STATUS_UPDATE') publicLabel = 'Progress Milestone Logged';
    else if (evt.eventType === 'INFO_REQUESTED') publicLabel = 'Supplementary Documentation Requested';
    else if (evt.eventType === 'OFFICIAL_RESPONSE') publicLabel = 'Official Departmental Response Filed';
    else if (evt.eventType === 'TRANSFER') publicLabel = 'Transferred to Competent Zonal Authority';
    else if (evt.eventType === 'ESCALATION') publicLabel = 'Statutory Escalation Triggered';
    else if (evt.eventType === 'FINDING_RECORDED') publicLabel = 'Oversight Review Finding Formally Recorded';
    else if (evt.eventType === 'CLOSED') publicLabel = 'Matter Concluded & Closed';
    else if (evt.eventType === 'APPEAL') publicLabel = 'Statutory Appeal Lodged';
    else if (evt.eventType === 'REOPENED') publicLabel = 'Complaint Reopened on Appeal';
    else if (evt.eventType === 'RESTRICTED_FROM_PUBLIC_VIEW') publicLabel = 'Restricted from Public Ledger';

    return {
      date: (evt.timestamp || evt.date || '').substring(0, 10),
      eventType: evt.eventType || 'STATUS_UPDATE',
      publicLabel,
      office: complaint.officeLocation || complaint.department,
      stage: evt.metadata?.newStage || null,
    };
  });

  return {
    id: complaint.id,
    department: complaint.department,
    office: complaint.officeLocation || complaint.department,
    category: complaint.category || 'Administrative Service Default',
    publicStatus:
      complaint.stage === 4
        ? 'Closed / Resolved'
        : complaint.stage >= 2
        ? `Escalated (Stage ${complaint.stage})`
        : 'Active / Under Investigation',
    stageName: complaint.stageName,
    isRestricted: false,
    filedDate: complaint.filedDate || complaint.submittedAt?.substring(0, 10),
    slaDaysRemaining: complaint.slaDaysRemaining ?? 0,
    finding: complaint.findings || 'Pending Review Determination',
    publicTimeline,
  };
}

// ─── 2. ACCOUNTABILITY INDICATOR FORMULA ─────────────────────────────────────
/**
 * Accountability Indicator Formula:
 * - Requires at least 10 closed complaints in evaluation period.
 * - Score = (Responsiveness Rate * 0.35) + (SLA Compliance Rate * 0.40) + (Resolution Quality * 0.25)
 *
 * IMPORTANT:
 * - Allegations are NEVER counted as misconduct.
 * - Only verified, substantiated review findings impact the quality score.
 */
export const MIN_CLOSED_COMPLAINTS_THRESHOLD = 10;

export function calculateAccountabilityIndicator(office) {
  const closedCount = office.closedComplaintsCount || 0;
  const meetsThreshold = closedCount >= MIN_CLOSED_COMPLAINTS_THRESHOLD;

  if (!meetsThreshold) {
    return {
      meetsThreshold: false,
      closedCount,
      minRequired: MIN_CLOSED_COMPLAINTS_THRESHOLD,
      score: null,
      grade: 'Data Insufficient',
      statusNotice: `Data Insufficient — Minimum ${MIN_CLOSED_COMPLAINTS_THRESHOLD} closed complaints required to compute statistical indicator (currently ${closedCount} closed).`,
    };
  }

  const responsivenessRate = office.medianAckHours <= 48 ? 100 : Math.max(0, 100 - (office.medianAckHours - 48) * 1.5);
  const slaComplianceRate = office.slaCompliancePercentage || 85;

  // Resolution Quality: 100 - (substantiated findings / closed cases * 100)
  // Higher percentage means fewer substantiated corruption/maladministration breaches
  const substantiatedBreachRate = (office.findings.substantiated / closedCount) * 100;
  const resolutionQuality = Math.max(0, 100 - substantiatedBreachRate * 1.2);

  const rawScore = responsivenessRate * 0.35 + slaComplianceRate * 0.40 + resolutionQuality * 0.25;
  const score = Math.round(rawScore * 10) / 10;

  let grade = 'C';
  let badgeVariant = 'warning';
  if (score >= 90) {
    grade = 'A+';
    badgeVariant = 'success';
  } else if (score >= 82) {
    grade = 'A';
    badgeVariant = 'success';
  } else if (score >= 74) {
    grade = 'B';
    badgeVariant = 'primary';
  } else if (score >= 60) {
    grade = 'C';
    badgeVariant = 'warning';
  } else {
    grade = 'Needs Improvement';
    badgeVariant = 'danger';
  }

  return {
    meetsThreshold: true,
    closedCount,
    score,
    grade,
    badgeVariant,
    responsivenessRate: Math.round(responsivenessRate),
    slaComplianceRate: Math.round(slaComplianceRate),
    resolutionQuality: Math.round(resolutionQuality),
    substantiatedCount: office.findings.substantiated,
    unsubstantiatedCount: office.findings.notSubstantiated,
    noFindingCount: office.findings.noFindingPossible,
  };
}

// ─── 3. FICTIONAL DEPARTMENT & OFFICE PROFILES ──────────────────────────────
export const DEMO_OFFICE_PROFILES = [
  {
    id: 'off-mcd-karolbagh',
    name: 'Ward 14 Zonal Office, Karol Bagh',
    department: 'Municipal Corporation of Delhi (MCD)',
    jurisdiction: 'Karol Bagh Zone, Central Delhi',
    nodalOfficer: 'Shri R. K. Sharma (Deputy Commissioner)',
    totalComplaints: 22,
    closedComplaintsCount: 15, // >= 10 threshold met!
    countsByStatus: {
      active: 4,
      underInvestigation: 2,
      escalated: 1,
      closed: 15,
      restricted: 1,
    },
    medianAckHours: 28, // 1.1 days
    medianAckDisplay: '1.2 Days (28 Hrs)',
    medianResponseDays: 5.6,
    slaCompliancePercentage: 88,
    findings: {
      substantiated: 2, // 2 verified findings
      notSubstantiated: 10,
      noFindingPossible: 3,
    },
    contact: 'karolbagh.mcd-demo@delhi.gov.in',
  },
  {
    id: 'off-bwssb-indiranagar',
    name: 'Indiranagar Sub-Division Water Supply Office',
    department: 'Bangalore Water Supply & Sewerage Board (BWSSB)',
    jurisdiction: 'East Division, Bengaluru Urban',
    nodalOfficer: 'Smt. L. Nagaveni (Executive Engineer)',
    totalComplaints: 19,
    closedComplaintsCount: 13, // >= 10 threshold met!
    countsByStatus: {
      active: 3,
      underInvestigation: 2,
      escalated: 1,
      closed: 13,
      restricted: 0,
    },
    medianAckHours: 36,
    medianAckDisplay: '1.5 Days (36 Hrs)',
    medianResponseDays: 8.2,
    slaCompliancePercentage: 78,
    findings: {
      substantiated: 3,
      notSubstantiated: 8,
      noFindingPossible: 2,
    },
    contact: 'indiranagar.bwssb-demo@karnataka.gov.in',
  },
  {
    id: 'off-mumbai-police-bandra',
    name: 'Bandra Division ACP & Police Station',
    department: 'Mumbai Suburban Police',
    jurisdiction: 'Zone IX, Mumbai Police',
    nodalOfficer: 'Shri V. S. Patil (Assistant Commissioner of Police)',
    totalComplaints: 18,
    closedComplaintsCount: 12, // >= 10 threshold met!
    countsByStatus: {
      active: 3,
      underInvestigation: 2,
      escalated: 1,
      closed: 12,
      restricted: 1,
    },
    medianAckHours: 19, // fast acknowledgement
    medianAckDisplay: '0.8 Days (19 Hrs)',
    medianResponseDays: 4.8,
    slaCompliancePercentage: 92,
    findings: {
      substantiated: 1,
      notSubstantiated: 9,
      noFindingPossible: 2,
    },
    contact: 'bandra.mumbaipolice-demo@mahapolice.gov.in',
  },
  {
    id: 'off-lucknow-aliganj',
    name: 'Zone 3 Civic Centre, Aliganj',
    department: 'Lucknow Nagar Nigam',
    jurisdiction: 'Zone 3, Trans-Gomti, Lucknow',
    nodalOfficer: 'Shri P. K. Srivastava (Zonal Officer)',
    totalComplaints: 7,
    closedComplaintsCount: 4, // < 10 threshold: SUPPRESSED INDICATOR!
    countsByStatus: {
      active: 2,
      underInvestigation: 1,
      escalated: 0,
      closed: 4,
      restricted: 0,
    },
    medianAckHours: 42,
    medianAckDisplay: '1.8 Days (42 Hrs)',
    medianResponseDays: 9.4,
    slaCompliancePercentage: 72,
    findings: {
      substantiated: 1,
      notSubstantiated: 2,
      noFindingPossible: 1,
    },
    contact: 'aliganj.lnn-demo@up.gov.in',
  },
  {
    id: 'off-chennai-health',
    name: 'Kilpauk Health & Sanitation Circle Office',
    department: 'Greater Chennai Corporation (GCC)',
    jurisdiction: 'Zone 8, Central Chennai',
    nodalOfficer: 'Dr. S. Radhakrishnan (Zonal Health Officer)',
    totalComplaints: 16,
    closedComplaintsCount: 11, // >= 10 threshold met!
    countsByStatus: {
      active: 3,
      underInvestigation: 1,
      escalated: 1,
      closed: 11,
      restricted: 0,
    },
    medianAckHours: 24,
    medianAckDisplay: '1.0 Day (24 Hrs)',
    medianResponseDays: 6.1,
    slaCompliancePercentage: 86,
    findings: {
      substantiated: 1,
      notSubstantiated: 8,
      noFindingPossible: 2,
    },
    contact: 'kilpauk.gcc-demo@chennaicorporation.gov.in',
  },
];
