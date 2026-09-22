import { getDirection, normalizeLocale, type Direction, type Locale } from '@communitydirect/core';

/** Props to spread onto an <html> element for correct language & direction. */
export function htmlLangAttributes(locale: string | null | undefined): {
  lang: Locale;
  dir: Direction;
} {
  const resolved = normalizeLocale(locale);
  return { lang: resolved, dir: getDirection(resolved) };
}

/**
 * Map a logical ("start"/"end") side to a physical ("left"/"right") side given
 * the locale direction — useful when a styling system lacks logical properties.
 */
export function physicalSide(
  logical: 'start' | 'end',
  locale: string | null | undefined,
): 'left' | 'right' {
  const dir = getDirection(normalizeLocale(locale));
  if (dir === 'ltr') return logical === 'start' ? 'left' : 'right';
  return logical === 'start' ? 'right' : 'left';
}

export { getDirection, isRTL } from '@communitydirect/core';
