import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import GlassCard from '../../components/common/GlassCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Sun,
  Moon,
  Globe,
  Eye,
  Type,
  Volume2,
  VolumeX,
  Check,
  Sparkles,
  AlertTriangle,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Play,
  Square,
  BookOpen,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    isDark,
    setIsDark,
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
  } = useTheme();

  const { currentLang, setCurrentLang, languages } = useLanguage();
  const isHi = currentLang === 'hi';

  const [saveToast, setSaveToast] = useState('');
  const [testSpeechText, setTestSpeechText] = useState(
    'CitizenConnect provides a tamper-evident civic accountability ledger. If you are in danger right now, call 112.'
  );

  const handleSave = () => {
    setSaveToast(
      isHi
        ? 'पहुंच और दृश्य प्राथमिकताएं सफलतापूर्वक अपडेट की गईं!'
        : 'Accessibility and display preferences updated successfully!'
    );
    setTimeout(() => setSaveToast(''), 4000);
  };

  const handleTestReadAloud = () => {
    const textToSpeak = isHi
      ? 'सिटिज़न कनेक्ट एक पारदर्शी जन शिकायत प्रणाली है। यदि आप इस समय किसी खतरे में हैं, तो तत्काल 112 डायल करें।'
      : testSpeechText;
    speakText(textToSpeak);
  };

  // Statutory Acronym Glossary (Official Acronyms retained with plain-language explanations)
  const ACRONYM_GLOSSARY = [
    {
      acronym: 'RTI',
      title: 'Right to Information',
      titleHi: 'सूचना का अधिकार',
      description: 'Right to Information Act, 2005. Statutory right to inspect public files, notings, and records.',
      descriptionHi: 'सूचना का अधिकार अधिनियम, 2005। सरकारी फ़ाइल नोटिंग्स और अभिलेखों की जांच का कानूनी अधिकार।',
    },
    {
      acronym: 'FIR',
      title: 'First Information Report',
      titleHi: 'प्रथम सूचना रिपोर्ट',
      description: 'Formal record prepared by police under Section 154 CrPC / Section 173 BNSS upon receiving information of a cognizable offence.',
      descriptionHi: 'संज्ञेय अपराध की सूचना मिलने पर पुलिस द्वारा धारा 173 बीएनएसएस के तहत दर्ज की जाने वाली प्राथमिकी।',
    },
    {
      acronym: 'Lokayukta',
      title: 'State Anti-Corruption Ombudsman',
      titleHi: 'राज्य लोकायुक्त',
      description: 'Independent statutory vigilance authority empowered to investigate corruption allegations against public officials.',
      descriptionHi: 'लोक सेवकों के भ्रष्टाचार की जांच करने वाला स्वतंत्र वैधानिक जांच निकाय।',
    },
    {
      acronym: 'DLSA',
      title: 'District Legal Services Authority',
      titleHi: 'जिला विधिक सेवा प्राधिकरण',
      description: 'Statutory body established in every District Court Complex under the Legal Services Authorities Act, 1987 providing free legal aid.',
      descriptionHi: 'प्रत्येक जिला न्यायालय परिसर में स्थित वैधानिक निकाय जो धारा 12 के तहत मुफ्त वकील उपलब्ध कराता है।',
    },
    {
      acronym: 'BNSS',
      title: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
      titleHi: 'भारतीय नागरिक सुरक्षा संहिता, 2023',
      description: 'The procedural law governing criminal investigation, FIR registration, and judicial inquiries in India.',
      descriptionHi: 'भारत में आपराधिक जांच और अदालती प्रक्रिया को नियंत्रित करने वाला प्रक्रियात्मक कानून।',
    },
    {
      acronym: 'CPGRAMS',
      title: 'Central Public Grievance Redress System',
      titleHi: 'केंद्रीय लोक शिकायत निवारण प्रणाली',
      description: 'National 24x7 online grievance portal operated by DARPG, Government of India.',
      descriptionHi: 'केंद्रीय मंत्रालयों और विभागों के लिए भारत सरकार का राष्ट्रीय शिकायत पोर्टल।',
    },
    {
      acronym: 'ACB',
      title: 'Anti-Corruption Bureau',
      titleHi: 'भ्रष्टाचार निरोधक ब्यूरो',
      description: 'Specialized state law enforcement agency investigating bribery traps under the Prevention of Corruption Act.',
      descriptionHi: 'रिश्वतखोरी के मामलों में कानूनी जाल (ट्रैप) बिछाने वाली विशेष पुलिस एजेंसी।',
    },
  ];

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-14 py-8 space-y-8">
      {/* 1. Mandatory Emergency Banner */}
      <div className="p-3.5 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>
            {isHi
              ? 'यदि आप इस समय किसी खतरे में हैं, तो तत्काल 112 पर कॉल करें।'
              : 'If you are in danger right now, call 112 immediately for emergency police response.'}
          </span>
        </div>
        <a
          href="tel:112"
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-sm flex-shrink-0"
        >
          Call 112
        </a>
      </div>

      <PageHeader
        title={
          isHi
            ? 'पहुंच, सेटिंग्स एवं भाषा प्राथमिकताएं'
            : 'Accessibility, Settings & Platform Preferences'
        }
        subtitle={
          isHi
            ? 'पाठ का आकार, उच्च-विपरीत मोड, ब्राउज़र वॉइस रीड-अलाउड, गति में कमी और भारत की भाषाओं को कॉन्फ़िगर करें।'
            : 'Configure text size scaling, high-contrast mode, browser speech synthesis read-aloud, reduced motion, and bilingual English / हिंदी interface.'
        }
        badge={
          <Badge variant="primary" dot>
            {isHi ? 'सार्वभौमिक पहुंच' : 'WCAG AA Accessibility'}
          </Badge>
        }
        breadcrumbs={[
          { label: isHi ? 'सिस्टम' : 'System' },
          { label: isHi ? 'सेटिंग्स एवं पहुंच' : 'Settings & Accessibility' },
        ]}
        action={
          <Button
            variant="primary"
            onClick={handleSave}
            className="btn-touch-target bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
          >
            {isHi ? 'प्राथमिकताएं सहेजें' : 'Save Preferences'}
          </Button>
        }
        isDark={isDark}
      />

      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in"
        >
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ─── COLUMN 1: VISUAL & SENSORY ACCESSIBILITY ──────────────────────── */}
        <div className="space-y-6">
          {/* Text Size Scaling */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHi ? 'पाठ आकार स्तर (Text Size Scaling)' : 'Text Size Scaling (3 Levels)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isHi
                    ? 'पूरे प्लेटफ़ॉर्म पर फ़ॉन्ट आकार को 16px, 18px या 20px में बदलें'
                    : 'Scale base body font size across the platform (Min 16px WCAG baseline)'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { id: 'normal', label: isHi ? 'सामान्य (16px)' : 'Normal (16px)', desc: '100% scale' },
                { id: 'medium', label: isHi ? 'मध्यम (18px)' : 'Medium (18px)', desc: '112.5% scale' },
                { id: 'large', label: isHi ? 'बड़ा (20px)' : 'Large (20px)', desc: '125% scale' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setFontSize(lvl.id)}
                  className={`btn-touch-target p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    fontSize === lvl.id
                      ? 'border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30 font-bold'
                      : isDark
                      ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400 block text-[11px] uppercase font-bold mb-1">
                {isHi ? 'पूर्वावलोकन नमूना:' : 'Live Font Scaling Preview:'}
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {isHi
                  ? 'यह एक परीक्षण वाक्य है। सिटिज़न कनेक्ट पर सभी शिकायतें पारदर्शी रूप से दर्ज होती हैं।'
                  : 'Sample paragraph text demonstrating your selected reading scale on CitizenConnect.'}
              </p>
            </div>
          </GlassCard>

          {/* Theme & High-Contrast Mode */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHi ? 'थीम एवं उच्च-विपरीत मोड' : 'Theme & High-Contrast Display'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isHi ? 'लाइट, डार्क और उच्च-विपरीत कंट्रास्ट मोड' : 'Light, Dark, and WCAG AAA High Contrast mode'}
                </p>
              </div>
            </div>

            {/* Light / Dark Mode selector */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setIsDark(false)}
                className={`btn-touch-target p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white border-[#0F4C81] ring-2 ring-[#0F4C81]/30 shadow-md text-slate-900 font-bold'
                    : 'bg-slate-900/60 border-slate-700 hover:border-slate-500 text-slate-400'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <div className="text-xs font-bold">{isHi ? 'लाइट मोड' : 'Light Mode'}</div>
                <div className="text-[10px] text-slate-500">Golden hour Parliament</div>
              </button>

              <button
                onClick={() => setIsDark(true)}
                className={`btn-touch-target p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-sky-400 ring-2 ring-sky-400/30 shadow-md text-white font-bold'
                    : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-600'
                }`}
              >
                <Moon className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                <div className="text-xs font-bold">{isHi ? 'डार्क मोड' : 'Dark Mode'}</div>
                <div className="text-[10px] text-slate-500">Night illuminated Sansad</div>
              </button>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <label htmlFor="toggle-high-contrast" className="font-bold text-xs cursor-pointer block">
                  {isHi ? 'उच्च विपरीत मोड (High-Contrast Mode)' : 'High-Contrast Mode (WCAG AAA)'}
                </label>
                <p className="text-[11px] text-slate-500">
                  {isHi
                    ? 'अक्षर और सीमाओं के बीच अधिकतम कंट्रास्ट (125% कंट्रास्ट + स्पष्ट पीले फ़ोकस रिंग)'
                    : 'Maximizes border sharpness, contrast (125%), and high-visibility keyboard focus rings'}
                </p>
              </div>
              <input
                id="toggle-high-contrast"
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 cursor-pointer"
              />
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <label htmlFor="toggle-reduced-motion" className="font-bold text-xs cursor-pointer block">
                  {isHi ? 'गति में कमी (Reduced-Motion Support)' : 'Reduced-Motion Support'}
                </label>
                <p className="text-[11px] text-slate-500">
                  {isHi
                    ? 'भारतीय ध्वज के 3D तरंग प्रभाव और यूआई ट्रांजिशन को रोकें'
                    : 'Pauses the 3D flag waving ripples and disables animated layout transitions'}
                </p>
              </div>
              <input
                id="toggle-reduced-motion"
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 cursor-pointer"
              />
            </div>
          </GlassCard>

          {/* Read-Aloud Browser Speech Synthesis */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHi ? 'बोलकर पढ़ें (Read-Aloud Speech Synthesis)' : 'Read-Aloud Browser Speech Synthesis'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isHi
                    ? 'ब्राउज़र के वॉइस इंजन का उपयोग करके स्क्रीन की जानकारी सुनें'
                    : 'Auditory playback using the browser’s SpeechSynthesis engine'}
                </p>
              </div>
            </div>

            {/* Voice Dropdown */}
            <div>
              <label htmlFor="voice-select" className="block text-[11px] font-bold text-slate-500 mb-1">
                {isHi ? 'सिंथेटिक आवाज़ चुनें (Available Voices):' : 'Select Voice:'}
              </label>
              <select
                id="voice-select"
                value={selectedVoiceIndex}
                onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-sky-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {availableVoices.length > 0 ? (
                  availableVoices.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                ) : (
                  <option value={0}>Default System Voice</option>
                )}
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <label htmlFor="speech-rate-slider" className="font-bold text-slate-500">
                  {isHi ? 'बोलने की गति (Speech Rate):' : 'Speech Rate / Speed:'}
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{speechRate}x</span>
              </div>
              <input
                id="speech-rate-slider"
                type="range"
                min="0.6"
                max="1.6"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            {/* Test Read-Aloud Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestReadAloud}
                className="btn-touch-target flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isHi ? 'नमूना वाक्य सुनें' : 'Test Read-Aloud'}</span>
              </button>
              <button
                type="button"
                onClick={stopSpeaking}
                className="btn-touch-target px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                title="Stop audio playback"
              >
                <Square className="w-3.5 h-3.5 fill-current text-red-500" />
                <span>Stop</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* ─── COLUMN 2: LANGUAGE & STATUTORY ACRONYMS ───────────────────────── */}
        <div className="space-y-6">
          {/* Primary Language Toggle: English & हिंदी */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#E06820] text-white flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  English / हिंदी Language Selector
                </h3>
                <p className="text-xs text-slate-500">
                  Bilingual citizen interface with constitutional Hindi & English support
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCurrentLang('en')}
                className={`btn-touch-target p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  currentLang === 'en'
                    ? 'border-[#E06820] bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-[#E06820]/40 font-bold'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-lg font-black block">English</span>
                <span className="text-[11px] text-slate-500">Standard Administrative Language</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentLang('hi')}
                className={`btn-touch-target p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                  currentLang === 'hi'
                    ? 'border-[#E06820] bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-[#E06820]/40 font-bold'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-lg font-black block">हिन्दी (Hindi)</span>
                <span className="text-[11px] text-slate-500">राजभाषा / आधिकारिक भाषा</span>
              </button>
            </div>

            {/* Additional Indian Languages (Schedule VIII) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {isHi ? 'अन्य 22 संविधानिक भाषाएं (अनुसूची VIII):' : 'All 22 Constitutional Languages (Schedule VIII):'}
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setCurrentLang(l.code)}
                    className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                      currentLang === l.code
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold'
                        : 'hover:bg-slate-500/10 border border-transparent'
                    }`}
                  >
                    <span>{l.native} ({l.name})</span>
                    {currentLang === l.code && <Badge variant="primary" size="sm">Active</Badge>}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Statutory Acronym Glossary & Explanations */}
          <GlassCard isDark={isDark} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHi ? 'वैधानिक संक्षिप्ताक्षर एवं शब्दावली' : 'Recognised Statutory Acronyms & Explanations'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isHi
                    ? 'RTI, FIR, Lokayukta, DLSA, BNSS के आधिकारिक नाम और सरल भाषा में व्याख्या'
                    : 'Official acronyms retained with plain-language definitions'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {ACRONYM_GLOSSARY.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-[#E06820]">
                      {item.acronym}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isHi ? item.titleHi : item.title}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    {isHi ? item.descriptionHi : item.description}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
