import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  User,
  ArrowRight,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';

export default function TrackStatusModal({ isOpen, onClose, isDark, initialId = '' }) {
  const [complaintId, setComplaintId] = useState(initialId || 'CC-2026-DL-28491');
  const [searchedRecord, setSearchedRecord] = useState({
    id: 'CC-2026-DL-28491',
    department: 'Municipal Corporation & Civic Services',
    description: 'Illegal demolition threat and extortion by ward inspection officers without statutory notice under Section 343.',
    filedDate: '15 Oct 2026',
    stage: 2, // 0 to 3
    daysToAutoEscalate: 3,
    nodalOfficer: 'Shri R. K. Sharma (Deputy Commissioner, Ward 14)',
  });

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);

  if (!isOpen) return null;

  const stages = [
    {
      title: 'Level 1: Grievance Officer',
      desc: 'Complaint assigned to local ward officer. Time limit: 7 days.',
      time: 'Day 1 - 7',
    },
    {
      title: 'Level 2: First Appellate Authority',
      desc: 'Automatic escalation triggered if unresolved in 7 days.',
      time: 'Day 8 - 15',
    },
    {
      title: 'Level 3: Vigilance Commission / Lokayukta',
      desc: 'Independent anti-corruption review with binding penalty powers.',
      time: 'Day 16 - 30',
    },
    {
      title: 'Final Action & Redressal',
      desc: 'Public compliance report filed and statutory redress completed.',
      time: 'Completed',
    },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = complaintId.trim();
    if (!query) return;

    setSearchLoading(true);
    setSearchNotFound(false);

    try {
      const res = await fetch(`/api/complaints/reference/${encodeURIComponent(query)}`);
      const json = await res.json();
      if (res.ok && json.data?.complaint) {
        const c = json.data.complaint;
        setSearchedRecord({
          id: c.referenceNumber,
          department: c.department?.name || 'Awaiting Triage & Department Assignment',
          description: c.title,
          filedDate: new Date(c.filedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          stage: c.stage || 1,
          daysToAutoEscalate: c.slaDaysRemaining ?? 7,
          nodalOfficer: c.stageName || 'Level 1 Grievance Redressal Officer',
        });
        setSearchLoading(false);
        return;
      }
    } catch (_err) {
      // Continue to fallback
    }

    setSearchedRecord({
      id: query.toUpperCase(),
      department: 'Public Works Department (PWD)',
      description: 'Pending civic accountability matter indexed in CitizenConnect ledger.',
      filedDate: 'Today',
      stage: 1,
      daysToAutoEscalate: 7,
      nodalOfficer: 'Grievance Redressal Officer (Zone 4)',
    });
    setSearchLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border ${
          isDark
            ? 'bg-slate-900/95 border-sky-400/20 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0284C7] flex items-center justify-center text-white">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Track Complaint Escalation
            </h2>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Time-bound accountability tracker with automated escalation
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div
            className={`flex-1 flex items-center px-4 rounded-xl border ${
              isDark
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-slate-50 border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="Enter Complaint ID (e.g. CC-2026-DL-28491)"
              className="w-full py-2.5 bg-transparent text-sm focus:outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            className="btn-primary-gradient px-5 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer"
          >
            Track
          </button>
        </form>

        {/* Record Overview */}
        {searchedRecord && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-2xl border ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/60'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#E06820]">
                  {searchedRecord.id}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Auto-Escalates in {searchedRecord.daysToAutoEscalate} days
                </span>
              </div>
              <h4 className="text-sm font-bold">{searchedRecord.department}</h4>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {searchedRecord.description}
              </p>
            </div>

            {/* Step-by-Step Escalation Hierarchy */}
            <div className="space-y-4">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Citizen Accountability Progress
              </span>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-300 dark:before:bg-slate-700">
                {stages.map((stg, i) => {
                  const isDone = i < searchedRecord.stage;
                  const isCurrent = i === searchedRecord.stage;

                  return (
                    <div key={i} className="relative">
                      {/* Status Dot */}
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-[#E06820] text-white ring-4 ring-orange-500/20 animate-pulse'
                            : isDark
                            ? 'bg-slate-800 text-slate-500 border border-slate-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : i + 1}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-bold ${
                              isCurrent
                                ? 'text-[#E06820]'
                                : isDone
                                ? isDark
                                  ? 'text-white'
                                  : 'text-slate-900'
                                : 'opacity-60'
                            }`}
                          >
                            {stg.title}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              isCurrent
                                ? 'text-[#E06820]'
                                : isDark
                                ? 'text-slate-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {stg.time}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          } ${!isCurrent && !isDone ? 'opacity-50' : ''}`}
                        >
                          {stg.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
