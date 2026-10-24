import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. Dark Mode
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const themeParam = urlParams.get('theme');
      if (themeParam === 'dark') return true;
      if (themeParam === 'light') return false;

      const saved = localStorage.getItem('citizenconnect_theme');
      if (saved !== null) return saved === 'dark';
    }
    return false; // Default Light Mode matching reference
  });

  // 2. Text Size: 'normal' (16px base) | 'medium' (18px base) | 'large' (20px base)
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('citizenconnect_fontsize') || 'normal';
    }
    return 'normal';
  });

  // 3. High Contrast Mode (WCAG AAA)
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('citizenconnect_highcontrast') === 'true';
    }
    return false;
  });

  // 4. Reduced Motion Mode
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('citizenconnect_reducedmotion');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // 5. Speech Synthesis Voice Settings
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Update DOM classes and localStorage on change
  useEffect(() => {
    localStorage.setItem('citizenconnect_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('citizenconnect_fontsize', fontSize);
    document.documentElement.classList.remove('text-size-normal', 'text-size-medium', 'text-size-large');
    document.documentElement.classList.add(`text-size-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('citizenconnect_highcontrast', highContrast ? 'true' : 'false');
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('citizenconnect_reducedmotion', reducedMotion ? 'true' : 'false');
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Read-Aloud Speech helper
  const speakText = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (availableVoices.length > 0 && availableVoices[selectedVoiceIndex]) {
      utterance.voice = availableVoices[selectedVoiceIndex];
    }
    utterance.rate = speechRate;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        setIsDark,
        toggleTheme,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        reducedMotion,
        setReducedMotion,
        availableVoices,
        selectedVoiceIndex,
        setSelectedVoiceIndex,
        speechRate,
        setSpeechRate,
        speakText,
        stopSpeaking,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
