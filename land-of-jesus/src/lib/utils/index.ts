import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display in the given locale (any BCP 47 code: 'en', 'uk', 'zh', 'fil', …).
 */
export function formatDate(date: Date | string | null, locale = 'en'): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(dateObj);
}

/**
 * Format a number with the locale's separators.
 */
export function formatNumber(num: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale).format(num);
}

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Short localized weekday name for an English day key ('monday' → 'Mon' / 'пн' / '月').
 * Unknown keys are returned unchanged.
 */
export function weekdayName(day: string, locale = 'en'): string {
  const index = WEEKDAY_INDEX[day.toLowerCase()];
  if (index === undefined) return day;
  // 7 January 2024 was a Sunday; adding the index gives the requested weekday.
  const date = new Date(Date.UTC(2024, 0, 7 + index, 12));
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date);
}

/**
 * Format a money amount in the locale's currency style — correct grouping and
 * currency-symbol placement per language (e.g. en `$250,000`, de `250.000 $`,
 * fr `250 000 $US`). Whole amounts only; the prototype's figures are USD.
 */
export function formatCurrency(amount: number, locale = 'en', currency = 'USD'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Check if a value is null or undefined
 */
export function isNullOrEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * Get the absolute URL for an image
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/images/placeholders/placeholder-church.jpg';
  if (path.startsWith('http')) return path;
  return path;
}
