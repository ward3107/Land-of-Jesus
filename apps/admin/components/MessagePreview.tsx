'use client';

import { getDirection, type Locale } from '@communitydirect/core';

/**
 * A phone-style lock-screen preview of the push notification a subscriber will
 * receive. Renders in the variant's own direction (RTL for ar/he).
 */
export function MessagePreview({
  appName,
  title,
  body,
  locale,
}: {
  appName: string;
  title: string;
  body: string;
  locale: Locale;
}) {
  const dir = getDirection(locale);
  return (
    <div className="rounded-3xl bg-slate-900 p-3 shadow-inner">
      <div className="rounded-2xl bg-slate-800/60 p-3">
        <div className="rounded-xl bg-white/95 p-3" dir={dir}>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-brand-600" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
              {appName}
            </span>
            <span className="ms-auto text-[11px] text-ink-500">now</span>
          </div>
          <p className="text-sm font-semibold text-ink-900">{title || 'Message title'}</p>
          <p className="mt-0.5 line-clamp-3 text-sm text-ink-700">
            {body || 'Your message preview appears here as subscribers will see it.'}
          </p>
        </div>
      </div>
    </div>
  );
}
