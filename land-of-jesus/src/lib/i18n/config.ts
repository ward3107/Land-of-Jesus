/**
 * I18n configuration for Land of Jesus
 * Supported locales: en (default), ar, he
 */

export const defaultLocale = 'en' as const;

export const locales = ['en', 'ar', 'he'] as const;

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
};

/**
 * Get native name for a locale
 */
export function getLocaleName(locale: Locale): string {
  return localeNames[locale] || locale;
}
