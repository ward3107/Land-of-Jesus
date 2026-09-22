/**
 * Canonical locale primitives shared across the platform.
 *
 * The UI ships in Arabic, Hebrew and English for the MVP. Arabic and Hebrew are
 * right-to-left. This module is the single source of truth for which locales
 * exist and their writing direction; the `@communitydirect/i18n` package builds
 * translation dictionaries and React helpers on top of it.
 */

export const SUPPORTED_LOCALES = ['ar', 'he', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export type Direction = 'ltr' | 'rtl';

const RTL_LOCALES: ReadonlySet<Locale> = new Set(['ar', 'he']);

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Coerce arbitrary input (e.g. `navigator.language`, `Accept-Language`) to a supported locale. */
export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE;
  const base = value.toLowerCase().split(/[-_]/)[0];
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE;
}

export function getDirection(locale: Locale): Direction {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}

export const LOCALE_LABELS: Record<Locale, { native: string; english: string }> = {
  ar: { native: 'العربية', english: 'Arabic' },
  he: { native: 'עברית', english: 'Hebrew' },
  en: { native: 'English', english: 'English' },
};
