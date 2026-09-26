'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeroChapter {
  image: string;
  /** City eyebrow, e.g. "Nazareth". */
  city: string;
  /** One narrative line, e.g. "Where the message began". */
  line: string;
}

export interface HeroCta {
  href: string;
  label: string;
}

export interface HeroProps {
  chapters: HeroChapter[];
  /** Descriptive page title — rendered as a persistent visually-hidden h1. */
  title: string;
  scrollHint: string;
  progressLabel: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}

/**
 * "Journey across the Holy Land" hero. Three chapters (Nazareth → Bethlehem →
 * Jerusalem) that cross-fade as the visitor scrolls, with a progress stepper
 * showing which chapter they are in.
 *
 * Two modes. The server render (and no-JS, and reduced motion) is a plain stack
 * of full-screen panels — the whole story is always readable without scripting.
 * After mount, when motion is allowed, it upgrades to a pinned stage; the active
 * chapter is how many viewports have scrolled past the section top (a passive,
 * rAF-throttled scroll/resize listener — no library). Only opacity animates.
 * The page's real h1 is a persistent visually-hidden title; the chapter lines
 * are captions, and off-screen chapters are `inert` (out of the tab order and
 * the accessibility tree). RTL-safe throughout.
 */
export function Hero({ chapters, title, scrollHint, progressLabel, primaryCta, secondaryCta }: HeroProps) {
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const lastIndex = chapters.length - 1;

  // Decide the mode once, on mount. Static unless scripting runs and motion is allowed.
  // Deferred a frame so the switch isn't a synchronous setState inside the effect.
  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const id = requestAnimationFrame(() => setEnhanced(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // While the stage is pinned, the active chapter is how many viewports we have
  // scrolled into it: one full screen per chapter. rAF-throttled, passive.
  useEffect(() => {
    if (!enhanced) return;
    const el = sectionRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight || 1;
      const top = el.getBoundingClientRect().top; // 0 when pinning starts, negative as you scroll in
      setActive(Math.min(lastIndex, Math.max(0, Math.floor(-top / vh))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update); // initial position, deferred out of the effect body
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enhanced, lastIndex]);

  if (!enhanced) {
    // Static baseline: stacked full-screen panels, whole story visible.
    return (
      <section aria-label={progressLabel}>
        <h1 className="sr-only">{title}</h1>
        {chapters.map((c, i) => (
          <div key={i} className="relative flex h-[100svh] items-end overflow-hidden bg-night text-white md:items-center">
            <Image src={c.image} alt="" fill priority={i === 0} unoptimized sizes="100vw" className="-z-10 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/50 to-night/10" aria-hidden="true" />
            <ChristPresence priority={i === 0} />
            <Container className="hero-pb pt-24 md:py-28">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/75">{c.city}</p>
              <p className="mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-tight md:text-7xl">
                {c.line}
              </p>
              {i === lastIndex ? <HeroCtas primaryCta={primaryCta} secondaryCta={secondaryCta} /> : null}
            </Container>
          </div>
        ))}
      </section>
    );
  }

  // Enhanced: a pinned stage that cross-fades between chapters as you scroll.
  // The stage pins for one viewport per chapter (section = chapters + 1 tall),
  // so the last chapter holds fully before the hero releases into the page.
  return (
    <section ref={sectionRef} aria-label={progressLabel} className="relative" style={{ height: `${(chapters.length + 1) * 100}svh` }}>
      <h1 className="sr-only">{title}</h1>
      <div className="sticky top-0 flex h-[100svh] items-end overflow-hidden bg-night text-white md:items-center">
        {chapters.map((c, i) => {
          const shown = i === active;
          return (
            <div
              key={i}
              inert={!shown}
              className={cn(
                'absolute inset-0 flex items-end transition-opacity duration-700 ease-ios md:items-center',
                shown ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Image src={c.image} alt="" fill priority={i === 0} unoptimized sizes="100vw" className="-z-10 object-cover" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/50 to-night/10" aria-hidden="true" />
              <ChristPresence priority={i === 0} />
              <Container className="hero-pb pt-24 md:py-28">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/75">{c.city}</p>
                <p className="mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-tight md:text-7xl">
                  {c.line}
                </p>
                {i === lastIndex ? <HeroCtas primaryCta={primaryCta} secondaryCta={secondaryCta} /> : null}
              </Container>
            </div>
          );
        })}

        <HeroProgress chapters={chapters} active={active} label={progressLabel} />

        <p
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-white/70 transition-opacity duration-500',
            active === 0 ? 'opacity-100' : 'opacity-0',
          )}
        >
          {scrollHint}
        </p>
        <span role="status" aria-live="polite" className="sr-only">
          {chapters[active]?.city}
        </span>
      </div>
    </section>
  );
}

/**
 * A masked figure of Christ — the 6th-century Sinai Pantocrator icon, from the
 * Holy Land itself — resting on the inline-end of the hero as a persistent
 * sacred presence over the journey. Purely decorative (empty alt, aria-hidden
 * wrapper); a radial feather melts it into the night background so the caption
 * on the inline-start stays clear. RTL-safe: pinned to the inline-end with a
 * horizontally symmetric mask.
 */
function ChristPresence({ priority = false }: { priority?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 end-0 w-[54%] sm:w-[44%] lg:w-[34%] [mask-image:radial-gradient(110%_78%_at_50%_34%,#000_22%,transparent_70%)] [-webkit-mask-image:radial-gradient(110%_78%_at_50%_34%,#000_22%,transparent_70%)]"
    >
      {/* A faint dark bed, feathered with the figure, so Christ reads gently over
          both the bright and dark chapters without covering the story or the
          caption. Kept subtle: a presence, not a second panel. */}
      <div className="absolute inset-0 bg-night/20" />
      <Image
        src="/images/christ-pantocrator.jpg"
        alt=""
        fill
        unoptimized
        priority={priority}
        sizes="(max-width: 768px) 54vw, 34vw"
        className="object-cover object-top opacity-[0.5] sm:opacity-[0.6]"
      />
    </div>
  );
}

function HeroCtas({ primaryCta, secondaryCta }: { primaryCta: HeroCta; secondaryCta: HeroCta }) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link href={primaryCta.href} className={buttonVariants({ size: 'lg' })}>
        {primaryCta.label}
        <ArrowRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
      </Link>
      <Link href={secondaryCta.href} className={buttonVariants({ variant: 'glass', size: 'lg' })}>
        <MapPin className="h-5 w-5" aria-hidden="true" />
        {secondaryCta.label}
      </Link>
    </div>
  );
}

function HeroProgress({ chapters, active, label }: { chapters: HeroChapter[]; active: number; label: string }) {
  // Vertical stepper on the inline-end edge, clear of the start-aligned caption
  // in both LTR and RTL. Dots on phones; dots + city names from sm up.
  return (
    <nav aria-label={label} className="absolute end-3 top-1/2 z-10 -translate-y-1/2 sm:end-6">
      <ol className="flex flex-col gap-4">
        {chapters.map((c, i) => {
          const current = i === active;
          return (
            <li key={i} className="flex items-center gap-2.5">
              <span
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-300',
                  current ? 'scale-125 bg-primary-500 ring-primary-500' : 'bg-white/30 ring-white/50',
                )}
              />
              <span
                className={cn(
                  // Visually dots-only on phones, but the city name stays in the
                  // accessibility tree so each step is named for screen readers.
                  // Shadow keeps the labels legible where they cross the figure.
                  'text-xs font-medium tracking-wide transition-colors duration-300 [text-shadow:0_1px_10px_rgb(0_0_0/0.7)] sr-only sm:not-sr-only',
                  current ? 'text-white' : 'text-white/70',
                )}
              >
                {c.city}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
