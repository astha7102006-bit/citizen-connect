import React, { useState, useMemo } from 'react';
import {
  Clock,
  Timer,
  ArrowRightLeft,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Copy,
  Check,
  FileText,
  AlertCircle,
  HelpCircle,
  Building,
  User,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  Send,
  X,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  TIMELINE_EVENT_TYPES,
  normalizeEventType,
  getEventVisualConfig,
  calculateTimelineStageDurations,
  computeTimelineAccountabilityMetrics,
  extractTransferHistory,
  detectTimelineAnomalies,
  filterTimelineForRole,
} from '../../services/timelineEventService';
import RecordVerificationModal from '../audit/RecordVerificationModal';

export default function AccountabilityTimeline({
  complaint,
  role: roleOverride,
  isCompact = false,
  className = '',
}) {
  const { role: contextRole, isAuthenticated } = useAuth();
  const { simulatedDate, appendAuditEvent, fetchRealComplaintTimeline } = useData();
  const { currentLang } = useLanguage();
  const isHi = currentLang === 'hi';

  const activeRole = roleOverride || contextRole || 'citizen';

  // Real backend timeline state
  const [liveEvents, setLiveEvents] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Component state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('oldest'); // 'oldest' | 'newest'
  const [expandedEvents, setExpandedEvents] = useState({});
  const [copiedHash, setCopiedHash] = useState(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false);
  const [showTransfersModal, setShowTransfersModal] = useState(false);

  // Fetch real database-backed timeline when authenticated or real record
  React.useEffect(() => {
    let isMounted = true;
    const isReal = Boolean(
      complaint &&
      (complaint.isRealRecord || complaint.dbId || (isAuthenticated && complaint.referenceNumber))
    );

    if (!isReal || !fetchRealComplaintTimeline) {
      setLiveEvents(null);
      setTimelineLoading(false);
      setTimelineError(null);
      return;
    }

    const loadLiveTimeline = async () => {
      setTimelineLoading(true);
      setTimelineError(null);
      try {
        const identifier = complaint.dbId || complaint.referenceNumber || complaint.id;
        const timeline = await fetchRealComplaintTimeline(identifier);
        if (!isMounted) return;

        const mapped = (timeline?.events || []).map((e) => ({
          sequence: e.sequence,
          eventId: e.eventId || `EVT-${(complaint.referenceNumber || complaint.id)?.slice(-5)}-${String(e.sequence).padStart(2, '0')}`,
          complaintId: e.complaintId || complaint.dbId || complaint.id,
          eventType: e.eventType,
          previousStatus: e.previousStatus || null,
          newStatus: e.newStatus || null,
          actorId: e.actorId || null,
          actorName: e.actorName || null,
          actorRole: e.actorRole || null,
          actor: e.actorName || (e.actorRole === 'Citizen' ? (complaint.isAnonymous ? (isHi ? 'मुखबिर (संरक्षित)' : 'Whistleblower (Protected)') : 'Citizen') : 'Official Authority'),
          responsibleDepartment: e.responsibleDepartment || complaint.department?.name || complaint.department || null,
          title: e.title || e.eventType,
          details: e.details || '',
          reason: e.reason || null,
          metadata: e.metadata || null,
          previousHash: e.previousHash,
          hash: e.hash,
          isoTimestamp: e.timestamp ? new Date(e.timestamp).toISOString() : null,
          timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) : '',
        }));

        setLiveEvents(mapped);
      } catch (err) {
        if (!isMounted) return;
        setTimelineError(err.message || 'Failed to load timeline from database.');
      } finally {
        if (isMounted) setTimelineLoading(false);
      }
    };

    loadLiveTimeline();

    return () => {
      isMounted = false;
    };
  }, [complaint?.id, complaint?.dbId, complaint?.referenceNumber, complaint?.isRealRecord, isAuthenticated, fetchRealComplaintTimeline, isHi, fetchTrigger]);

  const rawHistory = liveEvents || complaint?.auditHistory || [];
  const effectiveRefDate = (complaint?.isRealRecord || complaint?.dbId) ? new Date() : simulatedDate;

  // Role-filtered history
  const roleFilteredHistory = useMemo(() => {
    return filterTimelineForRole(rawHistory, activeRole);
  }, [rawHistory, activeRole]);

  // Stage durations enriched
  const enrichedHistory = useMemo(() => {
    return calculateTimelineStageDurations(roleFilteredHistory, effectiveRefDate);
  }, [roleFilteredHistory, effectiveRefDate]);

  // Summary Metrics
  const metrics = useMemo(() => {
    return computeTimelineAccountabilityMetrics(roleFilteredHistory, complaint, effectiveRefDate);
  }, [roleFilteredHistory, complaint, effectiveRefDate]);

  // Transfer history
  const transferHistory = useMemo(() => {
    return extractTransferHistory(roleFilteredHistory);
  }, [roleFilteredHistory]);

  // Anomaly detection
  const detectedAnomalies = useMemo(() => {
    return detectTimelineAnomalies(rawHistory);
  }, [rawHistory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: enrichedHistory.length,
      CITIZEN: 0,
      EVIDENCE: 0,
      OFFICIAL: 0,
      TRANSFER: 0,
      ESCALATION: 0,
      REVIEW: 0,
    };

    enrichedHistory.forEach((evt) => {
      const cfg = getEventVisualConfig(evt.eventType);
      const cat = cfg.categoryKey;
      if (cat === 'citizen') counts.CITIZEN++;
      else if (cat === 'evidence') counts.EVIDENCE++;
      else if (cat === 'official') counts.OFFICIAL++;
      else if (cat === 'transfer') counts.TRANSFER++;
      else if (cat === 'escalation' || cat === 'overdue') counts.ESCALATION++;
      else if (cat === 'verified_procedural') counts.REVIEW++;
    });

    return counts;
  }, [enrichedHistory]);

  // Filtered & Sorted events for presentation
  const displayedEvents = useMemo(() => {
    let list = [...enrichedHistory];

    // Filter by Category
    if (activeCategoryFilter !== 'ALL') {
      list = list.filter((evt) => {
        const cfg = getEventVisualConfig(evt.eventType);
        const cat = cfg.categoryKey;
        if (activeCategoryFilter === 'CITIZEN') return cat === 'citizen';
        if (activeCategoryFilter === 'EVIDENCE') return cat === 'evidence';
        if (activeCategoryFilter === 'OFFICIAL') return cat === 'official';
        if (activeCategoryFilter === 'TRANSFER') return cat === 'transfer';
        if (activeCategoryFilter === 'ESCALATION') return cat === 'escalation' || cat === 'overdue';
        if (activeCategoryFilter === 'REVIEW') return cat === 'verified_procedural';
        return true;
      });
    }

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((evt) => {
        const title = (evt.title || '').toLowerCase();
        const details = (evt.details || '').toLowerCase();
        const actor = (evt.actor || evt.actorName || '').toLowerCase();
        const dept = (evt.responsibleDepartment || '').toLowerCase();
        const reason = (evt.reason || '').toLowerCase();
        const eventId = (evt.eventId || '').toLowerCase();
        return (
          title.includes(query) ||
          details.includes(query) ||
          actor.includes(query) ||
          dept.includes(query) ||
          reason.includes(query) ||
          eventId.includes(query)
        );
      });
    }

    // Sort order
    if (sortOrder === 'newest') {
      list.reverse();
    }

    return list;
  }, [enrichedHistory, activeCategoryFilter, searchQuery, sortOrder]);

  // If no complaint provided
  if (!complaint) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400 opacity-60" />
        <p className="font-semibold">{isHi ? 'कोई शिकायत रिकॉर्ड नहीं चुना गया' : 'No complaint record selected'}</p>
        <p className="text-sm mt-1">{isHi ? 'समयरेखा देखने के लिए शिकायत चुनें' : 'Select a complaint to inspect its full accountability timeline.'}</p>
      </div>
    );
  }

  // Accordion toggle
  const toggleExpand = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const handleExpandAll = () => {
    const all = {};
    displayedEvents.forEach((evt) => {
      all[evt.eventId] = true;
    });
    setExpandedEvents(all);
  };

  const handleCollapseAll = () => {
    setExpandedEvents({});
  };

  const handleCopyHash = (hash, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Submit Official Clarification for Anomaly
  const handleSubmitClarification = async (e) => {
    e.preventDefault();
    if (!clarificationText.trim()) return;

    setClarificationSubmitting(true);
    try {
      const officialActor =
        activeRole === 'reviewer'
          ? 'Authorized Oversight Reviewer'
          : activeRole === 'official'
          ? 'Designated Grievance Official'
          : 'Statutory Redressal Desk';

      await appendAuditEvent(complaint.id, {
        eventType: TIMELINE_EVENT_TYPES.CORRECTION_RECORDED,
        actor: officialActor,
        reason: selectedAnomaly?.warningTitle || 'Procedural anomaly clarified upon supervisory audit',
        details: `Official Clarification: ${clarificationText.trim()}`,
        metadata: {
          clarifiesEventId: selectedAnomaly?.eventId || null,
          anomalyType: selectedAnomaly?.type || 'STATUS_AMENDMENT',
          auditedUnderClock: simulatedDate,
        },
      });

      setShowClarificationModal(false);
      setClarificationText('');
      setSelectedAnomaly(null);
    } catch (err) {
      console.error('Failed to append clarification:', err);
    } finally {
      setClarificationSubmitting(false);
    }
  };

  // "What happens next?" projection resolver
  const getWhatHappensNext = (eventType, complaintStage) => {
    const norm = normalizeEventType(eventType);
    switch (norm) {
      case TIMELINE_EVENT_TYPES.COMPLAINT_SUBMITTED:
        return isHi
          ? 'अगला कदम: 48 घंटे के भीतर वैधानिक पावती और जांच अधिकारी का आवंटन।'
          : 'Next Step: Statutory acknowledgement & allocation to Grievance Redressal Officer within 48 hours.';
      case TIMELINE_EVENT_TYPES.ACKNOWLEDGEMENT_RECORDED:
        return isHi
          ? 'अगला कदम: प्रारंभिक साक्ष्य परीक्षण और 7 कार्य दिवसों में स्थिति अद्यतन।'
          : 'Next Step: Preliminary evidence scrutiny & official inquiry update within 7 working days.';
      case TIMELINE_EVENT_TYPES.CITIZEN_EVIDENCE_ADDED:
        return isHi
          ? 'अगला कदम: जांच दल द्वारा डिजिटल साक्ष्य का सत्यापन और रिकॉर्ड में समावेशन।'
          : 'Next Step: Cryptographic verification and evidentiary incorporation into case record.';
      case TIMELINE_EVENT_TYPES.OFFICIAL_RESPONSE_RECEIVED:
        return isHi
          ? 'अगला कदम: शिकायतकर्ता द्वारा समीक्षा या अपीलीय प्राधिकरण के समक्ष विचार।'
          : 'Next Step: Complainant satisfaction review or escalation to Appellate Authority if unsatisfactory.';
      case TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_COMPLETED:
      case TIMELINE_EVENT_TYPES.DEPARTMENT_TRANSFER_REQUESTED:
        return isHi
          ? 'अगला कदम: नए विभाग द्वारा 7 कार्य दिवसों के भीतर फ़ाइल की स्वीकृति और कार्रवाई।'
          : 'Next Step: Receiving department acknowledgment & commencement of jurisdiction review within 7 working days.';
      case TIMELINE_EVENT_TYPES.DEADLINE_MISSED:
      case TIMELINE_EVENT_TYPES.COMPLAINT_ESCALATED:
        return isHi
          ? 'अगला कदम: प्रथम अपीलीय अधिकारी (संयुक्त आयुक्त / सतर्कता) द्वारा सुनवाई और नोटिस।'
          : 'Next Step: First Appellate Authority (Joint Commissioner / Vigilance) summon and inquiry review.';
      case TIMELINE_EVENT_TYPES.REVIEWER_FINDING_RECORDED:
        return isHi
          ? 'अगला कदम: वैधानिक निष्कर्ष का कार्यान्वयन और अनुपालन रिपोर्ट जारी करना।'
          : 'Next Step: Directorial enforcement of review finding and issuance of final closure memorandum.';
      case TIMELINE_EVENT_TYPES.COMPLAINT_CLOSED:
        return isHi
          ? 'शिकायत औपचारिक रूप से बंद है। यदि असंतुष्ट हैं तो 30 दिनों के भीतर अपील कर सकते हैं।'
          : 'Complaint officially closed. 30-day statutory window remains open for Lokayukta / Appellate Appeal.';
      default:
        return isHi
          ? 'अगला कदम: निर्धारित नागरिक सेवा मानक के अनुसार निरंतर निगरानी।'
          : 'Next Step: Ongoing procedural monitoring under Citizens Charter performance standards.';
    }
  };

  return (
    <section
      aria-label={isHi ? 'जवाबदेही समयरेखा' : 'The Accountability Timeline'}
      className={`accountability-timeline space-y-6 ${className}`}
    >
      {/* ── LIVE DATA STATUS BANNER (REAL DATABASE) ─────────────────────────── */}
      {timelineLoading && (
        <div className="p-3 px-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>{isHi ? 'सरकारी लेज़र से लाइव डेटा लोड हो रहा है...' : 'Refreshing timeline from government cryptographic ledger...'}</span>
          </div>
          <span className="text-[11px] font-mono opacity-70">GET /api/complaints/:id/timeline</span>
        </div>
      )}

      {timelineError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{timelineError}</span>
          </div>
          <button
            onClick={() => setFetchTrigger((prev) => prev + 1)}
            className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 text-rose-900 dark:text-rose-200 font-semibold transition-colors"
          >
            {isHi ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* ── 1. HEADER & TOP CONTROLS ────────────────────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Clock className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {isHi ? 'जवाबदेही समयरेखा' : 'The Accountability Timeline'}
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    {activeRole.toUpperCase()} {isHi ? 'दृश्य' : 'VIEW'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isHi
                    ? 'शिकायत दर्ज करने से लेकर निस्तारण तक प्रत्येक चरण का अपरिवर्तनीय ऑडिट ट्रेल'
                    : 'Auditable chronological history from submission to closure with stage duration & integrity checks.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              aria-label={isHi ? 'समयरेखा अखंडता सत्यापित करें' : 'Verify Timeline Cryptographic Integrity'}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isHi ? 'रिकॉर्ड सत्यापित करें' : 'Verify Record Integrity'}</span>
            </button>

            {transferHistory.length > 0 && (
              <button
                onClick={() => setShowTransfersModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                aria-label={isHi ? 'स्थानांतरण इतिहास देखें' : 'View Transfer History'}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>
                  {transferHistory.length} {isHi ? 'स्थानांतरण' : 'Transfers'}
                </span>
              </button>
            )}

            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setSortOrder(sortOrder === 'oldest' ? 'newest' : 'oldest')}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
                title={sortOrder === 'oldest' ? 'Switch to Newest First' : 'Switch to Oldest First'}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === 'oldest' ? (isHi ? 'पुरातन पहले' : 'Oldest First') : (isHi ? 'नवीनतम पहले' : 'Newest First')}</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleExpandAll}
                className="px-2.5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-h-[44px]"
              >
                {isHi ? 'सभी खोलें' : 'Expand All'}
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-2.5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-h-[44px]"
              >
                {isHi ? 'सभी समेटें' : 'Collapse All'}
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. ACCOUNTABILITY SUMMARY METRICS ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">
          {/* Metric 1: Total Elapsed Time */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>{isHi ? 'कुल व्यतीत समय' : 'Total Elapsed Time'}</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {metrics.totalElapsedDisplay}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isHi ? 'दायर करने से वर्तमान चरण तक' : 'Filing to current status'}
            </p>
          </div>

          {/* Metric 2: Current Stage Duration */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>{isHi ? 'वर्तमान चरण अवधि' : 'Current Stage Duration'}</span>
              <Timer className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {metrics.currentStageDurationDisplay}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isHi ? 'अंतिम दर्ज गतिविधि से' : 'Since latest recorded action'}
            </p>
          </div>

          {/* Metric 3: Number of Transfers */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>{isHi ? 'विभाग स्थानांतरण' : 'Department Transfers'}</span>
              <ArrowRightLeft className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {metrics.transferCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {metrics.transferCount > 0
                ? isHi
                  ? 'पूर्व अवधि सुरक्षित रखी गई'
                  : 'Prior department tenure logged'
                : isHi
                ? 'मूल विभाग में सक्रिय'
                : 'Remained at original office'}
            </p>
          </div>

          {/* Metric 4: Overdue Actions */}
          <div
            className={`p-4 rounded-xl border transition-colors ${
              metrics.overdueCount > 0
                ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-900/60'
                : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span className={metrics.overdueCount > 0 ? 'text-red-700 dark:text-red-400 font-semibold' : ''}>
                {isHi ? 'अतिदेय / छूटी समयसीमा' : 'Overdue / Missed SLAs'}
              </span>
              <AlertTriangle className={`w-4 h-4 ${metrics.overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
            <div
              className={`text-lg font-bold tracking-tight ${
                metrics.overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {metrics.overdueCount} {metrics.overdueCount === 1 ? 'Action' : 'Actions'}
            </div>
            <p
              className={`text-[11px] mt-1 ${
                metrics.overdueCount > 0 ? 'text-red-600/80 dark:text-red-400/80 font-medium' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {metrics.overdueCount > 0
                ? isHi
                  ? 'स्वतः अपीलीय ट्रिगर सक्रिय'
                  : 'Statutory escalation triggered'
                : isHi
                ? 'समयसीमा के भीतर'
                : 'Within charter compliance'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. DEADLINE & UPCOMING MILESTONE CARD ──────────────────────────── */}
      {!metrics.isResolvedOrClosed && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 mt-0.5">
                <Timer className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {isHi ? 'आगामी सांविधिक समयसीमा और मील का पत्थर' : 'Next Statutory Milestone & SLA Target'}
                  </h3>
                  {metrics.isOverdue && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
                      {isHi ? 'समयसीमा समाप्त' : 'SLA OVERDUE'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {isHi ? 'जिम्मेदार कार्यालय: ' : 'Responsible Office: '}
                  <span className="font-medium text-slate-900 dark:text-slate-200">{metrics.currentDepartment}</span>
                  {' • '}
                  {metrics.nextDeadline}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs">
              <span className="text-slate-500 dark:text-slate-400 block">{isHi ? 'सिम्युलेटेड क्लॉक:' : 'Simulated Clock:'}</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                {simulatedDate}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. UNEXPLAINED STATUS CHANGE WARNING BANNER (ANOMALY DETECTION) ─ */}
      {detectedAnomalies.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-rose-50/90 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900/80 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-rose-900 dark:text-rose-200 text-base">
                    {isHi ? 'अस्पष्टीकृत स्थिति परिवर्तन का पता चला' : 'Unexplained Status Change Detected — Review Required'}
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                    {detectedAnomalies.length} {detectedAnomalies.length === 1 ? 'Anomaly' : 'Anomalies'}
                  </span>
                </div>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1 max-w-2xl">
                  {isHi
                    ? 'अपरिवर्तनीय ऑडिट ट्रेल में बिना अधिकृत अधिकारी या बिना कारण के स्थिति परिवर्तन पाया गया है। नागरिक सुरक्षा हेतु स्पष्टीकरण आवश्यक है।'
                    : 'The automated integrity scanner flagged an event occurring without an identified official actor, missing reason, or out-of-sequence timestamp.'}
                </p>

                {/* List anomalies */}
                <ul className="mt-3 space-y-1.5 text-xs text-rose-950 dark:text-rose-200">
                  {detectedAnomalies.map((anom, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white/60 dark:bg-rose-900/30 p-2 rounded-lg border border-rose-200 dark:border-rose-800/50">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-rose-900 dark:text-white">
                          [{anom.eventId}]: {anom.warningTitle}
                        </span>
                        <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                          {anom.warningDetail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Reviewer / Official Action */}
            {(activeRole === 'reviewer' || activeRole === 'official' || activeRole === 'admin') && (
              <div className="shrink-0 flex items-center md:self-center">
                <button
                  onClick={() => {
                    setSelectedAnomaly(detectedAnomalies[0]);
                    setShowClarificationModal(true);
                  }}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 min-h-[48px]"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{isHi ? 'आधिकारिक स्पष्टीकरण दर्ज करें' : 'Record Official Clarification'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. FILTER TABS & SEARCH BAR ────────────────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Timeline Filters">
            {[
              { key: 'ALL', label: isHi ? 'सभी' : 'All', count: categoryCounts.ALL },
              { key: 'CITIZEN', label: isHi ? 'नागरिक' : 'Citizen', count: categoryCounts.CITIZEN },
              { key: 'EVIDENCE', label: isHi ? 'साक्ष्य' : 'Evidence', count: categoryCounts.EVIDENCE },
              { key: 'OFFICIAL', label: isHi ? 'अधिकारी' : 'Official', count: categoryCounts.OFFICIAL },
              { key: 'TRANSFER', label: isHi ? 'स्थानांतरण' : 'Transfers', count: categoryCounts.TRANSFER },
              { key: 'ESCALATION', label: isHi ? 'अपील / समयसीमा' : 'Deadlines & Escalation', count: categoryCounts.ESCALATION },
              { key: 'REVIEW', label: isHi ? 'समीक्षा' : 'Review & Procedural', count: categoryCounts.REVIEW },
            ].map((tab) => {
              const isActive = activeCategoryFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategoryFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 min-h-[36px] ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? 'समयरेखा खोजें...' : 'Search events, actors, depts...'}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Search timeline events"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 6. THE VERTICAL CONNECTED TIMELINE ─────────────────────────────── */}
      <div className="relative">
        {/* Continuous vertical timeline connector line */}
        <div
          className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800"
          aria-hidden="true"
        />

        {displayedEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Filter className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
            <p className="font-medium">{isHi ? 'कोई मेल खाता घटना रिकॉर्ड नहीं मिला' : 'No matching events found'}</p>
            <p className="text-xs text-slate-400 mt-1">
              {isHi ? 'फ़िल्टर या खोज शब्द बदलकर पुनः प्रयास करें।' : 'Try resetting your category filter or search query.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6" role="list">
            {displayedEvents.map((evt, index) => {
              const visualConfig = getEventVisualConfig(evt.eventType);
              const IconComponent = visualConfig.icon || CheckCircle2;
              const isExpanded = !!expandedEvents[evt.eventId];
              const isAnomaly = detectedAnomalies.some((a) => a.eventId === evt.eventId);
              const whatHappensNext = getWhatHappensNext(evt.eventType, complaint.stage);

              return (
                <div
                  key={evt.eventId || `evt-${index}`}
                  role="listitem"
                  className={`relative pl-14 transition-all ${
                    isAnomaly ? 'ring-2 ring-rose-400 dark:ring-rose-800 rounded-2xl' : ''
                  }`}
                >
                  {/* Event Marker Node */}
                  <div
                    className={`absolute left-2.5 top-3 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center shadow-md z-10 ${visualConfig.colorClasses.marker}`}
                    title={visualConfig.label}
                    aria-hidden="true"
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Event Content Card */}
                  <div
                    className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md ${
                      visualConfig.colorClasses.border
                    } border-l-4 ${isAnomaly ? 'border-rose-400 bg-rose-50/20' : ''}`}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => toggleExpand(evt.eventId)}
                      className="p-5 cursor-pointer select-none"
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpand(evt.eventId);
                        }
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Title & Category Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${visualConfig.colorClasses.badge}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {visualConfig.badgeText}
                          </span>

                          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {evt.eventId}
                          </span>

                          {isAnomaly && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {isHi ? 'अस्पष्टीकृत विसंगति' : 'Flagged Anomaly'}
                            </span>
                          )}
                        </div>

                        {/* Date & Stage Duration */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <time dateTime={evt.timestamp}>{evt.timestamp}</time>
                          </span>

                          {evt.durationLabel && (
                            <span
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                              title="Time complaint stayed at previous stage before this action"
                            >
                              ⏳ {evt.durationLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Title */}
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                        {evt.title || evt.eventType}
                      </h4>

                      {/* Actor & Department Meta */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {evt.actor ? (
                          <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{isHi ? 'कर्ता: ' : 'Actor: '}</span>
                            <span>{evt.actor}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{isHi ? 'अज्ञात कर्ता (अलर्ट)' : 'Unrecorded Actor (Anomaly)'}</span>
                          </span>
                        )}

                        {evt.responsibleDepartment && (
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Building className="w-3.5 h-3.5" />
                            <span>{evt.responsibleDepartment}</span>
                          </span>
                        )}
                      </div>

                      {/* Event Short Description */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
                        {evt.details}
                      </p>

                      {/* What happens next preview */}
                      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {isHi ? 'इसके बाद क्या होगा? ' : 'What happens next? '}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">{whatHappensNext}</span>
                        </div>
                      </div>

                      {/* Toggle indicator */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        <span>
                          {isExpanded
                            ? isHi
                              ? 'विवरण समेटने के लिए क्लिक करें'
                              : 'Click to collapse details'
                            : isHi
                            ? 'विस्तृत ऑडिट डेटा, हैश और साक्ष्य देखने के लिए क्लिक करें'
                            : 'Click to view cryptographic proof, attachments & metadata'}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {isExpanded ? (
                            <>
                              <span>{isHi ? 'कम दिखाएं' : 'Less'}</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>{isHi ? 'अधिक दिखाएं' : 'More'}</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ── EXPANDABLE DRAWER: METADATA & CRYPTOGRAPHIC PROOF ── */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 rounded-b-2xl space-y-4">
                        {/* Reason / Justification if recorded */}
                        {evt.reason && (
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs">
                            <span className="font-bold text-amber-900 dark:text-amber-200 block mb-0.5">
                              {isHi ? 'दर्ज कारण / औचित्य:' : 'Recorded Statutory Reason / Ground:'}
                            </span>
                            <span className="text-amber-800 dark:text-amber-300">{evt.reason}</span>
                          </div>
                        )}

                        {/* Event Attachments / Evidence Fingerprints */}
                        {evt.metadata?.fileName && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-teal-600" />
                              {isHi ? 'संलग्न साक्ष्य फ़ाइल:' : 'Attached Evidence Exhibit:'}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600 dark:text-slate-300">
                              <span className="font-mono">{evt.metadata.fileName}</span>
                              {evt.metadata.fileFingerprint && (
                                <span className="font-mono text-[11px] text-slate-400" title="SHA-256 Byte Fingerprint">
                                  Fingerprint: {evt.metadata.fileFingerprint.substring(0, 16)}...
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Transfer-specific Metadata */}
                        {(evt.metadata?.fromDepartment || evt.metadata?.toDepartment) && (
                          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 text-xs space-y-1.5">
                            <span className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                              <ArrowRightLeft className="w-4 h-4" />
                              {isHi ? 'अंतर-विभागीय स्थानांतरण विवरण:' : 'Inter-Department Transfer Routing:'}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                              <div>
                                <span className="text-slate-400 block text-[10px]">{isHi ? 'स्रोत विभाग' : 'From Department'}</span>
                                <span className="font-medium">{evt.metadata.fromDepartment || 'Initial Desk'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">{isHi ? 'गंतव्य विभाग' : 'To Department'}</span>
                                <span className="font-medium">{evt.metadata.toDepartment || evt.responsibleDepartment}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cryptographic SHA-256 Block Details */}
                        <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <Lock className="w-3.5 h-3.5" />
                              <span>{isHi ? 'क्रिप्टोग्राफ़िक ब्लॉक हैश' : 'Cryptographic Block Verification'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">SHA-256 Link</span>
                          </div>

                          <div className="space-y-1.5">
                            <div>
                              <span className="text-[10px] text-slate-400 block">{isHi ? 'वर्तमान ब्लॉक हैश' : 'Current Event Block Hash'}</span>
                              <div className="flex items-center justify-between gap-2 bg-slate-800/80 p-1.5 rounded-lg">
                                <span className="text-xs break-all text-emerald-300">
                                  {evt.hash || 'Unsealed Pending Genesis'}
                                </span>
                                {evt.hash && (
                                  <button
                                    onClick={(e) => handleCopyHash(evt.hash, e)}
                                    className="p-1 rounded hover:bg-slate-700 text-slate-300 shrink-0"
                                    title="Copy SHA-256 Hash"
                                    aria-label="Copy Hash"
                                  >
                                    {copiedHash === evt.hash ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block">{isHi ? 'पिछला ब्लॉक हैश' : 'Previous Block Hash (Parent Link)'}</span>
                              <div className="bg-slate-800/50 p-1.5 rounded-lg text-[11px] text-slate-400 break-all">
                                {evt.previousHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7. DEPARTMENT TRANSFER HISTORY MODAL ───────────────────────────── */}
      {showTransfersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {isHi ? 'विस्तृत स्थानांतरण इतिहास' : 'Department Transfer History'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isHi ? 'फ़ाइल स्थानांतरण, कारण और कार्यभार की पूर्ण समयरेखा' : 'Inter-agency handover chronology and statutory compliance records.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTransfersModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {transferHistory.map((tr, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isHi ? `स्थानांतरण #${idx + 1}` : `Transfer Handover #${idx + 1}`}
                    </span>
                    <span className="text-slate-500">{tr.date}</span>
                  </div>

                  <div className="flex items-center gap-3 py-1 font-semibold text-indigo-700 dark:text-indigo-300">
                    <span>{tr.fromDepartment}</span>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tr.toDepartment}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">{isHi ? 'अधिकृत कर्ता' : 'Initiating Officer'}</span>
                    <span className="text-slate-700 dark:text-slate-300">{tr.actor}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">{isHi ? 'स्थानांतरण का कारण' : 'Statutory Reason'}</span>
                    <span className="text-slate-700 dark:text-slate-300">{tr.reason}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                      {tr.statusText}
                    </span>
                    <span className="text-slate-500">
                      {isHi ? 'प्रतिक्रिया समयसीमा: ' : 'Receiving Deadline: '}
                      {tr.receivingDeadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowTransfersModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. RECORD OFFICIAL CLARIFICATION MODAL ────────────────────────── */}
      {showClarificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <FileCheck2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {isHi ? 'आधिकारिक स्पष्टीकरण दर्ज करें' : 'Record Official Clarification'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isHi ? 'ऑडिट ट्रेल में अपरिवर्तनीय परिशिष्ट संलग्न करें' : 'Appends an auditable clarification event to seal the chain anomaly.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClarificationModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedAnomaly && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
                <span className="font-semibold text-rose-900 dark:text-rose-200 block">
                  Flagged: {selectedAnomaly.warningTitle}
                </span>
                <p className="text-rose-800 dark:text-rose-300 mt-0.5">{selectedAnomaly.warningDetail}</p>
              </div>
            )}

            <form onSubmit={handleSubmitClarification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isHi ? 'स्पष्टीकरण / जांच टिप्पणी विवरण:' : 'Official Clarification & Justification:'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={clarificationText}
                  onChange={(e) => setClarificationText(e.target.value)}
                  placeholder={
                    isHi
                      ? 'संबंधित अधिकारी का नाम, आदेश संख्या एवं स्थिति परिवर्तन का सांविधिक कारण लिखें...'
                      : 'State official order reference, responsible officer designation, and rationale for this procedural status transition...'
                  }
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClarificationModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={clarificationSubmitting || !clarificationText.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md flex items-center gap-1.5 min-h-[44px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {clarificationSubmitting
                      ? isHi
                        ? 'दर्ज हो रहा है...'
                        : 'Sealing Event...'
                      : isHi
                      ? 'परिशिष्ट सुरक्षित करें'
                      : 'Append Clarification'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 9. CRYPTOGRAPHIC RECORD VERIFICATION MODAL ────────────────────── */}
      <RecordVerificationModal
        complaint={{
          ...complaint,
          auditHistory: rawHistory,
        }}
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </section>
  );
}
