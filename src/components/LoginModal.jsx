/**
 * CitizenConnect — Login Modal (Phase 3)
 *
 * Two-tab layout:
 *   Tab 1: Email & Password  — connects to real POST /api/auth/login + /register
 *   Tab 2: Demo OTP          — original mock phone-OTP flow (unchanged, for judges)
 *
 * The existing UI design, color scheme, and structure are preserved.
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Smartphone,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// ── Sub-component: Real Email/Password Auth ────────────────────────────────────
function RealAuthForm({ isDark, onSuccess }) {
  const { login, register } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode]           = useState('login'); // 'login' | 'register'
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(null);

  const inputClass = `w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400/70`;
  const wrapClass  = `flex items-center px-3.5 py-3 rounded-2xl border ${
    isDark
      ? 'bg-slate-800/80 border-slate-700 text-white'
      : 'bg-slate-50 border-slate-200 text-slate-900'
  }`;
  const labelClass = `block text-xs font-semibold uppercase tracking-wider mb-2 ${
    isDark ? 'text-slate-400' : 'text-slate-600'
  }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login({ email, password });
      } else {
        if (!name.trim()) { setError('Name is required.'); setLoading(false); return; }
        user = await register({ name, email, password });
      }
      setSuccess(user);
      setTimeout(onSuccess, 1200);
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Welcome, {success.name}!</h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {mode === 'register'
              ? 'Account created! Please verify your email before logging in.'
              : 'Signed in successfully.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className={`flex rounded-xl overflow-hidden border text-xs font-semibold ${
        isDark ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => { setMode('login'); setError(''); }}
          className={`flex-1 py-2 transition cursor-pointer ${
            mode === 'login'
              ? 'bg-gradient-to-r from-[#0F4C81] to-[#0284C7] text-white'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('authSignIn')}
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(''); }}
          className={`flex-1 py-2 transition cursor-pointer ${
            mode === 'register'
              ? 'bg-gradient-to-r from-[#0F4C81] to-[#0284C7] text-white'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('authCreateAccount')}
        </button>
      </div>

      {/* Name (register only) */}
      {mode === 'register' && (
        <div>
          <label className={labelClass}>{t('authFullName')}</label>
          <div className={wrapClass}>
            <User className="w-4 h-4 text-slate-400 mr-2.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('authNamePlaceholder')}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label className={labelClass}>{t('authEmail')}</label>
        <div className={wrapClass}>
          <Mail className="w-4 h-4 text-slate-400 mr-2.5" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('authEmailPlaceholder')}
            className={inputClass}
            autoComplete={mode === 'login' ? 'email' : 'off'}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className={labelClass}>{t('authPassword')}</label>
        <div className={wrapClass}>
          <Lock className="w-4 h-4 text-slate-400 mr-2.5" />
          <input
            type={showPass ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? t('authPassPlaceholder') : t('authPassword')}
            className={`${inputClass} flex-1`}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="ml-2 text-slate-400 hover:text-slate-300 cursor-pointer"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary-gradient py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : mode === 'login' ? (
          <>
            <span>{t('authSignInBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>{t('authRegisterBtn')}</span>
          </>
        )}
      </button>

      <div className="text-center pt-2">
        {mode === 'login' ? (
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`font-semibold underline cursor-pointer ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-[#0F4C81] hover:text-[#0284C7]'}`}
            >
              Register here
            </button>
          </p>
        ) : (
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`font-semibold underline cursor-pointer ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-[#0F4C81] hover:text-[#0284C7]'}`}
            >
              Sign In here
            </button>
          </p>
        )}
      </div>

      {mode === 'login' && (
        <div className={`mt-2 p-2.5 rounded-xl border text-[11px] leading-relaxed ${
          isDark ? 'bg-slate-800/40 border-slate-700/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="font-semibold text-slate-400 mb-1.5">Demo Accounts (Click to Fill):</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setEmail('citizen@citizenconnect.gov.in'); setPassword('CitizenPassword123!'); setError(''); }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 cursor-pointer font-medium border border-sky-500/30 transition"
            >
              Citizen Demo
            </button>
            <button
              type="button"
              onClick={() => { setEmail('official@citizenconnect.gov.in'); setPassword('StaffPassword123!'); setError(''); }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 cursor-pointer font-medium border border-amber-500/30 transition"
            >
              Official Demo
            </button>
          </div>
        </div>
      )}

      {mode === 'register' && (
        <p className={`text-[11px] text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Public registration creates a Citizen account only.
        </p>
      )}
    </form>
  );
}

// ── Sub-component: Demo Phone OTP Flow (ORIGINAL — unchanged) ──────────────────
function DemoOtpForm({ isDark, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [phone, setPhone]               = useState('');
  const [otpSent, setOtpSent]           = useState(false);
  const [otp, setOtp]                   = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phone.length >= 10) setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setLoggedInUser({
      name: 'Aditya Kumar Verma',
      aadhaarLast4: '8924',
      phone: phone || '+91 98765 43210',
    });
  };

  if (loggedInUser) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Welcome, {loggedInUser.name}</h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Verified Citizen Account (Linked to DigiLocker)
          </p>
        </div>
        <button
          onClick={() => {
            if (onSuccess) onSuccess();
            else if (onClose) onClose();
          }}
          className="w-full btn-primary-gradient py-3 rounded-xl text-white font-semibold text-sm cursor-pointer"
        >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  if (!otpSent) {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Mobile Number
          </label>
          <div className={`flex items-center px-3.5 py-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
            <Smartphone className="w-4 h-4 text-slate-400 mr-2.5" />
            <span className="text-sm font-semibold mr-2 text-slate-400">+91</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 10-digit number"
              maxLength={10}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full btn-primary-gradient py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
        >
          <span>Send One-Time Password (OTP)</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="relative py-2 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300/30 dark:border-slate-700/50" />
          </div>
          <span className={`relative px-3 text-[11px] font-semibold uppercase ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
            Or Continue With
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLoggedInUser({ name: 'Pooja Sharma', aadhaarLast4: '4192', phone: '+91 98112 34567' })}
          className={`w-full py-3 rounded-2xl border font-semibold text-sm flex items-center justify-center space-x-2.5 transition cursor-pointer ${isDark ? 'border-sky-500/30 bg-sky-950/20 text-sky-300 hover:bg-sky-900/30' : 'border-blue-200 bg-blue-50/60 text-blue-800 hover:bg-blue-100/60'}`}
        >
          <Shield className="w-4 h-4" />
          <span>DigiLocker / MeriPehchaan SSO</span>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="text-center py-2">
        <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          OTP sent to +91 {phone || '9876543210'}. Enter{' '}
          <strong className="text-[#E06820]">1234</strong> to verify.
        </span>
      </div>
      <div>
        <input
          type="text"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter 4-digit OTP"
          maxLength={4}
          className={`w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
        />
      </div>
      <button
        type="submit"
        className="w-full btn-primary-gradient py-3.5 rounded-2xl text-white font-bold text-sm cursor-pointer shadow-lg"
      >
        Verify & Sign In
      </button>
      <button
        type="button"
        onClick={() => setOtpSent(false)}
        className="w-full text-center text-xs text-slate-400 hover:underline pt-1 cursor-pointer"
      >
        Change phone number
      </button>
    </form>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function LoginModal({ isOpen, onClose, onSuccess, isDark }) {
  const [tab, setTab] = useState('real'); // 'real' | 'demo'
  const { t } = useLanguage();

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative border ${
          isDark
            ? 'bg-slate-900/95 border-sky-400/20 text-white'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F4C81] to-[#0284C7] flex items-center justify-center text-white shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t('navCitizenDashboard')}</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              CitizenConnect · {t('platformSubtitle')}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className={`flex rounded-xl overflow-hidden border mb-5 text-xs font-semibold ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={() => setTab('real')}
            className={`flex-1 py-2 transition cursor-pointer ${
              tab === 'real'
                ? 'bg-gradient-to-r from-[#0F4C81] to-[#0284C7] text-white'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('authEmailPasswordTab')}
          </button>
          <button
            type="button"
            onClick={() => setTab('demo')}
            className={`flex-1 py-2 transition cursor-pointer ${
              tab === 'demo'
                ? 'bg-gradient-to-r from-[#0F4C81] to-[#0284C7] text-white'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('authDemoOtpTab')}
          </button>
        </div>

        {/* Content */}
        {tab === 'real' ? (
          <RealAuthForm isDark={isDark} onSuccess={handleSuccess} />
        ) : (
          <DemoOtpForm isDark={isDark} onClose={onClose} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}
