import React, { useState } from 'react';
import { AlertTriangle, Phone, ShieldAlert, X } from 'lucide-react';

export default function EmergencyBanner() {
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  return (
    <>
      <div
        role="alert"
        aria-label="National Emergency Notice"
        className="relative z-50 w-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B91C1C] text-white text-[12px] sm:text-[13px] font-medium py-1.5 px-3 sm:px-6 shadow-md transition-all"
      >
        <div className="max-w-[1520px] mx-auto flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          {/* Main Emergency Message */}
          <div className="flex items-center space-x-2 min-w-0">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 flex-shrink-0" />
            <span className="truncate">
              <strong>Emergency Notice:</strong> If you are in danger right now, call <strong className="text-amber-200">112</strong>.
            </span>
          </div>

          {/* Quick Helplines */}
          <div className="flex items-center space-x-3 text-[11px] sm:text-[12px] flex-shrink-0 ml-auto">
            <a
              href="tel:112"
              className="inline-flex items-center space-x-1 bg-white text-red-700 font-bold px-2.5 py-0.5 rounded-full hover:bg-amber-100 transition-colors shadow-sm"
            >
              <Phone className="w-3 h-3 fill-current" />
              <span>Call 112</span>
            </a>
            <button
              onClick={() => setShowHelplineModal(true)}
              className="hidden md:inline-flex items-center space-x-1 underline hover:text-amber-200 cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>More Helplines</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Helplines Quick Modal */}
      {showHelplineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl p-6 bg-slate-900 border border-red-500/40 text-white shadow-2xl relative">
            <button
              onClick={() => setShowHelplineModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">National Emergency Helplines</h3>
                <p className="text-xs text-slate-400">All India 24x7 Toll-Free Emergency Response</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-xl bg-red-950/60 border border-red-500/40 hover:bg-red-900/60"
              >
                <div>
                  <div className="font-bold text-amber-300">National Emergency Number</div>
                  <div className="text-xs text-slate-300">Police, Fire, Ambulance (ERSS)</div>
                </div>
                <span className="text-base font-extrabold text-white px-3 py-1 rounded-lg bg-red-600">112</span>
              </a>

              <a
                href="tel:1091"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80"
              >
                <div>
                  <div className="font-bold text-slate-200">Women Helpline (24x7)</div>
                  <div className="text-xs text-slate-400">National Commission for Women</div>
                </div>
                <span className="text-base font-bold text-white px-3 py-1 rounded-lg bg-slate-700">1091</span>
              </a>

              <a
                href="tel:1930"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80"
              >
                <div>
                  <div className="font-bold text-slate-200">Cyber Crime Helpline</div>
                  <div className="text-xs text-slate-400">Financial fraud & cyber threats</div>
                </div>
                <span className="text-base font-bold text-white px-3 py-1 rounded-lg bg-slate-700">1930</span>
              </a>

              <a
                href="tel:1064"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80"
              >
                <div>
                  <div className="font-bold text-slate-200">Anti-Corruption Bureau (ACB)</div>
                  <div className="text-xs text-slate-400">Central Vigilance / Lokayukta</div>
                </div>
                <span className="text-base font-bold text-white px-3 py-1 rounded-lg bg-slate-700">1064</span>
              </a>

              <a
                href="tel:15100"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80"
              >
                <div>
                  <div className="font-bold text-slate-200">NALSA Free Legal Aid</div>
                  <div className="text-xs text-slate-400">Statutory free legal assistance</div>
                </div>
                <span className="text-base font-bold text-white px-3 py-1 rounded-lg bg-purple-700">15100</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
