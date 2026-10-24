import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DEMO_ROLES } from '../../services/dataShaping';
import { Link } from 'react-router-dom';
import {
  DEMO_OFFICE_PROFILES,
  calculateAccountabilityIndicator,
  MIN_CLOSED_COMPLAINTS_THRESHOLD,
} from '../../data/publicRecordsData';
import {
  Globe,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Shield,
  FileCheck,
  TrendingUp,
  AlertTriangle,
  Lock,
  EyeOff,
  HelpCircle,
  FileWarning,
  ExternalLink,
  ChevronRight,
  X,
  Info,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react';

export default function PublicRecordsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { getComplaintsForRole, departments } = useData();

  // Public data projection: strictly sanitized, no citizen PII, no phone, no witnesses
  const publicComplaints = getComplaintsForRole(DEMO_ROLES.PUBLIC, user);

  // Active view: 'search' | 'ledger' | 'offices' | 'how-calculated'
  const [activeTab, setActiveTab] = useState('search');

  // Search & Filter State
  const [complaintIdQuery, setComplaintIdQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Single Complaint Inspection state
  const [inspectedComplaint, setInspectedComplaint] = useState(null);

  // Selected Office Profile Modal
  const [selectedOfficeProfile, setSelectedOfficeProfile] = useState(null);

  // "Report an Error" Modal State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTargetRecord, setErrorTargetRecord] = useState(null);
  const [errorCategory, setErrorCategory] = useState('Office Jurisdiction Inaccuracy');
  const [errorDetails, setErrorDetails] = useState('');
  const [errorSuccessMsg, setErrorSuccessMsg] = useState('');

  // Search by complaint ID or keyword
  const searchResults = useMemo(() => {
    if (!complaintIdQuery.trim()) return publicComplaints;
    const q = complaintIdQuery.trim().toLowerCase();
    return publicComplaints.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q) ||
        c.office?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
    );
  }, [complaintIdQuery, publicComplaints]);

  // Filtered public ledger
  const filteredLedger = useMemo(() => {
    return publicComplaints.filter((c) => {
      const matchesDept =
        selectedDeptFilter === 'all' ||
        c.department?.toLowerCase().includes(selectedDeptFilter.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'restricted' && c.isRestricted) ||
        (selectedStatusFilter === 'closed' && c.publicStatus.includes('Closed')) ||
        (selectedStatusFilter === 'active' && !c.isRestricted && !c.publicStatus.includes('Closed'));

      return matchesDept && matchesStatus;
    });
  }, [publicComplaints, selectedDeptFilter, selectedStatusFilter]);

  // Handle direct ID search lookup
  const handleInspectComplaint = (record) => {
    setInspectedComplaint(record);
    setActiveTab('inspect');
  };

  // Handle Error Submission
  const handleSubmitError = (e) => {
    e.preventDefault();
    setErrorSuccessMsg(
      `Error report logged for ${errorTargetRecord?.id || 'Public Record'}. A public audit flag (TICKET-ERR-${Math.floor(
        1000 + Math.random() * 9000
      )}) has been appended for reviewer verification.`
    );
    setShowErrorModal(false);
    setErrorDetails('');
    setTimeout(() => setErrorSuccessMsg(''), 6000);
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

      {/* 2. Page Header */}
      <PageHeader
        title="Public Accountability Records & Open Redress Ledger"
        subtitle="Search individual complaints by ID to inspect public-safe timelines, or review department accountability indicators. All published data is strictly scrubbed of personal identities."
        badge={<Badge variant="success" dot>Open Public Ledger</Badge>}
        breadcrumbs={[{ label: 'Public Transparency' }, { label: 'Accountability Ledger' }]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('how-calculated')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'how-calculated'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                  : isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How This is Calculated</span>
            </button>
          </div>
        }
        isDark={isDark}
      />

      {/* 3. Strict Public Data Privacy & Methodology Notice */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5">Strict Public Data Privacy & Statutory Principle:</strong>
          <span>
            Citizen identities, phone numbers, witness names, private evidence, and sensitive descriptions are
            <strong> strictly excluded</strong> from the public ledger. Complaint volume is <em>never</em> treated as
            proof of guilt or misconduct; only formal reviewer-verified findings are recorded.
          </span>
        </div>
      </div>

      {/* Notification Toast for Error Report */}
      {errorSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{errorSuccessMsg}</span>
        </div>
      )}

      {/* 4. Top Navigation Bar for Public Accountability Features */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('search');
            setInspectedComplaint(null);
          }}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'search' || activeTab === 'inspect'
              ? 'border-[#0F4C81] text-[#0F4C81] dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search Complaint ID</span>
        </button>

        <button
          onClick={() => setActiveTab('offices')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'offices'
              ? 'border-[#0F4C81] text-[#0F4C81] dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department & Office Profiles ({DEMO_OFFICE_PROFILES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-[#0F4C81] text-[#0F4C81] dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Complete Public Ledger ({publicComplaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('how-calculated')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'how-calculated'
              ? 'border-[#0F4C81] text-[#0F4C81] dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Indicator Methodology</span>
        </button>
      </div>

      {/* ─── TAB 1: SEARCH COMPLAINT ID & INSPECTION ───────────────────────── */}
      {(activeTab === 'search' || activeTab === 'inspect') && (
        <div className="space-y-6">
          {/* Search Box */}
          <GlassCard isDark={isDark} className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={complaintIdQuery}
                  onChange={(e) => {
                    setComplaintIdQuery(e.target.value);
                    if (inspectedComplaint) setInspectedComplaint(null);
                  }}
                  placeholder="Enter Complaint ID (e.g. CC-2026-DL-28491, CC-2026-KA-71829)..."
                  className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] font-mono ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              {complaintIdQuery && (
                <button
                  onClick={() => {
                    setComplaintIdQuery('');
                    setInspectedComplaint(null);
                  }}
                  className="px-3 py-3 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
              <span>
                Search results show <strong>only public-safe parameters</strong>: ID, Department, Office, Category, Status, and Timeline.
              </span>
              <span className="font-mono text-[11px]">
                Try: <button onClick={() => setComplaintIdQuery('CC-2026-DL-28491')} className="underline text-sky-600 dark:text-sky-400">CC-2026-DL-28491</button> (Active) or{' '}
                <button onClick={() => setComplaintIdQuery('CC-2026-KA-71829')} className="underline text-amber-600 dark:text-amber-400">CC-2026-KA-71829</button> (Restricted)
              </span>
            </div>
          </GlassCard>

          {/* Detailed Single Inspected Complaint View */}
          {inspectedComplaint ? (
            <GlassCard isDark={isDark} className="space-y-6 border-2 border-[#0F4C81]/30">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-[#E06820]">
                      {inspectedComplaint.id}
                    </span>
                    {inspectedComplaint.isRestricted ? (
                      <Badge variant="warning" size="sm">
                        Restricted Public Record
                      </Badge>
                    ) : (
                      <Badge
                        variant={inspectedComplaint.publicStatus.includes('Closed') ? 'success' : 'primary'}
                        size="sm"
                      >
                        {inspectedComplaint.publicStatus}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">Public Verification File</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setErrorTargetRecord(inspectedComplaint);
                      setShowErrorModal(true);
                    }}
                    className="text-xs text-slate-500 border-slate-300 dark:border-slate-700"
                  >
                    <FileWarning className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Report an Error
                  </Button>
                  <button
                    onClick={() => setInspectedComplaint(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* RESTRICTED RECORD DISPLAY */}
              {inspectedComplaint.isRestricted ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>This Record is Restricted from Public View Under Statutory Reviewer Order</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block">Restriction Effective Date:</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {inspectedComplaint.restrictionDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Public-Safe Reason Category:</span>
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          {inspectedComplaint.publicSafeReasonCategory}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-amber-500/20">
                      In accordance with the Lokayukta Act and CitizenConnect Privacy Charter, sensitive narrative details,
                      witness declarations, and official memoranda are statutorily sealed to protect whistleblower safety
                      and preserve investigation integrity.
                    </p>
                  </div>

                  {/* Public-safe timeline for restricted record */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Public-Safe Procedural Timeline
                    </h4>
                    <div className="space-y-2">
                      {inspectedComplaint.publicTimeline.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <strong className="block text-slate-800 dark:text-slate-200">{step.publicLabel}</strong>
                            <span className="text-slate-400 text-[11px]">{step.office}</span>
                          </div>
                          <span className="font-mono text-slate-500">{step.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* UNRESTRICTED PUBLIC SAFE RECORD DISPLAY */
                <div className="space-y-6">
                  {/* Public-Safe Attributes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block">Complaint ID:</span>
                      <span className="font-mono font-bold text-[#E06820]">{inspectedComplaint.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Department:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inspectedComplaint.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Responsible Office:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inspectedComplaint.office}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Category:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inspectedComplaint.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Public Status:</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {inspectedComplaint.publicStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Filed Date:</span>
                      <span className="font-semibold">{inspectedComplaint.filedDate || 'Recorded'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Review Finding:</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {inspectedComplaint.finding || 'Under Review'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Privacy Scrubbing:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ All PII Masked
                      </span>
                    </div>
                  </div>

                  {/* Public-Safe Chronological Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Public-Safe Chronological Timeline
                    </h4>
                    <div className="space-y-2">
                      {inspectedComplaint.publicTimeline?.map((evt, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <strong className="block text-slate-800 dark:text-slate-200">
                                {evt.publicLabel}
                              </strong>
                              <span className="text-slate-500 text-[11px]">{evt.office}</span>
                            </div>
                          </div>
                          <span className="font-mono text-slate-400 text-right">{evt.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          ) : (
            /* Search Results Cards */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Displaying {searchResults.length} Public Records</span>
                <span>Click any record to inspect public-safe parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((rec) => (
                  <GlassCard
                    key={rec.id}
                    isDark={isDark}
                    className="p-4 space-y-3 hover:border-sky-500/40 transition-all cursor-pointer"
                    onClick={() => handleInspectComplaint(rec)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#E06820]">{rec.id}</span>
                          {rec.isRestricted ? (
                            <Badge variant="warning" size="sm">
                              Restricted
                            </Badge>
                          ) : (
                            <Badge
                              variant={rec.publicStatus?.includes('Closed') ? 'success' : 'primary'}
                              size="sm"
                            >
                              {rec.publicStatus}
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-bold mt-1 text-slate-900 dark:text-white">
                          {rec.category}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div>Department: <strong className="text-slate-700 dark:text-slate-300">{rec.department}</strong></div>
                      <div>Office: <strong className="text-slate-700 dark:text-slate-300">{rec.office}</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Filed: {rec.filedDate}</span>
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">Inspect Record →</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: DEPARTMENT & OFFICE PROFILES & ACCOUNTABILITY INDICATOR ── */}
      {activeTab === 'offices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold">Zonal Department & Office Performance Profiles</h3>
              <p className="text-xs text-slate-500">
                Transparent accountability indicators computed exclusively from documented responsiveness,
                SLA compliance, and substantiated review findings.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('how-calculated')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Read Indicator Formula</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_OFFICE_PROFILES.map((office) => {
              const indicator = calculateAccountabilityIndicator(office);

              return (
                <GlassCard key={office.id} isDark={isDark} className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500 font-semibold">{office.department}</span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {office.name}
                        </h4>
                        <p className="text-xs text-slate-400">{office.jurisdiction}</p>
                      </div>

                      {/* Accountability Indicator Badge */}
                      <div className="text-right flex-shrink-0">
                        {indicator.meetsThreshold ? (
                          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-right">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                              Accountability Score
                            </span>
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                              {indicator.score}%
                            </div>
                            <Badge variant={indicator.badgeVariant} size="sm">
                              Grade {indicator.grade}
                            </Badge>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-right max-w-[140px]">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Indicator
                            </span>
                            <div className="text-xs font-bold text-slate-400 mt-1">
                              Data Insufficient
                            </div>
                            <span className="text-[9px] text-slate-500 block mt-0.5">
                              &lt; 10 Closed Cases
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Complaint Counts by Status */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                      <strong className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2">
                        Complaint Volume by Procedural Status ({office.totalComplaints} Total)
                      </strong>
                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                          <div className="font-bold">{office.countsByStatus.active}</div>
                          <span className="text-[9px] text-slate-400 uppercase">Active</span>
                        </div>
                        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                          <div className="font-bold">{office.countsByStatus.underInvestigation}</div>
                          <span className="text-[9px] uppercase">Inquiry</span>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          <div className="font-bold">{office.countsByStatus.escalated}</div>
                          <span className="text-[9px] uppercase">Escalated</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          <div className="font-bold">{office.countsByStatus.closed}</div>
                          <span className="text-[9px] uppercase">Closed</span>
                        </div>
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300">
                          <div className="font-bold">{office.countsByStatus.restricted}</div>
                          <span className="text-[9px] uppercase">Restricted</span>
                        </div>
                      </div>
                    </div>

                    {/* Response & Acknowledgement Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Median Acknowledgement:</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {office.medianAckDisplay}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Median Response Time:</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                          {office.medianResponseDays} Days
                        </span>
                      </div>
                    </div>

                    {/* Findings Recorded Through Review */}
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                      <strong className="block text-[11px] uppercase tracking-wider text-purple-800 dark:text-purple-300">
                        Formal Review Determinations (Closed Cases)
                      </strong>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Substantiated:</span>
                          <span className="font-bold text-red-600 dark:text-red-400 font-mono">
                            {office.findings.substantiated}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Not Substantiated:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {office.findings.notSubstantiated}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">No Finding Possible:</span>
                          <span className="font-bold text-slate-500 font-mono">
                            {office.findings.noFindingPossible}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Insufficient Data Warning Notice */}
                    {!indicator.meetsThreshold && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          {indicator.statusNotice}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Nodal Officer: {office.nodalOfficer}</span>
                    <button
                      onClick={() => {
                        setErrorTargetRecord({ id: office.name, department: office.department });
                        setShowErrorModal(true);
                      }}
                      className="text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 font-semibold flex items-center gap-1"
                    >
                      <FileWarning className="w-3.5 h-3.5" />
                      <span>Report Error</span>
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: COMPLETE PUBLIC LEDGER WITH FILTERING ──────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <GlassCard isDark={isDark} className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={complaintIdQuery}
                  onChange={(e) => setComplaintIdQuery(e.target.value)}
                  placeholder="Filter by complaint ID, category, or location..."
                  className={`w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />
              </div>

              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className={`w-full sm:w-60 px-3 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                  isDark ? 'glass-input-dark' : 'glass-input-light'
                }`}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name.split(' ')[0]}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className={`w-full sm:w-48 px-3 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                  isDark ? 'glass-input-dark' : 'glass-input-light'
                }`}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Inquiries</option>
                <option value="closed">Closed / Resolved</option>
                <option value="restricted">Restricted Records</option>
              </select>
            </div>
          </GlassCard>

          {/* Ledger Table / Card List */}
          <div className="space-y-3">
            {filteredLedger.map((rec) => (
              <GlassCard
                key={rec.id}
                isDark={isDark}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-sky-500/40 transition-all cursor-pointer"
                onClick={() => handleInspectComplaint(rec)}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#E06820]">{rec.id}</span>
                    {rec.isRestricted ? (
                      <Badge variant="warning" size="sm">
                        Restricted Public View
                      </Badge>
                    ) : (
                      <Badge
                        variant={rec.publicStatus?.includes('Closed') ? 'success' : 'primary'}
                        size="sm"
                      >
                        {rec.publicStatus}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400">• {rec.category}</span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {rec.description}
                  </h4>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span>Department: <strong>{rec.department}</strong></span>
                    <span>•</span>
                    <span>Office: <strong>{rec.office}</strong></span>
                    <span>•</span>
                    <span>Filed: <strong>{rec.filedDate}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    Inspect Timeline →
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: HOW THIS IS CALCULATED (METHODOLOGY) ──────────────────── */}
      {activeTab === 'how-calculated' && (
        <GlassCard isDark={isDark} className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <Badge variant="purple" size="sm">
              Accountability Indicator Formula
            </Badge>
            <h3 className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
              Transparent Accountability Indicator Methodology
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              CitizenConnect enforces mathematical fairness: public bodies must be evaluated on verified
              compliance and responsiveness, never on raw allegation volume.
            </p>
          </div>

          {/* Mathematical Formula Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3">
            <div className="text-slate-400 uppercase tracking-widest text-[10px]">
              Core Indicator Formula:
            </div>
            <div className="text-sm sm:text-base font-bold text-purple-300">
              Accountability Score = (0.35 × R) + (0.40 × S) + (0.25 × Q)
            </div>
            <div className="space-y-1 text-slate-300 text-xs">
              <div>• <strong>R (Responsiveness Rate - 35%):</strong> Percentage of complaints acknowledged within the statutory SLA window (≤ 48 hours).</div>
              <div>• <strong>S (SLA Compliance Rate - 40%):</strong> Percentage of citizen grievances concluded without incurring an autonomous escalation breach.</div>
              <div>• <strong>Q (Resolution Quality - 25%):</strong> Rate calculated as 100% minus (Substantiated Breaches / Closed Complaints × 100%).</div>
            </div>
          </div>

          {/* Key Principles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                10
              </div>
              <strong className="block font-bold text-slate-800 dark:text-slate-200 pt-1">
                Minimum 10-Case Threshold Rule
              </strong>
              <p className="text-slate-500 leading-relaxed">
                Small sample sizes create wild statistical swings. The indicator is strictly suppressed until an
                office concludes at least <strong>10 closed cases</strong> during the evaluation period.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                ⚖
              </div>
              <strong className="block font-bold text-slate-800 dark:text-slate-200 pt-1">
                Allegations ≠ Misconduct
              </strong>
              <p className="text-slate-500 leading-relaxed">
                High complaint volume often reflects high public engagement or population density. A complaint is
                solely an allegation until substantiated through formal oversight review.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                12m
              </div>
              <strong className="block font-bold text-slate-800 dark:text-slate-200 pt-1">
                Rolling 12-Month Window
              </strong>
              <p className="text-slate-500 leading-relaxed">
                Only records concluded within the last 12 calendar months are eligible for scoring, rewarding recent
                systemic improvements and responsive grievance management.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-slate-500">
              Want to review the complete anti-vanishing architecture?
            </span>
            <Link
              to="/methodology"
              className="text-purple-600 dark:text-purple-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>View Architectural Whitepaper</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </GlassCard>
      )}

      {/* ─── MODAL: REPORT AN ERROR IN THIS RECORD ─────────────────────────── */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <Badge variant="warning" size="sm">
                Public Record Rectification
              </Badge>
              <h3 className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                Report an Error in this Record
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: <strong>{errorTargetRecord?.id || 'Public Ledger Record'}</strong> • {errorTargetRecord?.department || 'Civic Authority'}
              </p>
            </div>

            <form onSubmit={handleSubmitError} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Type of Inaccuracy:
                </label>
                <select
                  value={errorCategory}
                  onChange={(e) => setErrorCategory(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:ring-1 focus:ring-purple-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="Office Jurisdiction Inaccuracy">Incorrect Office / Jurisdiction Attribution</option>
                  <option value="Public Timeline Discrepancy">Public Timeline / Date Discrepancy</option>
                  <option value="Status Update Inconsistency">Procedural Status Inconsistency</option>
                  <option value="Factual Typographical Error">Factual Typographical Error</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Describe the Inaccuracy:
                </label>
                <textarea
                  required
                  rows={4}
                  value={errorDetails}
                  onChange={(e) => setErrorDetails(e.target.value)}
                  placeholder="Explain the discrepancy and provide factual context for reviewer verification..."
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500">
                Notice: Error reports are reviewed by the independent Oversight Reviewer. Approved corrections are appended to the immutable audit trail as a public Corrigendum.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErrorModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Submit Error Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
