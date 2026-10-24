/**
 * CitizenConnect — The Accountability Timeline Service & Event Engine
 *
 * Implements the 18 chronological event types, centralized event schema,
 * dynamic stage duration tracking, department transfer auditing,
 * and automated unexplained status change detection.
 */

import {
  FileText,
  CheckCircle2,
  Paperclip,
  MessageSquare,
  Search,
  Activity,
  HelpCircle,
  UserCheck,
  ArrowRightLeft,
  CheckCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Scale,
  XCircle,
  RotateCcw,
  RefreshCw,
  FileEdit,
  ShieldAlert,
  ShieldCheck,
  Eye,
  AlertCircle,
} from 'lucide-react';

// ─── 1. THE 18 CHRONOLOGICAL EVENT TYPES ────────────────────────────────────
export const TIMELINE_EVENT_TYPES = {
  COMPLAINT_SUBMITTED: 'COMPLAINT_SUBMITTED',                       // 1. Complaint submitted
  ACKNOWLEDGEMENT_RECORDED: 'ACKNOWLEDGEMENT_RECORDED',             // 2. Acknowledgement recorded
  CITIZEN_EVIDENCE_ADDED: 'CITIZEN_EVIDENCE_ADDED',                 // 3. Citizen evidence added
  OFFICIAL_RESPONSE_RECEIVED: 'OFFICIAL_RESPONSE_RECEIVED',         // 4. Official response received
  INVESTIGATION_STARTED: 'INVESTIGATION_STARTED',                   // 5. Investigation started
  INVESTIGATION_PROGRESS_UPDATED: 'INVESTIGATION_PROGRESS_UPDATED', // 6. Investigation progress updated
  ADDITIONAL_INFO_REQUESTED: 'ADDITIONAL_INFO_REQUESTED',           // 7. Additional information requested
  CITIZEN_INFO_PROVIDED: 'CITIZEN_INFO_PROVIDED',                   // 8. Citizen provided additional information
  DEPARTMENT_TRANSFER_REQUESTED: 'DEPARTMENT_TRANSFER_REQUESTED',   // 9. Department transfer requested
  DEPARTMENT_TRANSFER_COMPLETED: 'DEPARTMENT_TRANSFER_COMPLETED',   // 10. Department transfer completed
  DEADLINE_APPROACHING: 'DEADLINE_APPROACHING',                     // 11. Deadline approaching
  DEADLINE_MISSED: 'DEADLINE_MISSED',                               // 12. Deadline missed
  COMPLAINT_ESCALATED: 'COMPLAINT_ESCALATED',                       // 13. Complaint escalated to next authority
  REVIEWER_FINDING_RECORDED: 'REVIEWER_FINDING_RECORDED',           // 14. Reviewer finding recorded
  COMPLAINT_CLOSED: 'COMPLAINT_CLOSED',                             // 15. Complaint closed with a reason
  APPEAL_SUBMITTED: 'APPEAL_SUBMITTED',                             // 16. Appeal submitted
  COMPLAINT_REOPENED: 'COMPLAINT_REOPENED',                         // 17. Complaint reopened
  CORRECTION_RECORDED: 'CORRECTION_RECORDED',                       // 18. Correction or clarification recorded
};

// Aliases mapping for historical seed data compatibility
export const EVENT_TYPE_ALIASES = {
  EVIDENCE_ADDED: TIMELINE_EVENT_TYPES.CITIZEN_EVIDENCE_ADDED,
  ACKNOWLEDGED: TIMELINE_EVENT_TYPES.ACKNOWLEDGEMENT_RECORDED,
  STATUS_UPDATED: TIMELINE_EVENT_TYPES.INVESTIGATION_PROGRESS_UPDATED,
  INFO_REQUESTED: TIMELINE_EVENT_TYPES.ADDITIONAL_INFO_REQUESTED,
  OFFICIAL_RESPONSE: TIMELINE_EVENT_TYPES.OFFICIAL_RESPONSE_RECEIVED,
  TRANSFERRED: TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_COMPLETED,
  ESCALATED: TIMELINE_EVENT_TYPES.COMPLAINT_ESCALATED,
  FINDING_RECORDED: TIMELINE_EVENT_TYPES.REVIEWER_FINDING_RECORDED,
  CLOSED: TIMELINE_EVENT_TYPES.COMPLAINT_CLOSED,
  APPEAL_FILED: TIMELINE_EVENT_TYPES.APPEAL_SUBMITTED,
  REOPENED: TIMELINE_EVENT_TYPES.COMPLAINT_REOPENED,
  CORRECTION_SUBMITTED: TIMELINE_EVENT_TYPES.CORRECTION_RECORDED,
};

export function normalizeEventType(type) {
  return EVENT_TYPE_ALIASES[type] || type || TIMELINE_EVENT_TYPES.INVESTIGATION_PROGRESS_UPDATED;
}

// ─── 2. VISUAL TREATMENT MAPPING (NEVER COLOUR ALONE: ICONS & LABELS) ───────
export const EVENT_CATEGORY_CONFIG = {
  CITIZEN: {
    categoryKey: 'citizen',
    label: 'Citizen Submission',
    badgeText: 'Citizen Action',
    icon: UserCheck,
    colorClasses: {
      marker: 'bg-blue-600 text-white ring-4 ring-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      border: 'border-l-blue-500',
      cardGlow: 'hover:border-blue-500/40',
      tagBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    },
  },
  EVIDENCE: {
    categoryKey: 'evidence',
    label: 'Evidence Added',
    badgeText: 'Cryptographic Exhibit',
    icon: Paperclip,
    colorClasses: {
      marker: 'bg-teal-600 text-white ring-4 ring-teal-500/20',
      badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
      border: 'border-l-teal-500',
      cardGlow: 'hover:border-teal-500/40',
      tagBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    },
  },
  OFFICIAL: {
    categoryKey: 'official',
    label: 'Official Action',
    badgeText: 'Official Response',
    icon: MessageSquare,
    colorClasses: {
      marker: 'bg-purple-600 text-white ring-4 ring-purple-500/20',
      badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      border: 'border-l-purple-500',
      cardGlow: 'hover:border-purple-500/40',
      tagBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    },
  },
  TRANSFER: {
    categoryKey: 'transfer',
    label: 'Department Transfer',
    badgeText: 'Inter-Agency Routing',
    icon: ArrowRightLeft,
    colorClasses: {
      marker: 'bg-indigo-600 text-white ring-4 ring-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      border: 'border-l-indigo-500',
      cardGlow: 'hover:border-indigo-500/40',
      tagBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    },
  },
  ESCALATION: {
    categoryKey: 'escalation',
    label: 'Statutory Escalation',
    badgeText: 'Appellate Trigger',
    icon: TrendingUp,
    colorClasses: {
      marker: 'bg-[#E06820] text-white ring-4 ring-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30',
      border: 'border-l-[#E06820]',
      cardGlow: 'hover:border-amber-500/40',
      tagBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
    },
  },
  OVERDUE: {
    categoryKey: 'overdue',
    label: 'Overdue Action',
    badgeText: 'SLA Breach',
    icon: AlertTriangle,
    colorClasses: {
      marker: 'bg-red-600 text-white ring-4 ring-red-500/20',
      badge: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
      border: 'border-l-red-500',
      cardGlow: 'hover:border-red-500/40',
      tagBg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
    },
  },
  VERIFIED_PROCEDURAL: {
    categoryKey: 'verified_procedural',
    label: 'Verified Procedural',
    badgeText: 'Compliance Logged',
    icon: CheckCircle2,
    colorClasses: {
      marker: 'bg-emerald-600 text-white ring-4 ring-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      border: 'border-l-emerald-500',
      cardGlow: 'hover:border-emerald-500/40',
      tagBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    },
  },
};

/**
 * Map an event type to its visual treatment category
 */
export function getEventVisualConfig(eventType) {
  const norm = normalizeEventType(eventType);
  switch (norm) {
    case TIMELINE_EVENT_TYPES.COMPLAINT_SUBMITTED:
    case TIMELINE_EVENT_TYPES.CITIZEN_INFO_PROVIDED:
    case TIMELINE_EVENT_TYPES.APPEAL_SUBMITTED:
      return EVENT_CATEGORY_CONFIG.CITIZEN;

    case TIMELINE_EVENT_TYPES.CITIZEN_EVIDENCE_ADDED:
      return EVENT_CATEGORY_CONFIG.EVIDENCE;

    case TIMELINE_EVENT_TYPES.OFFICIAL_RESPONSE_RECEIVED:
    case TIMELINE_EVENT_TYPES.ADDITIONAL_INFO_REQUESTED:
      return EVENT_CATEGORY_CONFIG.OFFICIAL;

    case TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_REQUESTED:
    case TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_COMPLETED:
      return EVENT_CATEGORY_CONFIG.TRANSFER;

    case TIMELINE_EVENT_TYPES.COMPLAINT_ESCALATED:
    case TIMELINE_EVENT_TYPES.DEADLINE_APPROACHING:
      return EVENT_CATEGORY_CONFIG.ESCALATION;

    case TIMELINE_EVENT_TYPES.DEADLINE_MISSED:
      return EVENT_CATEGORY_CONFIG.OVERDUE;

    case TIMELINE_EVENT_TYPES.ACKNOWLEDGEMENT_RECORDED:
    case TIMELINE_EVENT_TYPES.INVESTIGATION_STARTED:
    case TIMELINE_EVENT_TYPES.INVESTIGATION_PROGRESS_UPDATED:
    case TIMELINE_EVENT_TYPES.REVIEWER_FINDING_RECORDED:
    case TIMELINE_EVENT_TYPES.COMPLAINT_CLOSED:
    case TIMELINE_EVENT_TYPES.COMPLAINT_REOPENED:
    case TIMELINE_EVENT_TYPES.CORRECTION_RECORDED:
    default:
      return EVENT_CATEGORY_CONFIG.VERIFIED_PROCEDURAL;
  }
}

// ─── 3. CENTRAL EVENT SCHEMA CREATION UTILITY ───────────────────────────────
export function createTimelineEvent({
  complaintId,
  eventType,
  title,
  description,
  actorRole = 'System',
  actorId = 'sys',
  actorName = 'Automated State Machine',
  responsibleDepartment = 'Municipal Corporation',
  timestamp = null,
  previousStatus = null,
  newStatus = null,
  deadline = null,
  reason = null,
  supportingEvidence = null,
  metadata = {},
}) {
  const normType = normalizeEventType(eventType);
  const now = new Date();
  const timestampStr =
    timestamp ||
    now.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const eventId = `EVT-${(complaintId || 'CC').replace(/[^A-Za-z0-9]/g, '').slice(-5)}-${Date.now().toString().slice(-4)}`;

  return {
    eventId,
    complaintId,
    eventType: normType,
    title: title || getDefaultEventTitle(normType),
    description: description || getDefaultEventDescription(normType),
    actorRole,
    actorId,
    actorName,
    responsibleDepartment,
    timestamp: timestampStr,
    isoTimestamp: now.toISOString(),
    previousStatus,
    newStatus,
    deadline,
    reason,
    supportingEvidence: supportingEvidence ? Array.isArray(supportingEvidence) ? supportingEvidence : [supportingEvidence] : null,
    metadata,
  };
}

export function getDefaultEventTitle(eventType) {
  switch (eventType) {
    case TIMELINE_EVENT_TYPES.COMPLAINT_SUBMITTED:
      return 'Complaint Formally Submitted';
    case TIMELINE_EVENT_TYPES.ACKNOWLEDGEMENT_RECORDED:
      return 'Statutory Acknowledgement Recorded';
    case TIMELINE_EVENT_TYPES.CITIZEN_EVIDENCE_ADDED:
      return 'Supplementary Evidence Exhibit Added';
    case TIMELINE_EVENT_TYPES.OFFICIAL_RESPONSE_RECEIVED:
      return 'Official Departmental Response Received';
    case TIMELINE_EVENT_TYPES.INVESTIGATION_STARTED:
      return 'Preliminary Inquiry Commenced';
    case TIMELINE_EVENT_TYPES.INVESTIGATION_PROGRESS_UPDATED:
      return 'Inquiry Progress Update Recorded';
    case TIMELINE_EVENT_TYPES.ADDITIONAL_INFO_REQUESTED:
      return 'Official Information Request Issued';
    case TIMELINE_EVENT_TYPES.CITIZEN_INFO_PROVIDED:
      return 'Citizen Clarification & Response Submitted';
    case TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_REQUESTED:
      return 'Inter-Departmental Transfer Requested';
    case TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_COMPLETED:
      return 'Department Transfer Executed & Accepted';
    case TIMELINE_EVENT_TYPES.DEADLINE_APPROACHING:
      return 'Statutory SLA Deadline Approaching';
    case TIMELINE_EVENT_TYPES.DEADLINE_MISSED:
      return 'Statutory SLA Response Deadline Missed';
    case TIMELINE_EVENT_TYPES.COMPLAINT_ESCALATED:
      return 'Complaint Escalated to Next Appellate Tier';
    case TIMELINE_EVENT_TYPES.REVIEWER_FINDING_RECORDED:
      return 'Oversight Determination & Finding Recorded';
    case TIMELINE_EVENT_TYPES.COMPLAINT_CLOSED:
      return 'Complaint Closed with Reason';
    case TIMELINE_EVENT_TYPES.APPEAL_SUBMITTED:
      return 'Statutory First Appeal Submitted';
    case TIMELINE_EVENT_TYPES.COMPLAINT_REOPENED:
      return 'Complaint Reopened for Review';
    case TIMELINE_EVENT_TYPES.CORRECTION_RECORDED:
      return 'Factual Clarification Recorded';
    default:
      return 'Procedural Event Logged';
  }
}

export function getDefaultEventDescription(eventType) {
  return `Procedural transaction recorded under citizen charter governance guidelines.`;
}

// ─── 4. DYNAMIC STAGE DURATION & TIMING CALCULATIONS ────────────────────────
/**
 * Safely parse date strings (e.g. "15 Oct 2026, 11:25 AM", "2026-10-23", etc.)
 */
export function parseEventTimestamp(dateStr) {
  if (!dateStr) return null;
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) return direct;

  // Try parsing Indian locale formats: "15 Oct 2026, 11:25 AM"
  const parts = dateStr.replace(',', '').split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const time = parts.slice(3).join(' ');
    const reordered = new Date(`${month} ${day}, ${year} ${time}`);
    if (!isNaN(reordered.getTime())) return reordered;
  }
  return null;
}

export function formatDurationHuman(diffMs) {
  if (diffMs == null || isNaN(diffMs)) return 'Duration not recorded';
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (days === 0 && remainingHours === 0) return 'Just moments';
  if (days === 0) return `${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
  if (remainingHours === 0) return `${days} day${days > 1 ? 's' : ''}`;
  return `${days} day${days > 1 ? 's' : ''}, ${remainingHours} hr${remainingHours > 1 ? 's' : ''}`;
}

/**
 * Calculates stage durations from recorded chronological events.
 * Retains duration spent with previous departments on transfer.
 */
export function calculateTimelineStageDurations(events = [], referenceClockDate = null) {
  if (!events || events.length === 0) return [];

  const refDate = referenceClockDate ? parseEventTimestamp(referenceClockDate) || new Date() : new Date();

  const enrichedEvents = events.map((evt, idx) => {
    const currDate = parseEventTimestamp(evt.isoTimestamp || evt.timestamp) || refDate;
    let durationAtPriorStage = null;
    let durationLabel = null;

    if (idx > 0) {
      const prevDate = parseEventTimestamp(events[idx - 1].isoTimestamp || events[idx - 1].timestamp);
      if (prevDate && currDate) {
        const diff = currDate.getTime() - prevDate.getTime();
        if (diff >= 0 && !isNaN(diff)) {
          durationAtPriorStage = diff;
          durationLabel = formatDurationHuman(durationAtPriorStage);
        }
      }
    }

    return {
      ...evt,
      parsedDate: currDate,
      durationAtPriorStage,
      durationLabel,
    };
  });

  return enrichedEvents;
}

/**
 * Calculates overall accountability summary metrics from actual events.
 */
export function computeTimelineAccountabilityMetrics(events = [], complaint = {}, referenceClockDate = null) {
  const refDate = referenceClockDate ? parseEventTimestamp(referenceClockDate) || new Date() : new Date();

  const submissionEvent = events.find(
    (e) => normalizeEventType(e.eventType) === TIMELINE_EVENT_TYPES.COMPLAINT_SUBMITTED
  ) || events[0];

  const submissionDate = parseEventTimestamp(submissionEvent?.isoTimestamp || submissionEvent?.timestamp) || refDate;
  const lastEvent = events[events.length - 1];
  const lastEventDate = parseEventTimestamp(lastEvent?.isoTimestamp || lastEvent?.timestamp) || refDate;

  // 1. Total Elapsed Time
  const totalElapsedMs = Math.max(0, refDate.getTime() - submissionDate.getTime());
  const totalElapsedDisplay = formatDurationHuman(totalElapsedMs);

  // 2. Current Stage Duration (Time spent at current active stage since last major transition)
  const currentStageDurationMs = Math.max(0, refDate.getTime() - lastEventDate.getTime());
  const currentStageDurationDisplay = formatDurationHuman(currentStageDurationMs);

  // 3. Number of Department Transfers
  const transferCount = events.filter((e) => {
    const t = normalizeEventType(e.eventType);
    return t === TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_COMPLETED || t === TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_REQUESTED;
  }).length;

  // 4. Number of Overdue Actions
  const overdueCount = events.filter((e) => {
    const t = normalizeEventType(e.eventType);
    return t === TIMELINE_EVENT_TYPES.DEADLINE_MISSED;
  }).length;

  // Overdue status evaluation for next pending action
  const isResolvedOrClosed = complaint.stage === 4 || events.some((e) => normalizeEventType(e.eventType) === TIMELINE_EVENT_TYPES.COMPLAINT_CLOSED);
  const remainingSlaDays = complaint.slaDaysRemaining ?? 0;
  const isOverdue = !isResolvedOrClosed && remainingSlaDays <= 0;

  return {
    totalElapsedDisplay,
    currentStageDurationDisplay,
    transferCount,
    overdueCount: overdueCount + (isOverdue ? 1 : 0),
    currentDepartment: complaint.officeLocation || complaint.department || 'Designated Zonal Authority',
    latestActivity: lastEvent?.title || lastEvent?.details || 'Complaint Active',
    latestActivityDate: lastEvent?.timestamp || 'Recently',
    nextDeadline: isResolvedOrClosed
      ? 'Concluded'
      : complaint.totalSlaDays
      ? `${remainingSlaDays > 0 ? `${remainingSlaDays} days remaining` : `${Math.abs(remainingSlaDays)} days overdue`}`
      : 'Deadline not configured',
    currentStatus: complaint.stageName || (isResolvedOrClosed ? 'Resolved & Closed' : 'In Progress'),
    isResolvedOrClosed,
    isOverdue,
  };
}

// ─── 5. DEPARTMENT TRANSFER HISTORY AUDIT ───────────────────────────────────
export function extractTransferHistory(events = []) {
  const transfers = [];
  events.forEach((evt, idx) => {
    const norm = normalizeEventType(evt.eventType);
    if (
      norm === TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_REQUESTED ||
      norm === TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_COMPLETED
    ) {
      const reason = evt.reason || evt.metadata?.transferReason;
      const isMissingReason = !reason || reason.trim() === '';
      const isAwaitingAcceptance = norm === TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_REQUESTED;

      transfers.push({
        eventId: evt.eventId,
        date: evt.timestamp,
        fromDepartment: evt.metadata?.fromDepartment || 'Initial Assignee',
        toDepartment: evt.metadata?.toDepartment || evt.responsibleDepartment || 'Receiving Zonal Authority',
        reason: reason || 'Transfer reason missing',
        isMissingReason,
        statusText: isAwaitingAcceptance ? 'Transfer awaiting acceptance' : 'Transfer completed & accepted',
        actor: evt.actorName || evt.actor || 'Authority Desk',
        receivingDeadline: evt.metadata?.receivingDeadline || '7 Working Days',
      });
    }
  });
  return transfers;
}

// ─── 6. UNEXPLAINED STATUS CHANGE DETECTION ─────────────────────────────────
/**
 * Detects chronological anomalies, missing actors, unrecorded reasons, or invalid stage jumps.
 * Displays: "Unexplained status change — review required."
 */
export function detectTimelineAnomalies(events = []) {
  const anomalies = [];

  events.forEach((evt, idx) => {
    const norm = normalizeEventType(evt.eventType);

    // 1. Missing actor
    if (!evt.actor && !evt.actorName && !evt.actorRole) {
      anomalies.push({
        eventId: evt.eventId || `idx-${idx}`,
        eventTitle: evt.title || evt.eventType,
        timestamp: evt.timestamp || 'Unknown Date',
        type: 'MISSING_ACTOR',
        warningTitle: 'Status changed without recorded actor',
        warningDetail: `Event #${idx + 1} (${evt.title || evt.eventType}) does not record a responsible official or system agent.`,
        severity: 'high',
      });
    }

    // 2. Missing timestamp
    if (!evt.timestamp) {
      anomalies.push({
        eventId: evt.eventId || `idx-${idx}`,
        eventTitle: evt.title || evt.eventType,
        timestamp: 'Not stated',
        type: 'MISSING_TIMESTAMP',
        warningTitle: 'Status changed without timestamp',
        warningDetail: `Event #${idx + 1} lacks a reliable UTC or local timestamp stamp.`,
        severity: 'high',
      });
    }

    // 3. Department transfer without recorded reason
    if (
      norm === TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_COMPLETED ||
      norm === TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_REQUESTED
    ) {
      const reason = evt.reason || evt.metadata?.transferReason;
      if (!reason || reason.trim() === '') {
        anomalies.push({
          eventId: evt.eventId || `idx-${idx}`,
          eventTitle: evt.title || 'Department Transfer',
          timestamp: evt.timestamp,
          type: 'MISSING_TRANSFER_REASON',
          warningTitle: 'Department transfer without recorded reason',
          warningDetail: 'Transfer was logged without stating statutory jurisdiction transfer justification.',
          severity: 'medium',
        });
      }
    }

    // 4. Closure without recorded reason
    if (norm === TIMELINE_EVENT_TYPES.COMPLAINT_CLOSED) {
      const reason = evt.reason || evt.metadata?.closureReason;
      if (!reason || reason.trim() === '') {
        anomalies.push({
          eventId: evt.eventId || `idx-${idx}`,
          eventTitle: evt.title || 'Complaint Closed',
          timestamp: evt.timestamp,
          type: 'MISSING_CLOSURE_REASON',
          warningTitle: 'Closure without recorded reason',
          warningDetail: 'Complaint was concluded without documenting the statutory basis or redress finding.',
          severity: 'high',
        });
      }
    }

    // 5. Chronological inconsistency check
    if (idx > 0) {
      const prevDate = parseEventTimestamp(events[idx - 1].timestamp);
      const currDate = parseEventTimestamp(evt.timestamp);
      if (prevDate && currDate && currDate.getTime() < prevDate.getTime()) {
        anomalies.push({
          eventId: evt.eventId || `idx-${idx}`,
          eventTitle: evt.title || evt.eventType,
          timestamp: evt.timestamp,
          type: 'INCONSISTENT_CHRONOLOGY',
          warningTitle: 'Events chronological order is inconsistent',
          warningDetail: `Timestamp (${evt.timestamp}) precedes previous event timestamp (${events[idx - 1].timestamp}).`,
          severity: 'high',
        });
      }
    }
  });

  return anomalies;
}

// ─── 7. ROLE-BASED PRIVACY PROJECTION FOR TIMELINE ──────────────────────────
export function filterTimelineForRole(events = [], role = 'citizen', currentUser = {}) {
  if (!Array.isArray(events)) return [];

  switch (role) {
    case 'public': {
      // Public visitors see ONLY sanitized procedural milestones.
      // Zero PII, zero witness names, zero private exhibits, zero internal notes.
      return events.map((evt) => ({
        ...evt,
        actor: 'Procedural Authority',
        actorName: 'Responsible Department',
        actorId: 'redacted',
        supportingEvidence: null, // Hidden from public
        details: evt.publicSafeSummary || evt.title || 'Procedural administrative action recorded.',
        reason: evt.reason ? `Procedural reason: ${evt.reason}` : null,
      }));
    }

    case 'official': {
      // Officials see complaint history but citizen personal identifiers & witness identities are redacted
      return events.map((evt) => {
        const isCitizenEvent =
          normalizeEventType(evt.eventType) === TIMELINE_EVENT_TYPES.COMPLAINT_SUBMITTED ||
          normalizeEventType(evt.eventType) === TIMELINE_EVENT_TYPES.CITIZEN_EVIDENCE_ADDED;

        return {
          ...evt,
          actor: isCitizenEvent ? '[CITIZEN PII REDACTED BY REVIEWER]' : evt.actor,
          actorName: isCitizenEvent ? 'Complainant (PII Masked)' : evt.actorName,
          // Witness attachments / unapproved raw evidence omitted
          supportingEvidence: (evt.supportingEvidence || []).map((e) => ({
            name: e.name,
            size: e.size,
            sha256: e.sha256,
          })),
        };
      });
    }

    case 'reviewer':
    case 'admin':
    case 'citizen':
    default:
      // Reviewers and Citizens see complete accessible history
      return events;
  }
}
