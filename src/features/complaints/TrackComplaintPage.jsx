import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import {
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building,
  User,
  ArrowRight,
  ShieldAlert,
  FileText,
  History,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import RecordVerificationModal from '../../components/audit/RecordVerificationModal';
import AccountabilityTimeline from '../../components/timeline/AccountabilityTimeline';

export default function TrackComplaintPage() {
  const { isDark } = useTheme();
  const { complaints, escalateComplaint, trackRealComplaint } = useData();

  const [searchQuery, setSearchQuery] = useState(complaints[0]?.id || 'CC-2026-DL-28491');
  const [activeComplaint, setActiveComplaint] = useState(complaints[0]);
  const [escalateSuccess, setEscalateSuccess] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchError('');

    try {
      if (trackRealComplaint) {
        const real = await trackRealComplaint(query);
        if (real) {
          setActiveComplaint(real);
          setEscalateSuccess('');
          setSearchLoading(false);
          return;
        }
      }
    } catch (_err) {
      // Continue to fallback
    }

    const found = complaints.find(
      (c) => c.id.toLowerCase() === query.toLowerCase()
    );
    if (found) {
      setActiveComplaint(found);
      setEscalateSuccess('');
    } else {
      setSearchError(`No record found for ID: ${query}. Please check the reference number and try again.`);
    }
    setSearchLoading(false);
  };

  const handleSimulateEscalate = () => {
    if (!activeComplaint) return;
    escalateComplaint(activeComplaint.id, 'Simulated SLA window lapse review');
    const updated = complaints.find((c) => c.id === activeComplaint.id);
    if (updated) {
      setActiveComplaint({ ...updated, stage: Math.min((updated.stage || 1) + 1, 4) });
    }
    setEscalateSuccess('Complaint successfully escalated to next statutory authority tier!');
    setTimeout(() => setEscalateSuccess(''), 4000);
  };

  const stages = [
    {
      title: 'Level 1: Ward Grievance Officer',
      desc: 'Assigned to local field officer. Statutory limit: 7 days.',
      timeWindow: 'Day 1 - 7',
    },
    {
      title: 'Level 2: First Appellate Authority',
      desc: 'Automatic escalation triggered upon Level 1 SLA lapse.',
      timeWindow: 'Day 8 - 15',
    },
    {
      title: 'Level 3: Lokayukta / Vigilance Commission',
      desc: 'Independent statutory anti-corruption review with penal powers.',
      timeWindow: 'Day 16 - 30',
    },
    {
      title: 'Final Action & Public Redressal',
      desc: 'Statutory compliance report filed and matter officially closed.',
      timeWindow: 'Completed',
    },
  ];

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title="Time-Bound Complaint Escalation Tracker"
        subtitle="Track your complaint through each statutory level. If an officer fails to act, the system automatically advances your case to the next tier."
        badge={<Badge variant="primary" dot>Live SLA Monitor</Badge>}
        breadcrumbs={[{ label: 'Grievance Redressal' }, { label: 'Track Status' }]}
        isDark={isDark}
      />

      {/* Search Bar */}
      <GlassCard isDark={isDark} className="mb-8 p-4 sm:p-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Tracking Reference ID (e.g. CC-2026-DL-28491)"
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                isDark ? 'glass-input-dark' : 'glass-input-light'
              }`}
            />
          </div>
          <Button type="submit" disabled={searchLoading} variant="primary" className="w-full sm:w-auto">
            {searchLoading ? 'Tracking...' : 'Track Case'}
          </Button>
        </form>

        {searchError && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
            {searchError}
          </div>
        )}

        {/* Quick Reference Pills */}
        <div className="flex items-center gap-2 mt-3 text-xs overflow-x-auto pb-1 text-slate-500">
          <span className="font-semibold flex-shrink-0">Sample Cases:</span>
          {complaints.slice(0, 3).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSearchQuery(c.id);
                setActiveComplaint(c);
              }}
              className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:border-[#E06820] cursor-pointer whitespace-nowrap"
            >
              {c.id} ({c.department.split(' ')[0]})
            </button>
          ))}
        </div>
      </GlassCard>

      {escalateSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{escalateSuccess}</span>
        </div>
      )}

      {activeComplaint ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Complaint Details & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <GlassCard isDark={isDark}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div>
                  <span className="text-xs font-mono font-bold text-[#E06820]">
                    {activeComplaint.id}
                  </span>
                  <h2 className="text-xl font-bold mt-1">{activeComplaint.title}</h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{activeComplaint.department}</span>
                    <span>•</span>
                    <span>Filed on {activeComplaint.filedDate}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={
                      activeComplaint.stage === 4
                        ? 'success'
                        : activeComplaint.stage >= 2
                        ? 'warning'
                        : 'primary'
                    }
                    size="lg"
                    dot
                  >
                    {activeComplaint.stageName || 'In Progress'}
                  </Badge>

                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify Record (SHA-256)</span>
                  </button>
                </div>
              </div>

              {/* Countdown Banner */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Statutory SLA Window
                    </div>
                    <div className="text-base font-extrabold">
                      {activeComplaint.slaDaysRemaining > 0
                        ? `${activeComplaint.slaDaysRemaining} Days Remaining Before Next Escalation`
                        : 'Resolved / Action Completed'}
                    </div>
                  </div>
                </div>

                {activeComplaint.stage < 4 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSimulateEscalate}
                    className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  >
                    Simulate SLA Lapse Escalation ↗
                  </Button>
                )}
              </div>

              {/* 4-Stage Visual Escalation Hierarchy */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Statutory Escalation Stages
                </h3>

                <div className="space-y-3">
                  {stages.map((stg, idx) => {
                    const isDone = (activeComplaint.stage || 1) > idx;
                    const isCurrent = (activeComplaint.stage || 1) === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? isDark
                              ? 'bg-sky-950/40 border-sky-500/50 ring-1 ring-sky-500/30'
                              : 'bg-sky-50 border-sky-300 ring-1 ring-sky-300'
                            : isDone
                            ? isDark
                              ? 'bg-slate-800/40 border-slate-700/60 opacity-80'
                              : 'bg-slate-50 border-slate-200'
                            : 'border-dashed border-slate-300 dark:border-slate-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isCurrent ? (
                              <Clock className="w-4 h-4 text-sky-500 animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </div>
                            )}
                            <span className="font-bold text-sm">{stg.title}</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                            {stg.timeWindow}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                          {stg.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            {/* Audit History — Accountability Timeline */}
            <GlassCard isDark={isDark}>
              <div className="mb-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-[#E06820]" />
                  Ordered Append-Only Cryptographic Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Every event below is permanently recorded with SHA-256 hash linkage. No event can be deleted or edited.
                </p>
              </div>
              <AccountabilityTimeline complaint={activeComplaint} role="citizen" />
            </GlassCard>
          </div>

          {/* Right Column: Case Officers & Evidence */}
          <div className="space-y-6">
            <GlassCard isDark={isDark}>
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#0F4C81]" />
                Accountable Officials
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Named Official:</span>
                  <span className="font-semibold">{activeComplaint.officialNamed || 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jurisdiction:</span>
                  <span className="font-semibold">{activeComplaint.officeLocation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Complainant:</span>
                  <span className="font-semibold">
                    {activeComplaint.isAnonymous ? 'Whistleblower (Protected)' : activeComplaint.citizenName}
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard isDark={isDark}>
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Verified Evidence Locker
              </h3>
              {activeComplaint.evidenceFiles?.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {activeComplaint.evidenceFiles.map((ev, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold truncate max-w-[180px]">{ev.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Size: {ev.size}</div>
                      </div>
                      <Badge variant="success" size="sm">Verified</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No attachments uploaded with this complaint.</p>
              )}
            </GlassCard>
          </div>
        </div>
      ) : (
        <GlassCard isDark={isDark} className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Please select or enter a valid Complaint ID</h3>
        </GlassCard>
      )}
      {activeComplaint && (
        <RecordVerificationModal
          complaint={activeComplaint}
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  );
}
