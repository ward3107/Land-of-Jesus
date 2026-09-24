'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { Container } from './Container';
import { LanguageSheet } from './LanguageSheet';
import { NAV_ITEMS, isActivePath } from './nav-items';
import { cn } from '@/lib/utils';

/**
 * Frosted top bar on every screen size: wordmark + language button. From md up
 * it also shows the primary destinations (phones use the BottomTabBar).
 */
export function TopBar() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();

  return (
    <header className="frosted safe-pt sticky top-0 z-40 border-b border-hairline">
      <Container className="flex h-topbar items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-md font-serif text-lg font-semibold tracking-tight text-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
        >
          Land of Jesus
        </Link>

        <nav aria-label={t('primaryNav')} className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  active ? 'bg-primary-100 text-primary-800' : 'text-muted hover:bg-stone-100 hover:text-night',
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <LanguageSheet />
      </Container>
    </header>
  );
}
