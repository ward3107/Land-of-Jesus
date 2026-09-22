import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@communitydirect/core';
import { createTranslator, DICTIONARIES, getDictionary, translate } from './dictionary';
import { getDirection, htmlLangAttributes, isRTL, physicalSide } from './rtl';

describe('locale direction (RTL)', () => {
  it('marks Arabic and Hebrew as RTL, English as LTR', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he')).toBe(true);
    expect(isRTL('en')).toBe(false);
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
  });

  it('produces correct <html> lang/dir attributes', () => {
    expect(htmlLangAttributes('ar')).toEqual({ lang: 'ar', dir: 'rtl' });
    expect(htmlLangAttributes('en-US')).toEqual({ lang: 'en', dir: 'ltr' });
    expect(htmlLangAttributes(undefined)).toEqual({ lang: 'en', dir: 'ltr' });
  });

  it('flips physical sides for RTL locales', () => {
    expect(physicalSide('start', 'en')).toBe('left');
    expect(physicalSide('end', 'en')).toBe('right');
    expect(physicalSide('start', 'he')).toBe('right');
    expect(physicalSide('end', 'ar')).toBe('left');
  });
});

describe('translation catalog', () => {
  it('provides a dictionary for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(DICTIONARIES[locale]).toBeDefined();
    }
  });

  it('every locale has the same set of keys as English (no missing translations)', () => {
    const keysOf = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'object' && v !== null
          ? keysOf(v, `${prefix}${k}.`)
          : [`${prefix}${k}`],
      );
    const reference = keysOf(DICTIONARIES.en).sort();
    for (const locale of SUPPORTED_LOCALES) {
      expect(keysOf(DICTIONARIES[locale]).sort()).toEqual(reference);
    }
  });

  it('translates known keys per locale', () => {
    expect(translate('en', 'common.follow')).toBe('Follow');
    expect(translate('ar', 'common.follow')).toBe('متابعة');
    expect(translate('he', 'common.follow')).toBe('עקוב');
  });

  it('falls back to English then to the key itself', () => {
    // Unknown locale normalizes to default (en).
    expect(translate('fr', 'admin.overview')).toBe('Overview');
    // Unknown key returns the key.
    expect(translate('en', 'does.not.exist' as never)).toBe('does.not.exist');
  });

  it('getDictionary + createTranslator are locale-bound', () => {
    expect(getDictionary('ar').common.appName).toBe(DICTIONARIES.ar.common.appName);
    const t = createTranslator('he');
    expect(t('common.send')).toBe('שלח');
  });
});
