import { DEFAULT_LOCALE, normalizeLocale, type Locale } from '@communitydirect/core';
import ar from './messages/ar.json';
import en from './messages/en.json';
import he from './messages/he.json';

/** The English catalog is the reference shape all locales must satisfy. */
export type Messages = typeof en;

export const DICTIONARIES: Record<Locale, Messages> = {
  en,
  ar: ar as Messages,
  he: he as Messages,
};

export function getDictionary(locale: string | null | undefined): Messages {
  return DICTIONARIES[normalizeLocale(locale)];
}

type Leaves<T> = T extends object
  ? { [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? '' : `.${Leaves<T[K]>}`}` }[keyof T]
  : never;

/** Dot-path into the message catalog, e.g. "admin.overview". */
export type MessageKey = Leaves<Messages>;

function lookup(dict: Messages, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], dict);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Translate `key` for `locale`. Falls back to the default locale, then returns
 * the key itself so missing translations are visible rather than crashing.
 */
export function translate(locale: string | null | undefined, key: MessageKey): string {
  const resolved = normalizeLocale(locale);
  return lookup(DICTIONARIES[resolved], key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key) ?? key;
}

/** Build a bound translator for a fixed locale. */
export function createTranslator(locale: string | null | undefined): (key: MessageKey) => string {
  const resolved = normalizeLocale(locale);
  return (key) => translate(resolved, key);
}
