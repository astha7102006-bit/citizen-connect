import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import {
  Users,
  ThumbsUp,
  MapPin,
  Building,
  Clock,
  MessageSquare,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function CommunityFeedPage() {
  const { isDark } = useTheme();
  const { complaints } = useData();

  const [corroborations, setCorroborations] = useState({
    'CC-2026-MH-49102': 42,
    'CC-2026-DL-28491': 89,
    'CC-2026-KA-71829': 156,
  });

  const [hasVoted, setHasVoted] = useState({});

  const handleCorroborate = (id) => {
    if (hasVoted[id]) return;
    setCorroborations((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    setHasVoted((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title="Community Grievance Feed & Collective Corroboration"
        subtitle="Public infrastructure issues and civic failures affect entire neighborhoods. Corroborate existing complaints with '+1 Me Too' to raise their statutory priority."
        badge={<Badge variant="saffron" dot>Civic Solidarity</Badge>}
        breadcrumbs={[{ label: 'Community' }, { label: 'Public Issues' }]}
        isDark={isDark}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {complaints.map((c) => (
            <GlassCard key={c.id} isDark={isDark} className="space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-[#E06820]">{c.id}</span>
                  <h3 className="text-lg font-bold mt-0.5">{c.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{c.officeLocation}</span>
                    <span>•</span>
                    <Building className="w-3.5 h-3.5" />
                    <span>{c.department}</span>
                  </p>
                </div>
                <Badge variant={c.stage >= 2 ? 'warning' : 'primary'} size="sm">
                  {c.stageName?.split(':')[0]}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {c.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex-wrap gap-3">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>SLA: {c.slaDaysRemaining} days remaining</span>
                </div>

                <Button
                  size="sm"
                  variant={hasVoted[c.id] ? 'secondary' : 'primary'}
                  onClick={() => handleCorroborate(c.id)}
                  disabled={hasVoted[c.id]}
                  icon={ThumbsUp}
                >
                  {hasVoted[c.id] ? 'Corroborated ✓' : `+1 Me Too (${corroborations[c.id] || 0} Citizens Affected)`}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard isDark={isDark}>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0F4C81]" />
              How Corroboration Works
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
              When 50+ citizens in the same ward or PIN code corroborate a single grievance (such as broken water mains, power cuts, or road cave-ins):
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                <strong>Accelerated SLA:</strong> Statutory response clock is cut from 15 to 3 days.
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300">
                <strong>District Magistrate Notice:</strong> Automated notification dispatched to the District Collector.
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
