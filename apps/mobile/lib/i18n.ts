import { I18nManager } from 'react-native';
import { getDirection, normalizeLocale, type Locale } from '@communitydirect/core';
import { createTranslator } from '@communitydirect/i18n';

/**
 * Apply a locale's writing direction to the native layout. Call on locale
 * change; a full RTL/LTR flip requires an app reload on native, so callers
 * should prompt the user to restart when the direction changes.
 */
export function applyLocaleDirection(locale: Locale): { changed: boolean } {
  const shouldBeRTL = getDirection(locale) === 'rtl';
  const changed = I18nManager.isRTL !== shouldBeRTL;
  if (changed) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
  return { changed };
}

export function makeTranslator(locale: string | null | undefined) {
  return createTranslator(normalizeLocale(locale));
}

export { normalizeLocale, getDirection };
