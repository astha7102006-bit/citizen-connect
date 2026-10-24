import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang');
      if (langParam) return langParam;

      const saved = localStorage.getItem('citizenconnect_lang');
      if (saved) return saved;
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('citizenconnect_lang', currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const t = (key, fallback) => getTranslation(currentLang, key, fallback);
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
