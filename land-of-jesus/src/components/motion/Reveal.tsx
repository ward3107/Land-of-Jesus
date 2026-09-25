'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  /** Stagger in ms; use 60ms steps across a grid. */
  delay?: number;
  className?: string;
}

/**
 * Fades and lifts content into place the first time it scrolls into view.
 * Server-rendered content is always visible (`[data-reveal]` with no
 * `[data-pending]`): globals.css only hides an element while it carries
 * `data-pending`, and that attribute is only ever added client-side, after
 * mount, for an element that is below the viewport when it mounts. An
 * element already in (or above) the viewport, a hydration failure, no-JS,
 * reduced motion, and print are therefore all always visible - state lives
 * in a data attribute set outside React (no re-render, no setState-in-effect).
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof IntersectionObserver === 'undefined') return;

    // Already in (or above) the viewport at mount: stays visible, no observer.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.setAttribute('data-pending', '');

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.removeAttribute('data-pending');
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
