import React from 'react';
import { Users, Shield, TrendingUp, HeartHandshake } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export default function BottomStatsBar({ isDark, currentLang = 'en' }) {
  const stats = [
    {
      icon: Users,
      headline: getTranslation(currentLang, 'stat1Number'),
      subtext: getTranslation(currentLang, 'stat1Text'),
    },
    {
      icon: Shield,
      headline: getTranslation(currentLang, 'stat2Number'),
      subtext: getTranslation(currentLang, 'stat2Text'),
    },
    {
      icon: TrendingUp,
      headline: getTranslation(currentLang, 'stat3Number'),
      subtext: getTranslation(currentLang, 'stat3Text'),
    },
    {
      icon: HeartHandshake,
      headline: getTranslation(currentLang, 'stat4Number'),
      subtext: getTranslation(currentLang, 'stat4Text'),
    },
  ];

  return (
    <div className="w-full max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-14">
      <div
        className={`w-full rounded-2xl sm:rounded-3xl px-6 sm:px-10 py-3.5 sm:py-4 transition-all duration-300 shadow-xl ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 items-center divide-y lg:divide-y-0 lg:divide-x divide-slate-400/20">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`flex items-center space-x-4 ${
                  idx === 0
                    ? 'lg:pr-8'
                    : idx === stats.length - 1
                    ? 'lg:pl-8 pt-3 lg:pt-0'
                    : 'lg:px-8 pt-3 lg:pt-0'
                }`}
              >
                {/* Circular Blue Icon Badge */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex-shrink-0 bg-[#0F4C81] flex items-center justify-center text-white shadow-md">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                </div>

                {/* Text Content */}
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-base sm:text-[17px] font-bold tracking-tight leading-snug truncate transition-colors ${
                      isDark ? 'text-white' : 'text-[#0E1B33]'
                    }`}
                  >
                    {item.headline}
                  </span>
                  <span
                    className={`text-xs sm:text-[13px] font-normal leading-tight truncate transition-colors ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {item.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
