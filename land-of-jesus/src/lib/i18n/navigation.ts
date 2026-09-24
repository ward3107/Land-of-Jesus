import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

/**
 * Locale-aware navigation. `Link`/`useRouter`/`usePathname` here automatically
 * keep the active locale prefix (localePrefix: 'always'), so a link to
 * `/explore` from `/ar` goes to `/ar/explore` — no redirect hop, no locale loss.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation({
  locales,
  defaultLocale,
  localePrefix: 'always',
});
