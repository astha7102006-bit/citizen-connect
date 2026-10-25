import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  User,
  Sun,
  Moon,
  Menu,
  X,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  Users,
  Settings,
  Scale,
  FileText,
  Lock,
  ChevronDown,
  BookOpen,
  Clock,
  LogOut,
} from 'lucide-react';
import { getTranslation, LANGUAGES } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({
  isDark: propIsDark,
  setIsDark: propSetIsDark,
  currentLang: propCurrentLang,
  onOpenLanguageModal,
  onOpenFileComplaint,
  onOpenTrack,
  onOpenLegal,
  onOpenSearch,
  onOpenLogin,
}) {
  const { isDark: contextIsDark, setIsDark: contextSetIsDark } = useTheme();
  const { currentLang: contextLang, currentLangObj: contextLangObj, t } = useLanguage();

  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const setIsDark = propSetIsDark || contextSetIsDark;
  const currentLang = propCurrentLang || contextLang || 'en';
  const currentLangObj = contextLangObj || LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const navigate = useNavigate();
  const location = useLocation();
  const portalsRef = useRef(null);
  const { realUser, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (portalsRef.current && !portalsRef.current.contains(e.target)) {
        setPortalsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCurrent = (path) => location.pathname === path;

  const navItems = [
    {
      name: 'Home',
      label: getTranslation(currentLang, 'navHome'),
      icon: Home,
      isActive: isCurrent('/'),
      action: () => {
        setActiveTab('Home');
        navigate('/');
      },
    },
    {
      name: 'Report a Complaint',
      label: getTranslation(currentLang, 'navFileComplaint'),
      isActive: isCurrent('/report') || isCurrent('/file-complaint'),
      action: () => {
        setActiveTab('Report a Complaint');
        if (location.pathname === '/') {
          if (onOpenFileComplaint) onOpenFileComplaint();
        } else {
          navigate('/report');
        }
      },
    },
    {
      name: 'Track Complaint',
      label: getTranslation(currentLang, 'navTrackStatus'),
      isActive: isCurrent('/track'),
      action: () => {
        setActiveTab('Track Complaint');
        navigate('/track');
      },
    },
    {
      name: 'Public Records',
      label: getTranslation(currentLang, 'navPublicRecords'),
      isActive: isCurrent('/public-records') || isCurrent('/transparency'),
      action: () => {
        setActiveTab('Public Records');
        navigate('/public-records');
      },
    },
    {
      name: 'Legal Help',
      label: getTranslation(currentLang, 'navHelp'),
      isActive: isCurrent('/legal-help'),
      action: () => {
        setActiveTab('Legal Help');
        navigate('/legal-help');
      },
    },
  ];

  const portalScreens = [
    { label: getTranslation(currentLang, 'navCitizenDashboard'), path: '/citizen-dashboard', icon: User, desc: getTranslation(currentLang, 'navCitizenDashboardDesc') },
    { label: getTranslation(currentLang, 'navOfficialInbox'), path: '/official-inbox', icon: ShieldCheck, desc: getTranslation(currentLang, 'navOfficialInboxDesc') },
    { label: getTranslation(currentLang, 'navReviewerDashboard'), path: '/reviewer-dashboard', icon: Scale, desc: getTranslation(currentLang, 'navReviewerDashboardDesc') },
    { label: getTranslation(currentLang, 'navTimeline'), path: '/timeline', icon: Clock, desc: getTranslation(currentLang, 'navTimelineDesc') },
    { label: getTranslation(currentLang, 'navLegalRemedies'), path: '/legal-remedies', icon: BookOpen, desc: getTranslation(currentLang, 'navLegalRemediesDesc') },
    { label: getTranslation(currentLang, 'navMethodology'), path: '/methodology', icon: FileText, desc: getTranslation(currentLang, 'navMethodologyDesc') },
    { label: getTranslation(currentLang, 'navAdminDemo'), path: '/admin-demo', icon: Lock, desc: getTranslation(currentLang, 'navAdminDemoDesc') },
    { label: getTranslation(currentLang, 'navSettings'), path: '/settings', icon: Settings, desc: getTranslation(currentLang, 'navSettingsDesc') },
  ];

  return (
    <header className="w-full relative z-40 transition-colors duration-300">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 h-20 sm:h-24 flex items-center justify-between">
        {/* Left Section: Emblem + CitizenConnect */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 sm:space-x-3.5 select-none flex-1 min-w-0 mr-2 cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-9 sm:w-11 h-12 sm:h-14 flex-shrink-0">
            <img
              src="/emblem-of-india.svg"
              alt="State Emblem of India"
              className={`h-9 sm:h-13 w-auto object-contain transition-all duration-300 ${
                isDark
                  ? 'brightness-0 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                  : 'brightness-90 contrast-125'
              }`}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center font-extrabold text-[17px] sm:text-[23px] tracking-tight leading-none truncate">
              <span className={isDark ? 'text-white' : 'text-[#0E1B33]'}>
                Citizen
              </span>
              <span className="text-[#E06820] font-black">Connect</span>
            </div>
            <span
              className={`text-[9.5px] sm:text-[12px] font-normal tracking-wide mt-0.5 sm:mt-1 truncate transition-colors ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {getTranslation(currentLang, 'platformSubtitle')}
            </span>
          </div>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center space-x-7 xl:space-x-8">
          {navItems.map((item) => {
            const isActive = item.isActive;
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={item.action}
                className={`relative py-2 flex items-center space-x-1.5 text-[15px] font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'text-white font-bold'
                      : 'text-[#0E1B33] font-bold'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-[#0E1B33]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 mr-0.5 opacity-90" />}
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full tricolor-gradient shadow-sm" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Portals, Language, Search, Settings, Theme, Login */}
        <div className="hidden lg:flex items-center space-x-2.5 xl:space-x-3.5">
          {/* Portals Dropdown Button */}
          <div className="relative" ref={portalsRef}>
            <button
              onClick={() => setPortalsOpen(!portalsOpen)}
              className={`px-3 py-1.5 rounded-full flex items-center space-x-1 text-xs font-bold transition-all duration-200 cursor-pointer border ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 hover:border-sky-400 text-sky-300 hover:bg-slate-750'
                  : 'bg-white/80 border-slate-200 hover:border-[#E06820] text-slate-800 hover:bg-white shadow-xs'
              }`}
              title={getTranslation(currentLang, 'navScreensHeader')}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#E06820]" />
              <span>{getTranslation(currentLang, 'navScreens')}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {portalsOpen && (
              <div
                className={`absolute right-0 mt-2 w-72 rounded-2xl p-2 shadow-2xl border z-50 animate-in fade-in ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/40 dark:border-slate-800">
                  {getTranslation(currentLang, 'navScreensHeader')}
                </div>
                <div className="space-y-1 py-1 max-h-80 overflow-y-auto">
                  {portalScreens.map((sc, i) => {
                    const Icon = sc.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          navigate(sc.path);
                          setPortalsOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition-all flex items-start space-x-2.5 cursor-pointer ${
                          location.pathname === sc.path
                            ? isDark
                              ? 'bg-sky-950/80 text-sky-300'
                              : 'bg-sky-50 text-sky-900'
                            : 'hover:bg-slate-500/10'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#0F4C81]/15 text-[#0F4C81] dark:text-sky-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">{sc.label}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{sc.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Language Selector Button */}
          <button
            onClick={onOpenLanguageModal}
            className={`px-3 py-1.5 rounded-full flex items-center space-x-1.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer border ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 hover:border-sky-400 text-sky-300 hover:bg-slate-750'
                : 'bg-white/80 border-slate-200 hover:border-[#E06820] text-slate-800 hover:bg-white shadow-xs'
            }`}
            title="Change Language of India / भाषा बदलें"
            aria-label="Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#E06820]" />
            <span>{currentLangObj.native}</span>
            <span className="text-[10px] uppercase opacity-60">({currentLangObj.code})</span>
          </button>

          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
              isDark
                ? 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
                : 'text-slate-700 hover:bg-white/60 hover:text-[#0E1B33]'
            }`}
            title={getTranslation(currentLang, 'navSearch')}
            aria-label="Search Platform"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Settings & Accessibility Button */}
          <button
            onClick={() => navigate('/settings')}
            className={`p-2 rounded-full transition-all duration-200 cursor-pointer ${
              isDark
                ? 'text-slate-200 hover:bg-slate-800/60 hover:text-white'
                : 'text-slate-700 hover:bg-white/60 hover:text-[#0E1B33]'
            }`}
            title="Accessibility & Settings"
            aria-label="Accessibility & Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
              isDark
                ? 'text-amber-300 hover:bg-slate-800/70'
                : 'text-slate-700 hover:bg-white/70'
            }`}
            title={isDark ? getTranslation(currentLang, 'switchLight') : getTranslation(currentLang, 'switchDark')}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Login / Dashboard Account State */}
          {isAuthenticated && realUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/citizen-dashboard')}
                className={`px-3.5 py-2 rounded-full flex items-center space-x-2 text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-md ${
                  location.pathname === '/citizen-dashboard' || location.pathname === '/dashboard'
                    ? 'bg-[#E06820] text-white shadow-[#E06820]/20'
                    : isDark
                    ? 'bg-[#0F4C81] hover:bg-[#0284C7] text-white border border-sky-400/30'
                    : 'bg-[#0F4C81] hover:bg-[#135A99] text-white'
                }`}
                title={getTranslation(currentLang, 'navMyDashboard')}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="max-w-[130px] truncate">{realUser.name || getTranslation(currentLang, 'navMyDashboard')}</span>
              </button>

              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className={`p-2 rounded-full transition-all duration-200 cursor-pointer border ${
                  isDark
                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                }`}
                title={getTranslation(currentLang, 'navSignOut')}
                aria-label={getTranslation(currentLang, 'navSignOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
              }}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center space-x-2 text-[13.5px] font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-md ${
                isDark
                  ? 'bg-[#152540] hover:bg-[#1C3256] text-white border border-sky-400/25 hover:border-sky-400/50'
                  : 'bg-[#13233D] hover:bg-[#1E365E] text-white border border-slate-700/20'
              }`}
            >
              <User className="w-4 h-4 text-slate-200" />
              <span>{getTranslation(currentLang, 'navLoginRegister')}</span>
            </button>
          )}
        </div>

        {/* Mobile / Tablet Hamburger & Controls */}
        <div className="flex lg:hidden items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={onOpenLanguageModal}
            className={`p-1.5 rounded-full border text-xs font-bold flex items-center space-x-1 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-sky-300'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
            title="Change Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#E06820]" />
            <span className="uppercase text-[11px]">{currentLang}</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`p-2 rounded-full ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-full ${
              isDark ? 'text-amber-300' : 'text-slate-700'
            }`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden px-6 pt-2 pb-6 space-y-2 border-b transition-all ${
            isDark
              ? 'bg-slate-950/95 border-slate-800 text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                item.action();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 rounded-md font-semibold text-base flex items-center justify-between"
            >
              <span>{item.label}</span>
              {item.isActive && (
                <span className="w-2 h-2 rounded-full bg-[#E06820]" />
              )}
            </button>
          ))}

          {/* Quick links to all screens */}
          <div className="pt-2 border-t border-slate-200/20 space-y-1">
            {portalScreens.map((sc, i) => {
              const Icon = sc.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    navigate(sc.path);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-slate-500/10"
                >
                  <Icon className="w-4 h-4 text-[#E06820]" />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200/20 flex flex-col space-y-2">
            <button
              onClick={() => {
                if (onOpenLanguageModal) onOpenLanguageModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-md text-left font-semibold flex items-center space-x-2 text-[#E06820]"
            >
              <Globe className="w-4 h-4" />
              <span>Change Language: {currentLangObj.native} ({currentLangObj.name})</span>
            </button>
            <button
              onClick={() => {
                if (onOpenSearch) onOpenSearch();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-md text-left font-semibold flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{getTranslation(currentLang, 'navSearch')}</span>
            </button>
            {isAuthenticated && realUser ? (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    navigate('/citizen-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 px-4 rounded-full bg-[#0F4C81] text-white font-semibold flex items-center justify-center space-x-2 shadow"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{getTranslation(currentLang, 'navMyDashboard')} ({realUser.name})</span>
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-2.5 px-4 rounded-full border border-red-500/30 text-red-500 font-semibold flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{getTranslation(currentLang, 'navSignOut')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenLogin) onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 px-4 rounded-full bg-[#13233D] text-white font-semibold flex items-center justify-center space-x-2 shadow"
              >
                <User className="w-4 h-4" />
                <span>{getTranslation(currentLang, 'navLoginRegister')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
