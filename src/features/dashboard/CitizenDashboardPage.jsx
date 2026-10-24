import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import RecordVerificationModal from '../../components/audit/RecordVerificationModal';
import CaseSummaryModal from '../../components/legal/CaseSummaryModal';
import AccountabilityTimeline from '../../components/timeline/AccountabilityTimeline';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  History,
  Scale,
  Send,
  UploadCloud,
  ChevronRight,
  Phone,
  HelpCircle,
  Printer,
} from 'lucide-react';

export default function CitizenDashboardPage() {
  const { isDark } = useTheme();
  const { user, realUser, isAuthenticated } = useAuth();
  const {
    complaints,
    realComplaints,
    realComplaintsLoading,
    fetchRealComplaints,
    legalCounselors,
    submitCorrection,
    fileAppeal,
    addEvidenceToComplaint,
  } = useData();
  const navigate = useNavigate();

  // Citizen's complaints: Prioritize database records when authenticated
  const myComplaints = isAuthenticated && realComplaints?.length > 0
    ? realComplaints
    : complaints.filter(
        (c) => c.citizenName === user?.name || c.isAnonymous || c.citizenPhone === user?.phone
      );

  const [selectedComplaint, setSelectedComplaint] = useState(myComplaints[0] || complaints[0]);

  // Keep selectedComplaint in sync when real complaints are fetched or updated
  React.useEffect(() => {
    if (myComplaints.length > 0) {
      if (!selectedComplaint || !myComplaints.some((c) => c.id === selectedComplaint.id)) {
        setSelectedComplaint(myComplaints[0]);
      }
    }
  }, [myComplaints]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showCaseSummaryModal, setShowCaseSummaryModal] = useState(false);

  // Modals / Action Drawers
  const [showAddInfoModal, setShowAddInfoModal] = useState(false);
  const [addInfoText, setAddInfoText] = useState('');
  const [addInfoFile, setAddInfoFile] = useState(null);

  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  const [actionSuccess, setActionSuccess] = useState('');

  // Handle Add Information
  const handleAddInformation = async (e) => {
    e.preventDefault();
    if (!addInfoText.trim() && !addInfoFile) return;

    if (addInfoText.trim()) {
      await submitCorrection(
        selectedComplaint.id,
        addInfoText.trim(),
        selectedComplaint.isAnonymous ? 'Whistleblower (Protected)' : selectedComplaint.citizenName
      );
    }

    if (addInfoFile) {
      await addEvidenceToComplaint(
        selectedComplaint.id,
        addInfoFile,
        selectedComplaint.isAnonymous ? 'Whistleblower (Protected)' : selectedComplaint.citizenName
      );
    }

    setActionSuccess('Supplemental information permanently recorded in audit chain!');
    setAddInfoText('');
    setAddInfoFile(null);
    setShowAddInfoModal(false);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  // Handle Appeal
  const handleFileAppeal = async (e) => {
    e.preventDefault();
    if (!appealReason.trim() || !selectedComplaint) return;

    await fileAppeal(
      selectedComplaint.id,
      appealReason.trim(),
      selectedComplaint.isAnonymous ? 'Whistleblower (Protected)' : selectedComplaint.citizenName
    );

    setActionSuccess('Statutory appeal formally filed with the First Appellate Authority.');
    setAppealReason('');
    setShowAppealModal(false);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  // Check if official requested additional information
  const infoRequestedEvent = selectedComplaint?.auditHistory?.find(
    (evt) => evt.eventType === 'INFO_REQUESTED' || evt.action === 'INFO_REQUESTED'
  );

  // Check if there are findings or decisions recorded
  const decisionEvents = selectedComplaint?.auditHistory?.filter(
    (evt) =>
      evt.eventType === 'FINDING_RECORDED' ||
      evt.eventType === 'CLOSED' ||
      evt.action === 'RESOLVED_AND_REFUNDED'
  ) || [];

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title={`Citizen Grievance Dashboard — ${isAuthenticated && realUser ? realUser.name : user?.name || 'Aditya Kumar Verma'}`}
        subtitle="Manage your active complaints, track statutory SLA countdowns, provide requested information, and verify cryptographic chain integrity."
        badge={
          isAuthenticated && realUser ? (
            <Badge variant="success" dot>Live Database Session ({realUser.role})</Badge>
          ) : (
            <Badge variant="success" dot>DigiLocker Verified Citizen (Demo)</Badge>
          )
        }
        breadcrumbs={[{ label: 'Citizen Portal' }, { label: 'My Complaints' }]}
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/report')}
          >
            File New Complaint
          </Button>
        }
        isDark={isDark}
      />

      {/* Success Toast */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Filed</span>
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2">{myComplaints.length}</div>
          <span className="text-[11px] text-slate-400">Recorded with SHA-256 genesis hashes</span>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">In Active Investigation</span>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2">
            {myComplaints.filter((c) => (c.stage || 1) < 4).length}
          </div>
          <span className="text-[11px] text-amber-500 font-semibold">Protected by statutory countdown</span>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Escalated / Appeals</span>
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2">
            {myComplaints.filter((c) => (c.stage || 1) >= 2 && (c.stage || 1) < 4).length}
          </div>
          <span className="text-[11px] text-purple-400 font-semibold">Senior Appellate & Lokayukta review</span>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Resolved & Redressed</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black mt-2">
            {myComplaints.filter((c) => (c.stage || 1) === 4).length}
          </div>
          <span className="text-[11px] text-emerald-500 font-semibold">Verified compliance reports</span>
        </GlassCard>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Complaint Roster */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              My Grievance Roster ({myComplaints.length})
            </h3>
            <span className="text-xs text-primary font-semibold">Append-Only</span>
          </div>

          {myComplaints.map((c) => {
            const isSelected = selectedComplaint?.id === c.id;
            const hasInfoRequest = c.auditHistory?.some((e) => e.eventType === 'INFO_REQUESTED');

            return (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-sky-950/40 border-sky-400 ring-1 ring-sky-400/40'
                      : 'bg-sky-50 border-sky-300 ring-1 ring-sky-300'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#E06820]">{c.id}</span>
                  <div className="flex items-center gap-1.5">
                    {hasInfoRequest && (
                      <Badge variant="danger" size="sm">Action Req</Badge>
                    )}
                    <Badge variant={c.stage === 4 ? 'success' : c.stage >= 2 ? 'warning' : 'primary'} size="sm">
                      {c.stageName}
                    </Badge>
                  </div>
                </div>

                <h4 className="font-bold text-sm line-clamp-1">{c.title}</h4>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>{c.department.split(' ')[0]}</span>
                  <span>Filed: {c.filedDate}</span>
                </div>

                <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800">
                  <span className="text-slate-500">SLA Days Left:</span>
                  <span className="font-bold text-amber-500">
                    {c.slaDaysRemaining > 0 ? `${c.slaDaysRemaining} Days` : 'Concluded'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Complaint Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {selectedComplaint ? (
            <GlassCard isDark={isDark} className="space-y-6">
              
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#E06820]">
                      {selectedComplaint.id}
                    </span>
                    <Badge variant={selectedComplaint.stage === 4 ? 'success' : selectedComplaint.stage >= 2 ? 'warning' : 'primary'} size="sm">
                      {selectedComplaint.stageName}
                    </Badge>
                    {selectedComplaint.isAnonymous && (
                      <Badge variant="purple" size="sm">Whistleblower Seal</Badge>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mt-1">{selectedComplaint.title}</h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{selectedComplaint.department}</span>
                    <span>•</span>
                    <span>Responsible Office: <strong>{selectedComplaint.officeLocation}</strong></span>
                    <span>•</span>
                    <span>Submitted: {selectedComplaint.filedDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowCaseSummaryModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Prepare Case Summary</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify this Record</span>
                  </button>
                </div>
              </div>

              {/* Action Required Alert (If Official/Reviewer Requested Additional Info) */}
              {infoRequestedEvent && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <span>⚠️</span> Action Required: Information Requested by Inquiry Officer
                    </span>
                    <span className="text-[10px] font-mono">{infoRequestedEvent.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/80">
                    "{infoRequestedEvent.details}"
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddInfoModal(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all shadow-sm"
                  >
                    + Submit Requested Information / Upload Documents
                  </button>
                </div>
              )}

              {/* Upcoming Deadlines & Escalation Dates */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Upcoming SLA Deadlines & Statutory Escalation Timetable
                  </span>
                  <span className="font-mono font-bold text-amber-600">
                    {selectedComplaint.slaDaysRemaining > 0 ? `${selectedComplaint.slaDaysRemaining} Days Remaining` : 'Completed'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-foreground/50 block font-semibold">Tier 1: Grievance Desk</span>
                    <span className="text-xs font-bold text-foreground">7 Days from filing</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-foreground/50 block font-semibold">Tier 2: Appellate Authority</span>
                    <span className="text-xs font-bold text-foreground">Day 15 (Auto-escalation)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-foreground/50 block font-semibold">Tier 3: Lokayukta / Vigilance</span>
                    <span className="text-xs font-bold text-foreground">Day 30 (Statutory Ombudsman)</span>
                  </div>
                </div>
              </div>

              {/* Citizen Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddInfoModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Add Supplemental Information</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAppealModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-card hover:bg-muted text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>File Statutory Appeal</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/track')}
                  className="px-3.5 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-semibold border border-border transition-all flex items-center gap-1.5 ml-auto"
                >
                  <span>Track Full SLA Escalation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Decisions & Recorded Findings (if any) */}
              {decisionEvents.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>📜</span> Official Departmental Decisions & Findings Recorded
                  </div>
                  <div className="space-y-2 pt-1">
                    {decisionEvents.map((dec, i) => (
                      <div key={i} className="p-3 rounded-xl bg-card border border-border/60 text-xs space-y-1">
                        <div className="flex justify-between items-center font-semibold">
                          <span className="text-primary">{dec.eventType || dec.action}</span>
                          <span className="font-mono text-[10px] text-foreground/50">{dec.timestamp}</span>
                        </div>
                        <p className="text-foreground/90">{dec.details}</p>
                        {dec.reason && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 italic">
                            Grounds: {dec.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Chronological Timeline — Accountability Timeline */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#E06820]" />
                  Complete Chronological Audit Timeline ({selectedComplaint.auditHistory?.length || 0} Events)
                </h3>
                <AccountabilityTimeline complaint={selectedComplaint} role="citizen" />
              </div>

              {/* Relevant Legal Assistance Options */}
              <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-border/60 space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-primary" />
                    Relevant Pro-Bono Legal Assistance Options
                  </h4>
                  <Link
                    to="/legal-help"
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View DLSA Roster</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-[11px] text-foreground/60">
                  Under the Legal Services Authorities Act, citizens facing administrative corruption or unlawful harassment are entitled to free legal representation.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {legalCounselors.slice(0, 2).map((lawyer) => (
                    <div key={lawyer.id} className="p-3 rounded-xl bg-card border border-border/60 text-xs space-y-1">
                      <div className="font-bold text-foreground">{lawyer.name}</div>
                      <div className="text-[11px] text-primary">{lawyer.designation}</div>
                      <div className="text-[10px] text-foreground/50">{lawyer.court}</div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        {lawyer.freeConsultationsGiven}+ Free Consultations Given
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </GlassCard>
          ) : (
            <GlassCard isDark={isDark} className="text-center py-12">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold">Select a complaint from your roster to inspect details</h3>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Add Information Modal */}
      {showAddInfoModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-foreground mb-1">Add Information to Record Chain</h3>
            <p className="text-xs text-foreground/70 mb-4">
              Your supplemental statement and evidence will be recorded as a new append-only event without rewriting existing facts.
            </p>

            <form onSubmit={handleAddInformation} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Supplemental Statement / Factual Clarification
                </label>
                <textarea
                  rows={4}
                  value={addInfoText}
                  onChange={(e) => setAddInfoText(e.target.value)}
                  placeholder="Detail new facts, reply to inquiry officer questions, or submit additional witness details..."
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Attach Evidence File (Photos, PDFs, Docs)
                </label>
                <input
                  type="file"
                  onChange={(e) => setAddInfoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                />
                <span className="text-[10px] text-foreground/50 block mt-1">
                  SHA-256 byte fingerprint will be generated and signed into the next event block.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddInfoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground/70 hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!addInfoText.trim() && !addInfoFile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 shadow-sm"
                >
                  Append to Audit Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Appeal Modal */}
      {showAppealModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-foreground mb-1">File Statutory Appeal</h3>
            <p className="text-xs text-foreground/70 mb-4">
              Submit your formal appeal grounds to the First Appellate Authority under the Citizens Charter Redressal Protocol.
            </p>

            <form onSubmit={handleFileAppeal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Grounds for Appeal <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why you are dissatisfied with the local grievance desk response, what evidence was ignored, or why escalation is required..."
                  className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground/70 hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!appealReason.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shadow-sm"
                >
                  Formally File Appeal ⚖
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Verification Modal */}
      {selectedComplaint && (
        <RecordVerificationModal
          complaint={selectedComplaint}
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      {/* Case Summary Print Modal */}
      {selectedComplaint && (
        <CaseSummaryModal
          complaint={selectedComplaint}
          isOpen={showCaseSummaryModal}
          onClose={() => setShowCaseSummaryModal(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
