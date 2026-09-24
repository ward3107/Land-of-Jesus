'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Show the button once the visitor has scrolled past most of the first screen. */
export function shouldShowBackToTop(scrollY: number, viewportHeight: number): boolean {
  return scrollY > viewportHeight * 0.8;
}

/**
 * Floating "back to top" button. It sits above the tab bar on phones and in the
 * inline-end corner (auto-mirrors in RTL). The scroll listener is passive and
 * throttled to one check per animation frame.
 */
export function BackToTop() {
  const t = useTranslations('Common');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(shouldShowBackToTop(window.scrollY, window.innerHeight));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const toTop = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t('backToTop')}
      inert={!visible}
      data-visible={visible}
      className={cn(
        'float-above-tabbar fixed end-4 z-30 grid h-12 w-12 place-items-center rounded-full border border-hairline bg-surface text-night shadow-float md:bottom-6 md:end-6',
        'transition-[opacity,transform] duration-300 ease-ios active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        visible ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0',
      )}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
