import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslation, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLangState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && LANGUAGES.some((l) => l.code === langParam)) {
          return langParam;
        }

        const saved = localStorage.getItem('citizenconnect_lang');
        if (saved && LANGUAGES.some((l) => l.code === saved)) {
          return saved;
        }
      } catch (err) {
        console.warn('Language initialization error:', err);
      }
    }
    return 'en';
  });

  const setCurrentLang = useCallback((langCode) => {
    if (!langCode || typeof langCode !== 'string') return;
    const cleanCode = langCode.trim();
    if (!LANGUAGES.some((l) => l.code === cleanCode)) return;

    setCurrentLangState(cleanCode);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('citizenconnect_lang', cleanCode);
        document.documentElement.lang = cleanCode;

        // Keep URL parameter in sync if present
        const url = new URL(window.location.href);
        if (url.searchParams.has('lang')) {
          url.searchParams.set('lang', cleanCode);
          window.history.replaceState({}, '', url.toString());
        }
      } catch (err) {
        console.warn('Language persistence error:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('citizenconnect_lang', currentLang);
        document.documentElement.lang = currentLang;
      } catch (err) {
        console.warn('Language effect persistence error:', err);
      }
    }
  }, [currentLang]);

  const t = useCallback((key, fallback) => getTranslation(currentLang, key, fallback), [currentLang]);
  const isHi = currentLang === 'hi';

  const currentLangObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setCurrentLang,
        currentLangObj,
        t,
        isHi,
        languages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
