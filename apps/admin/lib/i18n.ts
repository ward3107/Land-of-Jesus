import { cookies } from 'next/headers';
import { normalizeLocale, type Locale } from '@communitydirect/core';

export const LOCALE_COOKIE = 'cd_locale';

/** Resolve the active admin UI locale from the cookie (defaults to English). */
export async function getActiveLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}
