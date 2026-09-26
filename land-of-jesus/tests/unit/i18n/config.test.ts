import { describe, expect, it } from 'vitest';
import {
  getDirection,
  localeEnglishNames,
  localeNames,
  locales,
  matchesLocaleQuery,
  rtlLocales,
} from '@/lib/i18n/config';

describe('locale registry', () => {
  it('has unique codes, each with a native and an English name', () => {
    expect(new Set(locales).size).toBe(locales.length);
    for (const l of locales) {
      expect(localeNames[l]?.trim(), l).toBeTruthy();
      expect(localeEnglishNames[l]?.trim(), l).toBeTruthy();
    }
    expect(Object.keys(localeNames).sort()).toEqual([...locales].sort());
    expect(Object.keys(localeEnglishNames).sort()).toEqual([...locales].sort());
  });

  it('starts with English and keeps Arabic and Hebrew as the only RTL languages', () => {
    expect(locales[0]).toBe('en');
    expect([...rtlLocales].sort()).toEqual(['ar', 'he']);
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
  });

  it('offers the 32 languages in picker order', () => {
    expect(locales).toEqual([
      'en', 'ar', 'he', 'es', 'pt', 'fr', 'it', 'de', 'pl', 'ro', 'el',
      'ru', 'uk', 'hy', 'ka', 'am', 'hi', 'zh', 'ja', 'ko', 'fil', 'id',
      'nl', 'sv', 'cs', 'hu', 'sr', 'bg', 'hr', 'tr', 'vi', 'ml',
    ]);
  });
});

describe('matchesLocaleQuery', () => {
  it('matches native name, English name or code, case-insensitively', () => {
    expect(matchesLocaleQuery('ar', 'ARAB')).toBe(true);
    expect(matchesLocaleQuery('ar', 'العر')).toBe(true);
    expect(matchesLocaleQuery('he', 'he')).toBe(true);
    expect(matchesLocaleQuery('he', 'arab')).toBe(false);
  });

  it('matches everything for an empty or blank query', () => {
    expect(matchesLocaleQuery('en', '')).toBe(true);
    expect(matchesLocaleQuery('en', '   ')).toBe(true);
  });
});
