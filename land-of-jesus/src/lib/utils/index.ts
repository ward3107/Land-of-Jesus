import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null, locale = 'en'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const locales: Record<string, string> = {
    en: 'en-US',
    ar: 'ar-SA',
    he: 'he-IL',
  };
  
  return dateObj.toLocaleDateString(locales[locale] || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a number with locale-aware formatting
 */
export function formatNumber(num: number, locale = 'en'): string {
  const locales: Record<string, string> = {
    en: 'en-US',
    ar: 'ar-SA',
    he: 'he-IL',
  };
  
  return new Intl.NumberFormat(locales[locale] || 'en-US').format(num);
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
