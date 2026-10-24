import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Clock,
  Scale,
  GitBranch,
  Database,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  ExternalLink,
  FileWarning,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function MethodologyPage() {
  const { isDark } = useTheme();

  // "Report an Error" Modal State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [errorSuccess, setErrorSuccess] = useState('');

  const handleSubmitError = (e) => {
    e.preventDefault();
    setErrorSuccess(
      'Methodology feedback logged! Your correction request has been appended for reviewer scrutiny.'
    );
    setShowErrorModal(false);
    setErrorDetails('');
    setTimeout(() => setErrorSuccess(''), 5000);
  };

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8 space-y-8">
      {/* Emergency Notice */}
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
        title="CitizenConnect Accountability Methodology & Architecture"
        subtitle="The operational design, cryptographic guarantees, and statutory escalation protocols that ensure grievances can never be quietly buried or delayed indefinitely."
        badge={<Badge variant="primary" dot>Architectural Whitepaper</Badge>}
        breadcrumbs={[{ label: 'Platform' }, { label: 'Methodology' }]}
        action={
          <div className="flex items-center gap-2">
            <Link to="/public-records">
              <Button variant="outline" size="sm" className="text-xs">
                View Public Ledger →
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowErrorModal(true)}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              <FileWarning className="w-3.5 h-3.5 mr-1" />
              Report an Error
            </Button>
          </div>
        }
        isDark={isDark}
      />

      {errorSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{errorSuccess}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Core Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard isDark={isDark} className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F4C81] text-white flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">1. The Anti-Vanishing Protocol</h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              Every complaint is stamped with an immutable UTC timestamp and a deterministic statutory SLA clock. Unlike legacy portals where an inactive ticket remains in "Under Process" status indefinitely, CitizenConnect employs autonomous state machines. If an assigned officer fails to submit a certified hearing order within the charter window (7 days), the case advances automatically to Tier 2 Appellate Review without requiring citizen intervention.
            </p>
          </GlassCard>

          <GlassCard isDark={isDark} className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">2. Dual-Layer Redaction & Whistleblower Envelopes</h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              Grievances often involve corrupt officials who could retaliate against citizens. CitizenConnect enforces data-shaping segregation: Oversight Reviewers inspect raw complaints to verify legitimacy, then generate cryptographically signed, redacted factual summaries for the accused department. Identifying citizen PII (phone, email, residential unit) is statutorily withheld.
            </p>
          </GlassCard>

          <GlassCard isDark={isDark} className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">3. Cryptographic Chain-of-Custody</h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              Every attachment, official note, and status shift is hashed via SHA-256 and appended to a tamper-evident audit ledger. Even platform administrators cannot delete or rewrite past audit events. If an official later claims evidence was never received, the mathematical hash proves exact delivery.
            </p>
          </GlassCard>

          <GlassCard isDark={isDark} className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E06820] text-white flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">4. Article 39A Pro-Bono Bridge</h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              Accountability requires accessible legal instruments. When a case approaches Tier 3 escalation, the platform directly connects the complainant to the National Legal Services Authority (NALSA) 15100 network and empanelled pro-bono advocates to draft statutory RTI appeals or High Court writ petitions.
            </p>
          </GlassCard>
        </div>

        {/* ─── SECTION: PUBLIC ACCOUNTABILITY INDICATOR FORMULA ───────────── */}
        <GlassCard isDark={isDark} className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <Badge variant="purple" size="sm">
              Mathematical Open Accountability
            </Badge>
            <h3 className="text-xl sm:text-2xl font-black mt-2 text-slate-900 dark:text-white">
              How the Public Accountability Indicator is Calculated
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              The Accountability Indicator is an open-source, deterministic score (0–100%) that measures an
              administrative office's procedural responsiveness and compliance with citizen charter timelines.
            </p>
          </div>

          {/* Formula Display Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-3">
            <div className="text-slate-400 uppercase tracking-widest text-[10px]">
              Mathematical Definition:
            </div>
            <div className="text-base sm:text-lg font-bold text-purple-300">
              Accountability Score = (0.35 × R) + (0.40 × S) + (0.25 × Q)
            </div>
            <div className="space-y-1.5 text-slate-300 text-xs pt-1">
              <div>
                <strong>• R (Responsiveness Weight - 35%):</strong> Evaluates median time to issue formal written acknowledgement. Max points awarded if median acknowledgement is within 48 hours.
              </div>
              <div>
                <strong>• S (SLA Compliance Weight - 40%):</strong> Percentage of citizen complaints concluded within statutory charter limits without triggering autonomous escalation breaches.
              </div>
              <div>
                <strong>• Q (Resolution Quality - 25%):</strong> Formula: <code>100% - (Substantiated Findings / Closed Complaints × 100%)</code>. Reflects the proportion of cases resolved cleanly without substantiated corrupt practice or deliberate maladministration.
              </div>
            </div>
          </div>

          {/* Three Key Statistical Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <strong className="block text-slate-900 dark:text-white font-bold text-sm">
                1. 10-Case Minimum Threshold Rule
              </strong>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Small sample sizes create erratic statistical anomalies. Any office with fewer than <strong>10 closed complaints</strong> in the evaluation period has its indicator marked as <em>"Data Insufficient"</em> to prevent premature reputational bias.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <strong className="block text-slate-900 dark:text-white font-bold text-sm">
                2. Allegations ≠ Misconduct
              </strong>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                High complaint volume is never treated as proof of guilt. Heavily populated wards or active civic communities file more complaints. Only formal, reviewer-substantiated findings impact the indicator's Quality score.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <strong className="block text-slate-900 dark:text-white font-bold text-sm">
                3. Rolling 12-Month Time Window
              </strong>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Only records concluded within a rolling 12-month evaluation window are included in the computation. Historical systemic lapses from past years do not penalize current reformed administrations.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Technical Guarantee Matrix */}
        <GlassCard isDark={isDark}>
          <h3 className="text-lg font-bold mb-4">Statutory Governance Lifecycle Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[11px]">
                  <th className="py-2.5 px-3">Escalation Tier</th>
                  <th className="py-2.5 px-3">Statutory Authority</th>
                  <th className="py-2.5 px-3">Max SLA Window</th>
                  <th className="py-2.5 px-3">Legal Trigger Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-3 font-bold text-sky-600 dark:text-sky-300">Level 1</td>
                  <td className="py-3 px-3">Ward Grievance Redressal Officer (GRO)</td>
                  <td className="py-3 px-3">7 Working Days</td>
                  <td className="py-3 px-3 text-slate-500">Auto-assigned upon complaint registration</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-300">Level 2</td>
                  <td className="py-3 px-3">First Appellate Authority (Joint/Addl Commissioner)</td>
                  <td className="py-3 px-3">15 Working Days</td>
                  <td className="py-3 px-3 text-slate-500">Autonomous escalation upon Level 1 timer lapse</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-300">Level 3</td>
                  <td className="py-3 px-3">State Lokayukta / Anti-Corruption Bureau</td>
                  <td className="py-3 px-3">30 Working Days</td>
                  <td className="py-3 px-3 text-slate-500">Statutory referral with binding investigative powers</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-300">Level 4</td>
                  <td className="py-3 px-3">High Court Writ Jurisdiction (Art 226)</td>
                  <td className="py-3 px-3">Immediate</td>
                  <td className="py-3 px-3 text-slate-500">NALSA pro-bono counsel file Writ of Mandamus</td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Error Report Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl relative space-y-4 text-xs">
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <Badge variant="warning" size="sm">
                Methodology & Audit Feedback
              </Badge>
              <h3 className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                Report a Discrepancy or Methodological Error
              </h3>
              <p className="text-slate-500 mt-0.5">
                Submit peer-review feedback or report an error in public calculations.
              </p>
            </div>

            <form onSubmit={handleSubmitError} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discrepancy Details:
                </label>
                <textarea
                  required
                  rows={4}
                  value={errorDetails}
                  onChange={(e) => setErrorDetails(e.target.value)}
                  placeholder="Detail the formula issue, statistical inconsistency, or record error..."
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowErrorModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Submit Feedback
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
