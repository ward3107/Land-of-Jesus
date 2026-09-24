'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { NAV_ITEMS, isActivePath } from './nav-items';
import { cn } from '@/lib/utils';

/**
 * iOS-style bottom tab bar for phones (hidden from md up, where the TopBar
 * shows the same destinations). Frosted, safe-area aware, 44px+ targets.
 */
export function BottomTabBar() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('primaryNav')}
      className="frosted safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-hairline md:hidden"
    >
      <ul className="mx-auto flex h-tabbar max-w-lg">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-[color,transform] duration-150 ease-ios active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
                  active ? 'text-primary-600' : 'text-muted',
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                <span>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
