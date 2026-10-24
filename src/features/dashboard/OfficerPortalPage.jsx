import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
  Building,
  User,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function OfficerPortalPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { complaints, escalateComplaint } = useData();

  const [selectedComplaint, setSelectedComplaint] = useState(complaints[0]);
  const [officerNote, setOfficerNote] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const handleEscalateToSupervisor = () => {
    if (!selectedComplaint) return;
    escalateComplaint(selectedComplaint.id, 'Officer initiated supervisory review referral');
    setActionNotice('Case referred upward to First Appellate Authority.');
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handleResolveCase = () => {
    if (!selectedComplaint) return;
    setActionNotice('Resolution notice logged with digital cryptographic signature.');
    setTimeout(() => setActionNotice(''), 4000);
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title="Grievance Redressal Officer (GRO) Workbench"
        subtitle="Simulated departmental triage desk for monitoring pending complaints, filing statutory inquiry responses, and adhering to citizen charter deadlines."
        badge={<Badge variant="purple" dot>Official Role Active</Badge>}
        breadcrumbs={[{ label: 'Government Portal' }, { label: 'Officer Workbench' }]}
        isDark={isDark}
      />

      {actionNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Triage Queue */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">
              Department Triage Queue
            </h3>
            <span className="text-xs text-slate-500">{complaints.length} Cases</span>
          </div>

          {complaints.map((c) => {
            const isSelected = selectedComplaint?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-sky-950/60 border-sky-400 ring-1 ring-sky-400/40'
                      : 'bg-sky-50 border-sky-400 ring-1 ring-sky-300'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#E06820]">{c.id}</span>
                  <Badge variant={c.stage === 4 ? 'success' : c.stage >= 2 ? 'warning' : 'primary'} size="sm">
                    {c.stageName?.split(':')[0]}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm line-clamp-1">{c.title}</h4>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                  <span>{c.department.split(' ')[0]}</span>
                  <span className="font-semibold text-amber-500">
                    SLA: {c.slaDaysRemaining}d remaining
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Complaint Investigation Workarea */}
        <div className="lg:col-span-2">
          {selectedComplaint ? (
            <GlassCard isDark={isDark} className="space-y-6">
              <div className="flex justify-between items-start flex-wrap gap-2 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-mono font-bold text-[#E06820]">
                    {selectedComplaint.id}
                  </span>
                  <h2 className="text-xl font-bold mt-1">{selectedComplaint.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Complainant: {selectedComplaint.isAnonymous ? 'Whistleblower (Protected Identity)' : selectedComplaint.citizenName}
                  </p>
                </div>
                <Badge variant={selectedComplaint.stage >= 2 ? 'warning' : 'primary'} size="lg">
                  {selectedComplaint.stageName}
                </Badge>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Statement of Grievance
                </h4>
                <p className="text-sm p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Official Action Controls */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Officer Action & Hearing Entry
                </h4>
                <textarea
                  rows={3}
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="Record official inquiry findings, site inspection notes, or citizen correspondence..."
                  className={`w-full p-3.5 rounded-2xl text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-[#0F4C81] ${
                    isDark ? 'glass-input-dark' : 'glass-input-light'
                  }`}
                />

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleEscalateToSupervisor}
                    className="border-purple-400/40 text-purple-600 dark:text-purple-300"
                  >
                    Refer to Appellate Authority ↗
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleResolveCase}
                  >
                    Issue Resolution Order & Sign ✓
                  </Button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard isDark={isDark} className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold">Select a complaint from the triage queue</h3>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
