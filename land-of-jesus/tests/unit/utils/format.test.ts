import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber, weekdayName } from '@/lib/utils';

const MID_JANUARY = new Date(Date.UTC(2025, 0, 15, 12));

describe('formatDate', () => {
  it('formats in any locale, not just en/ar/he', () => {
    expect(formatDate(MID_JANUARY, 'en')).toBe('January 15, 2025');
    expect(formatDate(MID_JANUARY, 'de')).toBe('15. Januar 2025');
    expect(formatDate(MID_JANUARY, 'ru')).toContain('января');
  });

  it('returns an empty string for missing or invalid dates', () => {
    expect(formatDate(null, 'en')).toBe('');
    expect(formatDate('not a date', 'en')).toBe('');
  });
});

describe('formatNumber', () => {
  it('uses the locale separators', () => {
    expect(formatNumber(1234567.5, 'en')).toBe('1,234,567.5');
    expect(formatNumber(1234567.5, 'de')).toBe('1.234.567,5');
  });
});

describe('weekdayName', () => {
  it('localizes English day keys', () => {
    expect(weekdayName('monday', 'en')).toBe('Mon');
    expect(weekdayName('monday', 'de')).toBe('Mo');
    expect(weekdayName('sunday', 'ru')).toBe('вс');
    expect(weekdayName('monday', 'ja')).toBe('月');
  });

  it('is case-insensitive and leaves unknown keys alone', () => {
    expect(weekdayName('Friday', 'en')).toBe('Fri');
    expect(weekdayName('funday', 'en')).toBe('funday');
  });
});
