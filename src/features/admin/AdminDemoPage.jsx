import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import RecordVerificationModal from '../../components/audit/RecordVerificationModal';
import {
  Settings,
  RefreshCw,
  FastForward,
  Lock,
  ShieldCheck,
  CheckCircle,
  Database,
  History,
  AlertOctagon,
  Trash2,
  AlertTriangle,
  Calendar,
  Cpu,
  Server,
  Radio,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  FileWarning,
  Activity,
  Layers,
} from 'lucide-react';

export default function AdminDemoPage() {
  const { isDark } = useTheme();
  const { role, setRole } = useAuth();
  const {
    complaints,
    auditArchive,
    resetDemoData,
    escalateComplaint,
    tamperComplaintRecord,
    restoreComplaintRecord,
    simulatedDate,
    advanceSimulatedDate,
    setSimulatedDate,
    adminActionLog,
    logAdminAction,
  } = useData();

  const [toast, setToast] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState(complaints[0]?.id || 'CC-2026-DL-28491');
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  // Reset Confirmation Modal State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Custom Date Picker State
  const [customDatePicker, setCustomDatePicker] = useState(simulatedDate || '2026-10-23');

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId) || complaints[0];

  const showNotification = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  // Date Advancement Handler
  const handleAdvanceDays = (days) => {
    const nextDate = advanceSimulatedDate(days);
    setCustomDatePicker(nextDate);
    showNotification(`Simulated system clock advanced by +${days} day(s). Active date: ${nextDate}`);
  };

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (!customDatePicker) return;
    setSimulatedDate(customDatePicker);
    showNotification(`Simulated system date set to ${customDatePicker}.`);
  };

  // Explicit Reset Confirmation
  const handleConfirmReset = () => {
    resetDemoData();
    setShowResetConfirmModal(false);
    showNotification('Demonstration dataset restored to benchmark baseline. Historical audit ledger and admin logs preserved.');
  };

  // Tamper Handler
  const handleTamper = (type) => {
    tamperComplaintRecord(selectedComplaintId, type);
    logAdminAction(
      'TAMPER_TEST_TRIGGERED',
      `Deliberate tamper test (${type}) injected into ${selectedComplaintId} for audit verification demo.`
    );
    showNotification(`⚠️ Deliberate tamper test (${type}) applied to ${selectedComplaintId}! Run verification to detect hash mismatch.`);
  };

  const handleRestore = () => {
    restoreComplaintRecord(selectedComplaintId);
    logAdminAction(
      'TAMPER_TEST_RESTORED',
      `Authentic cryptographic ledger restored for ${selectedComplaintId}.`
    );
    showNotification(`✓ Authentic cryptographic ledger restored for ${selectedComplaintId}.`);
  };

  const handleFastForwardEscalate = () => {
    const target = complaints.find((c) => (c.stage || 1) < 4);
    if (target) {
      escalateComplaint(target.id, 'Simulated administrative SLA breach (+7 days time advancement)');
      logAdminAction('AUTO_ESCALATION_TRIGGERED', `Simulated SLA lapse escalated ${target.id} to Stage ${(target.stage || 1) + 1}.`);
      showNotification(`Fast-forward triggered! Complaint ${target.id} escalated to next appellate stage.`);
    } else {
      showNotification('All demo complaints are already at their final resolution stage.');
    }
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8 space-y-8">
      {/* 1. Mandatory Emergency Banner */}
      <div className="p-3.5 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>If you are in danger right now, call 112 immediately for emergency police response.</span>
        </div>
        <a
          href="tel:112"
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-sm flex-shrink-0"
        >
          Call 112
        </a>
      </div>

      <PageHeader
        title="Admin Demonstration Controls & Platform Audit Governance"
        subtitle="Manage demonstration test harnesses, advance simulated clocks, execute cryptographic tamper tests, and inspect the immutable audit ledger."
        badge={<Badge variant="danger" dot>Admin Oversight</Badge>}
        breadcrumbs={[{ label: 'Administration' }, { label: 'Demo Controls' }]}
        isDark={isDark}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 2. Structural Immutability Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-200 text-xs sm:text-sm leading-relaxed flex items-start space-x-3">
        <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5">Architectural Immutability Guarantee:</strong>
          Administrators have permission to simulate clock movements and inject diagnostic tamper tests.
          However, administrators are <strong>structurally prohibited</strong> from deleting, editing, or truncating existing complaint event history.
          A demo data reset restores the benchmark fictional dataset, but does <em>not</em> erase historical audit logs.
        </div>
      </div>

      {/* 3. Browser Storage Limitation Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold uppercase tracking-wider text-[11px]">
            Browser Storage Demonstration Architecture Notice
          </strong>
          <p className="leading-relaxed opacity-90">
            Browser storage is solely a demonstration environment. It is <strong>not secure</strong> against a privileged user who controls the client browser, DevTools, or disk storage. Permanent, server-enforced, and non-repudiable immutability requires a decentralized validator consensus or hardened sovereign server backend.
          </p>
        </div>
      </div>

      {/* 4. Simulated Demo Clock & Date Controls */}
      <GlassCard isDark={isDark} className="p-6 space-y-4 border-purple-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Simulated Demonstration Clock
              </span>
              <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {simulatedDate}
              </h3>
              <p className="text-xs text-slate-500">
                All statutory SLA countdowns, auto-escalations, and timelines evaluate against this clock.
              </p>
            </div>
          </div>

          {/* Quick Advancement Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAdvanceDays(1)}
              className="btn-touch-target px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
            >
              +1 Day
            </button>
            <button
              onClick={() => handleAdvanceDays(7)}
              className="btn-touch-target px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
            >
              +7 Days (SLA Window)
            </button>
            <button
              onClick={() => handleAdvanceDays(30)}
              className="btn-touch-target px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
            >
              +30 Days (Escalation)
            </button>
          </div>
        </div>

        {/* Custom Date Form */}
        <form onSubmit={handleApplyCustomDate} className="flex items-center gap-3 flex-wrap pt-1 text-xs">
          <label htmlFor="custom-date-input" className="font-bold text-slate-500">
            Set Custom Simulated Date:
          </label>
          <input
            id="custom-date-input"
            type="date"
            value={customDatePicker}
            onChange={(e) => setCustomDatePicker(e.target.value)}
            className={`p-2 rounded-xl border text-xs font-mono focus:ring-2 focus:ring-purple-500 ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            Update System Date
          </button>
        </form>
      </GlassCard>

      {/* 5. Main Grid: Tamper Suite & Administrative Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tamper Test Harness & Reset */}
        <div className="lg:col-span-1 space-y-6">
          {/* Admin Tamper Testing Card */}
          <GlassCard isDark={isDark} className="space-y-4 border-amber-500/40">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>Admin Tamper Testing Suite</span>
              </h3>
              <Badge variant={selectedComplaint?.isTamperedForDemo ? 'danger' : 'success'} size="sm">
                {selectedComplaint?.isTamperedForDemo ? 'Tampered' : 'Clean Record'}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Deliberately corrupt stored record payload in local storage to test that the browser's cryptographic
              verification engine catches integrity violations at the exact block.
            </p>

            <div>
              <label htmlFor="tamper-record-select" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Target Complaint Record:
              </label>
              <select
                id="tamper-record-select"
                value={selectedComplaintId}
                onChange={(e) => setSelectedComplaintId(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs border font-mono ${
                  isDark ? 'glass-input-dark' : 'glass-input-light'
                }`}
              >
                {complaints.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.title.substring(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                className="w-full text-xs font-bold btn-touch-target"
                onClick={() => setVerifyModalOpen(true)}
              >
                🔗 Verify Record Integrity (SHA-256)
              </Button>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleTamper('EVENT_CONTENT')}
                  className="btn-touch-target p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold text-left transition-all"
                >
                  ⚠️ 1. Tamper Event Narrative Content
                </button>
                <button
                  type="button"
                  onClick={() => handleTamper('PREV_HASH')}
                  className="btn-touch-target p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold text-left transition-all"
                >
                  ⚠️ 2. Corrupt PrevHash Chain Pointer
                </button>
                <button
                  type="button"
                  onClick={() => handleTamper('EVIDENCE')}
                  className="btn-touch-target p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold text-left transition-all"
                >
                  ⚠️ 3. Modify Evidence SHA-256 Fingerprint
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  className="btn-touch-target p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold text-center transition-all mt-1"
                >
                  ✓ Restore Pristine Authentic Record
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Environment Reset with Confirmation */}
          <GlassCard isDark={isDark} className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#0F4C81] dark:text-sky-400" />
              <span>Demo Environment Reset</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Restores initial fictional demo complaints and offices. Requires explicit confirmation to distinguish it from ordinary operations.
            </p>

            <Button
              variant="outline"
              className="w-full justify-start text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 btn-touch-target"
              onClick={() => setShowResetConfirmModal(true)}
              icon={RefreshCw}
            >
              Reset Demo Data to Baseline
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-xs border-purple-500/40 text-purple-700 dark:text-purple-300 btn-touch-target"
              onClick={handleFastForwardEscalate}
              icon={FastForward}
            >
              Simulate Autonomous SLA Escalation
            </Button>
          </GlassCard>

          {/* Prohibited Operations Card */}
          <GlassCard isDark={isDark} className="space-y-3 border-dashed border-red-500/40">
            <div className="flex items-center space-x-2 text-xs font-bold text-red-500 uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4" />
              <span>Prohibited Administrative Operations</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              To guarantee that complaints cannot quietly vanish, these operations are locked by system architecture:
            </p>
            <div className="space-y-2 text-xs">
              <button
                disabled
                className="w-full p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 flex items-center justify-between cursor-not-allowed border border-slate-300 dark:border-slate-700 btn-touch-target"
              >
                <span className="flex items-center gap-1.5 line-through">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Grievance Record
                </span>
                <Badge variant="danger" size="sm">Locked</Badge>
              </button>
              <button
                disabled
                className="w-full p-2.5 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 flex items-center justify-between cursor-not-allowed border border-slate-300 dark:border-slate-700 btn-touch-target"
              >
                <span className="flex items-center gap-1.5 line-through">
                  <Lock className="w-3.5 h-3.5" /> Rewrite Audit Timestamp
                </span>
                <Badge variant="danger" size="sm">Locked</Badge>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Integrations, Escalation Configuration & Admin Action Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simulated Integrations & AI Configuration Panel */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Simulated Integrations & AI Engine Configuration</span>
              </h3>
              <Badge variant="success" size="sm">All Bridges Active</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* DigiLocker */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>DigiLocker Sandbox Bridge</span>
                  <Badge variant="success" size="sm">Simulated Active</Badge>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Simulates OAuth2 doc issuance for Aadhaar & caste verification. Latency: 14ms.
                </p>
                <div className="font-mono text-[10px] text-slate-400">Token: SHA256-DIGILOCKER-DEMO-VALIDATED</div>
              </div>

              {/* Aadhaar OTP */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Aadhaar e-KYC Simulator</span>
                  <Badge variant="success" size="sm">Mock UIDAI</Badge>
                </div>
                <p className="text-slate-500 text-[11px]">
                  6-digit simulated OTP verification with instant client-side hash handshake.
                </p>
                <div className="font-mono text-[10px] text-slate-400">Standard Test OTP: 123456</div>
              </div>

              {/* Sovereign AI Backend */}
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-1">
                <div className="flex items-center justify-between font-bold text-purple-700 dark:text-purple-300">
                  <span>Sovereign Local AI Backend</span>
                  <Badge variant="purple" size="sm">Port 5050 Online</Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Local Node HTTP proxy (server/aiServer.mjs) with Gemini Flash fallback.
                </p>
                <div className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                  Endpoint: http://127.0.0.1:5050/api/ai/extract
                </div>
              </div>

              {/* SMS & Notification Bridge */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>SMS & Citizen Dispatcher</span>
                  <Badge variant="primary" size="sm">Mock Gateway</Badge>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Dispatches simulated SLA escalation and inquiry notices to citizen mobile numbers.
                </p>
                <div className="font-mono text-[10px] text-slate-400">Notices Dispatched: 18</div>
              </div>
            </div>
          </GlassCard>

          {/* Statutory Escalation Configuration & Deadlines Matrix */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#E06820]" />
                <span>Statutory Escalation Configuration & SLAs</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">4-Tier Governance Model</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 space-y-1">
                <strong className="block text-[11px] uppercase">Level 1: GRO</strong>
                <div className="font-mono text-base font-bold">7 Days</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Ward Grievance Redressal Officer investigation</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                <strong className="block text-[11px] uppercase">Level 2: Appellate</strong>
                <div className="font-mono text-base font-bold">15 Days</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">First Appellate Authority (Joint Commissioner)</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 space-y-1">
                <strong className="block text-[11px] uppercase">Level 3: Lokayukta</strong>
                <div className="font-mono text-base font-bold">30 Days</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Anti-Corruption Bureau / Lokayukta Bench III</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                <strong className="block text-[11px] uppercase">Level 4: High Court</strong>
                <div className="font-mono text-base font-bold">Immediate</div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Article 226 Constitutional Writ of Mandamus</p>
              </div>
            </div>
          </GlassCard>

          {/* Append-Only Administrative Action Audit Log */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Administrative Actions Audit Log (Append-Only)</span>
              </h3>
              <Badge variant="purple" size="sm">{adminActionLog.length} Events</Badge>
            </div>

            <p className="text-xs text-slate-500">
              Every date shift, test trigger, and baseline reset is permanently recorded in this tamper-evident admin log:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {adminActionLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{log.action}</span>
                    <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">{log.details}</p>
                  <div className="text-[10px] text-slate-400">Actor: <strong>{log.actor}</strong> • ID: {log.id}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ─── MODAL: EXPLICIT CONFIRMATION FOR DEMO RESET ──────────────────── */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-white dark:bg-slate-900 border border-amber-500/50 shadow-2xl relative space-y-4 text-xs">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Confirm Demonstration Environment Reset
                </h3>
                <span className="text-[11px] text-slate-500">Demo-Only Environment Operation</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>CRITICAL AUDIT NOTICE:</strong> This action will restore the initial benchmark fictional grievances, offices, and sample evidence files.
              This is a <strong>demo-only environment reset</strong> and NOT an ordinary complaint deletion.
              Existing historical audit log entries and administrator event chains will <strong>NOT</strong> be deleted.
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to re-initialize the demonstration data store?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirmModal(false)}
                className="btn-touch-target"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReset}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold btn-touch-target"
              >
                Confirm Environment Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tamper Verification Modal */}
      {selectedComplaint && (
        <RecordVerificationModal
          complaint={selectedComplaint}
          isOpen={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
        />
      )}
    </div>
  );
}
