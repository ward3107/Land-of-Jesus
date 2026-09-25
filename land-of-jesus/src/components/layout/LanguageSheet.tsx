'use client';

import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Globe, Search, X } from 'lucide-react';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import {
  getDirection,
  localeEnglishNames,
  localeNames,
  locales,
  matchesLocaleQuery,
  type Locale,
} from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Language button + iOS-style bottom sheet (a centered dialog from md up).
 *
 * A role="dialog" panel rather than <dialog>, portaled to <body>: the frosted
 * TopBar's backdrop-filter would otherwise become the containing block for
 * position:fixed and trap the sheet inside the header. Lists every locale from
 * lib/i18n/config in its own script, so it scales to many languages.
 */
export function LanguageSheet({ className }: { className?: string }) {
  const t = useTranslations('Common');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const searchId = useId();
  const [query, setQuery] = useState('');

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const choose = (next: Locale) => {
    close();
    if (next === locale) return;
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  const visibleLocales = locales.filter((l) => matchesLocaleQuery(l, query));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t('language')}: ${localeNames[locale] ?? locale}`}
        onClick={() => {
          setQuery('');
          setOpen(true);
        }}
        className={cn(
          'inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-night transition-[background-color,transform] duration-150 ease-ios hover:bg-stone-100 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          className,
        )}
      >
        <Globe className="h-[18px] w-[18px]" aria-hidden="true" />
        <span aria-hidden="true">{localeNames[locale] ?? locale}</span>
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
              <div
                data-testid="sheet-backdrop"
                aria-hidden="true"
                onClick={close}
                className="absolute inset-0 animate-fade-in bg-night/40"
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="safe-pb relative max-h-[85dvh] w-full max-w-md animate-sheet-up overflow-y-auto overscroll-contain rounded-t-sheet bg-linen shadow-float md:animate-fade-in md:rounded-sheet"
              >
                <div className="sticky top-0 z-10 bg-linen">
                  <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-hairline md:hidden" aria-hidden="true" />
                  <div className="flex items-center justify-between px-5 py-3">
                    <h2 id={titleId} className="text-lg font-semibold text-night">
                      {t('language')}
                    </h2>
                    <button
                      type="button"
                      onClick={close}
                      aria-label={t('close')}
                      className="grid h-8 w-8 place-items-center rounded-full bg-stone-200/70 text-muted transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="relative mx-4 mb-3">
                    <label htmlFor={searchId} className="sr-only">
                      {t('searchLanguages')}
                    </label>
                    <Search
                      className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id={searchId}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('searchLanguages')}
                      autoComplete="off"
                      className="h-10 w-full rounded-control bg-stone-100 pe-3 ps-9 text-base text-night placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                {visibleLocales.length === 0 ? (
                  <p role="status" className="px-5 pb-8 pt-4 text-center text-muted">
                    {t('noLanguageMatch')}
                  </p>
                ) : (
                  <ul className="mx-4 mb-4 divide-y divide-hairline overflow-hidden rounded-control bg-surface">
                    {visibleLocales.map((l) => {
                      const current = l === locale;
                      return (
                        <li key={l}>
                          <button
                            type="button"
                            lang={l}
                            dir={getDirection(l)}
                            aria-current={current ? 'true' : undefined}
                            onClick={() => choose(l)}
                            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-start text-base text-night transition-colors hover:bg-stone-50 active:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                          >
                            <span className="flex min-w-0 flex-col">
                              <span>{localeNames[l]}</span>
                              {l !== 'en' ? (
                                <span lang="en" dir="ltr" className="text-sm text-muted">
                                  {localeEnglishNames[l]}
                                </span>
                              ) : null}
                            </span>
                            {current ? <Check className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
