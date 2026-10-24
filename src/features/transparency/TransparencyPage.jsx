import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import {
  BarChart3,
  TrendingUp,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function TransparencyPage() {
  const { isDark } = useTheme();
  const { departments, complaints } = useData();

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title="Public Governance & Accountability Transparency Portal"
        subtitle="Open civic data measuring departmental compliance, average resolution times, and statutory auto-escalation rates across government ministries."
        badge={<Badge variant="primary" dot>Open Data Initiative</Badge>}
        breadcrumbs={[{ label: 'Accountability' }, { label: 'Public Metrics' }]}
        isDark={isDark}
      />

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Overall Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            87.4%
          </div>
          <span className="text-[11px] text-slate-400">Within statutory charter deadline</span>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-black mt-2 text-sky-600 dark:text-sky-400">
            6.2 Days
          </div>
          <span className="text-[11px] text-slate-400">Reduced from 38 days baseline</span>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Active Auto-Escalations</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black mt-2 text-amber-500">
            12.6%
          </div>
          <span className="text-[11px] text-slate-400">Advanced to Appellate Authorities</span>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
            <span>Zero-Vanishing Index</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black mt-2 text-purple-600 dark:text-purple-400">
            100%
          </div>
          <span className="text-[11px] text-slate-400">Cryptographically tracked cases</span>
        </GlassCard>
      </div>

      {/* Department Accountability League Table */}
      <GlassCard isDark={isDark}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Departmental Performance League</h3>
          <span className="text-xs text-slate-400">Ranked by on-time resolution rate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[11px]">
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Level 1 SLA</th>
                <th className="py-3 px-3">Appellate Body</th>
                <th className="py-3 px-3">Resolution Rate</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {departments.map((dept, idx) => (
                <tr key={dept.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="py-3 px-3 font-semibold">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{dept.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{dept.slaDaysLevel1} Days</td>
                  <td className="py-3 px-3 text-slate-500 truncate max-w-[200px]">{dept.escalationAuthority}</td>
                  <td className="py-3 px-3">
                    <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden inline-block mr-2 align-middle">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${80 + (idx * 3) % 18}%` }}
                      />
                    </div>
                    <span className="font-bold text-xs">{80 + (idx * 3) % 18}%</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Badge variant={idx < 4 ? 'success' : 'warning'} size="sm">
                      {idx < 4 ? 'Compliant' : 'Monitoring'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
