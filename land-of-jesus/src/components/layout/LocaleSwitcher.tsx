'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

/**
 * Switch locale while staying on the same page. Uses next-intl navigation so the
 * path (without the locale prefix) is preserved and `dir` updates on the server.
 */
export function LocaleSwitcher() {
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelect(next: Locale) {
    if (next === active) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      <Globe className="me-1 h-4 w-4 text-stone-500" aria-hidden="true" />
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => onSelect(loc)}
          disabled={isPending}
          aria-current={loc === active ? 'true' : undefined}
          className={cn(
            'rounded-md px-2 py-1 text-sm font-medium transition-colors disabled:opacity-50',
            loc === active
              ? 'bg-stone-100 text-stone-900'
              : 'text-stone-500 hover:text-stone-900',
          )}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
