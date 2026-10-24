import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ShieldCheck,
  Scale,
  Globe,
  Settings,
  ChevronDown,
  RefreshCw,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { DEMO_ROLES } from '../../services/dataShaping';

export default function DemoRoleSwitcher() {
  const { role, setRole, roleDetails, allRoles } = useAuth();
  const { resetDemoData } = useData();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState('');

  const roleIcons = {
    [DEMO_ROLES.CITIZEN]: UserCheck,
    [DEMO_ROLES.OFFICIAL]: ShieldCheck,
    [DEMO_ROLES.REVIEWER]: Scale,
    [DEMO_ROLES.PUBLIC]: Globe,
    [DEMO_ROLES.ADMIN]: Settings,
  };

  const ActiveIcon = roleIcons[role] || UserCheck;

  const handleRoleSelect = (newRole) => {
    setRole(newRole);
    setIsOpen(false);
    setToast(`Role switched to ${newRole.toUpperCase()}. Data shaped accordingly.`);
    setTimeout(() => setToast(''), 3500);

    // Optional smart navigation based on role selected
    if (newRole === DEMO_ROLES.OFFICIAL) {
      navigate('/official-inbox');
    } else if (newRole === DEMO_ROLES.REVIEWER) {
      navigate('/reviewer-dashboard');
    } else if (newRole === DEMO_ROLES.PUBLIC) {
      navigate('/public-records');
    } else if (newRole === DEMO_ROLES.ADMIN) {
      navigate('/admin-demo');
    } else if (newRole === DEMO_ROLES.CITIZEN) {
      navigate('/citizen-dashboard');
    }
  };

  const handleReset = () => {
    resetDemoData();
    setToast('Benchmark demonstration data reset. Audit history preserved.');
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <>
      {/* Top Demo Bar */}
      <div
        className={`w-full py-1 px-3 sm:px-6 text-xs border-b select-none transition-colors duration-200 ${
          isDark
            ? 'bg-slate-950/90 border-slate-800 text-slate-300'
            : 'bg-slate-100/90 border-slate-200 text-slate-700'
        }`}
      >
        <div className="max-w-[1520px] mx-auto flex items-center justify-between gap-2 flex-wrap">
          {/* Demo Mode Notice */}
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Demo Mode Active
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400">
              Fictional data simulation • Information segregation enforced by data-shaping
            </span>
          </div>

          {/* Role Switcher Pill & Quick Reset */}
          <div className="flex items-center space-x-2 relative ml-auto">
            <div className="relative">
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-slate-900 border-sky-400/40 text-white hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ActiveIcon className="w-3.5 h-3.5 text-[#E06820]" />
                <span>Simulating Role:</span>
                <span className="text-[#0F4C81] dark:text-sky-300 font-extrabold underline decoration-[#E06820]">
                  {roleDetails.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Role Switcher Dropdown */}
              {isOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-72 rounded-2xl p-2 shadow-2xl border z-50 animate-in fade-in ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/40 dark:border-slate-800">
                    Select Demo Persona & Role
                  </div>

                  <div className="space-y-1 py-1">
                    {allRoles.map((r) => {
                      const Icon = roleIcons[r.id] || UserCheck;
                      const isSelected = role === r.id;

                      return (
                        <button
                          key={r.id}
                          onClick={() => handleRoleSelect(r.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 cursor-pointer ${
                            isSelected
                              ? isDark
                                ? 'bg-sky-950/80 border border-sky-500/50 text-white'
                                : 'bg-sky-50 border border-sky-200 text-slate-900'
                              : 'hover:bg-slate-500/10'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-[#0F4C81] text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{r.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {r.personaName}
                            </div>
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {r.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-200/40 dark:border-slate-800 flex justify-between items-center text-[11px]">
                    <button
                      onClick={handleReset}
                      className="text-amber-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Demo Data</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/admin-demo');
                        setIsOpen(false);
                      }}
                      className="text-sky-500 hover:underline font-semibold cursor-pointer"
                    >
                      Demo Admin Panel →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Feedback Toast */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 text-amber-300 border border-amber-500/40 text-xs font-bold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Info className="w-3.5 h-3.5" />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}
