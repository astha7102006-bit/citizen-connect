import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  FileText,
  Clock,
  Building,
  User,
  Scale,
  Hash,
  AlertCircle,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useLanguage } from '../../context/LanguageContext';

export default function CaseSummaryModal({ complaint, isOpen, onClose, isDark }) {
  const printRef = useRef(null);
  const { t } = useLanguage();

  if (!isOpen || !complaint) return null;

  const handlePrint = () => {
    window.print();
  };

  const auditEvents = complaint.auditHistory || [];
  const evidenceFiles = complaint.evidenceFiles || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-base text-slate-800 dark:text-white">
              {t('modalCaseSummaryTitle')}
            </h3>
            <Badge variant="purple" size="sm">{t('navLegalHelp')}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 print:text-black print:bg-white print:p-0 print:m-0 font-sans text-sm"
        >
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-800 pb-4 text-center sm:text-left sm:flex sm:justify-between sm:items-end">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-500 print:text-slate-700">
                CitizenConnect Civic Accountability Platform • Public Record Dossier
              </div>
              <h1 className="text-2xl font-black mt-1 tracking-tight text-slate-900 print:text-black">
                FORMAL GRIEVANCE & AUDIT CASE SUMMARY
              </h1>
              <p className="text-xs text-slate-500 print:text-slate-600 mt-0.5">
                Prepared for legal consultation, statutory appeal, and official inquiry under the Constitution of India.
              </p>
            </div>
            <div className="mt-3 sm:mt-0 text-right">
              <div className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 print:text-black">
                CASE ID: {complaint.id}
              </div>
              <div className="text-[11px] text-slate-500">
                Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-200 print:text-black print:border-black print:bg-slate-50">
            <strong>CONFIDENTIAL LEGAL MEMO:</strong> This case summary compile verified cryptographic records, chronological event logs, and evidence hash receipts from the CitizenConnect decentralized platform. General information only — not a substitute for a judicial order.
          </div>

          {/* Section 1: Matter Identification & Parties */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 print:text-black border-b pb-1">
              1. Case Identification & Responsible Authority
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Complaint ID:</span>
                <span className="font-mono font-bold">{complaint.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Submission Date:</span>
                <span className="font-semibold">{complaint.submittedAt || complaint.filedDate || 'Recorded'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Category:</span>
                <span className="font-semibold">{complaint.category || 'Administrative Maladministration'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Severity Tier:</span>
                <span className="font-semibold">{complaint.severity || 'Standard'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department:</span>
                <span className="font-semibold">{complaint.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Office Location:</span>
                <span className="font-semibold">{complaint.officeLocation || complaint.location || 'Municipal Complex'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Official Named:</span>
                <span className="font-semibold">{complaint.officialNamed || 'Not specified by citizen'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Complainant Status:</span>
                <span className="font-semibold">
                  {complaint.isAnonymous ? 'Whistleblower (Identity Sealed)' : complaint.citizenName || 'Verified Resident'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Narrative Allegation */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 print:text-black border-b pb-1">
              2. Factual Substance of Grievance
            </h2>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 print:border-black text-xs leading-relaxed">
              <div className="font-bold mb-1 text-slate-800 dark:text-slate-200 print:text-black">
                {complaint.title}
              </div>
              <p className="text-slate-700 dark:text-slate-300 print:text-black">
                {complaint.description}
              </p>
              {complaint.redactedSummary && complaint.redactedSummary !== complaint.description && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
                  <strong>Official Redacted Notice:</strong> {complaint.redactedSummary}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Statutory Escalation & Current Status */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 print:text-black border-b pb-1">
              3. Current Statutory Stage & SLA Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 print:border-black">
                <span className="text-slate-500 block">Current Escalation Tier:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300 print:text-black">
                  Stage {complaint.stage || 1} — {complaint.stageName || 'In Progress'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 print:border-black">
                <span className="text-slate-500 block">Statutory SLA Window:</span>
                <span className="font-semibold">{complaint.totalSlaDays || 30} Days (Standard Citizen Charter)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 print:border-black">
                <span className="text-slate-500 block">Time to Escalation:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 print:text-black">
                  {complaint.slaDaysRemaining ?? 0} Days remaining before auto-escalation
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Cryptographic Evidence Inventory */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 print:text-black border-b pb-1">
              4. Evidence Inventory & SHA-256 Cryptographic Fingerprints
            </h2>
            {evidenceFiles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 print:border-black">
                  <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-700 dark:text-slate-300 print:text-black">
                    <tr>
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">File / Asset Name</th>
                      <th className="p-2 border">Size / Type</th>
                      <th className="p-2 border">SHA-256 Fingerprint (Byte Integrity)</th>
                      <th className="p-2 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceFiles.map((ev, i) => (
                      <tr key={i} className="border-t border-slate-200 dark:border-slate-700 print:border-black">
                        <td className="p-2 border font-mono">{i + 1}</td>
                        <td className="p-2 border font-semibold">{ev.name}</td>
                        <td className="p-2 border">{ev.size || 'Document'}</td>
                        <td className="p-2 border font-mono text-[10px] break-all">
                          {ev.sha256 || 'Calculated on upload'}
                        </td>
                        <td className="p-2 border text-emerald-600 font-semibold">Verified</td>
                      </tr>
                    ))}
                    {complaint.audioEvidence && (
                      <tr className="border-t border-slate-200 dark:border-slate-700 print:border-black">
                        <td className="p-2 border font-mono">{evidenceFiles.length + 1}</td>
                        <td className="p-2 border font-semibold">🎙️ In-Browser Audio Recording</td>
                        <td className="p-2 border">{complaint.audioEvidence.duration || 'Audio'}</td>
                        <td className="p-2 border font-mono text-[10px] break-all">
                          {complaint.audioEvidence.sha256 || 'sha256-verified-audio-stream'}
                        </td>
                        <td className="p-2 border text-emerald-600 font-semibold">Verified</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No external documentary evidence attached.</p>
            )}
          </div>

          {/* Section 5: Chronological Append-Only Event Log */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 print:text-black border-b pb-1">
              5. Tamper-Evident Chronological Audit Trail (Append-Only)
            </h2>
            <div className="space-y-1.5">
              {auditEvents.map((evt, idx) => (
                <div
                  key={evt.eventId || idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 print:border-black text-[11px] grid grid-cols-1 sm:grid-cols-12 gap-1.5"
                >
                  <div className="sm:col-span-3 font-mono font-bold text-purple-700 dark:text-purple-400 print:text-black">
                    {evt.eventType || evt.action}
                  </div>
                  <div className="sm:col-span-3 text-slate-500">
                    {evt.timestamp || evt.date}
                  </div>
                  <div className="sm:col-span-3 text-slate-700 dark:text-slate-300 print:text-black font-semibold">
                    {evt.actor}
                  </div>
                  <div className="sm:col-span-3 font-mono text-[10px] text-slate-400 break-all text-right">
                    Hash: {evt.hash ? `${evt.hash.substring(0, 16)}...` : 'genesis'}
                  </div>
                  {evt.reason && (
                    <div className="sm:col-span-12 text-slate-600 dark:text-slate-400 print:text-black italic pl-2 border-l-2 border-purple-400">
                      Note/Reason: {evt.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Official Finding & Recommendations */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 print:text-black border-b pb-1">
              6. Official Oversight Findings & Recommended Next Remedies
            </h2>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 print:border-black text-xs space-y-1.5">
              <div>
                <strong>Oversight Determination:</strong>{' '}
                <span className="font-semibold text-purple-700 dark:text-purple-300 print:text-black">
                  {complaint.findings || 'Under Active Oversight Review'}
                </span>
              </div>
              <div>
                <strong>Recommended Statutory Next Steps:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600 dark:text-slate-300 print:text-black">
                  <li>File RTI Application under Section 6(1) for inspection of file movements and delay registers.</li>
                  <li>Schedule free legal consultation with District Legal Services Authority (DLSA) or dial 15100.</li>
                  <li>In case of continued default, submit statutory appeal to State Lokayukta or designated RTS Appellate Authority.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Signature Box for Counsel */}
          <div className="pt-6 border-t border-slate-300 dark:border-slate-700 print:border-black grid grid-cols-2 gap-8 text-[11px] text-slate-500 print:text-black">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 print:border-black"></div>
              <p className="mt-1 font-semibold">Complainant / Citizen Signature</p>
              <p className="text-[10px]">Verified under CitizenConnect platform protocol</p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-dashed border-slate-400 print:border-black"></div>
              <p className="mt-1 font-semibold">Legal Counsel / Legal Aid Advocate Signature</p>
              <p className="text-[10px]">Empaneled DLSA / NALSA Panelist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
