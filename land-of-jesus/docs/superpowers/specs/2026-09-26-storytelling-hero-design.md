# Storytelling Hero — "Journey across the Holy Land" — Design

Date: 2026-09-26
Status: Approved (design)
Scope: Replace the home page's single-photo hero with a scroll-driven, three-chapter journey. Home page below the hero and all other pages are untouched.

## 1. Goal

Turn the hero into a story the visitor scrolls through: three chapters that follow the Gospel geography — Nazareth → Bethlehem → Jerusalem — each a real Holy Land photo that cross-fades into the next, with a **progress stepper** that shows which chapter the visitor is in. Seamless, native (no animation library, no video), free, and it keeps the site's 22 languages, RTL, accessibility and reduced-motion behavior.

## 2. Chapters

Fixed narrative (not database-driven), using the three existing church photos:

| # | City (eyebrow) | Photo | Narrative line (new copy) |
| --- | --- | --- | --- |
| 1 | Nazareth | `/images/churches/annunciation.jpg` | "Where the message began" |
| 2 | Bethlehem | `/images/churches/nativity.jpg` | "Where he was born" |
| 3 | Jerusalem | `/images/churches/holy-sepulchre.jpg` | "Where the story turns to hope" |

The city eyebrows reuse existing keys `Explore.cityNazareth / cityBethlehem / cityJerusalem` (already in all 22 locales). After chapter 3 the journey settles and the two CTAs appear: Explore (`ctaExplore`) and Open map (`ctaOpenMap`), both existing.

## 3. Mechanism

`Hero` becomes a **client component** with two render modes:

- **Static (SSR / no-JS / reduced-motion):** three full-screen panels stacked in normal flow, each photo + eyebrow + line, all visible; CTAs after the last panel; no pinning, no stepper. This is the graceful, always-accessible baseline — crawlers and no-JS visitors get the whole story.
- **Enhanced (after mount, when `prefers-reduced-motion` is not `reduce`):** the section is `(chapters + 1) × 100svh` tall (one viewport of pinned scroll per chapter, so the last chapter holds fully before release); a `sticky top-0 h-[100svh]` stage stays fixed while it scrolls. The three photo+caption layers are stacked absolutely and cross-fade by opacity (700ms, `ease-ios`) as the active chapter changes. The CTAs show on the last chapter; a "scroll to begin" hint shows on the first.

**Active chapter** is tracked with one `IntersectionObserver` (the same lightweight pattern as `Reveal`, not a library) over three sentinel rows (`grid grid-rows-3` overlay) using a center-line `rootMargin: '-50% 0px -50% 0px'`; the row crossing viewport center sets `active`. The active index drives:
- the visible photo/caption (opacity),
- the stepper's filled/`aria-current` dot,
- an `aria-live="polite"` announcement of the current city.

Mode switches from static→enhanced in a mount effect (same as `Reveal`): SSR markup is the static baseline, so there is no hydration mismatch and content is never hidden without JS.

## 4. Progress stepper

A compact vertical stepper pinned inside the stage (`nav` labelled by `HomePage.journeyProgressLabel`), one item per chapter: a dot + the city name. The active item is filled in `primary-600` with `aria-current="step"`; the others are muted. On phones it is dots + short labels at the inline-start, small; on desktop it can show the full city label. It sits at the **inline-end** (clear of the start-aligned caption) so it mirrors correctly in RTL (Arabic/Hebrew). It is decorative-but-navigational: not clickable (pure indicator) in v1.

## 5. Component API

`src/components/home/Hero.tsx`:
```ts
export interface HeroChapter { image: string; city: string; line: string; }
export interface HeroCta { href: string; label: string; }
export interface HeroProps {
  chapters: HeroChapter[];           // exactly 3 in v1, but rendered generically
  scrollHint: string;
  progressLabel: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}
```
The home page builds `chapters` from the three image constants + `Explore.city*` + the new `journeyLine*` keys. `HERO_IMAGE` is no longer used by the hero (kept in `demo/data.ts` for any other reference).

## 6. i18n

New `HomePage` keys, translated into all 22 locales (parity test enforces it):
- `journeyLine1` = "Where the message began"
- `journeyLine2` = "Where he was born"
- `journeyLine3` = "Where the story turns to hope"
- `journeyScrollHint` = "Scroll to begin"
- `journeyProgressLabel` = "Journey progress"

No ICU placeholders. City eyebrows and CTA labels reuse existing keys.

## 7. Accessibility & performance

- The section has a meaningful `aria-label` (the journey). The page has one persistent, visually-hidden descriptive `h1` (the site tagline); the chapter lines are captions (`p`), not headings. In enhanced mode off-screen chapters are `inert` (out of the tab order and the a11y tree), so the hidden CTAs are not focusable until the last chapter.
- Stepper: `nav` + `aria-current="step"`; `aria-live="polite"` region announces the active city.
- Reduced motion: stays in static mode (no pin, no cross-fade); the global reduced-motion rule also zeroes any transition.
- First photo `priority`, the rest lazy; images are the existing local `unoptimized` files. Only opacity/transform animate (compositor-friendly). No `backdrop-filter`.
- RTL: logical utilities only; stepper and captions mirror; no directional icons except the CTA arrow (`rtl:-scale-x-100`).

## 8. Testing

- `tests/unit/home/Hero.test.tsx` (rewrite): renders all three lines, city eyebrows and both CTAs; exposes a progress `nav` with three items; in the default (pre-mount / no-IntersectionObserver) render every chapter's text is present and reachable (baseline accessible); with a mocked `IntersectionObserver`, entering a sentinel sets `aria-current="step"` on the matching stepper item and updates the announced city; reduced-motion (mocked `matchMedia`) keeps the static baseline (no observer created).
- `tests/unit/i18n/messages.test.ts` already checks parity/placeholders/non-empty for the new keys across all locales.

## 9. Non-goals

Clickable stepper (jump-to-chapter), a fourth "finale" panel, changing any section below the hero, video, or new photography.

## 10. Risks

- The sticky-crossfade depends on JS for the active state; mitigated by the static SSR baseline (full story with no JS) and reduced-motion staying static.
- Three stacked full-bleed photos on the first screen: only the first is `priority`; the others are the same small local files already shipped, so no meaningful LCP cost.
