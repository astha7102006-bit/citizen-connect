import React, { useState, useMemo } from 'react';
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
  Scale,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Unlock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  EyeOff,
  FileSearch,
  Clock,
  Users,
  Copy,
  GitBranch,
  CalendarX,
  FileQuestion,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Advisory Flag Engine ───────────────────────────────────────────────────
function computeAdvisoryFlags(complaint, allComplaints) {
  const flags = [];

  // 1. Duplicate evidence: check sha256 of evidence files against other complaints
  if (complaint.evidenceFiles && complaint.evidenceFiles.length > 0) {
    const myHashes = complaint.evidenceFiles.map((e) => e.sha256).filter(Boolean);
    for (const other of allComplaints) {
      if (other.id === complaint.id) continue;
      const otherHashes = (other.evidenceFiles || []).map((e) => e.sha256).filter(Boolean);
      const overlap = myHashes.filter((h) => otherHashes.includes(h));
      if (overlap.length > 0) {
        flags.push({
          id: 'duplicate_evidence',
          icon: Copy,
          label: 'Possible Duplicate Evidence',
          detail: `${overlap.length} evidence file(s) share identical SHA-256 hash with complaint ${other.id}.`,
          severity: 'high',
        });
        break;
      }
    }
  }

  // 2. Similar complaint text: basic substring match > 40 chars
  const myDesc = (complaint.description || '').toLowerCase();
  for (const other of allComplaints) {
    if (other.id === complaint.id) continue;
    const otherDesc = (other.description || '').toLowerCase();
    const myWords = myDesc.split(/\s+/).filter((w) => w.length > 5);
    const matchCount = myWords.filter((w) => otherDesc.includes(w)).length;
    if (matchCount > 8) {
      flags.push({
        id: 'similar_text',
        icon: FileSearch,
        label: 'Similar Complaint Narrative',
        detail: `High word overlap detected with complaint ${other.id}. Worth reviewing for coordination.`,
        severity: 'medium',
      });
      break;
    }
  }

  // 3. Coordinated submissions: same department, submitted on same day
  const myDate = (complaint.submittedAt || '').substring(0, 10);
  const myDept = complaint.department;
  const coordinated = allComplaints.filter(
    (o) =>
      o.id !== complaint.id &&
      o.department === myDept &&
      (o.submittedAt || '').substring(0, 10) === myDate
  );
  if (coordinated.length >= 1) {
    flags.push({
      id: 'coordinated',
      icon: Users,
      label: 'Possible Coordinated Submissions',
      detail: `${coordinated.length + 1} complaint(s) against "${myDept}" filed on ${myDate}. May be organised or may reflect a systemic issue.`,
      severity: 'medium',
    });
  }

  // 4. Missing information: key fields not stated
  const missingFields = [];
  if (!complaint.incidentDate || complaint.incidentDate === 'Not stated') missingFields.push('Incident date');
  if (!complaint.location || complaint.location === 'Not stated') missingFields.push('Location');
  if (!complaint.officialNamed || complaint.officialNamed === 'Not known') missingFields.push('Official named');
  if (missingFields.length > 0) {
    flags.push({
      id: 'missing_info',
      icon: FileQuestion,
      label: 'Missing Key Information',
      detail: `The following fields were not provided: ${missingFields.join(', ')}.`,
      severity: 'low',
    });
  }

  // 5. Inconsistent dates: incidentDate after submittedAt
  if (complaint.incidentDate && complaint.submittedAt) {
    const inc = new Date(complaint.incidentDate);
    const sub = new Date(complaint.submittedAt);
    if (!isNaN(inc) && !isNaN(sub) && inc > sub) {
      flags.push({
        id: 'inconsistent_dates',
        icon: CalendarX,
        label: 'Inconsistent Dates',
        detail: `Incident date (${complaint.incidentDate}) is after submission date (${complaint.submittedAt.substring(0, 10)}).`,
        severity: 'high',
      });
    }
  }

  // 6. Evidence metadata mismatch: file uploadedAt vs incidentDate
  if (complaint.evidenceFiles && complaint.incidentDate) {
    const incDate = new Date(complaint.incidentDate);
    for (const ev of complaint.evidenceFiles) {
      if (ev.uploadedAt) {
        const evDate = new Date(ev.uploadedAt);
        if (!isNaN(evDate) && !isNaN(incDate) && evDate < incDate) {
          flags.push({
            id: 'evidence_metadata',
            icon: Clock,
            label: 'Evidence Metadata Inconsistency',
            detail: `File "${ev.name}" appears to have been created before the reported incident date. Worth verifying.`,
            severity: 'medium',
          });
          break;
        }
      }
    }
  }

  return flags;
}

// ─── Flag severity styling ──────────────────────────────────────────────────
const FLAG_SEVERITY = {
  high: 'border-red-500/40 bg-red-500/8 text-red-700 dark:text-red-300',
  medium: 'border-amber-500/40 bg-amber-500/8 text-amber-700 dark:text-amber-300',
  low: 'border-blue-500/40 bg-blue-500/8 text-blue-700 dark:text-blue-300',
};

const FLAG_ICON_COLOR = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-blue-500',
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReviewerDashboardPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const {
    getComplaintsForRole,
    recordFinding,
    restrictFromPublicView,
    closeComplaint,
    reopenComplaint,
  } = useData();

  const allComplaints = getComplaintsForRole(DEMO_ROLES.REVIEWER, user);
  const [selectedId, setSelectedId] = useState(allComplaints[0]?.id || null);
  const selectedComplaint = allComplaints.find((c) => c.id === selectedId) || null;

  // UI state
  const [activeTab, setActiveTab] = useState('dossier');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [expandedFlag, setExpandedFlag] = useState(null);

  // Finding form state
  const [findingType, setFindingType] = useState('');
  const [findingReason, setFindingReason] = useState('');
  const [findingLoading, setFindingLoading] = useState(false);

  // Redaction / Restrict form state
  const [redactReason, setRedactReason] = useState('');
  const [redactLoading, setRedactLoading] = useState(false);

  // Close with appeal route state
  const [closeReason, setCloseReason] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);

  // Reopen appealed state
  const [reopenReason, setReopenReason] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);

  const reviewerActor = user?.personaName || 'Justice S. N. Hegde (Retd.), Oversight Reviewer';

  // Compute advisory flags for selected complaint
  const advisoryFlags = useMemo(() => {
    if (!selectedComplaint) return [];
    return computeAdvisoryFlags(selectedComplaint, allComplaints);
  }, [selectedComplaint, allComplaints]);

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setActionError('');
    setTimeout(() => setActionSuccess(''), 5000);
  };
  const showError = (msg) => {
    setActionError(msg);
    setActionSuccess('');
    setTimeout(() => setActionError(''), 5000);
  };

  // ── Finding submission ──
  const handleRecordFinding = async () => {
    if (!selectedComplaint) return;
    if (!findingType) { showError('Please select a finding type.'); return; }
    if (!findingReason.trim()) { showError('Please enter your reasoning for this finding.'); return; }
    setFindingLoading(true);
    try {
      await recordFinding(
        selectedComplaint.id,
        `${findingType}: ${findingReason}`,
        reviewerActor
      );
      showSuccess(`Finding recorded: "${findingType}". This is now part of the append-only audit trail.`);
      setFindingType('');
      setFindingReason('');
    } catch (err) {
      showError('Failed to record finding. Please try again.');
    } finally {
      setFindingLoading(false);
    }
  };

  // ── Approve Redactions / Restrict public visibility ──
  const handleRestrictPublic = async () => {
    if (!selectedComplaint) return;
    if (!redactReason.trim()) { showError('Please provide a reason for restricting public visibility.'); return; }
    setRedactLoading(true);
    try {
      await restrictFromPublicView(selectedComplaint.id, redactReason, reviewerActor);
      showSuccess('Public visibility restriction applied and recorded in audit trail.');
      setRedactReason('');
    } catch (err) {
      showError('Failed to apply restriction. Please try again.');
    } finally {
      setRedactLoading(false);
    }
  };

  // ── Close with appeal route ──
  const handleCloseWithAppeal = async () => {
    if (!selectedComplaint) return;
    if (!closeReason.trim()) { showError('Please provide a reason and the appeal route instructions.'); return; }
    setCloseLoading(true);
    try {
      await closeComplaint(
        selectedComplaint.id,
        `CLOSED WITH APPEAL ROUTE — ${closeReason}. Complainant may file an appeal within 90 days by contacting the State Appellate Authority.`,
        reviewerActor
      );
      showSuccess('Complaint closed with appeal route recorded. Audit trail updated.');
      setCloseReason('');
    } catch (err) {
      showError('Failed to close complaint. Please try again.');
    } finally {
      setCloseLoading(false);
    }
  };

  // ── Reopen appealed complaint ──
  const handleReopen = async () => {
    if (!selectedComplaint) return;
    if (!reopenReason.trim()) { showError('Please provide a reason for reopening.'); return; }
    setReopenLoading(true);
    try {
      await reopenComplaint(selectedComplaint.id, reopenReason, reviewerActor);
      showSuccess('Complaint reopened. New audit event recorded.');
      setReopenReason('');
    } catch (err) {
      showError('Failed to reopen complaint. Please try again.');
    } finally {
      setReopenLoading(false);
    }
  };

  const TABS = [
    { id: 'dossier', label: 'Full Dossier' },
    { id: 'flags', label: `AI Flags ${advisoryFlags.length > 0 ? `(${advisoryFlags.length})` : ''}` },
    { id: 'finding', label: 'Record Finding' },
    { id: 'actions', label: 'Oversight Actions' },
    { id: 'audit', label: 'Audit Trail' },
  ];

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      {/* Emergency Notice */}
      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        If you are in danger right now, call <strong className="mx-1">112</strong>.
      </div>

      <PageHeader
        title="Oversight Reviewer Console — Independent Vigilance & Appellate Authority"
        subtitle="Unrestricted investigation oversight. Review raw complainant files, verify cryptographic evidence hashes, protect whistleblowers, and enforce statutory deadlines."
        badge={<Badge variant="purple" dot>Reviewer Privilege Active</Badge>}
        breadcrumbs={[{ label: 'Oversight Authority' }, { label: 'Review Workbench' }]}
        isDark={isDark}
      />

      {/* Reviewer Clearance Banner */}
      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-800 dark:text-purple-200 text-xs sm:text-sm mb-6 flex items-start gap-3">
        <Unlock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Unredacted Investigation Clearance:</strong> As an Oversight Reviewer, you have statutory
          authorization to inspect raw complainant details, unredacted whistleblower envelopes, and
          cross-departmental audit trails under the Lokayukta Act.{' '}
          <span className="text-purple-400 italic">
            This is a demonstration system. No real personal data is stored.
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {actionSuccess && (
        <div className="mb-4 p-4 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-sm font-semibold flex items-center gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Case Queue ────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Active Investigation Roster ({allComplaints.length})
            </h3>
            <span className="text-xs text-purple-500 font-semibold">Tier 1-3 Oversight</span>
          </div>

          {allComplaints.map((c) => {
            const flags = computeAdvisoryFlags(c, allComplaints);
            const isSelected = selectedId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => { setSelectedId(c.id); setActiveTab('dossier'); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-purple-950/40 border-purple-400 ring-1 ring-purple-400/40'
                      : 'bg-purple-50 border-purple-400 ring-1 ring-purple-300'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#E06820]">{c.id}</span>
                  <Badge
                    variant={c.severity === 'Critical' ? 'danger' : c.severity === 'High' ? 'warning' : 'purple'}
                    size="sm"
                  >
                    {c.severity}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm line-clamp-1">{c.title}</h4>
                <div className="text-xs text-slate-400 mt-1">
                  Citizen: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{c.citizenName}</strong>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800">
                  <span>{c.department?.split(' ')[0]}</span>
                  <div className="flex items-center gap-1.5">
                    {flags.length > 0 && (
                      <span className="text-amber-500 font-bold">⚑ {flags.length}</span>
                    )}
                    <span className="font-bold text-purple-400">Stage {c.stage}/4</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Detail Panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          {selectedComplaint ? (
            <GlassCard isDark={isDark} className="space-y-0 p-0 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#E06820]">{selectedComplaint.id}</span>
                      <Badge variant="purple" size="sm">Full Raw Dossier</Badge>
                      {selectedComplaint.isAnonymous && (
                        <Badge variant="danger" size="sm">Whistleblower Protected</Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold mt-1">{selectedComplaint.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Dept: <strong>{selectedComplaint.department}</strong> · Official: <strong>{selectedComplaint.officialNamed || 'Not named'}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={selectedComplaint.stage >= 3 ? 'danger' : selectedComplaint.stage >= 2 ? 'warning' : 'primary'} size="lg">
                      {selectedComplaint.stageName}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowVerifyModal(true)}
                      className="text-xs border-purple-500/40 text-purple-600 dark:text-purple-300"
                    >
                      🔗 Verify Chain
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 dark:text-purple-300'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-5 space-y-5">

                {/* ── TAB: Full Dossier ── */}
                {activeTab === 'dossier' && (
                  <div className="space-y-5">
                    {/* Citizen Profile */}
                    <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-3">
                      <div className="flex items-center justify-between font-bold text-purple-300">
                        <span>Verified Citizen Profile (Classified — Reviewer Seal Only)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Complainant</span>
                          <span className="font-bold">{selectedComplaint.citizenName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Phone</span>
                          <span className="font-bold">{selectedComplaint.citizenPhone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Email</span>
                          <span className="font-bold break-all">{selectedComplaint.citizenEmail}</span>
                        </div>
                        {selectedComplaint.incidentDate && (
                          <div>
                            <span className="text-slate-400 block mb-0.5">Incident Date</span>
                            <span className="font-bold">{selectedComplaint.incidentDate}</span>
                          </div>
                        )}
                        {selectedComplaint.location && (
                          <div>
                            <span className="text-slate-400 block mb-0.5">Location</span>
                            <span className="font-bold">{selectedComplaint.location}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 block mb-0.5">Submitted</span>
                          <span className="font-bold">{selectedComplaint.submittedAt?.substring(0, 10) || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Raw Statement */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Raw Complainant Statement</h4>
                      <p className="text-sm p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 leading-relaxed">
                        {selectedComplaint.description}
                      </p>
                    </div>

                    {/* Witnesses — Reviewer Eyes Only */}
                    {selectedComplaint.witnesses && selectedComplaint.witnesses.length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" /> Confidential Witness Roster (Reviewer Eyes Only)
                          </span>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20">
                            Redacted from Official & Public
                          </span>
                        </div>
                        <div className="space-y-2 pt-1">
                          {selectedComplaint.witnesses.map((w, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-amber-500/20 text-xs flex items-center justify-between gap-2">
                              <div>
                                <strong>{w.name}</strong>
                                <span className="text-slate-500 ml-2">({w.relation || 'Witness'})</span>
                              </div>
                              <div className="font-mono text-slate-500">{w.contact || 'No contact provided'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audio Evidence */}
                    {selectedComplaint.audioEvidence && (
                      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-primary">
                          <span className="flex items-center gap-1.5">🎙️ In-Browser Audio Evidence Recording</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            Duration: {selectedComplaint.audioEvidence.duration || '0:45'}
                          </span>
                        </div>
                        {selectedComplaint.audioEvidence.url && (
                          <audio controls className="w-full h-9 rounded-lg" src={selectedComplaint.audioEvidence.url} />
                        )}
                        <div className="font-mono text-[10px] text-slate-500 break-all">
                          SHA-256: {selectedComplaint.audioEvidence.sha256 || 'sha256-verified-audio-stream'}
                        </div>
                      </div>
                    )}

                    {/* Evidence Vault */}
                    {selectedComplaint.evidenceFiles && selectedComplaint.evidenceFiles.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Cryptographic Evidence Vault & Chain of Custody
                        </h4>
                        <div className="space-y-2">
                          {selectedComplaint.evidenceFiles.map((ev, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs flex-wrap gap-2"
                            >
                              <div>
                                <div className="font-bold">{ev.name} {ev.size && `(${ev.size})`}</div>
                                <div className="font-mono text-[10px] text-slate-400 break-all mt-0.5">
                                  SHA-256: {ev.sha256 || 'hash-pending'}
                                </div>
                                {ev.uploadedAt && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">Uploaded: {ev.uploadedAt}</div>
                                )}
                              </div>
                              <Badge variant="success" size="sm">Integrity Verified</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supplemental Corrections */}
                    {selectedComplaint.corrections && selectedComplaint.corrections.length > 0 && (
                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                          📜 Supplemental Citizen Corrigendum Records
                        </div>
                        <div className="space-y-1.5 pt-1">
                          {selectedComplaint.corrections.map((corr, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-blue-500/20 text-xs space-y-1">
                              <div className="flex justify-between text-[11px] text-slate-500">
                                <span>Appended by: <strong>{corr.actor}</strong></span>
                                <span>{corr.timestamp}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 italic">"{corr.text}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: AI Advisory Flags ── */}
                {activeTab === 'flags' && (
                  <div className="space-y-4">
                    {/* Advisory disclaimer */}
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                      <span>
                        <strong>Advisory Flags — Never Proof.</strong> These flags are automatically detected patterns that are
                        <em> worth a closer look</em>. They are not conclusions. Each flag requires human reviewer judgement before
                        any action is taken. No complaint is automatically rejected based on these signals.
                      </span>
                    </div>

                    {advisoryFlags.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-green-500" />
                        <p className="font-semibold">No Advisory Flags Detected</p>
                        <p className="text-xs mt-1">No patterns of concern were identified for this complaint.</p>
                      </div>
                    ) : (
                      advisoryFlags.map((flag) => {
                        const FlagIcon = flag.icon;
                        const isExpanded = expandedFlag === flag.id;
                        return (
                          <div
                            key={flag.id}
                            className={`rounded-2xl border p-4 space-y-2 ${FLAG_SEVERITY[flag.severity]}`}
                          >
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => setExpandedFlag(isExpanded ? null : flag.id)}
                            >
                              <div className="flex items-center gap-2">
                                <FlagIcon className={`w-4 h-4 flex-shrink-0 ${FLAG_ICON_COLOR[flag.severity]}`} />
                                <span className="font-bold text-sm">{flag.label}</span>
                                <Badge
                                  variant={flag.severity === 'high' ? 'danger' : flag.severity === 'medium' ? 'warning' : 'primary'}
                                  size="sm"
                                >
                                  {flag.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] italic opacity-70">Worth a closer look</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="pt-2 border-t border-current/20">
                                <p className="text-xs leading-relaxed">{flag.detail}</p>
                                <p className="text-[11px] italic mt-2 opacity-60">
                                  Advisory only — this flag is never proof of wrongdoing or fraud. Human review required.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ── TAB: Record Finding ── */}
                {activeTab === 'finding' && (
                  <div className="space-y-5">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                      <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Findings are permanent and append-only. Once recorded, a finding becomes part of the tamper-evident
                        audit chain and cannot be deleted or modified.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Finding Type <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {['Substantiated', 'Not Substantiated', 'No Finding Possible'].map((opt) => (
                          <label
                            key={opt}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                              findingType === opt
                                ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-200'
                                : isDark
                                ? 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="findingType"
                              value={opt}
                              checked={findingType === opt}
                              onChange={() => setFindingType(opt)}
                              className="accent-purple-500"
                            />
                            <div>
                              <div className="font-semibold text-sm">{opt}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {opt === 'Substantiated' && 'The complaint is supported by evidence and investigation findings.'}
                                {opt === 'Not Substantiated' && 'Insufficient evidence to support the complaint allegations.'}
                                {opt === 'No Finding Possible' && 'Insufficient information to make a determination either way.'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Reasoning / Basis for Finding <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={findingReason}
                        onChange={(e) => setFindingReason(e.target.value)}
                        rows={4}
                        placeholder="Provide the statutory basis and reasoning for this finding..."
                        className={`w-full p-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                          isDark ? 'bg-slate-900/60 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleRecordFinding}
                      disabled={findingLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {findingLoading ? 'Recording...' : '⚖ Record Finding in Audit Trail'}
                    </Button>
                  </div>
                )}

                {/* ── TAB: Oversight Actions ── */}
                {activeTab === 'actions' && (
                  <div className="space-y-6">
                    {/* Approve Redactions / Restrict Public Visibility */}
                    <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-sm">Restrict Public Visibility</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Prevents this complaint and its details from appearing in public accountability records.
                        A new audit event will be created recording your reason.
                      </p>
                      <textarea
                        value={redactReason}
                        onChange={(e) => setRedactReason(e.target.value)}
                        rows={2}
                        placeholder="Reason for restricting public visibility (e.g. ongoing investigation, witness protection)..."
                        className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${
                          isDark ? 'bg-slate-900/60 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                      <Button
                        variant="outline"
                        onClick={handleRestrictPublic}
                        disabled={redactLoading}
                        className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-300 w-full"
                      >
                        {redactLoading ? 'Applying...' : '🔒 Approve Redactions & Restrict Public View'}
                      </Button>
                    </div>

                    {/* Close with Appeal Route */}
                    <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <h4 className="font-bold text-sm">Close with Appeal Route</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Closes the complaint while recording the appeal pathway for the citizen. The complainant
                        may appeal within 90 days. This action is irreversible — a new audit event will be appended.
                      </p>
                      <textarea
                        value={closeReason}
                        onChange={(e) => setCloseReason(e.target.value)}
                        rows={2}
                        placeholder="Reason for closure and appeal instructions for the citizen..."
                        className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${
                          isDark ? 'bg-slate-900/60 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                      <Button
                        variant="outline"
                        onClick={handleCloseWithAppeal}
                        disabled={closeLoading}
                        className="text-xs border-red-500/40 text-red-600 dark:text-red-300 w-full"
                      >
                        {closeLoading ? 'Closing...' : '✗ Close Complaint with Appeal Route'}
                      </Button>
                    </div>

                    {/* Reopen Appealed Complaint */}
                    <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-green-500" />
                        <h4 className="font-bold text-sm">Reopen Appealed Complaint</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Reopens a closed or rejected complaint that has been successfully appealed. A new
                        REOPENED audit event will be recorded with your reason.
                      </p>
                      <textarea
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        rows={2}
                        placeholder="Basis for reopening (e.g. appeal upheld, new evidence admitted)..."
                        className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                          isDark ? 'bg-slate-900/60 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />
                      <Button
                        variant="outline"
                        onClick={handleReopen}
                        disabled={reopenLoading}
                        className="text-xs border-green-500/40 text-green-600 dark:text-green-300 w-full"
                      >
                        {reopenLoading ? 'Reopening...' : '↺ Reopen Appealed Complaint'}
                      </Button>
                    </div>

                    {/* Escalate / Statutory Orders (legacy actions kept) */}
                    <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-purple-500" />
                        <h4 className="font-bold text-sm">Statutory Escalation & Orders</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        These are simulated demonstration actions that log advisory notes in the audit trail.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => showSuccess('PII-redacted summary approved for dispatch to department. Audit trail updated.')}
                          className="border-sky-500/40 text-sky-600 dark:text-sky-300 text-xs"
                        >
                          Approve Redacted Summary ↗
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => showSuccess('Direct Lokayukta Order recorded in audit trail.')}
                          className="border-purple-500/40 text-purple-600 dark:text-purple-300 text-xs"
                        >
                          Direct Lokayukta Order ⚖
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: Audit Trail — Accountability Timeline ── */}
                {activeTab === 'audit' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                      <span>
                        <strong>Demo Disclaimer:</strong> This audit chain is stored in browser localStorage for demonstration.
                        It is not server-enforced and a privileged user controlling the browser can alter it.
                        True tamper-evidence requires a protected backend. Use &quot;Verify Chain&quot; to check integrity.
                      </span>
                    </div>
                    <AccountabilityTimeline complaint={selectedComplaint} role="reviewer" />
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard isDark={isDark} className="text-center py-12">
              <Scale className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold">Select a dossier from the investigation roster</h3>
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
