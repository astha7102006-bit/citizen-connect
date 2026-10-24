import React from 'react';
import {
  X,
  Scale,
  PhoneCall,
  Shield,
  FileText,
  ExternalLink,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export default function LegalHelpModal({ isOpen, onClose, isDark }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl relative border ${
          isDark
            ? 'bg-slate-900/95 border-purple-400/20 text-white'
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
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Free Legal Help & Citizen Rights
            </h2>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Statutory legal aid resources under Article 39A of the Indian Constitution
            </p>
          </div>
        </div>

        {/* Toll-Free Legal Aid Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-purple-400 font-bold">
                NALSA National Legal Aid Helpline
              </div>
              <div className="text-lg font-black text-white">15100 (Toll Free)</div>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
            24x7 Available
          </span>
        </div>

        {/* Core Citizen Rights Accordion / Cards */}
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-slate-800/40 border-slate-700/60'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2 text-sm font-bold text-emerald-500 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>Right to Time-Bound Redressal</span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Under the Citizen’s Charter and Public Grievance Rules, every
              statutory complaint filed against an administrative officer must
              receive an official acknowledgement within 48 hours and an initial
              disposition within 15 working days.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-slate-800/40 border-slate-700/60'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2 text-sm font-bold text-sky-500 mb-1">
              <FileText className="w-4 h-4" />
              <span>Right to Information (RTI Act 2005)</span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              If a department fails to act or withholds file movements, citizens
              can invoke Section 6 of the RTI Act to inspect case records,
              file notings, and disciplinary log books. The statutory response
              time is strictly 30 days.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? 'bg-slate-800/40 border-slate-700/60'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2 text-sm font-bold text-purple-400 mb-1">
              <Shield className="w-4 h-4" />
              <span>Whistleblower & Citizen Immunity</span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              The Whistle Blowers Protection Act shields citizens exposing
              official wrongdoing. CitizenConnect secures complaint trails with
              cryptographic indexing so submitted filings cannot be altered or
              erased.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary-gradient px-6 py-2.5 rounded-full text-white font-semibold text-xs cursor-pointer"
          >
            I Understand My Rights
          </button>
        </div>
      </div>
    </div>
  );
}
