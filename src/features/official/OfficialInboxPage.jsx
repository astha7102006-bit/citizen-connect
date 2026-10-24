import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DEMO_ROLES } from '../../services/dataShaping';
import RecordVerificationModal from '../../components/audit/RecordVerificationModal';
import AccountabilityTimeline from '../../components/timeline/AccountabilityTimeline';
import {
  Inbox,
  ShieldAlert,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
  Building,
  UserX,
  Lock,
  Send,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Share2,
  FileQuestion,
  AlertOctagon,
  Loader2,
} from 'lucide-react';

// ── Real API helpers ───────────────────────────────────────────────────────────
const STAFF_API = '/api/staff';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${STAFF_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.error?.message ?? `Request failed ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** Maps a DB complaint (from /api/staff/complaints) to the shape OfficialInboxPage uses */
function mapRealComplaint(c) {
  return {
    id: c.id,
    referenceNumber: c.referenceNumber,
    title: c.title,
    description: c.description || '',
    redactedSummary: c.title,
    category: c.category,
    status: c.status,
    priority: c.priority,
    severity: c.priority === 'CRITICAL' ? 'Critical' : c.priority === 'HIGH' ? 'High' : 'Medium',
    stage: c.stage,
    stageName: c.stageName,
    department: c.department?.name || 'Unassigned',
    departmentId: c.departmentId || (c.department?.id ?? null),
    officeLocation: c.department?.name || 'Central Office',
    officialNamed: 'Grievance Officer',
    slaDaysRemaining: c.slaDaysRemaining ?? 7,
    filedDate: new Date(c.filedAt || c.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    }),
    citizenName: c.citizen?.name || 'Protected',
    citizenPhone: c.citizen?.email || 'Redacted',
    isAnonymous: c.isAnonymous,
    isRealRecord: true,
    auditHistory: [],
    dbId: c.id,
  };
}

export default function OfficialInboxPage() {
  const { isDark } = useTheme();
  const { user, realUser, isAuthenticated } = useAuth();
  const {
    getComplaintsForRole,
    acknowledgeComplaint: demoAcknowledge,
    startInvestigation: demoStartInvestigation,
    updateComplaintStatus: demoUpdateStatus,
    requestInformation: demoRequestInfo,
    submitOfficialResponse: demoSubmitResponse,
    transferComplaint: demoTransferComplaint,
    departments,
  } = useData();

  // ── Determine real-staff mode ─────────────────────────────────────────────
  const STAFF_ROLES = ['OFFICIAL', 'REVIEWER', 'ADMIN'];
  const isRealStaff = isAuthenticated && realUser && STAFF_ROLES.includes(realUser.role);

  // ── Real API state ────────────────────────────────────────────────────────
  const [realComplaints, setRealComplaints] = useState([]);
  const [realLoading, setRealLoading] = useState(false);
  const [realError, setRealError] = useState(null);
  const [realDepartments, setRealDepartments] = useState([]);

  // Fetch real departments list for accurate transfers
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.departments && json.data.departments.length > 0) {
          setRealDepartments(json.data.departments);
          const defaultDept = json.data.departments[1] || json.data.departments[0];
          if (defaultDept) {
            setTransferDepartment(defaultDept.name);
            setTransferDepartmentId(defaultDept.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchRealComplaints = useCallback(async () => {
    setRealLoading(true);
    setRealError(null);
    try {
      const json = await apiFetch('/complaints?limit=50');
      const mapped = (json.data?.complaints || []).map(mapRealComplaint);
      setRealComplaints(mapped);
    } catch (err) {
      setRealError(err.message || 'Failed to load complaints.');
    } finally {
      setRealLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRealStaff) {
      fetchRealComplaints();
    }
  }, [isRealStaff, fetchRealComplaints]);

  // ── Demo-mode fallback ────────────────────────────────────────────────────
  const demoComplaints = getComplaintsForRole(DEMO_ROLES.OFFICIAL, user);

  // Active complaints source
  const complaints = isRealStaff ? realComplaints : demoComplaints;

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Auto-select first complaint when list loads
  useEffect(() => {
    if (complaints.length > 0 && !selectedComplaint) {
      setSelectedComplaint(complaints[0]);
    }
  }, [complaints, selectedComplaint]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Official action form states
  const [activeActionTab, setActiveActionTab] = useState('response'); // 'response', 'investigate', 'update', 'request_info', 'transfer', 'challenge'
  const [responseText, setResponseText] = useState('');
  const [investigationDate, setInvestigationDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [infoRequestDetails, setInfoRequestDetails] = useState('');
  const [transferDepartment, setTransferDepartment] = useState(
    departments[1]?.name || 'Public Works Department (PWD)'
  );
  const [transferDepartmentId, setTransferDepartmentId] = useState(departments[1]?.id || '');
  const [transferReason, setTransferReason] = useState('');
  const [challengeStatement, setChallengeStatement] = useState('');

  const officialName = realUser?.name || user?.personaName || 'Grievance Redressal Officer';
  const [actionError, setActionError] = useState('');

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setActionError('');
    setTimeout(() => setActionSuccess(''), 4500);
  };
  const showError = (msg) => {
    setActionError(msg);
    setActionSuccess('');
    setTimeout(() => setActionError(''), 5000);
  };

  // ── Action helpers: real API first, demo fallback ───────────────────────────

  // 1. Acknowledge Complaint
  const handleAcknowledge = async () => {
    if (!selectedComplaint) return;
    if (isRealStaff) {
      try {
        await apiFetch(`/complaints/${selectedComplaint.dbId}/acknowledge`, {
          method: 'POST',
          body: JSON.stringify({ notes: 'Complaint officially acknowledged by departmental grievance officer.' }),
        });
        showSuccess('Complaint officially acknowledged! Event appended to audit ledger.');
        fetchRealComplaints();
      } catch (err) {
        showError(err.message || 'Failed to acknowledge complaint.');
      }
      return;
    }
    await demoAcknowledge(
      selectedComplaint.id, officialName,
      'Complaint officially acknowledged by departmental grievance officer. Assigned for initial preliminary inquiry.'
    );
    showSuccess('Complaint officially acknowledged! Event appended to cryptographic ledger.');
  };

  // 2. Mark Investigation in Progress
  const handleStartInvestigation = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (isRealStaff) {
      try {
        await apiFetch(`/complaints/${selectedComplaint.dbId}/investigation`, {
          method: 'POST',
          body: JSON.stringify({
            notes: `Investigation initiated. Expected completion: ${investigationDate}. ${investigationNotes || 'Site visit and roster audit initiated.'}`,
            targetDate: investigationDate,
          }),
        });
        showSuccess('Investigation initiated with target date! Event appended to audit chain.');
        setInvestigationNotes('');
        fetchRealComplaints();
      } catch (err) {
        showError(err.message || 'Failed to start investigation.');
      }
      return;
    }
    await demoStartInvestigation(
      selectedComplaint.id, officialName,
      `Investigation marked in progress. Expected completion date: ${investigationDate}. Notes: ${investigationNotes || 'Site visit and roster audit initiated.'}`
    );
    showSuccess('Investigation initiated with target date! Event appended to audit chain.');
    setInvestigationNotes('');
  };

  // 3. Post Progress Update
  const handlePostStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusUpdateNote.trim() || !selectedComplaint) return;
    if (isRealStaff) {
      try {
        await apiFetch(`/complaints/${selectedComplaint.dbId}/investigation`, {
          method: 'POST',
          body: JSON.stringify({ notes: statusUpdateNote.trim() }),
        });
        showSuccess('Progress update permanently recorded into audit history.');
        setStatusUpdateNote('');
        fetchRealComplaints();
      } catch (err) {
        showError(err.message || 'Failed to post progress update.');
      }
      return;
    }
    await demoUpdateStatus(
      selectedComplaint.id, 'Level 1: Inquiry Progress Recorded',
      officialName, statusUpdateNote.trim()
    );
    showSuccess('Progress update permanently recorded into audit history.');
    setStatusUpdateNote('');
  };

  // 4. Request Additional Information
  const handleRequestInformation = async (e) => {
    e.preventDefault();
    if (!infoRequestDetails.trim() || !selectedComplaint) return;
    if (isRealStaff) {
      try {
        await apiFetch(`/complaints/${selectedComplaint.dbId}/request-info`, {
          method: 'POST',
          body: JSON.stringify({ infoRequest: infoRequestDetails.trim() }),
        });
        showSuccess('Notice for additional information dispatched to complainant!');
        setInfoRequestDetails('');
        fetchRealComplaints();
      } catch (err) {
        showError(err.message || 'Failed to request information.');
      }
      return;
    }
    await demoRequestInfo(selectedComplaint.id, officialName, infoRequestDetails.trim());
    showSuccess('Notice for additional information dispatched to complainant!');
    setInfoRequestDetails('');
  };

  // 5. Submit Official Response
  const handlePostResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim() || !selectedComplaint) return;
    if (isRealStaff) {
      try {
        await apiFetch(`/complaints/${selectedComplaint.dbId}/response`, {
          method: 'POST',
          body: JSON.stringify({ responseText: responseText.trim(), responseType: 'INTERIM' }),
        });
        showSuccess('Official departmental compliance response signed and recorded into audit trail.');
        setResponseText('');
        fetchRealComplaints();
      } catch (err) {
        showError(err.message || 'Failed to publish response.');
      }
      return;
    }
    await demoSubmitResponse(selectedComplaint.id, responseText.trim(), officialName);
    showSuccess('Official departmental compliance response signed and recorded into audit trail.');
    setResponseText('');
  };

  // 6. Request Transfer with Reason
  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    if (!transferReason.trim() || !selectedComplaint) return;
    if (isRealStaff) {
      try {
        let deptId = transferDepartmentId;
        if (!deptId && realDepartments.length > 0) {
          const matched = realDepartments.find((d) => d.name === transferDepartment);
          deptId = matched ? matched.id : realDepartments[0].id;
        }
        await apiFetch(`/complaints/${selectedComplaint.dbId}/transfer`, {
          method: 'POST',
          body: JSON.stringify({ departmentId: deptId, reason: transferReason.trim() }),
        });
        showSuccess(`Transfer dispatched. Event logged.`);
        setTransferReason('');
        fetchRealComplaints();
      } catch (err) {
        showError(err.message || 'Failed to transfer complaint.');
      }
      return;
    }
    await demoTransferComplaint(
      selectedComplaint.id, transferDepartment, officialName, transferReason.trim()
    );
    showSuccess(`Transfer request dispatched to ${transferDepartment}. Event logged.`);
    setTransferReason('');
  };

  // 7. Challenge Inaccurate Record Through Separate Response
  const handleChallengeRecord = async (e) => {
    e.preventDefault();
    if (!challengeStatement.trim() || !selectedComplaint) return;
    const contestText = `[OFFICIAL CONTESTATION & RECORD CHALLENGE]: ${challengeStatement.trim()} (Submitted under official oath; prior statements remain immutable).`;
    if (isRealStaff) {
      try {
        await apiFetch(`/complaints/${selectedComplaint.dbId}/response`, {
          method: 'POST',
          body: JSON.stringify({ responseText: contestText, responseType: 'CLARIFICATION' }),
        });
        showSuccess('Official contestation recorded as a new audit event. Original record remains immutable.');
        setChallengeStatement('');
        fetchRealComplaints();
      } catch (err) {
        showError(err.message || 'Failed to submit contestation.');
      }
      return;
    }
    await demoSubmitResponse(selectedComplaint.id, contestText, officialName);
    showSuccess('Official contestation recorded as a new audit event. Original record remains immutable.');
    setChallengeStatement('');
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title="Office Official Inbox — Redacted Grievance Triage"
        subtitle="Departmental redressal console. In compliance with Whistleblower and Citizen Privacy provisions, personal citizen PII and witnesses are cryptographically redacted."
        badge={<Badge variant="amber" dot>Official Role View</Badge>}
        breadcrumbs={[{ label: 'Official Console' }, { label: 'Grievance Inbox' }]}
        isDark={isDark}
      />

      {/* Redaction Security Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm mb-6 flex items-start space-x-3">
        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Statutory PII & Witness Redaction Active:</strong> You are viewing complaints through the Office Official data filter. Citizen names, phone numbers, email addresses, and confidential witness identities are strictly redacted by the Oversight Reviewer under Section 8(1)(j) to prevent retaliation and ensure impartial inquiry. You see only the reviewer-approved redacted summary.
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Real-staff live data indicator */}
      {isRealStaff && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Live Database Mode:</strong> You are logged in as <strong>{realUser?.name}</strong> ({realUser?.role}) — actions write to the real database.
            {realLoading && <span className="ml-2 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading...</span>}
            {realError && <span className="ml-2 text-red-500">⚠ {realError}</span>}
          </span>
          <button onClick={fetchRealComplaints} className="ml-auto text-[11px] underline" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Redacted Queue */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Department Assigned Cases ({complaints.length}){isRealStaff ? ' — Live' : ' — Demo'}
            </h3>
            <span className="text-[11px] text-amber-500 font-semibold">Strict SLA Clock</span>
          </div>

          {isRealStaff && realLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading complaints from database…
            </div>
          )}

          {isRealStaff && !realLoading && complaints.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No complaints in the database yet.
            </div>
          )}

          {complaints.map((c) => {
            const isSelected = selectedComplaint?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/30'
                      : 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#E06820]">{c.id}</span>
                  <Badge variant={c.severity === 'Critical' ? 'danger' : 'amber'} size="sm">
                    {c.severity}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm line-clamp-1">{c.title}</h4>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>{c.officeLocation}</span>
                  <span className="font-bold text-amber-500">{c.slaDaysRemaining}d SLA</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800">
                  <span className="text-slate-500">Stage: {c.stage}/4</span>
                  <span className="text-[11px] text-slate-400">{c.stageName}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Case File & Official Action Console */}
        <div className="lg:col-span-2 space-y-6">
          {selectedComplaint ? (
            <GlassCard isDark={isDark} className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#E06820]">
                      {selectedComplaint.id}
                    </span>
                    <Badge variant="amber" size="sm">Reviewer-Approved Redacted File</Badge>
                  </div>
                  <h2 className="text-xl font-bold mt-1">{selectedComplaint.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Department: <strong>{selectedComplaint.department}</strong> • Official Named: <strong>{selectedComplaint.officialNamed}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowVerifyModal(true)}
                    className="text-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Verify Ledger
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleAcknowledge}
                    className="text-xs"
                  >
                    ✓ Acknowledge Case
                  </Button>
                </div>
              </div>

              {/* Reviewer-Approved Redacted Summary Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Approved Redacted Summary (PII Shielded):
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20">
                    Section 8(1)(j) Certified
                  </span>
                </div>
                <p className="text-foreground/90 leading-relaxed italic">
                  "{selectedComplaint.redactedSummary || selectedComplaint.description}"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-foreground/60">
                  <div>Complainant: <strong className="text-foreground">{selectedComplaint.citizenName}</strong></div>
                  <div>Phone/Email: <strong className="text-foreground">{selectedComplaint.citizenPhone}</strong></div>
                  <div>Witnesses: <strong className="text-foreground">Redacted Under Reviewer Seal</strong></div>
                </div>
              </div>

              {/* Official Action Tabs */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Official Statutory Actions & Responses
                  </h4>
                  <span className="text-[11px] text-slate-500">All actions are append-only</span>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-foreground/[0.03] border border-border/50 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('response')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeActionTab === 'response'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                  >
                    Official Response
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('investigate')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeActionTab === 'investigate'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                  >
                    Mark Investigation In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('update')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeActionTab === 'update'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                  >
                    Post Progress Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('request_info')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeActionTab === 'request_info'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                  >
                    Request Information
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('transfer')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeActionTab === 'transfer'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/70 hover:bg-foreground/5'
                    }`}
                  >
                    Request Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionTab('challenge')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      activeActionTab === 'challenge'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-red-600 hover:bg-red-500/10'
                    }`}
                  >
                    Challenge Record
                  </button>
                </div>

                {/* Tab 1: Submit Response */}
                {activeActionTab === 'response' && (
                  <form onSubmit={handlePostResponse} className="space-y-3 p-4 rounded-2xl bg-card border border-border/70 animate-in fade-in">
                    <label className="text-xs font-semibold text-foreground block">
                      Official Departmental Compliance Statement
                    </label>
                    <textarea
                      rows={4}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Enter formal departmental inquiry findings, remediation measures executed, or compliance report..."
                      className={`w-full p-3 rounded-xl text-xs border resize-none focus:outline-none focus:ring-2 focus:ring-primary ${
                        isDark ? 'glass-input-dark' : 'glass-input-light'
                      }`}
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Signed as: <strong>{officialName}</strong></span>
                      <Button type="submit" variant="primary" size="sm" disabled={!responseText.trim()}>
                        Sign & Append Response →
                      </Button>
                    </div>
                  </form>
                )}

                {/* Tab 2: Mark Investigation In Progress */}
                {activeActionTab === 'investigate' && (
                  <form onSubmit={handleStartInvestigation} className="space-y-3 p-4 rounded-2xl bg-card border border-border/70 animate-in fade-in">
                    <label className="text-xs font-semibold text-foreground block">
                      Target Investigation Completion Date
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={investigationDate}
                        onChange={(e) => setInvestigationDate(e.target.value)}
                        className={`p-2.5 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                      />
                      <input
                        type="text"
                        value={investigationNotes}
                        onChange={(e) => setInvestigationNotes(e.target.value)}
                        placeholder="Inquiry scope (e.g. Field inspection of site)"
                        className={`p-2.5 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button type="submit" variant="primary" size="sm">
                        Mark Investigation In Progress ✓
                      </Button>
                    </div>
                  </form>
                )}

                {/* Tab 3: Post Progress Update */}
                {activeActionTab === 'update' && (
                  <form onSubmit={handlePostStatusUpdate} className="space-y-3 p-4 rounded-2xl bg-card border border-border/70 animate-in fade-in">
                    <label className="text-xs font-semibold text-foreground block">
                      Progress Milestone or Procedural Stage Note
                    </label>
                    <textarea
                      rows={3}
                      value={statusUpdateNote}
                      onChange={(e) => setStatusUpdateNote(e.target.value)}
                      placeholder="e.g., Core samples extracted from road site; laboratory binder assay initiated under IRC:37 protocol."
                      className={`w-full p-3 rounded-xl text-xs border resize-none focus:outline-none focus:ring-2 focus:ring-primary ${
                        isDark ? 'glass-input-dark' : 'glass-input-light'
                      }`}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="primary" size="sm" disabled={!statusUpdateNote.trim()}>
                        Post Progress Update
                      </Button>
                    </div>
                  </form>
                )}

                {/* Tab 4: Request Additional Information */}
                {activeActionTab === 'request_info' && (
                  <form onSubmit={handleRequestInformation} className="space-y-3 p-4 rounded-2xl bg-card border border-border/70 animate-in fade-in">
                    <label className="text-xs font-semibold text-foreground block">
                      Statutory Document / Information Request Notice to Complainant
                    </label>
                    <textarea
                      rows={3}
                      value={infoRequestDetails}
                      onChange={(e) => setInfoRequestDetails(e.target.value)}
                      placeholder="Specify what additional slips, timestamps, receipts, or photos are required from the citizen to advance inquiry..."
                      className={`w-full p-3 rounded-xl text-xs border resize-none focus:outline-none focus:ring-2 focus:ring-primary ${
                        isDark ? 'glass-input-dark' : 'glass-input-light'
                      }`}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="primary" size="sm" disabled={!infoRequestDetails.trim()}>
                        Dispatch Information Request Notice
                      </Button>
                    </div>
                  </form>
                )}

                {/* Tab 5: Request Transfer with Reason */}
                {activeActionTab === 'transfer' && (
                  <form onSubmit={handleRequestTransfer} className="space-y-3 p-4 rounded-2xl bg-card border border-border/70 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">
                          Destination Agency / Section
                        </label>
                        <select
                          value={isRealStaff ? (transferDepartmentId || transferDepartment) : transferDepartment}
                          onChange={(e) => {
                            const val = e.target.value;
                            const deptList = isRealStaff && realDepartments.length > 0 ? realDepartments : departments;
                            const found = deptList.find((d) => d.id === val || d.name === val);
                            if (found) {
                              setTransferDepartment(found.name);
                              setTransferDepartmentId(found.id);
                            } else {
                              setTransferDepartment(val);
                            }
                          }}
                          className={`w-full p-2.5 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                        >
                          {(isRealStaff && realDepartments.length > 0 ? realDepartments : departments).map((d) => (
                            <option key={d.id} value={isRealStaff ? d.id : d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">
                          Statutory Transfer Reason <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={transferReason}
                          onChange={(e) => setTransferReason(e.target.value)}
                          placeholder="e.g. Jurisdiction belongs to Municipal Health Wing"
                          className={`w-full p-2.5 rounded-xl text-xs border ${isDark ? 'glass-input-dark' : 'glass-input-light'}`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button type="submit" variant="primary" size="sm" disabled={!transferReason.trim()}>
                        Transmit Jurisdictional Transfer Request
                      </Button>
                    </div>
                  </form>
                )}

                {/* Tab 6: Challenge Inaccurate Record Through Separate Response */}
                {activeActionTab === 'challenge' && (
                  <form onSubmit={handleChallengeRecord} className="space-y-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 animate-in fade-in">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                      <AlertOctagon className="w-4 h-4" />
                      <span>Formal Official Record Contestation</span>
                    </div>
                    <p className="text-[11px] text-foreground/70">
                      If an allegation or procedural summary is factually incorrect, you may submit a formal contestation. <strong>System immutability guarantees that prior events cannot be erased</strong>; your contestation is permanently recorded as an official counter-deposition.
                    </p>
                    <textarea
                      rows={3}
                      value={challengeStatement}
                      onChange={(e) => setChallengeStatement(e.target.value)}
                      placeholder="Detail official records, dispatch logs, or statutory citations disputing the complainant's factual assertions..."
                      className={`w-full p-3 rounded-xl text-xs border resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        isDark ? 'glass-input-dark' : 'glass-input-light'
                      }`}
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!challengeStatement.trim()}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm"
                      >
                        Submit Formal Contestation Deposition
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Complete Chronological Audit History — Accountability Timeline */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Case Audit Trail ({selectedComplaint.auditHistory?.length || 0} Events)
                </h4>
                <AccountabilityTimeline complaint={selectedComplaint} role="official" />
              </div>

            </GlassCard>
          ) : (
            <GlassCard isDark={isDark} className="text-center py-12">
              <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold">No active grievances assigned to this jurisdiction</h3>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Record Verification Modal */}
      {selectedComplaint && (
        <RecordVerificationModal
          complaint={selectedComplaint}
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  );
}
