import React, { useState } from 'react';
import { RefreshCw, UserCheck, ShieldCheck, Check, Info } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function DemoControls() {
  const { resetDemoData, auditArchive } = useData();
  const { user, role, switchRole } = useAuth();
  const { isDark } = useTheme();
  const [toastMessage, setToastMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setToastMessage('Demo benchmark data reset! Audit trail records preserved.');
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 hidden sm:flex items-center space-x-2">
        {/* Reset Demo Data Button */}
        <button
          onClick={handleReset}
          title="Reset demonstration complaints to benchmark baseline (Audit history is preserved)"
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md border transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900/90 text-amber-300 border-amber-500/30 hover:bg-slate-800'
              : 'bg-white/95 text-amber-800 border-amber-300 hover:bg-amber-50'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Reset Demo Data</span>
        </button>

        {/* Role Switcher Button */}
        <button
          onClick={switchRole}
          title={`Currently logged in as ${role === 'officer' ? 'Grievance Officer' : 'Citizen'}. Click to switch role.`}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md border transition-all cursor-pointer ${
            role === 'officer'
              ? isDark
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-900/80'
                : 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
              : isDark
              ? 'bg-sky-950/80 text-sky-300 border-sky-500/40 hover:bg-sky-900/80'
              : 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
          }`}
        >
          {role === 'officer' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
          )}
          <span>Role: {role === 'officer' ? 'Officer' : 'Citizen'}</span>
        </button>

        {/* Audit assurance info button */}
        <button
          onClick={() => setShowInfo((prev) => !prev)}
          className={`p-1.5 rounded-full text-xs shadow-lg backdrop-blur-md border transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:text-slate-900'
          }`}
          title="Fictional Simulation & Audit Guarantee Notice"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info Popover */}
      {showInfo && (
        <div className="fixed bottom-16 right-4 z-50 w-80 p-4 rounded-2xl shadow-2xl border text-xs bg-slate-900 border-slate-700 text-slate-200 animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-white mb-1.5">
            <span>Audit & Simulation Policy</span>
            <button
              onClick={() => setShowInfo(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed">
            • <strong>Strictly Fictional:</strong> All citizens, officers, and complaints shown are simulated demonstration data.
          </p>
          <p className="text-slate-300 mt-1 leading-relaxed">
            • <strong>Audit History Protection:</strong> Standard complaint operations append immutable logs. The reset action preserves audit archive logs.
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Audit archive entries: {auditArchive.length}</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-emerald-600 text-white font-semibold text-xs sm:text-sm shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
