'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

const STORAGE_KEY = 'loj-cookie-notice';

/**
 * A slim, dismissible notice — not a consent gate. The site sets only essential
 * cookies, so there is nothing to accept or reject; this simply informs and
 * links to the Cookie Policy. Dismissal is remembered per browser. Sits above
 * the mobile tab bar; a plain bottom bar on desktop. RTL-safe.
 */
export function CookieNotice() {
  const t = useTranslations('Cookie');
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === 'dismissed';
    } catch {
      dismissed = false;
    }
    if (dismissed) return;
    // Deferred a frame so this isn't a synchronous setState inside the effect.
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      /* private mode / storage blocked — just hide for this view */
    }
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))] z-40 md:bottom-0"
    >
      <div className="frosted border-t border-hairline">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-night/80">
            {t('noticeText')}{' '}
            <Link
              href="/cookies"
              className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
            >
              {t('noticeLearnMore')}
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 self-end rounded-full bg-night px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-night/90 sm:self-auto"
          >
            {t('noticeDismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
