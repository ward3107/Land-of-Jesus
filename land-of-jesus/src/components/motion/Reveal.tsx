'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  /** Stagger in ms; use 60ms steps across a grid. */
  delay?: number;
  className?: string;
}

/**
 * Fades and lifts its children into place the first time they scroll into
 * view. The state lives in a data attribute set outside React (no re-render,
 * no setState-in-effect). globals.css only hides [data-reveal] when scripting
 * runs and motion is allowed. Wrap cards and headings, not whole long lists.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute('data-visible', '');

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      show();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div ref={ref} data-reveal="" className={className} style={style}>
      {children}
    </div>
  );
}
