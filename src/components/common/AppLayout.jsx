import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import EmergencyBanner from './EmergencyBanner';
import DemoRoleSwitcher from './DemoRoleSwitcher';
import DemoControls from './DemoControls';
import LanguageModal from '../LanguageModal';
import TrackStatusModal from '../TrackStatusModal';
import LegalHelpModal from '../LegalHelpModal';
import SearchModal from '../SearchModal';
import LoginModal from '../LoginModal';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AppLayout() {
  const { isDark, setIsDark } = useTheme();
  const { currentLang, setCurrentLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentTrackingId, setCurrentTrackingId] = useState('');

  const isLanding = location.pathname === '/';

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    navigate('/citizen-dashboard');
  };

  const handleOpenFileComplaint = () => {
    if (isLanding) {
      const cardEl = document.getElementById('complaint-card-container');
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      navigate('/report');
    }
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col font-['Inter',sans-serif] transition-colors duration-500 ${
        isDark ? 'bg-[#060c18] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* 1. Mandatory Emergency Banner on Every Page */}
      <EmergencyBanner />

      {/* 2. DEMO ROLE Switcher Bar with Visible Demo Mode Label */}
      <DemoRoleSwitcher />

      {/* 3. Top Navigation Bar */}
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        currentLang={currentLang}
        onOpenLanguageModal={() => setIsLanguageOpen(true)}
        onOpenFileComplaint={handleOpenFileComplaint}
        onOpenTrack={() => navigate('/track')}
        onOpenLegal={() => navigate('/legal-help')}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* 3. Dynamic Page View */}
      <div className="flex-1 w-full">
        <Outlet
          context={{
            onOpenTrackModal: () => setIsTrackOpen(true),
            onOpenLegalModal: () => setIsLegalOpen(true),
            setCurrentTrackingId,
          }}
        />
      </div>

      {/* 4. Global Demo Controls & Role Switcher */}
      <DemoControls />

      {/* 5. Shared Accessible Modals */}
      <LanguageModal
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        currentLang={currentLang}
        onSelectLanguage={(langCode) => setCurrentLang(langCode)}
        isDark={isDark}
      />

      <TrackStatusModal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        isDark={isDark}
        initialId={currentTrackingId}
      />

      <LegalHelpModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        isDark={isDark}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        isDark={isDark}
        onSelectResult={(item) => {
          if (item.type === 'legal' || item.type === 'faq' || item.type === 'guide') {
            navigate('/legal-help');
          } else {
            navigate('/track');
          }
        }}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        isDark={isDark}
      />
    </div>
  );
}
