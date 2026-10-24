import React, { useState } from 'react';
import { Globe, X, Check, Search } from 'lucide-react';
import { LANGUAGES, getTranslation } from '../i18n/translations';

export default function LanguageModal({
  isOpen,
  onClose,
  currentLang,
  onSelectLanguage,
  isDark,
}) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl max-h-[85vh] rounded-3xl p-6 sm:p-7 shadow-2xl relative border flex flex-col ${
          isDark
            ? 'bg-slate-900/95 border-sky-400/20 text-white'
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
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E06820] to-[#FF9933] flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {getTranslation(currentLang, 'selectLanguage')}
            </h2>
            <p
              className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {getTranslation(currentLang, 'languageModalDesc')}
            </p>
          </div>
        </div>

        {/* Search input for languages */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language / भाषा खोजें..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none transition ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Languages Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[50vh]">
          {filteredLanguages.map((lang) => {
            const isSelected = currentLang === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-sky-500/20 border-sky-400 text-white font-bold ring-1 ring-sky-400'
                      : 'bg-orange-50 border-[#E06820] text-[#0E1B33] font-bold ring-1 ring-[#E06820]'
                    : isDark
                    ? 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-sm font-semibold truncate leading-tight">
                    {lang.native}
                  </span>
                  <span
                    className={`text-[11px] truncate mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {lang.name}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#E06820] dark:text-sky-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-300/30 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Eighth Schedule of the Constitution of India
          </span>
          <button
            onClick={onClose}
            className="btn-primary-gradient px-4 py-1.5 rounded-full text-white font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
