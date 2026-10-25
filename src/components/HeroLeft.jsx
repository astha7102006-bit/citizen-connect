import React from 'react';
import {
  FileText,
  Eye,
  ShieldCheck,
  Scale,
  Send,
  ArrowRight,
} from 'lucide-react';
import { getTranslation } from '../i18n/translations';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function HeroLeft({
  isDark: propIsDark,
  currentLang: propCurrentLang,
  onOpenFileComplaint,
  onOpenTrack,
  onOpenLegal,
  onOpenLearnMore,
}) {
  const { isDark: contextIsDark } = useTheme();
  const { currentLang: contextLang, t } = useLanguage();

  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const currentLang = propCurrentLang || contextLang || 'en';
  const features = [
    {
      title: getTranslation(currentLang, 'feat1Title'),
      subtitle: getTranslation(currentLang, 'feat1Subtitle'),
      icon: FileText,
      bg: 'bg-[#EA580C]', // Saffron/Orange
      action: onOpenFileComplaint,
    },
    {
      title: getTranslation(currentLang, 'feat2Title'),
      subtitle: getTranslation(currentLang, 'feat2Subtitle'),
      icon: Eye,
      bg: 'bg-[#0284C7]', // Blue
      action: onOpenTrack,
    },
    {
      title: getTranslation(currentLang, 'feat3Title'),
      subtitle: getTranslation(currentLang, 'feat3Subtitle'),
      icon: ShieldCheck,
      bg: 'bg-[#059669]', // Green
      action: onOpenLearnMore,
    },
    {
      title: getTranslation(currentLang, 'feat4Title'),
      subtitle: getTranslation(currentLang, 'feat4Subtitle'),
      icon: Scale,
      bg: 'bg-[#7C3AED]', // Violet/Purple
      action: onOpenLegal,
    },
  ];

  return (
    <div className="flex flex-col select-text">
      {/* Eyebrow with Tricolor Accent Line */}
      <div className="flex items-center space-x-3 mb-4">
        <span
          className={`text-[12px] sm:text-[13px] font-bold tracking-[0.22em] uppercase transition-colors ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          {getTranslation(currentLang, 'eyebrow')}
        </span>
        <div className="h-[3px] w-14 rounded-full tricolor-gradient shadow-sm" />
      </div>

      {/* Main Heading */}
      <h1
        className={`text-[20px] sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold leading-[1.22] lg:leading-[1.16] tracking-tight mb-4 sm:mb-5 transition-colors break-words ${
          isDark ? 'text-white' : 'text-[#0E1B33]'
        }`}
      >
        <span className="block sm:inline">{getTranslation(currentLang, 'heroHeading1')}</span>{' '}
        <span className="block sm:inline">{getTranslation(currentLang, 'heroHeading2')}</span>
      </h1>

      {/* Description */}
      <p
        className={`text-[14px] sm:text-[15px] lg:text-[16px] leading-relaxed mb-6 sm:mb-7 max-w-xl font-normal transition-colors ${
          isDark ? 'text-slate-200' : 'text-slate-700'
        }`}
      >
        {getTranslation(currentLang, 'heroDescription')}
      </p>

      {/* 4 Feature Highlights */}
      <div className="grid grid-cols-2 lg:flex lg:flex-nowrap items-center gap-2.5 sm:gap-4 xl:gap-5 mb-6 sm:mb-8">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              onClick={feat.action}
              className={`group flex items-center space-x-2 py-1 px-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isDark ? 'hover:bg-slate-800/50' : 'hover:bg-white/50'
              }`}
            >
              {/* Circular Colored Icon */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-md ${feat.bg} group-hover:scale-105 transition-transform duration-200`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-[12.5px] sm:text-[13.5px] font-bold leading-tight truncate transition-colors ${
                    isDark ? 'text-white' : 'text-[#0E1B33]'
                  }`}
                >
                  {feat.title}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight font-medium truncate transition-colors ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {feat.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Primary Button */}
        <button
          onClick={onOpenFileComplaint}
          className="btn-primary-gradient px-7 py-3.5 rounded-full text-white font-semibold text-[15px] flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/20 active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4 fill-white/20 stroke-[2] -rotate-12" />
          <span>{getTranslation(currentLang, 'btnFileComplaint')}</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </button>

        {/* Secondary Button */}
        <button
          onClick={onOpenLearnMore}
          className={`px-7 py-3.5 rounded-full font-semibold text-[15px] flex items-center justify-center space-x-1.5 transition-all duration-200 backdrop-blur-md cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-slate-900/50 hover:bg-slate-800/70 text-white border border-slate-600/70 shadow-sm'
              : 'bg-white/65 hover:bg-white/90 text-[#0E1B33] border border-slate-300/80 shadow-sm'
          }`}
        >
          <span>{getTranslation(currentLang, 'btnLearnMore')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
