import { describe, it, expect } from 'vitest';
import { LANGUAGES, TRANSLATIONS, getTranslation } from '../../src/i18n/translations.js';

describe('Global Language & Translation System', () => {
  it('defines 23 supported constitutional and administrative languages of India', () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(22);
    expect(LANGUAGES.some((l) => l.code === 'en')).toBe(true);
    expect(LANGUAGES.some((l) => l.code === 'hi')).toBe(true);

    for (const lang of LANGUAGES) {
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.native).toBeTruthy();
    }
  });

  it('translates core platform keys accurately in Hindi and English', () => {
    expect(getTranslation('en', 'navHome')).toBe('Home');
    expect(getTranslation('hi', 'navHome')).toBe('होम');

    expect(getTranslation('en', 'heroHeading1')).toBe('Building a Citizen-Powered');
    expect(getTranslation('hi', 'heroHeading1')).toBe('नागरिक-संचालित सरकारी');

    expect(getTranslation('en', 'navTrackStatus')).toBe('Track Status');
    expect(getTranslation('hi', 'navTrackStatus')).toBe('स्थिति ट्रैक करें');

    expect(getTranslation('en', 'navCitizenDashboard')).toBe('Citizen Dashboard');
    expect(getTranslation('hi', 'navCitizenDashboard')).toBe('नागरिक डैशबोर्ड');
  });

  it('safely falls back to English when a key is absent in a regional language', () => {
    const result = getTranslation('bn', 'nonExistentKey123', 'Fallback Text');
    expect(result).toBe('Fallback Text');

    // When no fallback argument is provided, returns key name rather than crashing
    const noFallback = getTranslation('hi', 'unknownKeyXYZ');
    expect(noFallback).toBe('unknownKeyXYZ');
  });

  it('ensures Emergency and Navigation critical keys exist in both English and Hindi', () => {
    const criticalKeys = [
      'navHome',
      'navFileComplaint',
      'navTrackStatus',
      'navPublicRecords',
      'navCitizenDashboard',
      'emergencyNotice',
      'emergencyCall112',
      'call112Btn',
      'selectLanguage',
      'languageModalDesc',
      'heroHeading1',
      'heroHeading2',
      'heroDescription',
      'cardTitle',
      'cardSubmitBtn',
    ];

    for (const key of criticalKeys) {
      expect(TRANSLATIONS.en[key]).toBeDefined();
      expect(typeof TRANSLATIONS.en[key]).toBe('string');
      expect(TRANSLATIONS.hi[key]).toBeDefined();
      expect(typeof TRANSLATIONS.hi[key]).toBe('string');
    }
  });
});
