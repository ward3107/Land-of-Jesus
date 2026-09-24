'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Container } from './Container';
import { cn } from '@/lib/utils';

// Only routes that actually exist are linked (per integration plan decision).
const NAV = [
  { href: '/', key: 'home' as const },
  { href: '/explore', key: 'explore' as const },
  { href: '/projects', key: 'projects' as const },
  { href: '/stories', key: 'stories' as const },
  { href: '/visit', key: 'visit' as const },
];

export function AppHeader() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-serif text-xl font-medium text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          Land of Jesus
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isActive(item.href)
                  ? 'text-stone-900'
                  : 'text-stone-600 hover:text-stone-900',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {t('explore')}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-stone-700 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open ? (
        <div id="mobile-nav" className="border-t border-stone-200 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-base font-medium',
                  isActive(item.href)
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-700 hover:bg-stone-100',
                )}
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="mt-3 border-t border-stone-200 pt-3">
              <LocaleSwitcher />
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
