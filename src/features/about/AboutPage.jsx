import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldCheck,
  Scale,
  Clock,
  Lock,
  Landmark,
  FileCheck,
  Users,
} from 'lucide-react';

export default function AboutPage() {
  const { isDark } = useTheme();

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8">
      <PageHeader
        title="About CitizenConnect — Building Citizen-Powered Accountability"
        subtitle="CitizenConnect was designed around a single non-negotiable principle: A complaint against an official cannot quietly vanish. It moves up the administrative chain on time, and every citizen can find free legal help."
        badge={<Badge variant="saffron" dot>Constitutional Civic Tech</Badge>}
        breadcrumbs={[{ label: 'Platform' }, { label: 'About Us' }]}
        isDark={isDark}
      />

      <div className="space-y-8">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard isDark={isDark}>
            <div className="w-12 h-12 rounded-2xl bg-[#0F4C81] flex items-center justify-center text-white mb-4 shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Automated Escalation Protocol</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              When an inquiry window lapses without certified departmental compliance, the case shifts upward automatically: from Ward Officer → First Appellate Authority → Lokayukta / Vigilance Commission.
            </p>
          </GlassCard>

          <GlassCard isDark={isDark}>
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white mb-4 shadow-md">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Article 39A Free Legal Aid</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Bridging citizens with the National Legal Services Authority (NALSA) 15100 helpline and empanelled pro-bono advocates to navigate statutory appeals, RTI filings, and writ petitions.
            </p>
          </GlassCard>

          <GlassCard isDark={isDark}>
            <div className="w-12 h-12 rounded-2xl bg-[#107C41] flex items-center justify-center text-white mb-4 shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Cryptographic Audit Trails</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every status change, official viewing event, hearing order, and evidence document is logged with SHA-256 hashes in an immutable audit ledger, guaranteeing complete chain-of-custody.
            </p>
          </GlassCard>
        </div>

        {/* Legal & Fictional Disclaimer */}
        <GlassCard isDark={isDark} className="border-amber-500/30">
          <div className="flex items-start space-x-3">
            <Landmark className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-base text-amber-600 dark:text-amber-400">
                Educational Demonstration & Fictional Simulation Notice
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                CitizenConnect is an advanced civic accountability design prototype. All citizen names, officials, office locations, case numbers, and legal counselors presented in this demonstration environment are <strong>strictly fictional</strong>. Government integrations (DigiLocker, CVC, Lokayukta, NALSA) are simulated to illustrate architectural flows.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
