/**
 * I18n configuration for Land of Jesus
 * Supported locales: see `locales` below (en is the default)
 */

export const defaultLocale = 'en' as const;

export const locales = ['en', 'ar', 'he', 'es', 'pt', 'fr', 'it', 'de', 'pl', 'ro', 'el', 'ru', 'uk', 'hy', 'ka'] as const;

export type Locale = (typeof locales)[number];

/**
 * RTL languages
 */
export const rtlLocales: readonly Locale[] = ['ar', 'he'];

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}

/**
 * Get the direction for a locale
 */
export function getDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Validate locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Locale display names
 */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  he: 'עברית',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  pl: 'Polski',
  ro: 'Română',
  el: 'Ελληνικά',
  ru: 'Русский',
  uk: 'Українська',
  hy: 'Հայերեն',
  ka: 'ქართული',
};

/**
 * English locale names (secondary label + search in the language sheet)
 */
export const localeEnglishNames: Record<Locale, string> = {
  en: 'English',
  ar: 'Arabic',
  he: 'Hebrew',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  it: 'Italian',
  de: 'German',
  pl: 'Polish',
  ro: 'Romanian',
  el: 'Greek',
  ru: 'Russian',
  uk: 'Ukrainian',
  hy: 'Armenian',
  ka: 'Georgian',
};

/**
 * Does a language-sheet search query match this locale (native name, English name or code)?
 */
export function matchesLocaleQuery(locale: Locale, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return [localeNames[locale], localeEnglishNames[locale], locale].some((s) => s.toLocaleLowerCase().includes(q));
}

/**
 * Get native name for a locale
 */
export function getLocaleName(locale: Locale): string {
  return localeNames[locale] || locale;
}
