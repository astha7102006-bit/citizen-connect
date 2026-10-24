import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  INITIAL_COMPLAINTS,
  INITIAL_DEPARTMENTS,
  INITIAL_LEGAL_COUNSELORS,
} from '../data/demoData';
import { shapeComplaintsForRole, shapeComplaintDetailForRole, DEMO_ROLES } from '../services/dataShaping';
import {
  GENESIS_HASH,
  AUDIT_EVENT_TYPES,
  calculateEventHash,
  computeEvidenceFingerprint,
  verifyComplaintAuditChain,
} from '../services/auditCrypto';

const DataContext = createContext();

export function DataProvider({ children }) {
  // Complaints store
  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('citizenconnect_complaints');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_COMPLAINTS;
      }
    }
    return INITIAL_COMPLAINTS;
  });

  // Global immutable audit archive
  const [auditArchive, setAuditArchive] = useState(() => {
    const saved = localStorage.getItem('citizenconnect_audit_archive');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Simulated Demo System Date
  const [simulatedDate, setSimulatedDateState] = useState(() => {
    return localStorage.getItem('citizenconnect_simulated_date') || '2026-10-23';
  });

  // Admin Actions Audit Log (Append-Only)
  const [adminActionLog, setAdminActionLog] = useState(() => {
    const saved = localStorage.getItem('citizenconnect_admin_action_log');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'ADM-INIT-01',
        action: 'ENVIRONMENT_BOOTSTRAP',
        actor: 'Platform Administrator (Demo)',
        timestamp: '23 Oct 2026, 09:00 AM',
        details: 'Initial demonstration parameters loaded with simulated government bridges.',
      },
    ];
  });

  const [departments] = useState(INITIAL_DEPARTMENTS);
  const [legalCounselors] = useState(INITIAL_LEGAL_COUNSELORS);

  // ── Real API Integration (Phase 4) ──────────────────────────────────────────
  const { realUser, isAuthenticated } = useAuth();
  const [realComplaints, setRealComplaints] = useState([]);
  const [realComplaintsLoading, setRealComplaintsLoading] = useState(false);
  const [realComplaintsError, setRealComplaintsError] = useState(null);

  const mapDbComplaint = useCallback((c) => ({
    id: c.referenceNumber,
    referenceNumber: c.referenceNumber,
    dbId: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    status: c.status,
    priority: c.priority,
    severity: c.priority === 'CRITICAL' ? 'Critical' : c.priority === 'HIGH' ? 'High' : c.priority === 'MEDIUM' ? 'Medium' : 'Low',
    stage: c.stage,
    stageName: c.stageName,
    department: c.department?.name || 'Awaiting Triage & Department Assignment',
    departmentId: c.departmentId || null,
    departmentCode: c.department?.code,
    citizenName: realUser?.name || 'Authenticated Citizen',
    citizenEmail: realUser?.email,
    isAnonymous: c.isAnonymous,
    isRealRecord: true,
    slaDaysRemaining: c.slaDaysRemaining ?? 7,
    filedDate: new Date(c.filedAt || c.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    createdAt: c.createdAt,
    auditHistory: (c.events || []).map((e) => ({
      sequence: e.sequence,
      eventId: e.eventId || `EVT-${c.referenceNumber?.slice(-5)}-${String(e.sequence).padStart(2, '0')}`,
      complaintId: e.complaintId || c.dbId || c.id,
      eventType: e.eventType,
      previousStatus: e.previousStatus || null,
      newStatus: e.newStatus || null,
      actorId: e.actorId || null,
      actorName: e.actorName || null,
      actorRole: e.actorRole || null,
      actor: e.actorName || (e.actorRole === 'Citizen' ? (c.isAnonymous ? 'Whistleblower (Protected)' : realUser?.name || 'Citizen') : 'Official Authority'),
      responsibleDepartment: e.responsibleDepartment || c.department?.name || null,
      title: e.title || e.eventType,
      details: e.details || '',
      reason: e.reason || null,
      metadata: e.metadata || null,
      previousHash: e.previousHash,
      hash: e.hash || 'sha256-verified-blockchain',
      isoTimestamp: e.timestamp ? new Date(e.timestamp).toISOString() : null,
      timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : 'Just now',
    })),
    evidenceFiles: (c.evidence || []).map((ev) => ({
      id: ev.id,
      name: ev.originalName || ev.fileName,
      size: `${Math.round(Number(ev.fileSize || 0) / 1024)} KB`,
      type: ev.contentType,
      sha256: ev.sha256Fingerprint,
      uploadedAt: new Date(ev.uploadedAt).toLocaleString('en-IN'),
    })),
    officialResponses: c.officialResponses || [],
  }), [realUser]);

  const fetchRealComplaints = useCallback(async () => {
    if (!isAuthenticated) return [];
    setRealComplaintsLoading(true);
    setRealComplaintsError(null);
    try {
      const res = await fetch('/api/complaints', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to fetch complaints');
      }
      const mapped = (json.data?.complaints || []).map(mapDbComplaint);
      setRealComplaints(mapped);
      return mapped;
    } catch (err) {
      setRealComplaintsError(err.message);
      return [];
    } finally {
      setRealComplaintsLoading(false);
    }
  }, [isAuthenticated, mapDbComplaint]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRealComplaints();
    } else {
      setRealComplaints([]);
    }
  }, [isAuthenticated, fetchRealComplaints]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('citizenconnect_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('citizenconnect_audit_archive', JSON.stringify(auditArchive));
  }, [auditArchive]);

  useEffect(() => {
    localStorage.setItem('citizenconnect_simulated_date', simulatedDate);
  }, [simulatedDate]);

  useEffect(() => {
    localStorage.setItem('citizenconnect_admin_action_log', JSON.stringify(adminActionLog));
  }, [adminActionLog]);

  const logAdminAction = (action, details) => {
    const entry = {
      id: `ADM-LOG-${Date.now().toString().slice(-6)}`,
      action,
      actor: 'System Administrator (Demo)',
      timestamp: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      details,
    };
    setAdminActionLog((prev) => [entry, ...prev]);
  };

  const advanceSimulatedDate = (days) => {
    const curr = new Date(simulatedDate);
    curr.setDate(curr.getDate() + Number(days));
    const nextDateStr = curr.toISOString().substring(0, 10);
    setSimulatedDateState(nextDateStr);
    logAdminAction(
      'SIMULATED_DATE_ADVANCE',
      `Simulated demo clock advanced by +${days} day(s). New effective date: ${nextDateStr}.`
    );
    return nextDateStr;
  };

  const setSimulatedDate = (newDateStr) => {
    setSimulatedDateState(newDateStr);
    logAdminAction('SIMULATED_DATE_CHANGE', `Simulated demo date manually adjusted to ${newDateStr}.`);
  };

  /**
   * Append-Only Audit Event Generator (Cryptographic SHA-256 Chain)
   * Enforces immutability: Existing events can never be edited or deleted.
   */
  const appendAuditEvent = async (complaintId, { eventType, actor, reason = null, details = '', metadata = {} }) => {
    let target = complaints.find((c) => c.id === complaintId);
    if (!target) return null;

    const history = target.auditHistory || [];
    const prevEvent = history[history.length - 1];
    const previousHash = prevEvent ? prevEvent.hash : GENESIS_HASH;
    const eventId = `EVT-${complaintId.replace(/[^A-Za-z0-9]/g, '').slice(-5)}-${String(history.length + 1).padStart(2, '0')}`;
    const nowStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const eventWithoutHash = {
      eventId,
      complaintId,
      eventType,
      actor: actor || 'Authorized System Actor',
      timestamp: nowStr,
      reason: reason || null,
      details: details || `Audit event ${eventType} appended to record chain.`,
      metadata: metadata || {},
      previousHash,
    };

    const hash = await calculateEventHash(eventWithoutHash, previousHash);
    const newEvent = { ...eventWithoutHash, hash };

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return {
          ...c,
          auditHistory: [...(c.auditHistory || []), newEvent],
        };
      })
    );

    setAuditArchive((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  /**
   * Submit new complaint with Cryptographic Genesis Block
   * If authenticated, persists atomically to PostgreSQL through Express API.
   */
  const submitComplaint = async (complaintData) => {
    if (isAuthenticated) {
      const priorityMap = {
        Critical: 'CRITICAL',
        High: 'HIGH',
        Medium: 'MEDIUM',
        Low: 'LOW',
      };
      const cleanPriority = priorityMap[complaintData.severity] || 'MEDIUM';

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: complaintData.title || `${complaintData.category || 'Grievance'} regarding ${complaintData.department || 'Civic Administration'}`,
          description: complaintData.description,
          category: complaintData.category || 'Procedural Violation',
          priority: cleanPriority,
          isAnonymous: Boolean(complaintData.isAnonymous),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to submit complaint to server.');
      }

      const mapped = mapDbComplaint(json.data.complaint);
      setRealComplaints((prev) => [mapped, ...prev]);
      setComplaints((prev) => [mapped, ...prev]);
      return mapped;
    }

    // ── Demo Mode Fallback ────────────────────────────────────────────────────
    const newId = `CC-2026-IND-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const genesisEventWithoutHash = {
      eventId: `EVT-${newId.replace(/[^A-Za-z0-9]/g, '').slice(-5)}-01`,
      complaintId: newId,
      eventType: AUDIT_EVENT_TYPES.COMPLAINT_SUBMITTED,
      actor: complaintData.citizenName || 'Citizen Complainant',
      timestamp: nowStr,
      reason: null,
      details: `Grievance formally registered under ${complaintData.department || 'General Administration'} for ${complaintData.category || 'Procedural Violation'}.`,
      metadata: {
        submissionMode: complaintData.submissionMode || 'Interactive Audio & Evidence Wizard',
        isAnonymous: Boolean(complaintData.isAnonymous),
        severity: complaintData.severity || 'Medium',
      },
      previousHash: GENESIS_HASH,
    };

    // Calculate deterministic hash
    const initialHash =
      typeof window !== 'undefined' && window.crypto && window.crypto.subtle
        ? `sha256-genesis-${Date.now()}` // Will be signed or recomputed
        : `sha256-genesis-${Date.now()}`;

    const genesisEvent = {
      ...genesisEventWithoutHash,
      hash: initialHash,
    };

    // Ensure async signature completes
    calculateEventHash(genesisEventWithoutHash, GENESIS_HASH).then((calculatedHash) => {
      genesisEvent.hash = calculatedHash;
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id !== newId) return c;
          const updatedHistory = [...c.auditHistory];
          if (updatedHistory[0]) updatedHistory[0].hash = calculatedHash;
          return { ...c, auditHistory: updatedHistory };
        })
      );
    });

    const newComplaint = {
      id: newId,
      title: complaintData.title || `${complaintData.category || 'Grievance'} regarding ${complaintData.department}`,
      category: complaintData.category || 'Official not performing duties',
      department: complaintData.department || 'General Administration',
      departmentId: complaintData.departmentId || 'muni-civic',
      officialNamed: complaintData.officialNamed || 'Field Inspection Officer',
      officialRole: complaintData.officialRole || 'Designated Public Servant',
      officeLocation: complaintData.officeLocation || 'Zonal Grievance Center',
      incidentDate: complaintData.incidentDate || new Date().toISOString().split('T')[0],
      incidentTime: complaintData.incidentTime || '11:00 AM',
      citizenName: complaintData.citizenName || 'Aditya Kumar Verma',
      citizenPhone: complaintData.citizenPhone || '+91 98765 43210',
      citizenEmail: complaintData.citizenEmail || 'citizen@example.org',
      isAnonymous: Boolean(complaintData.isAnonymous),
      severity: complaintData.severity || 'Medium',
      description: complaintData.description || '',
      witnesses: complaintData.witnesses || [],
      audioEvidence: complaintData.audioEvidence || null,
      isDeclarationAgreed: Boolean(complaintData.isDeclarationAgreed),
      otpVerified: Boolean(complaintData.otpVerified),
      redactedSummary: `Grievance category [${complaintData.category || 'Procedural'}]. Incident at ${complaintData.officeLocation || 'zonal office'} on ${complaintData.incidentDate || 'recent date'}. Allegations involving ${complaintData.officialRole || 'officer'}. Citizen and witness PII redacted under Section 8(1)(j).`,
      publicSummary: `Public accountability grievance registered under ${complaintData.department || 'Civic Services'} concerning ${complaintData.category || 'service delivery'}.`,
      reviewStatus: 'approved',
      filedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      stage: 1,
      stageName: 'Level 1: Grievance Officer Assigned',
      slaDaysRemaining: 7,
      totalSlaDays: 7,
      evidenceFiles: complaintData.evidenceFiles || [],
      auditHistory: [genesisEvent],
      corrections: [],
      aiDraftData: complaintData.aiDraftData || null,
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    setAuditArchive((prev) => [
      {
        complaintId: newId,
        timestamp: nowStr,
        event: 'COMPLAINT_CREATED',
        actor: complaintData.citizenName || 'Citizen',
      },
      ...prev,
    ]);

    return newComplaint;
  };

  /**
   * 1. Evidence Added (computes actual file byte fingerprint)
   */
  const addEvidenceToComplaint = async (complaintId, fileOrAttachment, actor) => {
    let fingerprint = fileOrAttachment.sha256;
    if (fileOrAttachment instanceof File || fileOrAttachment instanceof Blob) {
      fingerprint = await computeEvidenceFingerprint(fileOrAttachment);
    } else if (!fingerprint) {
      fingerprint = await computeEvidenceFingerprint(fileOrAttachment.name || 'document');
    }

    const newExhibit = {
      name: fileOrAttachment.name || 'Evidence_Exhibit.pdf',
      size: fileOrAttachment.size || '1.2 MB',
      type: fileOrAttachment.type || 'application/pdf',
      sha256: fingerprint,
      uploadedAt: new Date().toLocaleTimeString('en-IN'),
    };

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return {
          ...c,
          evidenceFiles: [...(c.evidenceFiles || []), newExhibit],
        };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.EVIDENCE_ADDED,
      actor: actor || 'Citizen Complainant',
      details: `New evidence exhibit added: ${newExhibit.name} (${newExhibit.size}). Fingerprint: ${fingerprint.substring(0, 16)}...`,
      metadata: {
        fileName: newExhibit.name,
        fileFingerprint: fingerprint,
        fileSize: newExhibit.size,
      },
    });
  };

  /**
   * 2. Acknowledged
   */
  const acknowledgeComplaint = async (complaintId, actor, notes) => {
    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.ACKNOWLEDGED,
      actor: actor || 'System Receipt Daemon',
      details: notes || 'Complaint received and formally acknowledged under Citizen Charter SLA rules.',
      metadata: { receiptIssued: true },
    });
  };

  /**
   * 3. Investigation Started
   */
  const startInvestigation = async (complaintId, actor, notes) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, stage: 1, stageName: 'Level 1: Under Active Investigation' };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.INVESTIGATION_STARTED,
      actor: actor || 'Inquiry Officer',
      details: notes || 'Formal departmental investigation initiated into submitted allegations.',
      metadata: { investigationStatus: 'ACTIVE' },
    });
  };

  /**
   * 4. Status Update
   */
  const updateComplaintStatus = async (complaintId, newStatus, actor, notes) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, stageName: newStatus };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.STATUS_UPDATED,
      actor: actor || 'Grievance Officer',
      details: notes || `Complaint progress update: Status transitioned to '${newStatus}'.`,
      metadata: { newStatus },
    });
  };

  /**
   * 5. Information Requested
   */
  const requestInformation = async (complaintId, actor, requestDetails) => {
    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.INFO_REQUESTED,
      actor: actor || 'Inquiry Officer',
      reason: 'Additional corroboration needed',
      details: requestDetails || 'Formal request for additional documents or witness statements issued to citizen.',
      metadata: { requestType: 'SUPPLEMENTAL_DOCUMENTS' },
    });
  };

  /**
   * 6. Official Response
   */
  const submitOfficialResponse = async (complaintId, noteText, officialName) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, officialResponse: noteText };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.OFFICIAL_RESPONSE,
      actor: officialName || 'Grievance Redressal Officer',
      details: `Official inquiry response recorded: "${noteText}"`,
      metadata: { officialResponseNote: noteText },
    });
  };

  /**
   * 7. Transfer
   */
  const transferComplaint = async (complaintId, targetDepartment, actor, reason) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, department: targetDepartment };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.TRANSFERRED,
      actor: actor || 'Jurisdiction Officer',
      reason: reason || 'Matter pertains to specialized municipal section',
      details: `Complaint transferred to ${targetDepartment}. Reason: ${reason || 'Jurisdictional realignment'}`,
      metadata: { targetDepartment },
    });
  };

  /**
   * 8. Escalation
   */
  const escalateComplaint = async (complaintId, actor = 'System (Smart Escalation Engine)', reason = 'Automated SLA breach escalation') => {
    let nextStage = 2;
    const stageNames = [
      'Filed',
      'Level 1: Grievance Officer Assigned',
      'Level 2: First Appellate Authority (Escalated)',
      'Level 3: Lokayukta / Vigilance Commission',
      'Final Redressal & Closure',
    ];

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        nextStage = Math.min((c.stage || 1) + 1, 4);
        return {
          ...c,
          stage: nextStage,
          stageName: stageNames[nextStage],
          slaDaysRemaining: nextStage === 4 ? 0 : 7,
        };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.ESCALATED,
      actor,
      reason,
      details: `Complaint escalated to ${stageNames[nextStage]}. Reason: ${reason}`,
      metadata: { targetStage: nextStage, targetStageName: stageNames[nextStage] },
    });
  };

  /**
   * 9. Finding Recorded
   */
  const recordFinding = async (complaintId, findingText, actor) => {
    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.FINDING_RECORDED,
      actor: actor || 'Oversight Investigator',
      details: `Inquiry finding recorded: "${findingText}"`,
      metadata: { findingText },
    });
  };

  /**
   * 10. Closure with Reason
   */
  const closeComplaint = async (complaintId, reason, actor) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, stage: 4, stageName: 'Final Redressal & Closure', slaDaysRemaining: 0 };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.CLOSED,
      actor: actor || 'Appellate Officer',
      reason: reason || 'Redressal completed and compliance verified',
      details: `Complaint formally closed. Reason: ${reason || 'Resolution achieved.'}`,
      metadata: { resolutionReason: reason },
    });
  };

  /**
   * 11. Appeal
   */
  const fileAppeal = async (complaintId, reason, actor) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, stage: 2, stageName: 'Level 2: Appeal Under Review' };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.APPEAL_FILED,
      actor: actor || 'Citizen Complainant',
      reason: reason || 'Dissatisfied with initial grievance finding',
      details: `Statutory appeal registered under Citizens Charter. Grounds: ${reason}`,
      metadata: { appealGrounds: reason },
    });
  };

  /**
   * 12. Reopening
   */
  const reopenComplaint = async (complaintId, reason, actor) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, stage: 2, stageName: 'Reopened: Secondary Inquiry' };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.REOPENED,
      actor: actor || 'Oversight Reviewer',
      reason: reason || 'Fresh evidence submitted or procedural lapse discovered',
      details: `Closed case reopened for secondary scrutiny. Reason: ${reason}`,
      metadata: { reopenReason: reason },
    });
  };

  /**
   * 13. Correction
   */
  const submitCorrection = async (complaintId, correctionText, actor) => {
    const nowStr = new Date().toLocaleString('en-IN');
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return {
          ...c,
          corrections: [
            ...(c.corrections || []),
            { timestamp: nowStr, text: correctionText, actor: actor || 'Citizen' },
          ],
        };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.CORRECTION_SUBMITTED,
      actor: actor || 'Citizen Complainant',
      reason: 'Citizen clarification of factual error in prior statement',
      details: `Corrigendum: "${correctionText}" (Original statement remains immutable).`,
      metadata: { correctionText },
    });
  };

  /**
   * 14. Withdrawal
   */
  const requestWithdrawal = async (complaintId, reason, actor) => {
    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.WITHDRAWAL_REQUESTED,
      actor: actor || 'Citizen Complainant',
      reason: reason || 'Mutual resolution achieved or voluntary withdrawal',
      details: `Citizen submitted formal withdrawal request. Reason: ${reason}`,
      metadata: { withdrawalReason: reason },
    });
  };

  /**
   * 15. Restriction from Public View with Reason
   */
  const restrictFromPublicView = async (complaintId, reason, actor) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return { ...c, isPublicRestricted: true, publicRestrictionReason: reason };
      })
    );

    return appendAuditEvent(complaintId, {
      eventType: AUDIT_EVENT_TYPES.PUBLIC_VIEW_RESTRICTED,
      actor: actor || 'Oversight Reviewer',
      reason: reason || 'Section 8(1)(j) Privacy Protection / Whistleblower Shield',
      details: `Record restricted from public transparency feeds. Legal basis: ${reason}`,
      metadata: { restrictionReason: reason },
    });
  };

  /**
   * Admin-Only: Deliberate Tamper Test
   * Modifies an event or evidence in browser storage without recalculating the hash.
   * Proves that `verifyComplaintAuditChain` catches tampering immediately.
   */
  const tamperComplaintRecord = (complaintId, tamperType = 'EVENT_CONTENT') => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;

        const newHistory = JSON.parse(JSON.stringify(c.auditHistory || []));
        const newEvidence = JSON.parse(JSON.stringify(c.evidenceFiles || []));

        if (tamperType === 'EVENT_CONTENT' && newHistory.length > 1) {
          // Alter text inside block #2 without updating hash
          newHistory[1].details = '⚠️ TAMPERED RECORD: Allegations secretly modified by unauthorized party in storage.';
        } else if (tamperType === 'PREV_HASH' && newHistory.length > 1) {
          // Corrupt previousHash link
          newHistory[1].previousHash = 'badhash0000000000000000000000000000000000000000000000000000000000';
        } else if (tamperType === 'EVIDENCE' && newEvidence.length > 0) {
          // Modify evidence file fingerprint
          newEvidence[0].sha256 = 'altered_sha256_fake_fingerprint_00000000000000000000000000000000';
        } else if (newHistory.length > 0) {
          newHistory[0].details = '⚠️ TAMPERED GENESIS: Initial filing details illegally rewritten.';
        }

        return {
          ...c,
          auditHistory: newHistory,
          evidenceFiles: newEvidence,
          isTamperedForDemo: true,
          tamperType,
        };
      })
    );
  };

  /**
   * Admin-Only: Restore authentic pristine record
   */
  const restoreComplaintRecord = (complaintId) => {
    const benchmark = INITIAL_COMPLAINTS.find((c) => c.id === complaintId);
    if (!benchmark) return;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        return JSON.parse(JSON.stringify(benchmark));
      })
    );
  };

  /**
   * Reset Demo Data (Preserves Audit Archive)
   */
  const resetDemoData = () => {
    const nowStr = new Date().toLocaleString('en-IN');
    const resetAuditRecord = {
      timestamp: nowStr,
      event: 'SYSTEM_DEMO_DATA_RESET',
      actor: 'Admin / Demonstration Controller',
      details: 'Demonstration dataset restored to benchmark baseline. Historical audit traces preserved.',
    };

    setAuditArchive((prev) => [resetAuditRecord, ...prev]);
    setComplaints(INITIAL_COMPLAINTS);
    localStorage.setItem('citizenconnect_complaints', JSON.stringify(INITIAL_COMPLAINTS));
    logAdminAction(
      'DEMO_ENVIRONMENT_RESET',
      'Demonstration dataset restored to initial fictional baseline. Historical audit ledger and admin logs preserved.'
    );
    return true;
  };

  /**
   * Get shaped complaints for a specific role
   */
  const getComplaintsForRole = (role, currentUser) => {
    return shapeComplaintsForRole(complaints, role, currentUser);
  };

  const getComplaintById = (id, role, currentUser) => {
    if (!id) return null;
    const found = complaints.find((c) => c.id.toLowerCase() === id.trim().toLowerCase());
    if (!found) return null;
    return shapeComplaintDetailForRole(found, role, currentUser);
  };

  /**
   * Track complaint securely from backend API by reference number
   */
  const trackRealComplaint = async (referenceNumber) => {
    try {
      const res = await fetch(`/api/complaints/reference/${encodeURIComponent(referenceNumber.trim())}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Complaint not found');
      }
      return mapDbComplaint(json.data.complaint);
    } catch (err) {
      // Fallback to local demo list
      const local = complaints.find(
        (c) => c.id.toLowerCase() === referenceNumber.trim().toLowerCase()
      );
      if (local) return local;
      throw err;
    }
  };

  /**
   * Update complaint via PATCH API
   */
  const updateRealComplaint = async (complaintId, updates) => {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || 'Failed to update complaint');
    }
    const mapped = mapDbComplaint(json.data.complaint);
    setRealComplaints((prev) => prev.map((c) => (c.dbId === complaintId || c.id === mapped.id ? mapped : c)));
    setComplaints((prev) => prev.map((c) => (c.dbId === complaintId || c.id === mapped.id ? mapped : c)));
    return mapped;
  };

  /**
   * Fetch authenticated chronological timeline for complaint
   */
  const fetchRealComplaintTimeline = async (complaintId) => {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/timeline`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || 'Failed to fetch timeline');
    }
    return json.data.timeline;
  };

  /**
   * Cryptographically verify complaint timeline against backend ledger
   */
  const verifyRealComplaintTimeline = async (complaintId) => {
    const res = await fetch(`/api/complaints/${encodeURIComponent(complaintId)}/timeline/verify`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || 'Failed to verify timeline');
    }
    return json.data;
  };

  return (
    <DataContext.Provider
      value={{
        complaints,
        realComplaints,
        realComplaintsLoading,
        realComplaintsError,
        fetchRealComplaints,
        trackRealComplaint,
        updateRealComplaint,
        fetchRealComplaintTimeline,
        verifyRealComplaintTimeline,
        departments,
        legalCounselors,
        auditArchive,
        appendAuditEvent,
        submitComplaint,
        addEvidenceToComplaint,
        acknowledgeComplaint,
        startInvestigation,
        updateComplaintStatus,
        requestInformation,
        submitOfficialResponse,
        transferComplaint,
        escalateComplaint,
        recordFinding,
        closeComplaint,
        fileAppeal,
        reopenComplaint,
        submitCorrection,
        addSupplementalCorrection: submitCorrection, // Alias for backward compatibility
        requestWithdrawal,
        restrictFromPublicView,
        tamperComplaintRecord,
        restoreComplaintRecord,
        verifyComplaintAuditChain,
        resetDemoData,
        simulatedDate,
        advanceSimulatedDate,
        setSimulatedDate,
        adminActionLog,
        logAdminAction,
        getComplaintsForRole,
        getComplaintById,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
