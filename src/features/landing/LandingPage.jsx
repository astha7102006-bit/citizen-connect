import React, { useState } from 'react';
import HeroLeft from '../../components/HeroLeft';
import ComplaintCard from '../../components/ComplaintCard';
import BottomStatsBar from '../../components/BottomStatsBar';
import IndianFlagCanvas from '../../components/IndianFlagCanvas';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Wind, Image as ImageIcon } from 'lucide-react';

export default function LandingPage({
  onOpenTrackModal,
  onOpenLegalModal,
}) {
  const { isDark } = useTheme();
  const { currentLang } = useLanguage();
  const { submitComplaint } = useData();
  const navigate = useNavigate();

  const [windLevel, setWindLevel] = useState(1.2);
  const [showFlagModal, setShowFlagModal] = useState(false);

  const handleComplaintSubmitted = (record) => {
    // Add to shared data context
    submitComplaint(record);
  };

  const scrollToComplaintCard = () => {
    const cardEl = document.getElementById('complaint-card-container');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-32px)] lg:h-[calc(100vh-32px)] flex flex-col justify-between overflow-x-hidden">
      {/* =========================================================================
          PARLIAMENT PHOTOGRAPHIC BACKGROUND
          Circular historic Sansad Bhavan aligned center-right matching reference.
          ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Light Mode Parliament Background */}
        <div
          className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-700 ease-in-out ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundImage: "url('/parliament-light.jpg')",
            backgroundPosition: '60% 12%',
            backgroundSize: 'cover',
          }}
        />

        {/* Dark Mode Parliament Background */}
        <div
          className={`absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-700 ease-in-out ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: "url('/parliament-dark.jpg')",
            backgroundPosition: '60% 12%',
            backgroundSize: 'cover',
          }}
        />

        {/* Atmospheric overlays for text readability */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-r from-[#060c18]/90 via-[#060c18]/45 to-transparent'
              : 'bg-gradient-to-r from-white/75 via-white/30 to-transparent'
          }`}
        />

        {/* Top Header atmospheric tint */}
        <div
          className={`absolute top-0 inset-x-0 h-28 transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-b from-[#060c18]/80 to-transparent'
              : 'bg-gradient-to-b from-white/65 to-transparent'
          }`}
        />

        {/* Bottom Bar contrast enhancer */}
        <div
          className={`absolute bottom-0 inset-x-0 h-36 transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-t from-[#060c18]/90 via-[#060c18]/40 to-transparent'
              : 'bg-gradient-to-t from-slate-900/35 via-transparent to-transparent'
          }`}
        />

        {/* 3D WebGL Waving Indian Flag anchored directly to the mast atop Sansad Bhavan */}
        <div
          className="absolute hidden lg:block pointer-events-none"
          style={{
            left: 'calc(50% - 28px)',
            top: '138px',
            width: '120px',
            height: '80px',
            zIndex: 15,
          }}
        >
          <IndianFlagCanvas
            windStrength={windLevel}
            showPole={false}
            isDark={isDark}
            useCustomTexture={true}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* =========================================================================
          HERO MAIN CONTENT SECTION
          Matches Reference Screenshot Layout with Live Language Translations
          ========================================================================= */}
      <main className="relative z-20 flex-1 max-w-[1520px] mx-auto w-full px-6 sm:px-10 lg:px-14 py-4 sm:py-6 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
          {/* Left Column: Hero Content */}
          <div className="w-full lg:max-w-[760px] flex-shrink-0">
            <HeroLeft
              isDark={isDark}
              currentLang={currentLang}
              onOpenFileComplaint={scrollToComplaintCard}
              onOpenTrack={() => {
                if (onOpenTrackModal) onOpenTrackModal();
                else navigate('/track');
              }}
              onOpenLegal={() => {
                if (onOpenLegalModal) onOpenLegalModal();
                else navigate('/legal-help');
              }}
              onOpenLearnMore={() => navigate('/about')}
            />
          </div>

          {/* Right Column: Submit a Complaint Card */}
          <div
            id="complaint-card-container"
            className="w-full lg:w-[460px] flex-shrink-0 flex justify-center lg:justify-end"
          >
            <ComplaintCard
              isDark={isDark}
              currentLang={currentLang}
              onComplaintSubmitted={handleComplaintSubmitted}
            />
          </div>
        </div>
      </main>

      {/* =========================================================================
          BOTTOM STATISTICS BAR
          ========================================================================= */}
      <footer className="relative z-20 w-full pb-6 sm:pb-8">
        <BottomStatsBar isDark={isDark} currentLang={currentLang} />
      </footer>

      {/* Modal: Full 3D Interactive Indian Flag Inspection */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 relative border shadow-2xl ${
              isDark
                ? 'bg-slate-900 border-sky-400/30 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setShowFlagModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-500/20 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">
                National Flag of India (Tiranga)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time WebGL cloth physics simulation with dynamic harmonic wind waves & user-uploaded authentic flag texture
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="w-full h-56 rounded-2xl bg-gradient-to-b from-sky-400/20 to-sky-900/30 overflow-hidden flex items-center justify-center border border-sky-500/20">
                <IndianFlagCanvas
                  windStrength={windLevel}
                  showPole={true}
                  isDark={isDark}
                  useCustomTexture={true}
                  className="w-full h-full"
                />
              </div>

              <div className="w-full h-56 rounded-2xl bg-slate-950/40 overflow-hidden flex flex-col items-center justify-center p-3 border border-slate-700/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-[#E06820]" />
                  Uploaded Reference Flag
                </span>
                <img
                  src="/user-indian-flag.png"
                  alt="User uploaded Indian National Flag"
                  className="max-h-36 max-w-full object-contain rounded-lg shadow-md"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold flex items-center gap-1">
                  <Wind className="w-3 h-3 text-[#E06820]" /> Wind Speed:
                </span>
                <button
                  onClick={() => setWindLevel(0.6)}
                  className={`px-3 py-1 rounded-full border text-xs cursor-pointer ${
                    windLevel === 0.6 ? 'bg-[#E06820] text-white border-transparent' : 'border-slate-500'
                  }`}
                >
                  Breeze
                </button>
                <button
                  onClick={() => setWindLevel(1.2)}
                  className={`px-3 py-1 rounded-full border text-xs cursor-pointer ${
                    windLevel === 1.2 ? 'bg-[#E06820] text-white border-transparent' : 'border-slate-500'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setWindLevel(2.0)}
                  className={`px-3 py-1 rounded-full border text-xs cursor-pointer ${
                    windLevel === 2.0 ? 'bg-[#E06820] text-white border-transparent' : 'border-slate-500'
                  }`}
                >
                  Strong
                </button>
              </div>
              <button
                onClick={() => setShowFlagModal(false)}
                className="btn-primary-gradient px-5 py-2 rounded-full text-white text-xs font-semibold cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
