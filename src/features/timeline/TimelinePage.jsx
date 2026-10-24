import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import AccountabilityTimeline from '../../components/timeline/AccountabilityTimeline';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Clock,
  Building,
  Shield,
  HeartPulse,
  Search,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export default function TimelinePage() {
  const { isDark } = useTheme();
  const { complaints, realComplaints, trackRealComplaint } = useData();
  const { role: userRole } = useAuth();
  const { currentLang } = useLanguage();
  const isHi = currentLang === 'hi';

  const [searchParams, setSearchParams] = useSearchParams();
  const { id: paramId } = useParams();

  // Active role preview state
  const [selectedRole, setSelectedRole] = useState(userRole || 'citizen');

  // Select complaint
  const complaintIdFromUrl = paramId || searchParams.get('id');
  const [selectedId, setSelectedId] = useState(() => {
    return complaintIdFromUrl || 'CC-2026-DL-28491';
  });

  const [customSearchId, setCustomSearchId] = useState('');
  const [customLoadedComplaint, setCustomLoadedComplaint] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Synchronize when URL changes
  useEffect(() => {
    if (complaintIdFromUrl && complaintIdFromUrl !== selectedId) {
      setSelectedId(complaintIdFromUrl);
    }
  }, [complaintIdFromUrl, selectedId]);

  // Combine real complaints and demo complaints
  const allAvailableComplaints = [
    ...(realComplaints || []),
    ...(customLoadedComplaint ? [customLoadedComplaint] : []),
    ...complaints,
  ];

  const currentComplaint =
    allAvailableComplaints.find(
      (c) =>
        c.id?.toLowerCase() === selectedId?.toLowerCase() ||
        c.referenceNumber?.toLowerCase() === selectedId?.toLowerCase() ||
        c.dbId?.toLowerCase() === selectedId?.toLowerCase()
    ) || complaints[0];

  const handleSelectScenario = (id) => {
    setSelectedId(id);
    setSearchParams({ id });
    setSearchError('');
  };

  const handleCustomSearch = async (e) => {
    e.preventDefault();
    const query = customSearchId.trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchError('');

    // Check existing in memory
    const existingMatch = allAvailableComplaints.find(
      (c) =>
        c.id?.toLowerCase() === query.toLowerCase() ||
        c.referenceNumber?.toLowerCase() === query.toLowerCase()
    );

    if (existingMatch) {
      setSelectedId(existingMatch.id || existingMatch.referenceNumber);
      setSearchParams({ id: existingMatch.id || existingMatch.referenceNumber });
      setCustomSearchId('');
      setSearchLoading(false);
      return;
    }

    // Attempt real database API lookup
    if (trackRealComplaint) {
      try {
        const real = await trackRealComplaint(query);
        if (real) {
          setCustomLoadedComplaint(real);
          setSelectedId(real.id || real.referenceNumber);
          setSearchParams({ id: real.id || real.referenceNumber });
          setCustomSearchId('');
          setSearchLoading(false);
          return;
        }
      } catch (err) {
        setSearchError(err.message || `No record found matching "${query}".`);
      }
    } else {
      setSearchError(`No record found matching "${query}".`);
    }

    setSearchLoading(false);
  };

  // Seed scenario definitions
  const SCENARIOS = [
    {
      id: 'CC-2026-DL-28491',
      title: isHi ? 'परिदृश्य क: नगर निगम - स्थानांतरण व अपीलीय वृद्धि' : 'Scenario A: Municipal Transfer & SLA Escalation',
      subtitle: isHi ? 'वार्ड 14 -> सतर्कता स्थानांतरण, समयसीमा चूक, स्तर 2 वृद्धि' : 'Ward 14 -> Vigilance transfer, missed deadline, Level 2 auto-escalation',
      icon: Building,
      badge: isHi ? 'स्थानांतरण व चूक' : 'Transfer & SLA Missed',
      badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'CC-2026-MH-49102',
      title: isHi ? 'परिदृश्य ख: पुलिस निगरानी - ऑडियो साक्ष्य व समीक्षा' : 'Scenario B: Police Oversight & Audio Evidence',
      subtitle: isHi ? 'नागरिक ऑडियो साक्ष्य, एसीपी प्रतिक्रिया, आगामी समीक्षा समयसीमा' : 'Citizen audio exhibit, ACP response, upcoming compliance deadline',
      icon: Shield,
      badge: isHi ? 'ऑडियो साक्ष्य व आगामी' : 'Audio & Upcoming SLA',
      badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
    },
    {
      id: 'CC-2026-UP-10482',
      title: isHi ? 'परिदृश्य ग: सिविल अस्पताल - अस्पष्टीकृत विसंगति' : 'Scenario C: Public Hospital & Anomaly Detection',
      subtitle: isHi ? 'आयुष्मान भारत कार्ड, अस्पष्टीकृत स्थिति परिवर्तन विसंगति' : 'Ayushman card denial, 1 deliberate unexplained status anomaly',
      icon: HeartPulse,
      badge: isHi ? 'विसंगति अलर्ट' : 'Anomaly Alert Flagged',
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <PageHeader
        title={isHi ? 'द अकाउंटेबिलिटी टाइमलाइन' : 'The Accountability Timeline'}
        subtitle={
          isHi
            ? 'नागरिक शिकायतों का पूर्ण, पारदर्शी, और अपरिवर्तनीय ऑडिट ट्रेल'
            : 'Immutable, chronological history tracking every status change, department handover, and statutory deadline.'
        }
      />

      {/* ── Scenario Picker & Controls Bar ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((scen) => {
          const isSelected = selectedId === scen.id;
          const Icon = scen.icon;
          return (
            <button
              key={scen.id}
              onClick={() => handleSelectScenario(scen.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 min-h-[110px] ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                  : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-2 rounded-xl ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                      {scen.title}
                    </h3>
                    <span className="font-mono text-[10px] text-slate-400">{scen.id}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${scen.badgeColor}`}
                >
                  {scen.badge}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {scen.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Role Persona Previewer & ID Search ─────────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Persona Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isHi ? 'भूमिका पूर्वावलोकन:' : 'Preview Perspective:'}</span>
          </span>
          {['citizen', 'official', 'reviewer', 'public'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                selectedRole === r
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Custom Complaint ID Search */}
        <form onSubmit={handleCustomSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={customSearchId}
              onChange={(e) => setCustomSearchId(e.target.value)}
              placeholder={isHi ? 'शिकायत संख्या दर्ज करें...' : 'Enter Complaint ID...'}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 transition-all shadow-sm min-h-[32px] flex items-center gap-1.5"
          >
            {searchLoading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            <span>{searchLoading ? (isHi ? 'खोज रहे हैं...' : 'Loading...') : (isHi ? 'खोजें' : 'Load')}</span>
          </button>
        </form>
      </div>

      {searchError && (
        <div className="p-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* ── Active Complaint Summary Overview ──────────────────────────────── */}
      {currentComplaint && (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {currentComplaint.id}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentComplaint.department}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                {currentComplaint.stageName || 'Active Procedural Stage'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentComplaint.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl">
              {currentComplaint.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/track?id=${currentComplaint.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>{isHi ? 'शिकायत ट्रैक करें' : 'Track View'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── The Master Accountability Timeline Component ───────────────────── */}
      <AccountabilityTimeline
        complaint={currentComplaint}
        role={selectedRole}
      />
    </div>
  );
}
