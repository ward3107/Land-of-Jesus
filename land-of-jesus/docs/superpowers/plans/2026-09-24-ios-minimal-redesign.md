# iOS-Minimal Mobile-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Land of Jesus site as a mobile-first, near-iOS-minimal app: palette taken from its Holy Land photos, system fonts, frosted top bar, iOS bottom tab bar, language sheet, "living photo" hero, swipeable sites strip, reveal-on-scroll motion, and a back-to-top button. Routes, data, i18n/RTL and accessibility stay as they are.

**Architecture:**
- Design tokens live in `src/app/globals.css` `@theme` (Tailwind v4) and mirror a typed palette in `src/lib/theme/palette.ts`. Tests check that the two files match and that every text/background pair passes WCAG AA.
- New layout chrome (TopBar, BottomTabBar, LanguageSheet, BackToTop) and motion (Reveal) are small client components.
- Hero and SiteStrip are server components. Their effects are pure CSS (Ken Burns keyframes, scroll-driven animation behind `@supports`, scroll-snap).
- Pages keep their data calls and only change their markup and classes.

**Tech Stack:** Next.js 16.3.5 (App Router, Turbopack), React 19.2.8, Tailwind CSS v4, next-intl 4.14.5, lucide-react 1.47, Vitest 5 + jsdom 30 + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-24-ios-minimal-redesign-design.md`

## Global Constraints

- Work from `land-of-jesus/`, the app root. The git repo root is its parent folder, but `git` commands work from here. Quote paths that contain `[locale]`.
- Package manager: `pnpm` is **not on PATH**, so always use `corepack pnpm@12.5.1 …`:
  - tests: `corepack pnpm@12.5.1 exec vitest run`
  - types: `corepack pnpm@12.5.1 exec tsc --noEmit`
  - lint: `corepack pnpm@12.5.1 lint`
  - build: `corepack pnpm@12.5.1 build`
- Vitest globals are **off**. Import `describe, it, expect, vi, beforeEach, afterEach` from `'vitest'` in every test.
- jsdom has **no** `HTMLDialogElement.showModal`, **no** `matchMedia` and **no** `IntersectionObserver`. It does have `requestAnimationFrame`. Stub what you need with `vi.stubGlobal`.
- Commit identity and trailer (the user's identity; never change git config):
  `git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "<subject>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`
- No new runtime dependencies. No animation library. No font downloads (remove `next/font`).
- Exact colors (from the spec §4). Never invent other hex values:
  - semantic: linen `#f6f3ec`, surface `#ffffff`, hairline `#ded9cf`, sand `#cdbb9f`, gold `#e0c68e`, night `#32261d`, muted `#6b645b`, sea `#4a6891`, sky `#aabdd8`, hills `#455f3f`, olive `#4f4e37`
  - primary (cedar): 50 `#faf6ef` · 100 `#f3eadb` · 200 `#e6d4b8` · 300 `#d4b98f` · 400 `#b8925f` · 500 `#9a7748` · 600 `#81623f` · 700 `#6b5033` · 800 `#54402a` · 900 `#3f2f20` · 950 `#2a1f15`
  - stone override: 50 `#f6f3ec` · 100 `#efeae1` · 200 `#ded9cf` · 300 `#cbc3b6` · 400 `#a79e90` · 500 `#716a60` · 600 `#6b645b` · 700 `#544d45` · 800 `#3d342c` · 900 `#32261d` · 950 `#211a14`
  - green override (Galilee hills): 50 `#f1f5ef` · 100 `#e1eadd` · 200 `#c5d4be` · 500 `#5f7d57` · 600 `#4f6b48` · 700 `#455f3f`
- Contrast rules:
  - White text only on `primary-600` or darker. White on `primary-500` is 4.11:1 and fails.
  - Text links on light backgrounds use `text-primary-700`.
  - `stone-400` is decorative only (2.39:1).
  - Focus rings stay `ring-primary-500` (3.71:1 on linen, which passes the 3:1 non-text rule).
- RTL: use logical utilities only (`ms-/me-/ps-/pe-/start-/end-/text-start`, `border-e`). Flip directional arrows with `rtl:-scale-x-100`.
- Fonts: `--font-serif: ui-serif, "New York", Georgia, "Times New Roman", serif`; `--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`.
- Motion: durations 150/200/300/400/700 ms; easing `cubic-bezier(0.22, 1, 0.36, 1)` (`ease-ios`); Ken Burns 20s. Everything must be static under `prefers-reduced-motion: reduce`.
- `backdrop-filter` is only allowed on the top bar, the tab bar and the Explore/church sticky bars (via the `frosted` utility). Never put it on cards or buttons.
- Next 16 note: read `node_modules/next/dist/docs/` before using an unfamiliar Next API. The only Next API this plan adds is the `viewport` export; see `01-app/03-api-reference/04-functions/generate-viewport.md`.

---

### Task 1: Test harness + photo palette with contrast guarantees

**Files:**
- Create: `vitest.config.mts`, `tests/setup.ts`
- Modify: `package.json` (add `test` script)
- Create: `src/lib/theme/contrast.ts`, `src/lib/theme/palette.ts`
- Test: `tests/unit/theme/contrast.test.ts`, `tests/unit/theme/palette.test.ts`

**Interfaces:**
- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(a: string, b: string): number` from `@/lib/theme/contrast`
- Produces: `semantic`, `primary`, `stone`, `green` (readonly hex maps) and `cssVariables(): Record<string, string>` (e.g. `{'--color-linen': '#f6f3ec', '--color-primary-600': '#81623f', …}`) from `@/lib/theme/palette`

- [ ] **Step 0: Branch**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/ios-minimal-redesign
```

- [ ] **Step 1: Create the Vitest harness**

`vitest.config.mts`:
```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    css: false,
  },
});
```

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

In `package.json` `"scripts"`, add after `"lint": "eslint"`:
```json
    "lint": "eslint",
    "test": "vitest run"
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/theme/contrast.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { contrastRatio, relativeLuminance } from '@/lib/theme/contrast';

describe('contrast', () => {
  it('computes WCAG relative luminance', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('computes the WCAG contrast ratio, order-independent', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#81623f', '#81623f')).toBe(1);
  });

  it('rejects anything but #rrggbb', () => {
    expect(() => relativeLuminance('red')).toThrow(/#rrggbb/);
  });
});
```

`tests/unit/theme/palette.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { contrastRatio } from '@/lib/theme/contrast';
import { green, primary, semantic, stone } from '@/lib/theme/palette';

const WHITE = '#ffffff';

// [foreground, background, where it is used]
const TEXT_PAIRS: [string, string, string][] = [
  [semantic.night, semantic.linen, 'body text on page'],
  [semantic.night, semantic.surface, 'text on cards'],
  [semantic.muted, semantic.linen, 'secondary text on page'],
  [semantic.muted, semantic.surface, 'secondary text on cards'],
  [semantic.muted, stone[100], 'placeholder / segmented control'],
  [stone[500], semantic.linen, 'stone-500 text'],
  [stone[700], stone[100], 'chips'],
  [WHITE, primary[600], 'filled button'],
  [WHITE, primary[700], 'filled button pressed'],
  [primary[600], semantic.linen, 'active tab label'],
  [primary[700], semantic.linen, 'links on page'],
  [primary[700], semantic.surface, 'links on cards'],
  [primary[700], primary[100], 'project badge'],
  [primary[800], primary[100], 'tinted button / notice'],
  [semantic.sea, semantic.surface, 'info text on cards'],
  [semantic.sea, semantic.linen, 'info text on page'],
  [WHITE, semantic.hills, 'verified pill'],
  [WHITE, green[600], 'success fill'],
  [green[700], green[100], 'open-to-visitors badge'],
  [semantic.night, semantic.gold, 'text on gold'],
  [WHITE, semantic.night, 'text on dark band'],
  [primary[300], semantic.night, 'link on dark hero'],
];

// Non-text UI (WCAG 1.4.11): 3:1
const UI_PAIRS: [string, string, string][] = [
  [primary[500], semantic.linen, 'focus ring on page'],
  [primary[500], semantic.surface, 'focus ring on cards'],
  [primary[600], semantic.gold, 'progress fill vs solid gold track'],
];

describe('photo palette contrast', () => {
  it.each(TEXT_PAIRS)('%s on %s (%s) passes AA text 4.5:1', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s vs %s (%s) passes 3:1', (fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it('keeps white off primary-500 (it fails AA)', () => {
    expect(contrastRatio(WHITE, primary[500])).toBeLessThan(4.5);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/theme`
Expected: FAIL with "Failed to resolve import "@/lib/theme/contrast"".

- [ ] **Step 4: Implement**

`src/lib/theme/contrast.ts`:
```ts
/** WCAG 2.x relative luminance of a `#rrggbb` color (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`Expected #rrggbb, got "${hex}"`);
  const n = parseInt(match[1], 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` colors, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
```

`src/lib/theme/palette.ts`:
```ts
/**
 * Land of Jesus palette, sampled (k-means) from the site's own Holy Land
 * photos in public/images. This is the typed source of truth:
 * src/app/globals.css `@theme` must mirror it exactly
 * (tests/unit/theme/css-sync.test.ts), and every text/background pair the UI
 * uses is contrast-checked in tests/unit/theme/palette.test.ts.
 */
export const semantic = {
  linen: '#f6f3ec', // page background: lightened Jerusalem stone
  surface: '#ffffff', // cards, sheets
  hairline: '#ded9cf', // separators, card borders
  sand: '#cdbb9f', // subtle fills
  gold: '#e0c68e', // limestone at golden hour: highlights, progress track
  night: '#32261d', // primary text: cedar shadow
  muted: '#6b645b', // secondary text
  sea: '#4a6891', // Sea of Galilee, darkened: info
  sky: '#aabdd8', // Galilee sky: info tint
  hills: '#455f3f', // Galilee hills: verified / success
  olive: '#4f4e37', // olive: tertiary accent
} as const;

/** Cedar: replaces the old terracotta `primary-*` scale. White text on 600+ only. */
export const primary = {
  50: '#faf6ef',
  100: '#f3eadb',
  200: '#e6d4b8',
  300: '#d4b98f',
  400: '#b8925f',
  500: '#9a7748',
  600: '#81623f',
  700: '#6b5033',
  800: '#54402a',
  900: '#3f2f20',
  950: '#2a1f15',
} as const;

/** Jerusalem stone: overrides Tailwind's default stone. 400 is decorative only. */
export const stone = {
  50: '#f6f3ec',
  100: '#efeae1',
  200: '#ded9cf',
  300: '#cbc3b6',
  400: '#a79e90',
  500: '#716a60',
  600: '#6b645b',
  700: '#544d45',
  800: '#3d342c',
  900: '#32261d',
  950: '#211a14',
} as const;

/** Galilee hills: overrides the Tailwind green shades the app uses. */
export const green = {
  50: '#f1f5ef',
  100: '#e1eadd',
  200: '#c5d4be',
  500: '#5f7d57',
  600: '#4f6b48',
  700: '#455f3f',
} as const;

/** Every token as the CSS custom property globals.css must define. */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, hex] of Object.entries(semantic)) vars[`--color-${name}`] = hex;
  for (const [step, hex] of Object.entries(primary)) vars[`--color-primary-${step}`] = hex;
  for (const [step, hex] of Object.entries(stone)) vars[`--color-stone-${step}`] = hex;
  for (const [step, hex] of Object.entries(green)) vars[`--color-green-${step}`] = hex;
  return vars;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/theme`
Expected: PASS. That is 3 contrast tests, 22 + 3 pair cases and 1 guard.

- [ ] **Step 6: Types + lint**

Run: `corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.mts tests/setup.ts package.json src/lib/theme tests/unit/theme
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "test: vitest harness + photo palette with WCAG contrast checks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Design tokens in globals.css, system fonts, viewport

**Files:**
- Modify (replace whole file): `src/app/globals.css`
- Modify (replace whole file): `src/app/[locale]/layout.tsx`
- Delete: `src/lib/utils/design-tokens.ts` (unused anywhere, still describes the old terracotta palette; superseded by `src/lib/theme/palette.ts`)
- Test: `tests/unit/theme/css-sync.test.ts`

**Interfaces:**
- Consumes: `cssVariables()`, `semantic` from `@/lib/theme/palette` (Task 1)
- Produces these Tailwind utilities, used by every later task:
  - colors: `bg-/text-/border-/ring-` + `linen | surface | hairline | sand | gold | night | muted | sea | sky | hills | olive`
  - radii: `rounded-control` (12px), `rounded-card` (20px), `rounded-sheet` / `rounded-t-sheet` (28px)
  - sizes: `h-topbar` (52px), `h-tabbar` (56px); easing: `ease-ios`; shadow: `shadow-float`
  - animations: `animate-ken-burns`, `animate-fade-in`, `animate-sheet-up`
  - custom utilities: `frosted`, `scrollbar-none`, `stick-below-topbar`, `float-above-tabbar`, `hero-min-h`, `hero-pb`, `safe-pt`, `safe-pb`
- Produces these plain CSS hooks:
  - `[data-reveal]` / `[data-visible]` (Reveal, Task 7)
  - `.hero-media` / `.hero-content` (Hero, Task 10)
  - `<body>` bottom padding that clears the tab bar on phones

- [ ] **Step 1: Write the failing test**

`tests/unit/theme/css-sync.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { cssVariables } from '@/lib/theme/palette';

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

describe('globals.css mirrors src/lib/theme/palette.ts', () => {
  it.each(Object.entries(cssVariables()))('defines %s: %s', (name, hex) => {
    expect(css).toMatch(new RegExp(`${name}:\\s*${hex};`, 'i'));
  });

  it('uses system fonts only (no next/font variables)', () => {
    expect(css).not.toMatch(/--font-(jakarta|garamond)/);
    expect(css).toMatch(/--font-serif:\s*ui-serif/);
    expect(css).toMatch(/--font-sans:\s*system-ui/);
  });

  it('keeps motion behind reduced-motion guards', () => {
    expect(css).toMatch(/@supports \(animation-timeline: scroll\(\)\)/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/theme/css-sync.test.ts`
Expected: FAIL. For example, "defines --color-linen: #f6f3ec" fails because globals.css still has the terracotta tokens.

- [ ] **Step 3: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

/*
 * Land of Jesus: iOS-minimal, mobile-first design tokens.
 * Colors are sampled from the site's Holy Land photos. src/lib/theme/palette.ts
 * is the typed source of truth; tests/unit/theme/css-sync.test.ts keeps this
 * file in sync with it. System fonts only: zero downloads, and every script
 * (Latin, Arabic, Hebrew, Cyrillic, CJK, …) renders natively.
 */
@theme {
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif;
  --font-serif: ui-serif, "New York", Georgia, "Times New Roman", serif;

  /* Semantic colors */
  --color-linen: #f6f3ec;
  --color-surface: #ffffff;
  --color-hairline: #ded9cf;
  --color-sand: #cdbb9f;
  --color-gold: #e0c68e;
  --color-night: #32261d;
  --color-muted: #6b645b;
  --color-sea: #4a6891;
  --color-sky: #aabdd8;
  --color-hills: #455f3f;
  --color-olive: #4f4e37;

  /* primary -> cedar. White text only on 600+ (500 is 4.11:1). */
  --color-primary-50: #faf6ef;
  --color-primary-100: #f3eadb;
  --color-primary-200: #e6d4b8;
  --color-primary-300: #d4b98f;
  --color-primary-400: #b8925f;
  --color-primary-500: #9a7748;
  --color-primary-600: #81623f;
  --color-primary-700: #6b5033;
  --color-primary-800: #54402a;
  --color-primary-900: #3f2f20;
  --color-primary-950: #2a1f15;

  /* stone -> Jerusalem stone (overrides Tailwind's stone). 400 is decorative only. */
  --color-stone-50: #f6f3ec;
  --color-stone-100: #efeae1;
  --color-stone-200: #ded9cf;
  --color-stone-300: #cbc3b6;
  --color-stone-400: #a79e90;
  --color-stone-500: #716a60;
  --color-stone-600: #6b645b;
  --color-stone-700: #544d45;
  --color-stone-800: #3d342c;
  --color-stone-900: #32261d;
  --color-stone-950: #211a14;

  /* green -> Galilee hills (the shades the app uses). */
  --color-green-50: #f1f5ef;
  --color-green-100: #e1eadd;
  --color-green-200: #c5d4be;
  --color-green-500: #5f7d57;
  --color-green-600: #4f6b48;
  --color-green-700: #455f3f;

  /* Shape */
  --radius-control: 12px;
  --radius-card: 20px;
  --radius-sheet: 28px;

  /* App chrome sizes -> h-topbar, h-tabbar */
  --spacing-topbar: 3.25rem; /* 52px */
  --spacing-tabbar: 3.5rem; /* 56px */

  /* Motion + depth */
  --ease-ios: cubic-bezier(0.22, 1, 0.36, 1);
  --shadow-float: 0 10px 30px rgb(50 38 29 / 0.14), 0 1px 3px rgb(50 38 29 / 0.08);

  --animate-ken-burns: ken-burns 20s ease-in-out infinite alternate;
  --animate-fade-in: fade-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
  --animate-sheet-up: sheet-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @keyframes ken-burns {
    from { transform: scale(1); }
    to { transform: scale(1.08); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes sheet-up {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}

@layer base {
  html {
    /* Anchors land below the sticky top bar. */
    scroll-padding-top: calc(var(--spacing-topbar) + env(safe-area-inset-top) + 0.5rem);
    -webkit-tap-highlight-color: transparent;
  }

  @media (prefers-reduced-motion: no-preference) {
    html { scroll-behavior: smooth; }
  }

  body {
    background-color: var(--color-linen);
    color: var(--color-night);
    font-family: var(--font-sans);
    /* Phones: keep all content (footer included) clear of the fixed tab bar. */
    padding-bottom: calc(var(--spacing-tabbar) + env(safe-area-inset-bottom));
  }

  @media (width >= 48rem) {
    body { padding-bottom: 0; }
  }
}

/* Frosted iOS bars. Solid linen where backdrop-filter is unsupported. */
@utility frosted {
  background-color: rgb(246 243 236 / 0.78); /* linen @ 78% */
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background-color: var(--color-linen);
  }
}

@utility scrollbar-none {
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

/* Safe-area-aware positions for the app chrome. */
@utility stick-below-topbar {
  top: calc(var(--spacing-topbar) + env(safe-area-inset-top));
}
@utility float-above-tabbar {
  bottom: calc(var(--spacing-tabbar) + env(safe-area-inset-bottom) + 1rem);
}
@utility hero-min-h {
  min-height: calc(100svh - var(--spacing-topbar) - env(safe-area-inset-top));
}
@utility hero-pb {
  padding-bottom: calc(var(--spacing-tabbar) + env(safe-area-inset-bottom) + 2.5rem);
}
@utility safe-pt {
  padding-top: env(safe-area-inset-top);
}
@utility safe-pb {
  padding-bottom: env(safe-area-inset-bottom);
}

@layer components {
  /*
   * Reveal-on-scroll (components/motion/Reveal.tsx). Content is only hidden when
   * scripting runs and motion is allowed, so no-JS visitors, crawlers and
   * reduced-motion users always see it.
   */
  @media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
    [data-reveal] {
      transition:
        opacity 700ms var(--ease-ios),
        transform 700ms var(--ease-ios);
      transition-delay: var(--reveal-delay, 0ms);
    }
    [data-reveal]:not([data-visible]) {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  /*
   * Living-photo hero (components/home/Hero.tsx): progressive enhancement.
   * The `animation` shorthand resets animation-timeline, so the timeline must
   * come after it.
   */
  @supports (animation-timeline: scroll()) {
    @media (prefers-reduced-motion: no-preference) {
      .hero-media {
        animation: hero-media-out linear both;
        animation-timeline: scroll(root);
        animation-range: 0 90vh;
      }
      .hero-content {
        animation: hero-content-out linear both;
        animation-timeline: scroll(root);
        animation-range: 0 60vh;
      }
    }
  }
}

@keyframes hero-media-out {
  to { opacity: 0.35; transform: scale(1.12); }
}
@keyframes hero-content-out {
  to { opacity: 0; transform: translateY(-40px); }
}

/* Respect reduced motion everywhere (Ken Burns, sheet, transitions). */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Replace `src/app/[locale]/layout.tsx`** (drop `next/font`; add `viewport`)

```tsx
import type { Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, getDirection } from '@/lib/i18n/config';
import { semantic } from '@/lib/theme/palette';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';

// Edge-to-edge on notched phones (safe-area insets are handled in CSS), with
// the browser UI tinted to the page's linen background.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: semantic.linen,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = getDirection(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <html lang={locale} dir={dir} className="h-full">
        <body className="flex min-h-full flex-col antialiased">
          <AppHeader />
          <main className="flex-1">{children}</main>
          <AppFooter />
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
```

Delete the stale token file:
```bash
git rm src/lib/utils/design-tokens.ts
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `corepack pnpm@12.5.1 exec vitest run`
Expected: PASS (all theme tests).

- [ ] **Step 6: Type-check, lint, build, and confirm the CSS survived compilation**

Run:
```bash
corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 build
grep -rlE "scripting" .next/static --include=*.css && grep -rl "animation-timeline" .next/static --include=*.css && grep -rl "backdrop-filter" .next/static --include=*.css
```
Expected: the build succeeds and each `grep` prints a CSS file path.
- If `@supports` nested inside `@utility frosted` fails to compile, move it out as a top-level rule: `@supports not (…) { .frosted { background-color: var(--color-linen); } }`.
- If the `scripting` media query is dropped, change `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` to `@media (prefers-reduced-motion: no-preference)`.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css "src/app/[locale]/layout.tsx" tests/unit/theme/css-sync.test.ts
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(design): Holy Land photo palette, system fonts, iOS tokens, viewport" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: New i18n keys (en / ar / he) with a parity test

**Files:**
- Modify: `messages/en.json`, `messages/ar.json`, `messages/he.json`
- Test: `tests/unit/i18n/messages.test.ts`

**Interfaces:**
- Produces these message keys:
  - `Common.backToTop`, `Common.language`, `Common.close`, `Common.skipToContent`
  - `Navigation.primaryNav`, `Navigation.footerNav`
  - `HomePage.swipeHint`
  - `Explore.viewMode`

- [ ] **Step 1: Write the failing test**

`tests/unit/i18n/messages.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import he from '../../../messages/he.json';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj)
    .flatMap(([k, v]) =>
      v && typeof v === 'object' ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
    )
    .sort();
}

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, part) => (o as Record<string, unknown> | undefined)?.[part], obj);
}

const NEW_KEYS = [
  'Common.backToTop',
  'Common.language',
  'Common.close',
  'Common.skipToContent',
  'Navigation.primaryNav',
  'Navigation.footerNav',
  'HomePage.swipeHint',
  'Explore.viewMode',
];

describe('messages', () => {
  it('ar and he have exactly the same keys as en', () => {
    expect(keys(ar)).toEqual(keys(en));
    expect(keys(he)).toEqual(keys(en));
  });

  it.each(NEW_KEYS)('%s is a non-empty string in every locale', (key) => {
    for (const messages of [en, ar, he]) {
      const value = get(messages, key);
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n`
Expected: FAIL on every NEW_KEYS case (`expected 'undefined' to be 'string'`). Parity passes.

- [ ] **Step 3: Add the keys** (the script keeps key order and the files' 2-space + trailing-newline format)

```bash
node <<'EOF'
const fs = require('fs');
const add = {
  en: {
    Common: { backToTop: 'Back to top', language: 'Language', close: 'Close', skipToContent: 'Skip to content' },
    Navigation: { primaryNav: 'Main navigation', footerNav: 'Footer navigation' },
    HomePage: { swipeHint: 'Swipe to see more' },
    Explore: { viewMode: 'View mode' },
  },
  ar: {
    Common: { backToTop: 'العودة إلى الأعلى', language: 'اللغة', close: 'إغلاق', skipToContent: 'انتقل إلى المحتوى' },
    Navigation: { primaryNav: 'التنقل الرئيسي', footerNav: 'روابط التذييل' },
    HomePage: { swipeHint: 'اسحب لرؤية المزيد' },
    Explore: { viewMode: 'طريقة العرض' },
  },
  he: {
    Common: { backToTop: 'חזרה למעלה', language: 'שפה', close: 'סגירה', skipToContent: 'דילוג לתוכן' },
    Navigation: { primaryNav: 'ניווט ראשי', footerNav: 'ניווט תחתון' },
    HomePage: { swipeHint: 'החליקו לצפייה בעוד' },
    Explore: { viewMode: 'מצב תצוגה' },
  },
};
for (const [locale, sections] of Object.entries(add)) {
  const file = `messages/${locale}.json`;
  const messages = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [section, entries] of Object.entries(sections)) Object.assign(messages[section], entries);
  fs.writeFileSync(file, JSON.stringify(messages, null, 2) + '\n');
}
EOF
git diff --stat messages
```
Expected: 3 files changed, only additions (8 lines each).

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add messages tests/unit/i18n
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): labels for tab bar, language sheet, back-to-top, skip link" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Shared nav model + iOS bottom tab bar

**Files:**
- Create: `src/components/layout/nav-items.ts`, `src/components/layout/BottomTabBar.tsx`
- Create (test helpers, reused by Tasks 5–10): `tests/unit/helpers/mocks.tsx`, `tests/unit/helpers/intl.tsx`
- Test: `tests/unit/layout/nav-items.test.ts`, `tests/unit/layout/BottomTabBar.test.tsx`

**Interfaces:**
- Consumes: `Navigation.*` messages (Task 3). Utilities `frosted`, `safe-pb`, `h-tabbar`, `ease-ios` (Task 2).
- Produces:
  - `type NavKey = 'home' | 'explore' | 'projects' | 'stories' | 'visit'`
  - `interface NavItem { href: string; key: NavKey; icon: LucideIcon; also?: readonly string[] }`
  - `NAV_ITEMS: readonly NavItem[]`
  - `isActivePath(pathname: string, item: Pick<NavItem, 'href' | 'also'>): boolean`
  - `BottomTabBar()` (no props)
- Produces (tests):
  - `navState: { pathname: string; replace: Mock }`, `navigationModule`, `nextImageModule` from `tests/unit/helpers/mocks.tsx`
  - `renderWithIntl(ui, locale?: 'en' | 'ar' | 'he')` from `tests/unit/helpers/intl.tsx`

- [ ] **Step 1: Create the test helpers**

`tests/unit/helpers/mocks.tsx`:
```tsx
import { vi } from 'vitest';
import type { AnchorHTMLAttributes } from 'react';

/**
 * Shared test doubles. In a test file:
 *   vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
 *   vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);
 * then set `navState.pathname` (locale-less, e.g. '/explore') per test.
 */
export const navState = { pathname: '/', replace: vi.fn() };

export const navigationModule = {
  Link: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => navState.pathname,
  useRouter: () => ({ replace: navState.replace }),
};

export const nextImageModule = {
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
};
```

`tests/unit/helpers/intl.tsx`:
```tsx
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import he from '../../../messages/he.json';

const MESSAGES = { en, ar, he };

/** Render inside next-intl with the real message files. */
export function renderWithIntl(ui: ReactElement, locale: keyof typeof MESSAGES = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/layout/nav-items.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, isActivePath } from '@/components/layout/nav-items';

const item = (key: string) => NAV_ITEMS.find((i) => i.key === key)!;

describe('NAV_ITEMS', () => {
  it('lists the five existing routes in tab order', () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual(['/', '/explore', '/projects', '/stories', '/visit']);
  });
});

describe('isActivePath', () => {
  it('matches Home only on "/"', () => {
    expect(isActivePath('/', item('home'))).toBe(true);
    expect(isActivePath('/explore', item('home'))).toBe(false);
  });

  it('matches a route and its children', () => {
    expect(isActivePath('/projects', item('projects'))).toBe(true);
    expect(isActivePath('/projects/basilica-restoration-phase1', item('projects'))).toBe(true);
  });

  it('ignores routes that only share a prefix', () => {
    expect(isActivePath('/explorer', item('explore'))).toBe(false);
  });

  it('treats church profiles as part of Explore', () => {
    expect(isActivePath('/churches/holy-sepulchre-jerusalem', item('explore'))).toBe(true);
  });
});
```

`tests/unit/layout/BottomTabBar.test.tsx`:
```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { navState } from '../helpers/mocks';
import { renderWithIntl } from '../helpers/intl';
import { BottomTabBar } from '@/components/layout/BottomTabBar';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

describe('BottomTabBar', () => {
  beforeEach(() => {
    navState.pathname = '/';
  });

  it('shows the five destinations with translated labels', () => {
    renderWithIntl(<BottomTabBar />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['Home', 'Explore', 'Projects', 'Stories', 'Visit']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/explore', '/projects', '/stories', '/visit']);
  });

  it('marks only the current tab with aria-current="page"', () => {
    navState.pathname = '/projects';
    renderWithIntl(<BottomTabBar />);
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link').filter((a) => a.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('keeps Explore active on a church profile', () => {
    navState.pathname = '/churches/holy-sepulchre-jerusalem';
    renderWithIntl(<BottomTabBar />);
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders Arabic labels', () => {
    renderWithIntl(<BottomTabBar />, 'ar');
    expect(screen.getByRole('link', { name: 'استكشاف' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/layout`
Expected: FAIL with "Failed to resolve import "@/components/layout/nav-items"".

- [ ] **Step 4: Implement**

`src/components/layout/nav-items.ts`:
```ts
import { BookOpen, Compass, HandHeart, House, MapPin, type LucideIcon } from 'lucide-react';

export type NavKey = 'home' | 'explore' | 'projects' | 'stories' | 'visit';

export interface NavItem {
  href: string;
  /** Key in the `Navigation` messages. */
  key: NavKey;
  icon: LucideIcon;
  /** Other path prefixes that belong to this destination. */
  also?: readonly string[];
}

/** Primary destinations (existing routes only), shared by TopBar and BottomTabBar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', key: 'home', icon: House },
  { href: '/explore', key: 'explore', icon: Compass, also: ['/churches'] },
  { href: '/projects', key: 'projects', icon: HandHeart },
  { href: '/stories', key: 'stories', icon: BookOpen },
  { href: '/visit', key: 'visit', icon: MapPin },
];

/** Is `item` the active destination for a locale-less pathname such as "/churches/x"? */
export function isActivePath(pathname: string, item: Pick<NavItem, 'href' | 'also'>): boolean {
  if (item.href === '/') return pathname === '/';
  return [item.href, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
```

`src/components/layout/BottomTabBar.tsx`:
```tsx
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/layout`
Expected: PASS (5 + 4 tests).

- [ ] **Step 6: Types + lint, then commit**

```bash
corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
git add src/components/layout/nav-items.ts src/components/layout/BottomTabBar.tsx tests/unit/helpers tests/unit/layout
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(nav): shared nav model + iOS bottom tab bar" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Language sheet

**Files:**
- Create: `src/components/layout/LanguageSheet.tsx`
- Test: `tests/unit/layout/LanguageSheet.test.tsx`

**Interfaces:**
- Consumes: `Common.language`, `Common.close` (Task 3); `locales`, `localeNames`, `getDirection`, `Locale` from `@/lib/i18n/config`; `usePathname`, `useRouter` from `@/lib/i18n/navigation`
- Produces: `LanguageSheet({ className?: string })`
  - The trigger's accessible name is `` `${t('language')}: ${localeNames[locale]}` ``, e.g. "Language: English".
  - It opens a `role="dialog"` named by `Common.language`.

Why it isn't `<dialog>`: jsdom lacks `showModal`. The sheet is also portaled to `<body>`, because the frosted TopBar's `backdrop-filter` would otherwise become the containing block for `position: fixed`, and the sheet would be trapped inside the 52px header.

- [ ] **Step 1: Write the failing test**

`tests/unit/layout/LanguageSheet.test.tsx`:
```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { navState } from '../helpers/mocks';
import { renderWithIntl } from '../helpers/intl';
import { LanguageSheet } from '@/components/layout/LanguageSheet';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

const openSheet = () => fireEvent.click(screen.getByRole('button', { name: 'Language: English' }));

describe('LanguageSheet', () => {
  beforeEach(() => {
    navState.pathname = '/explore';
    navState.replace.mockClear();
  });

  it('starts closed with a labelled trigger', () => {
    renderWithIntl(<LanguageSheet />);
    const trigger = screen.getByRole('button', { name: 'Language: English' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a labelled modal listing every locale in its own script, focusing the current one', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    const dialog = screen.getByRole('dialog', { name: 'Language' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const options = within(dialog)
      .getAllByRole('button')
      .filter((b) => b.hasAttribute('lang'));
    expect(options.map((b) => b.textContent)).toEqual(['English', 'العربية', 'עברית']);
    const current = within(dialog).getByRole('button', { name: 'English' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'العربية' })).toHaveAttribute('dir', 'rtl');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language: English' })).toHaveFocus();
  });

  it('closes on a backdrop tap and on the close button', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches locale and stays on the same page', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(navState.replace).toHaveBeenCalledWith('/explore', { locale: 'ar' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does nothing when the current language is chosen', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(navState.replace).not.toHaveBeenCalled();
  });

  it('keeps Tab focus inside the sheet', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/layout/LanguageSheet.test.tsx`
Expected: FAIL with "Failed to resolve import "@/components/layout/LanguageSheet"".

- [ ] **Step 3: Implement `src/components/layout/LanguageSheet.tsx`**

```tsx
'use client';

import { useCallback, useEffect, useId, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Globe, X } from 'lucide-react';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { getDirection, localeNames, locales, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${t('language')}: ${localeNames[locale] ?? locale}`}
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-night transition-[background-color,transform] duration-150 ease-ios hover:bg-stone-100 active:scale-95',
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
                <ul className="mx-4 mb-4 divide-y divide-hairline overflow-hidden rounded-control bg-surface">
                  {locales.map((l) => {
                    const current = l === locale;
                    return (
                      <li key={l}>
                        <button
                          type="button"
                          lang={l}
                          dir={getDirection(l)}
                          aria-current={current ? 'true' : undefined}
                          onClick={() => choose(l)}
                          className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-start text-base text-night transition-colors hover:bg-stone-50 active:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                        >
                          <span>{localeNames[l]}</span>
                          {current ? <Check className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/layout/LanguageSheet.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Types + lint, then commit**

```bash
corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
git add src/components/layout/LanguageSheet.tsx tests/unit/layout/LanguageSheet.test.tsx
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): iOS-style language sheet (portaled, focus-trapped)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: TopBar replaces AppHeader; wire layout chrome + footer

**Files:**
- Create: `src/components/layout/TopBar.tsx`
- Delete: `src/components/layout/AppHeader.tsx`, `src/components/layout/LocaleSwitcher.tsx`
- Modify (replace whole file): `src/app/[locale]/layout.tsx`, `src/components/layout/AppFooter.tsx`, `src/components/layout/Container.tsx`
- Test: `tests/unit/layout/TopBar.test.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS`, `isActivePath` (Task 4), `LanguageSheet` (Task 5), `BottomTabBar` (Task 4), `Common.skipToContent`, `Navigation.primaryNav/footerNav` (Task 3)
- Produces:
  - `TopBar()` (no props)
  - Layout contract: `<main id="main" tabIndex={-1}>` is the skip-link and back-to-top focus target
  - `Container` gutter is now `px-4 sm:px-6` (iOS 16px on phones)

- [ ] **Step 1: Write the failing test**

`tests/unit/layout/TopBar.test.tsx`:
```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { navState } from '../helpers/mocks';
import { renderWithIntl } from '../helpers/intl';
import { TopBar } from '@/components/layout/TopBar';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

describe('TopBar', () => {
  beforeEach(() => {
    navState.pathname = '/stories';
  });

  it('links the wordmark home', () => {
    renderWithIntl(<TopBar />);
    expect(screen.getByRole('link', { name: 'Land of Jesus' })).toHaveAttribute('href', '/');
  });

  it('shows the desktop destinations with the current one marked', () => {
    renderWithIntl(<TopBar />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(5);
    expect(within(nav).getByRole('link', { name: 'Stories' })).toHaveAttribute('aria-current', 'page');
  });

  it('offers the language sheet', () => {
    renderWithIntl(<TopBar />);
    expect(screen.getByRole('button', { name: 'Language: English' })).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/layout/TopBar.test.tsx`
Expected: FAIL with "Failed to resolve import "@/components/layout/TopBar"".

- [ ] **Step 3: Implement `src/components/layout/TopBar.tsx`**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/lib/i18n/navigation';
import { Container } from './Container';
import { LanguageSheet } from './LanguageSheet';
import { NAV_ITEMS, isActivePath } from './nav-items';
import { cn } from '@/lib/utils';

/**
 * Frosted top bar on every screen size: wordmark + language button. From md up
 * it also shows the primary destinations (phones use the BottomTabBar).
 */
export function TopBar() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();

  return (
    <header className="frosted safe-pt sticky top-0 z-40 border-b border-hairline">
      <Container className="flex h-topbar items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-md font-serif text-lg font-semibold tracking-tight text-night focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
        >
          Land of Jesus
        </Link>

        <nav aria-label={t('primaryNav')} className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  active ? 'bg-primary-100 text-primary-800' : 'text-muted hover:bg-stone-100 hover:text-night',
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <LanguageSheet />
      </Container>
    </header>
  );
}
```

- [ ] **Step 4: Replace `src/components/layout/AppFooter.tsx`**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Container } from './Container';

const LINKS = [
  { href: '/explore', key: 'explore' },
  { href: '/projects', key: 'projects' },
  { href: '/stories', key: 'stories' },
  { href: '/visit', key: 'visit' },
] as const;

export function AppFooter() {
  const tf = useTranslations('Footer');
  const tn = useTranslations('Navigation');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-linen">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-serif text-lg font-semibold text-night">Land of Jesus</p>
          <p className="mt-1 text-sm text-muted">{tf('tagline')}</p>
        </div>
        <nav aria-label={tn('footerNav')} className="flex flex-wrap gap-x-6 gap-y-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-night">
              {tn(l.key)}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-muted">{tf('copyright', { year })}</p>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 5: Replace `src/components/layout/Container.tsx`** (16px phone gutter)

```tsx
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * Horizontal layout primitive: centered max-width with a consistent side gutter
 * (16px on phones like iOS, 24px from sm up). `size` picks the max width.
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'narrow' | 'base' | 'wide' | 'full';
}

const MAX_WIDTHS: Record<NonNullable<ContainerProps['size']>, string> = {
  narrow: 'max-w-2xl',
  base: 'max-w-4xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({ size = 'wide', className, ...props }: ContainerProps) {
  return <div className={cn('mx-auto w-full px-4 sm:px-6', MAX_WIDTHS[size], className)} {...props} />;
}
```

- [ ] **Step 6: Replace `src/app/[locale]/layout.tsx`**

```tsx
import type { Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, getDirection } from '@/lib/i18n/config';
import { semantic } from '@/lib/theme/palette';
import { TopBar } from '@/components/layout/TopBar';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { AppFooter } from '@/components/layout/AppFooter';

// Edge-to-edge on notched phones (safe-area insets are handled in CSS), with
// the browser UI tinted to the page's linen background.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: semantic.linen,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations('Common');
  const dir = getDirection(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <html lang={locale} dir={dir} className="h-full">
        <body className="flex min-h-full flex-col antialiased">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-night focus:shadow-float"
          >
            {t('skipToContent')}
          </a>
          <TopBar />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <AppFooter />
          <BottomTabBar />
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 7: Remove the old header + switcher, then confirm nothing imports them**

```bash
git rm src/components/layout/AppHeader.tsx src/components/layout/LocaleSwitcher.tsx
grep -rn "AppHeader\|LocaleSwitcher" src || echo "no references"
```
Expected: `no references`.

- [ ] **Step 8: Run tests, types, lint, build**

Run: `corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 build`
Expected: all PASS, and the build prints the `/[locale]` routes.

- [ ] **Step 9: Commit**

```bash
git add src/components/layout "src/app/[locale]/layout.tsx" tests/unit/layout/TopBar.test.tsx
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(layout): frosted TopBar + bottom tab bar + skip link; drop AppHeader/LocaleSwitcher" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Reveal-on-scroll motion

**Files:**
- Create: `src/components/motion/Reveal.tsx`
- Test: `tests/unit/motion/Reveal.test.tsx`

**Interfaces:**
- Consumes: the `[data-reveal]` / `[data-visible]` CSS (Task 2)
- Produces: `Reveal({ children: ReactNode; delay?: number /* ms, use 60ms steps */; className?: string })`, which renders `<div data-reveal>`.
  - Use it around **cards and headings**, not whole long lists. A 0.15 threshold can't be reached by an element more than ~6 screens tall.

- [ ] **Step 1: Write the failing test**

`tests/unit/motion/Reveal.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Reveal } from '@/components/motion/Reveal';

class MockIO {
  static instances: MockIO[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    MockIO.instances.push(this);
  }
  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

const wrapperOf = (text: string) => screen.getByText(text).parentElement as HTMLElement;

describe('Reveal', () => {
  beforeEach(() => {
    MockIO.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIO);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts hidden and reveals once, the first time it intersects', () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>,
    );
    const el = wrapperOf('Hello');
    expect(el).toHaveAttribute('data-reveal');
    expect(el).not.toHaveAttribute('data-visible');

    const io = MockIO.instances[0];
    expect(io.options).toMatchObject({ threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    act(() => io.trigger(false));
    expect(el).not.toHaveAttribute('data-visible');
    act(() => io.trigger(true));
    expect(el).toHaveAttribute('data-visible');
    expect(io.disconnect).toHaveBeenCalled();
  });

  it('exposes the stagger delay as a CSS variable', () => {
    render(
      <Reveal delay={120}>
        <p>Hi</p>
      </Reveal>,
    );
    expect(wrapperOf('Hi').style.getPropertyValue('--reveal-delay')).toBe('120ms');
  });

  it('shows content immediately without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(
      <Reveal>
        <p>Plain</p>
      </Reveal>,
    );
    expect(wrapperOf('Plain')).toHaveAttribute('data-visible');
  });

  it('shows content immediately when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(
      <Reveal>
        <p>Calm</p>
      </Reveal>,
    );
    expect(wrapperOf('Calm')).toHaveAttribute('data-visible');
    expect(MockIO.instances).toHaveLength(0);
  });

  it('disconnects on unmount', () => {
    const { unmount } = render(
      <Reveal>
        <p>Bye</p>
      </Reveal>,
    );
    unmount();
    expect(MockIO.instances[0].disconnect).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/motion`
Expected: FAIL with "Failed to resolve import "@/components/motion/Reveal"".

- [ ] **Step 3: Implement `src/components/motion/Reveal.tsx`**

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/motion`
Expected: PASS (5 tests).

- [ ] **Step 5: Types + lint, then commit**

```bash
corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
git add src/components/motion tests/unit/motion
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(motion): Reveal-on-scroll (IntersectionObserver, reduced-motion safe)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Back-to-top button

**Files:**
- Create: `src/components/layout/BackToTop.tsx`
- Modify: `src/app/[locale]/layout.tsx` (render `<BackToTop />` after `<BottomTabBar />`)
- Test: `tests/unit/layout/BackToTop.test.tsx`

**Interfaces:**
- Consumes:
  - `Common.backToTop` (Task 3)
  - `#main` focus target (Task 6)
  - utilities `float-above-tabbar`, `shadow-float`, `ease-ios` (Task 2)
- Produces:
  - `shouldShowBackToTop(scrollY: number, viewportHeight: number): boolean`
  - `BackToTop()` (no props). While hidden it is `inert`; it carries `data-visible="true|false"`.

- [ ] **Step 1: Write the failing test**

`tests/unit/layout/BackToTop.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithIntl } from '../helpers/intl';
import { BackToTop, shouldShowBackToTop } from '@/components/layout/BackToTop';

describe('shouldShowBackToTop', () => {
  it('appears only after 80% of the first screen', () => {
    expect(shouldShowBackToTop(0, 800)).toBe(false);
    expect(shouldShowBackToTop(640, 800)).toBe(false);
    expect(shouldShowBackToTop(641, 800)).toBe(true);
  });
});

describe('BackToTop', () => {
  beforeEach(() => {
    // Async frame so the rAF throttle behaves like a browser.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      queueMicrotask(() => cb(0));
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });
  afterEach(() => vi.unstubAllGlobals());

  // window.scrollY is read-only in lib.dom, so redefine it (tsc checks tests too).
  const scrollTo = async (y: number) => {
    Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
    await act(async () => {
      fireEvent.scroll(window);
    });
  };

  it('is hidden and inert at the top of the page', async () => {
    renderWithIntl(<BackToTop />);
    await act(async () => {});
    const button = screen.getByRole('button', { name: 'Back to top', hidden: true });
    expect(button).toHaveAttribute('inert');
    expect(button).toHaveAttribute('data-visible', 'false');
  });

  it('appears after scrolling down and hides again at the top', async () => {
    renderWithIntl(<BackToTop />);
    await scrollTo(700);
    const button = screen.getByRole('button', { name: 'Back to top' });
    expect(button).not.toHaveAttribute('inert');
    expect(button).toHaveAttribute('data-visible', 'true');
    await scrollTo(0);
    expect(button).toHaveAttribute('data-visible', 'false');
  });

  it('scrolls smoothly to the top and moves focus to the main content', async () => {
    const main = document.createElement('main');
    main.id = 'main';
    main.tabIndex = -1;
    document.body.appendChild(main);

    renderWithIntl(<BackToTop />);
    await scrollTo(2000);
    fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(main).toHaveFocus();
    main.remove();
  });

  it('jumps without animation when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    renderWithIntl(<BackToTop />);
    await scrollTo(2000);
    fireEvent.click(screen.getByRole('button', { name: 'Back to top' }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/layout/BackToTop.test.tsx`
Expected: FAIL with "Failed to resolve import "@/components/layout/BackToTop"".

- [ ] **Step 3: Implement `src/components/layout/BackToTop.tsx`**

```tsx
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

    schedule(); // initial position, e.g. a restored scroll after reload
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
```

In `src/app/[locale]/layout.tsx`:
- add `import { BackToTop } from '@/components/layout/BackToTop';` after the `BottomTabBar` import;
- change `<BottomTabBar />` to:
```tsx
          <BottomTabBar />
          <BackToTop />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/layout/BackToTop.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Types + lint, then commit**

Run: `corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint`
If lint reports `react-hooks/set-state-in-effect` on `schedule()`: the only `setState` runs in the rAF callback, which is asynchronous. Replace the initial `schedule();` with `frame = requestAnimationFrame(update);`, which behaves the same, and re-run.

```bash
git add src/components/layout/BackToTop.tsx "src/app/[locale]/layout.tsx" tests/unit/layout/BackToTop.test.tsx
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(ux): back-to-top button (rAF-throttled, RTL-aware, focus return)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Restyle the shared primitives

**Files (replace whole file unless noted):**
- `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`
- `src/components/layout/Section.tsx`, `src/components/layout/SectionHeading.tsx`
- `src/components/common/ImagePlaceholder.tsx`, `src/components/common/ProfileSection.tsx`
- `src/components/churches/ChurchCard.tsx`, `src/components/churches/TraditionCard.tsx`
- `src/components/projects/ProjectCard.tsx`, `src/components/projects/ProgressBar.tsx`
- Test: `tests/unit/ui/primitives.test.tsx`

**Interfaces:**
- Produces:
  - `buttonVariants({ variant?: 'primary' | 'tinted' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'link'; size?: 'sm' | 'base' | 'lg' | 'icon' })`. Default is a primary pill; `glass` is for use over photos and dark bands.
  - `ImagePlaceholder`: adds `ratio: '4/5'` and a `sizes?: string` prop. An empty `alt` makes the fallback `aria-hidden`.
  - `ChurchCard`: adds `children?: ReactNode` (extra pills rendered after the tradition pill). The image is now decorative (`alt=""`).
  - `SectionHeading`: default `align` is now `'start'` (iOS large title).
  - `Section` tones: `white` → `bg-surface`, `stone` → `bg-linen`, `dark` → `bg-night`.
  - All other props are unchanged.

- [ ] **Step 1: Write the failing test**

`tests/unit/ui/primitives.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/projects/ProgressBar';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import { ChurchCard } from '@/components/churches/ChurchCard';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);

describe('buttonVariants', () => {
  it('makes primary buttons cedar-600 pills (AA with white) with press feedback', () => {
    const cls = buttonVariants();
    expect(cls).toContain('bg-primary-600');
    expect(cls).toContain('hover:bg-primary-700');
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('active:scale-[0.97]');
    expect(cls).not.toContain('bg-primary-500');
  });

  it('has tinted and glass variants', () => {
    expect(buttonVariants({ variant: 'tinted' })).toContain('bg-primary-100');
    expect(buttonVariants({ variant: 'glass' })).toContain('text-white');
  });

  it('uses AA-safe cedar-700 for text links', () => {
    expect(buttonVariants({ variant: 'link' })).toContain('text-primary-700');
  });
});

describe('Badge', () => {
  it('puts white text on cedar-600', () => {
    render(<Badge variant="primary">New</Badge>);
    expect(screen.getByText('New').className).toContain('bg-primary-600');
  });
});

describe('ProgressBar', () => {
  it('clamps the value and draws cedar on a gold track', () => {
    render(<ProgressBar value={140} label="Progress" />);
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar.className).toContain('bg-gold');
    expect((bar.firstElementChild as HTMLElement).className).toContain('bg-primary-600');
  });
});

describe('ImagePlaceholder', () => {
  it('renders the photo with its alt text', () => {
    render(<ImagePlaceholder src="/images/x.jpg" alt="Basilica" />);
    expect(screen.getByRole('img', { name: 'Basilica' })).toHaveAttribute('src', '/images/x.jpg');
  });

  it('labels the fallback, or hides it when decorative', () => {
    const { container, rerender } = render(<ImagePlaceholder alt="Basilica" />);
    expect(screen.getByRole('img', { name: 'Basilica' })).toBeInTheDocument();
    rerender(<ImagePlaceholder alt="" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.firstElementChild?.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports the 4:5 portrait ratio used by the sites strip', () => {
    const { container } = render(<ImagePlaceholder alt="" ratio="4/5" />);
    expect((container.firstElementChild as HTMLElement).className).toContain('aspect-[4/5]');
  });
});

describe('ChurchCard', () => {
  it('links to the church with its details and extra pills', () => {
    render(
      <ChurchCard
        slug="holy-sepulchre-jerusalem"
        name="Holy Sepulchre"
        location="Jerusalem, Israel"
        tradition="Orthodox"
        imageUrl="/images/churches/holy-sepulchre.jpg"
      >
        <span>Open</span>
      </ChurchCard>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/churches/holy-sepulchre-jerusalem');
    expect(link).toHaveTextContent('Holy Sepulchre');
    expect(link).toHaveTextContent('Jerusalem, Israel');
    expect(link).toHaveTextContent('Orthodox');
    expect(link).toHaveTextContent('Open');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/ui`
Expected: FAIL. For example, `expected '… bg-primary-500 …' to contain 'bg-primary-600'`, the 4:5 ratio is missing, and the ChurchCard pills are missing.

- [ ] **Step 3: Replace the primitives**

`src/components/ui/button.tsx`:
```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * iOS-style buttons: pills with a subtle press (scale) response. Filled
 * buttons use cedar-600, the lightest cedar that passes AA with white text.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,transform] duration-150 ease-ios active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        tinted: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary: 'border border-hairline bg-surface text-night hover:bg-stone-50',
        outline: 'border border-stone-300 bg-transparent text-night hover:bg-stone-100',
        ghost: 'text-night hover:bg-stone-100',
        glass: 'border border-white/40 bg-white/15 text-white hover:bg-white/25',
        link: 'text-primary-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        base: 'h-11 px-5 text-[15px]',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'base',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export default Button;
```

`src/components/ui/card.tsx`: change only these two class strings.
- `Card`: `'rounded-lg border border-stone-200 bg-white text-stone-950 shadow-sm'` becomes `'rounded-card border border-hairline/80 bg-surface text-night'`
- `CardDescription`: `'text-sm text-stone-500'` becomes `'text-sm text-muted'`

`src/components/ui/badge.tsx`: replace the `variantStyles` object with:
```tsx
    const variantStyles = {
      default: 'bg-stone-100 text-stone-700',
      primary: 'bg-primary-600 text-white',
      success: 'bg-hills text-white',
      warning: 'bg-gold text-night',
      error: 'bg-red-700 text-white',
      outline: 'border border-stone-300 text-stone-700',
    };
```

`src/components/layout/Section.tsx`: change the `TONES` object and the section padding:
```tsx
const TONES: Record<NonNullable<SectionProps['tone']>, string> = {
  white: 'bg-surface text-night',
  stone: 'bg-linen text-night',
  dark: 'bg-night text-white',
};
```
and `className={cn('py-24', TONES[tone], className)}` becomes `className={cn('py-14 md:py-24', TONES[tone], className)}`.

`src/components/layout/SectionHeading.tsx`:
```tsx
import { cn } from '@/lib/utils';

/**
 * iOS large-title section heading (serif, start-aligned by default) with an
 * optional subtitle.
 */
export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'center' | 'start';
  tone?: 'default' | 'inverted';
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  align = 'start',
  tone = 'default',
  className,
}: SectionHeadingProps) {
  const inverted = tone === 'inverted';
  return (
    <div
      className={cn(
        'mb-8 max-w-2xl md:mb-12',
        align === 'center' ? 'mx-auto text-center' : 'text-start',
        className,
      )}
    >
      <h2
        className={cn(
          'font-serif text-[34px] font-semibold leading-[1.1] tracking-tight md:text-5xl',
          inverted ? 'text-white' : 'text-night',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={cn('mt-3 text-base md:text-lg', inverted ? 'text-white/75' : 'text-muted')}>{subtitle}</p>
      ) : null}
    </div>
  );
}
```

`src/components/common/ImagePlaceholder.tsx`:
```tsx
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const RATIOS = {
  '16/10': 'aspect-[16/10]',
  '4/3': 'aspect-[4/3]',
  '4/5': 'aspect-[4/5]',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
} as const;

const TONES = {
  stone: 'from-stone-200 to-sand text-muted',
  primary: 'from-primary-100 to-primary-200 text-primary-700',
  olive: 'from-green-100 to-green-200 text-hills',
} as const;

export interface ImagePlaceholderProps {
  /** Real image URL. When absent, a heritage-toned placeholder is shown. */
  src?: string | null;
  /** Empty string = decorative (e.g. the name is already in adjacent text). */
  alt: string;
  ratio?: keyof typeof RATIOS;
  tone?: keyof typeof TONES;
  icon?: LucideIcon;
  className?: string;
  /** Larger icon for hero-scale placeholders. */
  iconClassName?: string;
  /** next/image `sizes` hint. */
  sizes?: string;
}

/**
 * Media frame with a graceful fallback. With `src` it renders next/image
 * (lazy by default); otherwise a photo-palette gradient with an icon that
 * never claims to depict a specific place.
 */
export function ImagePlaceholder({
  src,
  alt,
  ratio = '16/10',
  tone = 'stone',
  icon: Icon = MapPin,
  className,
  iconClassName,
  sizes = '(max-width: 768px) 100vw, 33vw',
}: ImagePlaceholderProps) {
  return (
    <div className={cn('relative overflow-hidden bg-stone-200', RATIOS[ratio], className)}>
      {src ? (
        <Image src={src} alt={alt} fill unoptimized className="object-cover" sizes={sizes} />
      ) : (
        <div
          {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
          className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', TONES[tone])}
        >
          <Icon className={cn('h-12 w-12', iconClassName)} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
```

`src/components/common/ProfileSection.tsx`: change `'mb-4 font-serif text-2xl text-stone-900'` to `'mb-4 font-serif text-2xl font-semibold text-night'`.

`src/components/churches/ChurchCard.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

export interface ChurchCardProps {
  slug: string;
  name: string;
  location: string;
  tradition?: string;
  imageUrl?: string | null;
  /** Extra status pills (e.g. "Open to visitors"), shown after the tradition. */
  children?: ReactNode;
}

/**
 * iOS-style church card: 4:3 photo, name, place, and pills. The whole card is
 * one link with press feedback. The photo is decorative (the name is the text).
 */
export function ChurchCard({ slug, name, location, tradition, imageUrl, children }: ChurchCardProps) {
  return (
    <Link
      href={`/churches/${slug}`}
      className="block overflow-hidden rounded-card border border-hairline/80 bg-surface transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
    >
      <ImagePlaceholder src={imageUrl} alt="" ratio="4/3" />
      <div className="p-4">
        <h3 className="text-[17px] font-semibold leading-snug text-night">{name}</h3>
        <p className="mt-0.5 text-[15px] text-muted">{location}</p>
        {tradition || children ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tradition ? (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                {tradition}
              </span>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
```

`src/components/churches/TraditionCard.tsx`:
```tsx
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/lib/utils';

export interface TraditionCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile background (e.g. 'bg-primary-100'). */
  accentClass: string;
  iconClass: string;
}

/**
 * "Explore by tradition" row (Catholic / Orthodox / Armenian …), like an iOS
 * settings cell: icon tile, title + description, chevron.
 */
export function TraditionCard({ href, title, description, icon: Icon, accentClass, iconClass }: TraditionCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card border border-hairline/80 bg-surface p-4 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
    >
      <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-control', accentClass)} aria-hidden="true">
        <Icon className={cn('h-6 w-6', iconClass)} />
      </span>
      <span className="min-w-0 flex-1">
        <h3 className="text-[17px] font-semibold text-night">{title}</h3>
        <p className="mt-0.5 text-[15px] text-muted">{description}</p>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}
```

`src/components/projects/ProjectCard.tsx`:
```tsx
import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { ProgressBar } from './ProgressBar';

export interface ProjectCardProps {
  slug: string;
  title: string;
  church?: string | null;
  progress: number;
  goal: string;
  progressLabel: string;
  goalLabel: string;
  learnMoreLabel: string;
}

/**
 * Preservation-project card: title, optional church, an accessible progress
 * bar and the fundraising goal. The whole card links to the project profile.
 */
export function ProjectCard({
  slug,
  title,
  church,
  progress,
  goal,
  progressLabel,
  goalLabel,
  learnMoreLabel,
}: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${slug}`}
      className="block rounded-card border border-hairline/80 bg-surface p-5 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen"
    >
      <h3 className="text-[17px] font-semibold leading-snug text-night">{title}</h3>
      {church ? <p className="mt-0.5 text-[15px] text-muted">{church}</p> : null}
      <ProgressBar className="mt-4" value={progress} label={progressLabel} valueLabel={`${progress}%`} />
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm text-muted">
          {goalLabel}: {goal}
        </span>
        <span className="flex items-center text-sm font-semibold text-primary-700">
          {learnMoreLabel}
          <ArrowRight className="ms-1 h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
```

`src/components/projects/ProgressBar.tsx`:
```tsx
import { cn } from '@/lib/utils';

/**
 * Accessible progress indicator (role=progressbar). `value` is 0–100. Cedar
 * fill on a limestone-gold track (3.37:1 against solid gold).
 */
export interface ProgressBarProps {
  value: number;
  label?: string;
  valueLabel?: string;
  className?: string;
}

export function ProgressBar({ value, label, valueLabel, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      {(label || valueLabel) && (
        <div className="mb-2 flex justify-between text-sm">
          {label ? <span className="text-muted">{label}</span> : <span />}
          {valueLabel ? <span className="font-semibold text-night">{valueLabel}</span> : null}
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-gold/60"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full bg-primary-600 transition-[inline-size] duration-700 ease-ios')}
          style={{ inlineSize: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm@12.5.1 exec vitest run`
Expected: PASS (all suites, including the 9 new primitives tests).

- [ ] **Step 5: Types + lint** (`ChurchCard` no longer renders `Card`; its callers' props are unchanged)

Run: `corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components tests/unit/ui
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(ui): iOS pills, grouped cards, large titles, gold progress track" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Living-photo Hero + swipeable SiteStrip

**Files:**
- Create: `src/components/home/Hero.tsx`, `src/components/home/SiteStrip.tsx`
- Test: `tests/unit/home/Hero.test.tsx`, `tests/unit/home/SiteStrip.test.tsx`

**Interfaces:**
- Consumes:
  - `buttonVariants` (`glass` variant, Task 9) and `ImagePlaceholder` `ratio="4/5"` + `sizes` (Task 9)
  - utilities `hero-min-h`, `hero-pb`, `animate-ken-burns`, `scrollbar-none`, `.hero-media`, `.hero-content` (Task 2)
- Produces:
  - `Hero(props: { image: string; headline: string; subheadline: string; primaryCta: { href: string; label: string }; secondaryCta: { href: string; label: string } })`, a server component with no client JS
  - `interface SiteStripItem { slug: string; name: string; city: string; image: string | null }`
  - `SiteStrip(props: { title: string; hint: string; viewAll: { href: string; label: string }; items: SiteStripItem[] })`, also a server component

- [ ] **Step 1: Write the failing tests**

`tests/unit/home/Hero.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/home/Hero';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);

const props = {
  image: '/images/hero-jerusalem.jpg',
  headline: 'Discover the living Christian heritage of the Holy Land',
  subheadline: 'Explore churches and communities.',
  primaryCta: { href: '/explore', label: 'Explore the Land' },
  secondaryCta: { href: '/explore?view=map', label: 'Open the Map' },
};

describe('Hero', () => {
  it('renders the page h1, subtitle and both calls to action', () => {
    render(<Hero {...props} />);
    expect(screen.getByRole('heading', { level: 1, name: props.headline })).toBeInTheDocument();
    expect(screen.getByText(props.subheadline)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore the Land/ })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: /Open the Map/ })).toHaveAttribute('href', '/explore?view=map');
  });

  it('keeps the photo decorative inside the Ken Burns + scroll-effect wrappers', () => {
    const { container } = render(<Hero {...props} />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', props.image);
    expect(img.closest('.animate-ken-burns')).not.toBeNull();
    expect(img.closest('.hero-media')).not.toBeNull();
    expect(container.querySelector('.hero-content')).not.toBeNull();
  });
});
```

`tests/unit/home/SiteStrip.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { SiteStrip } from '@/components/home/SiteStrip';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);
vi.mock('next/image', async () => (await import('../helpers/mocks')).nextImageModule);

const items = [
  { slug: 'basilica-annunciation-nazareth', name: 'Basilica of the Annunciation', city: 'Nazareth', image: '/images/churches/annunciation.jpg' },
  { slug: 'church-nativity-bethlehem', name: 'Church of the Nativity', city: 'Bethlehem', image: null },
];

describe('SiteStrip', () => {
  it('is a focusable, labelled, snap-scrolling region of site links', () => {
    render(
      <SiteStrip
        title="Featured Churches"
        hint="Swipe to see more"
        viewAll={{ href: '/explore', label: 'View All Churches' }}
        items={items}
      />,
    );
    const region = screen.getByRole('region', { name: 'Featured Churches' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.className).toContain('snap-x');
    const links = within(region).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/churches/basilica-annunciation-nazareth',
      '/churches/church-nativity-bethlehem',
    ]);
    expect(links[0]).toHaveTextContent('Basilica of the Annunciation');
    expect(links[0]).toHaveTextContent('Nazareth');
  });

  it('shows the swipe hint and a view-all link', () => {
    render(
      <SiteStrip
        title="Featured Churches"
        hint="Swipe to see more"
        viewAll={{ href: '/explore', label: 'View All Churches' }}
        items={items}
      />,
    );
    expect(screen.getByText('Swipe to see more')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View All Churches' })).toHaveAttribute('href', '/explore');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/home`
Expected: FAIL with "Failed to resolve import "@/components/home/Hero"".

- [ ] **Step 3: Implement**

`src/components/home/Hero.tsx`:
```tsx
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { buttonVariants } from '@/components/ui/button';

export interface HeroCta {
  href: string;
  label: string;
}

export interface HeroProps {
  image: string;
  headline: string;
  subheadline: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}

/**
 * "Living photo" hero: a full-screen Holy Land photo with a slow Ken Burns
 * zoom. Where scroll-driven animations exist, the photo fades and scales and
 * the text rises as you scroll away (see .hero-media / .hero-content in
 * globals.css). Pure CSS, no client JS; static under reduced motion.
 */
export function Hero({ image, headline, subheadline, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="hero-min-h relative isolate flex items-end overflow-hidden bg-night text-white md:items-center"
    >
      <div className="hero-media absolute inset-0 -z-10" aria-hidden="true">
        <div className="relative h-full w-full animate-ken-burns">
          <Image src={image} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/50 to-night/10"
        aria-hidden="true"
      />

      <Container className="hero-content hero-pb pt-24 md:py-28">
        <h1
          id="hero-title"
          className="max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          {headline}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">{subheadline}</p>
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
      </Container>
    </section>
  );
}
```

`src/components/home/SiteStrip.tsx`:
```tsx
import { ChevronRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

export interface SiteStripItem {
  slug: string;
  name: string;
  city: string;
  image: string | null;
}

export interface SiteStripProps {
  title: string;
  hint: string;
  viewAll: { href: string; label: string };
  items: SiteStripItem[];
}

/**
 * Horizontally swipeable row of sacred sites (scroll-snap, hidden scrollbar,
 * logical padding so it mirrors in RTL). Keyboard users can focus the row and
 * scroll it with the arrow keys.
 */
export function SiteStrip({ title, hint, viewAll, items }: SiteStripProps) {
  return (
    <section className="bg-linen py-10 md:py-16">
      <Container className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="site-strip-title"
            className="font-serif text-[28px] font-semibold leading-tight tracking-tight text-night md:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted md:hidden">{hint}</p>
        </div>
        <Link
          href={viewAll.href}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full text-[15px] font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {viewAll.label}
          <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </Container>

      <div
        role="region"
        aria-labelledby="site-strip-title"
        tabIndex={0}
        className="scrollbar-none mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 sm:scroll-px-6 sm:px-6 md:gap-4"
      >
        {items.map((s) => (
          <Link
            key={s.slug}
            href={`/churches/${s.slug}`}
            className="relative w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-card bg-stone-200 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-linen md:w-[300px]"
          >
            <ImagePlaceholder src={s.image} alt="" ratio="4/5" sizes="(max-width: 768px) 78vw, 300px" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 via-night/40 to-transparent p-4 pt-16">
              <h3 className="text-lg font-semibold leading-snug text-white">{s.name}</h3>
              <p className="text-sm text-white/85">{s.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/home`
Expected: PASS (4 tests).

- [ ] **Step 5: Types + lint, then commit**

```bash
corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
git add src/components/home tests/unit/home
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(home): living-photo hero + swipeable sacred-sites strip" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Rebuild the home page

**Files:**
- Modify (replace whole file): `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `Hero`, `SiteStrip` (Task 10), `Reveal` (Task 7), `TraditionCard`, `ProjectCard`, `Section`, `SectionHeading`, `buttonVariants`, `Card` (Task 9), `HomePage.*` messages including `swipeHint` (Task 3), `getChurches`, `getProjects` (unchanged data layer)
- Produces: the home page

Server components can't be unit-tested with Testing Library, so this task is verified by the build and a visual check.

- [ ] **Step 1: Replace `src/app/[locale]/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, BookOpen, Calendar, Heart, Users } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { Hero } from '@/components/home/Hero';
import { SiteStrip } from '@/components/home/SiteStrip';
import { TraditionCard } from '@/components/churches/TraditionCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { HERO_IMAGE, VISIT_IMAGE } from '@/lib/demo/data';
import { getChurches } from '@/lib/data/churches';
import { getProjects } from '@/lib/data/projects';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('HomePage');

  // Live Supabase content (falls back to bundled demo data on error/empty).
  const [churches, projects] = await Promise.all([getChurches(locale), getProjects(locale)]);
  const sites = churches.map((c) => ({ slug: c.slug, name: c.name, city: c.location.city, image: c.image }));

  const traditions = [
    { key: 'catholic', href: '/explore?tradition=catholic', title: t('traditionCatholicTitle'), description: t('traditionCatholicDesc'), accentClass: 'bg-primary-100', iconClass: 'text-primary-700' },
    { key: 'orthodox', href: '/explore?tradition=orthodox', title: t('traditionOrthodoxTitle'), description: t('traditionOrthodoxDesc'), accentClass: 'bg-sky/35', iconClass: 'text-sea' },
    { key: 'armenian', href: '/explore?tradition=armenian', title: t('traditionArmenianTitle'), description: t('traditionArmenianDesc'), accentClass: 'bg-green-100', iconClass: 'text-hills' },
  ];

  const stories = [
    { title: t('story1Title'), excerpt: t('story1Excerpt'), icon: BookOpen },
    { title: t('story2Title'), excerpt: t('story2Excerpt'), icon: Users },
  ];

  const visitItems = [t('visitItem1'), t('visitItem2'), t('visitItem3'), t('visitItem4')];

  return (
    <div className="flex flex-col">
      <Hero
        image={HERO_IMAGE}
        headline={t('heroHeadline')}
        subheadline={t('heroSubheadline')}
        primaryCta={{ href: '/explore', label: t('ctaExplore') }}
        secondaryCta={{ href: '/explore?view=map', label: t('ctaOpenMap') }}
      />

      <SiteStrip
        title={t('sectionFeaturedChurches')}
        hint={t('swipeHint')}
        viewAll={{ href: '/explore', label: t('viewAllChurches') }}
        items={sites}
      />

      {/* Explore by tradition */}
      <Section tone="stone" className="pt-4 md:pt-8">
        <Reveal>
          <SectionHeading title={t('sectionExploreTitle')} subtitle={t('exploreSubtitle')} />
        </Reveal>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {traditions.map((tr, i) => (
            <Reveal key={tr.key} delay={i * 60}>
              <TraditionCard
                href={tr.href}
                title={tr.title}
                description={tr.description}
                icon={BookOpen}
                accentClass={tr.accentClass}
                iconClass={tr.iconClass}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Stories */}
      <Section tone="white">
        <Reveal>
          <SectionHeading title={t('sectionStories')} subtitle={t('storiesSubtitle')} />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <Card className="h-full p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-stone-100" aria-hidden="true">
                    <s.icon className="h-6 w-6 text-stone-700" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-night">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{s.excerpt}</p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Projects */}
      <Section tone="stone">
        <Reveal>
          <SectionHeading title={t('sectionProjects')} subtitle={t('projectsSubtitle')} />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 60}>
              <ProjectCard
                slug={p.slug}
                title={p.title}
                church={p.church?.name ?? null}
                progress={p.progress}
                goal={`$${p.budget.total.toLocaleString()}`}
                progressLabel={t('progress')}
                goalLabel={t('goal')}
                learnMoreLabel={t('learnMore')}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/projects" className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'w-full sm:w-auto')}>
            {t('viewAllProjects')}
            <ArrowRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* Visit */}
      <Section tone="white">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <h2 className="font-serif text-[34px] font-semibold leading-[1.1] tracking-tight text-night md:text-5xl">
              {t('sectionVisitTitle')}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{t('visitSubtitle')}</p>
            <ul className="mt-6 divide-y divide-hairline overflow-hidden rounded-card border border-hairline/80 bg-linen">
              {visitItems.map((item) => (
                <li key={item} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
                  <span className="text-night">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/visit" className={cn(buttonVariants({ size: 'lg' }), 'mt-8 w-full sm:w-auto')}>
              {t('ctaPlanVisit')}
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal delay={60}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-stone-200 md:aspect-square">
              <Image src={VISIT_IMAGE} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Follow the journey */}
      <Section tone="dark" containerSize="base">
        <Reveal className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gold" aria-hidden="true" />
          <h2 className="mt-6 font-serif text-[34px] font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t('sectionFollowJourney')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/75">{t('followSubtitle')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/explore" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
              {t('ctaFollowExplore')}
            </Link>
            <Link href="/explore" className={buttonVariants({ variant: 'glass', size: 'lg' })}>
              {t('ctaLearnMore')}
            </Link>
          </div>
        </Reveal>
      </Section>
    </div>
  );
}
```

- [ ] **Step 2: Types, lint, tests, build**

Run: `corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 build`
Expected: all PASS.

- [ ] **Step 3: Visual check at phone size**

Start `corepack pnpm@12.5.1 dev`. Open `http://localhost:3000/en` at 390×844, then at 1280×900. Confirm:
- the hero fills the screen under the top bar and its buttons sit above the tab bar;
- the photo slowly zooms;
- the sites strip snaps card-by-card;
- sections fade up as they scroll in;
- the tab bar shows Home as active;
- the browser console has no errors.

Repeat at `/ar`. The strip and chevrons must mirror, and the tab bar must be RTL.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/page.tsx"
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(home): living-photo hero, sites strip, reveal-on-scroll sections" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Polish the remaining pages

**Files:**
- Modify (replace whole file): `src/app/[locale]/explore/ExploreView.tsx`, `src/app/[locale]/projects/page.tsx`, `src/app/[locale]/stories/page.tsx`, `src/app/[locale]/visit/page.tsx`
- Modify (targeted edits): `src/app/[locale]/churches/[slug]/page.tsx`, `src/app/[locale]/projects/[slug]/page.tsx`

**Interfaces:**
- Consumes:
  - `ChurchCard` `children` pills, `buttonVariants` (`tinted`/`secondary`/`glass`), `ImagePlaceholder` `sizes` (Task 9)
  - `Reveal` (Task 7), `Explore.viewMode` (Task 3), `frosted` + `stick-below-topbar` + `scrollbar-none` (Task 2)
- Produces: no new exports. `ExploreChurch` stays exported unchanged, because `ChurchMap` imports it.

- [ ] **Step 1: Replace `src/app/[locale]/explore/ExploreView.tsx`**

The sticky bar becomes frosted and sits below the TopBar. Controls become iOS style. The search input is 16px, which stops iOS zoom-on-focus. Map view now shows the map on phones too; before, it was `hidden lg:block`.

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MapPin, Search, Filter, List, Map as MapIcon } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { Container } from '@/components/layout/Container';
import { ChurchCard } from '@/components/churches/ChurchCard';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChurchMap } from '@/components/explore/ChurchMap';

export interface ExploreChurch {
  slug: string;
  name: string;
  location: string;
  tradition: string;
  isOpen: boolean;
  hasProjects: boolean;
  image: string;
  latitude: number;
  longitude: number;
}

export function ExploreView({
  initialView,
  churches,
}: {
  initialView: 'list' | 'map';
  churches: ExploreChurch[];
}) {
  const t = useTranslations('Explore');
  const [viewMode, setViewMode] = useState<'list' | 'map'>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = churches.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectClass =
    'w-full rounded-control border border-hairline bg-surface px-3 py-2.5 text-base text-night focus:outline-none focus:ring-2 focus:ring-primary-500';
  const segment = (active: boolean) =>
    cn(
      'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      active ? 'bg-surface text-night shadow-sm' : 'text-muted hover:text-night',
    );

  return (
    <div className="min-h-[100svh]">
      {/* Search + controls */}
      <div className="frosted stick-below-topbar sticky z-30 border-b border-hairline">
        <Container size="full" className="max-w-[1920px]">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
            <label htmlFor="church-search" className="sr-only">
              {t('searchPlaceholder')}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-5 w-5 text-muted" aria-hidden="true" />
              <input
                id="church-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-11 w-full rounded-control bg-stone-100 pe-4 ps-10 text-base text-night placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                aria-controls="explore-filters"
                className={cn(buttonVariants({ variant: showFilters ? 'tinted' : 'secondary', size: 'sm' }), 'h-11')}
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                {t('filters')}
              </button>

              <div className="flex rounded-full bg-stone-100 p-1" role="group" aria-label={t('viewMode')}>
                <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={segment(viewMode === 'list')}>
                  <List className="h-4 w-4" aria-hidden="true" />
                  <span>{t('listView')}</span>
                </button>
                <button type="button" onClick={() => setViewMode('map')} aria-pressed={viewMode === 'map'} className={segment(viewMode === 'map')}>
                  <MapIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{t('mapView')}</span>
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div id="explore-filters" className="mb-3 rounded-card border border-hairline bg-surface p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label htmlFor="f-location" className="mb-2 block text-sm font-medium text-night">
                    {t('location')}
                  </label>
                  <select id="f-location" className={selectClass}>
                    <option value="">{t('allLocations')}</option>
                    <option value="nazareth">Nazareth</option>
                    <option value="bethlehem">Bethlehem</option>
                    <option value="jerusalem">Jerusalem</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-tradition" className="mb-2 block text-sm font-medium text-night">
                    {t('tradition')}
                  </label>
                  <select id="f-tradition" className={selectClass}>
                    <option value="">{t('allTraditions')}</option>
                    <option value="catholic">{t('traditionCatholic')}</option>
                    <option value="orthodox">{t('traditionOrthodox')}</option>
                    <option value="armenian">{t('traditionArmenian')}</option>
                    <option value="anglican">{t('traditionAnglican')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="f-type" className="mb-2 block text-sm font-medium text-night">
                    {t('type')}
                  </label>
                  <select id="f-type" className={selectClass}>
                    <option value="">{t('allTypes')}</option>
                    <option value="church">{t('typeChurch')}</option>
                    <option value="chapel">{t('typeChapel')}</option>
                    <option value="monastery">{t('typeMonastery')}</option>
                    <option value="archaeological">{t('typeArchaeological')}</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input type="checkbox" className="h-5 w-5 rounded accent-primary-600" />
                    <span className="text-sm text-night">{t('openToVisitors')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </Container>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1920px]">
        {viewMode === 'list' ? (
          <div className="p-4 sm:p-6">
            {filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <ChurchCard key={c.slug} slug={c.slug} name={c.name} location={c.location} tradition={c.tradition} imageUrl={c.image}>
                    {c.isOpen ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        {t('openToVisitorsBadge')}
                      </span>
                    ) : null}
                    {c.hasProjects ? (
                      <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                        {t('hasProjects')}
                      </span>
                    ) : null}
                  </ChurchCard>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <MapPin className="mx-auto mb-4 h-14 w-14 text-stone-300" aria-hidden="true" />
                <h3 className="mb-2 text-xl font-semibold text-night">{t('noResultsTitle')}</h3>
                <p className="text-muted">{t('noResultsSubtitle')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:h-[calc(100svh-12rem)] lg:grid-cols-5">
            <div className="relative h-[55svh] bg-stone-100 lg:order-last lg:col-span-3 lg:h-auto">
              <ChurchMap churches={filtered} />
            </div>
            <div className="p-4 sm:p-6 lg:col-span-2 lg:overflow-y-auto lg:border-e lg:border-hairline">
              <ul className="space-y-3">
                {filtered.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/churches/${c.slug}`}
                      className="flex gap-4 rounded-card border border-hairline/80 bg-surface p-3 transition-transform duration-150 ease-ios active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <ImagePlaceholder src={c.image} alt="" ratio="square" sizes="80px" className="h-20 w-20 shrink-0 rounded-control" />
                      <div className="min-w-0 flex-1 py-0.5">
                        <h3 className="truncate font-semibold text-night">{c.name}</h3>
                        <p className="mt-0.5 text-sm text-muted">{c.location}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">{c.tradition}</span>
                          {c.isOpen && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{t('open')}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Church profile, `src/app/[locale]/churches/[slug]/page.tsx`**

a) Add `import { cn } from '@/lib/utils';` after the `getChurchBySlug` import.

b) Replace `<div className="bg-white">` with `<div>`. The page now sits on linen with white grouped cards.

c) Replace the whole `{/* Hero */}` `<section>…</section>` with:
```tsx
      {/* Hero */}
      <section className="relative h-[56svh] min-h-[360px] overflow-hidden bg-night">
        <ImagePlaceholder
          src={church.image}
          alt={church.name}
          ratio="wide"
          sizes="100vw"
          className="absolute inset-0 h-full w-full"
          iconClassName="h-24 w-24"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 via-night/40 to-transparent pb-6 pt-24 md:pb-10">
          <Container>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white">{church.tradition}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white">{church.denomination}</span>
            </div>
            <h1 className="font-serif text-[34px] font-semibold leading-[1.1] tracking-tight text-white md:text-6xl">
              {church.name}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-white/90">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              <span className="text-lg">
                {church.location.city}, {church.location.country}
              </span>
            </p>
          </Container>
        </div>
      </section>
```

d) Replace the whole `{/* Actions bar */}` `<div …>…</div>` block with this iOS pill row. It scrolls horizontally on narrow phones.
```tsx
      {/* Actions bar */}
      <div className="frosted stick-below-topbar sticky z-30 border-b border-hairline">
        <Container className="scrollbar-none flex items-center gap-2 overflow-x-auto py-3">
          <span className={buttonVariants({ size: 'sm' })}>
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {t('planVisit')}
          </span>
          <button type="button" className={buttonVariants({ variant: 'tinted', size: 'sm' })}>
            <Heart className="h-4 w-4" aria-hidden="true" />
            {t('follow')}
          </button>
          <button type="button" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            {t('save')}
          </button>
          <button type="button" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'ms-auto')}>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {t('share')}
          </button>
        </Container>
      </div>
```

e) Replace `{/* Main content */}` `<Container className="py-12">` with `<Container className="py-8 md:py-12">`.

- [ ] **Step 3: Project profile, `src/app/[locale]/projects/[slug]/page.tsx`** (exact replacements)

| Find | Replace with |
| --- | --- |
| `<div className="bg-white">` | `<div>` |
| `<section className="relative overflow-hidden bg-stone-900 py-16 text-white">` | `<section className="relative overflow-hidden bg-night py-12 text-white md:py-16">` |
| `bg-gradient-to-br from-primary-900/40 to-stone-900` | `bg-gradient-to-br from-primary-900/60 to-night` |
| `<span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white backdrop-blur-sm">{project.category}</span>` | `<span className="rounded-full bg-white/20 px-3 py-1 text-sm text-white">{project.category}</span>` |
| `<span className="flex items-center gap-1 rounded-full bg-green-600/80 px-3 py-1 text-sm text-white backdrop-blur-sm">` | `<span className="flex items-center gap-1 rounded-full bg-hills px-3 py-1 text-sm text-white">` |
| `<h1 className="mb-4 font-serif text-4xl md:text-5xl">{project.title}</h1>` | `<h1 className="mb-4 font-serif text-[34px] font-semibold leading-[1.1] tracking-tight md:text-5xl">{project.title}</h1>` |
| `<p className="mb-6 max-w-3xl text-xl text-stone-300">{project.shortDescription}</p>` | `<p className="mb-6 max-w-3xl text-lg text-white/80 md:text-xl">{project.shortDescription}</p>` |
| `{/* Main content */}` followed by `<Container className="py-12">` | the same comment, then `<Container className="py-8 md:py-12">` |

- [ ] **Step 4: Replace `src/app/[locale]/projects/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getProjects } from '@/lib/data/projects';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('ProjectsPage');
  const tc = await getTranslations('Common');
  const projects = await getProjects(locale);

  return (
    <Section tone="stone">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={Math.min(i, 5) * 60}>
            <ProjectCard
              slug={p.slug}
              title={p.title}
              church={p.church?.name ?? null}
              progress={p.progress}
              goal={`$${p.budget.total.toLocaleString()}`}
              progressLabel={tc('progress')}
              goalLabel={tc('goal')}
              learnMoreLabel={tc('learnMore')}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 5: Replace `src/app/[locale]/stories/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { isValidLocale } from '@/lib/i18n/config';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { Card } from '@/components/ui/card';
import { DEMO_STORIES } from '@/lib/demo/data';

export default async function StoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('StoriesPage');

  return (
    <Section tone="stone">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_STORIES.map((s, i) => (
          <Reveal key={s.slug} delay={Math.min(i, 5) * 60}>
            <Card className="h-full p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-stone-100" aria-hidden="true">
                  <BookOpen className="h-6 w-6 text-stone-700" />
                </span>
                <div>
                  <span className="inline-block rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                    {s.category}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold text-night">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.excerpt}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 6: Replace `src/app/[locale]/visit/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Clock, Accessibility, Users, MapPin, ArrowRight } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { isValidLocale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export default async function VisitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('VisitPage');

  const items = [
    { icon: Clock, title: t('hoursTitle'), body: t('hoursBody') },
    { icon: Accessibility, title: t('accessTitle'), body: t('accessBody') },
    { icon: Users, title: t('toursTitle'), body: t('toursBody') },
    { icon: MapPin, title: t('stayTitle'), body: t('stayBody') },
  ];

  return (
    <Section tone="stone">
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it, i) => (
          <Reveal key={it.title} delay={i * 60}>
            <Card className="h-full p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-primary-100" aria-hidden="true">
                  <it.icon className="h-6 w-6 text-primary-700" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-night">{it.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{it.body}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
      <div className="mt-10">
        <Link href="/explore" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
          {t('cta')}
          <ArrowRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
```

- [ ] **Step 7: Check that no stale classes remain**

```bash
grep -rn "top-16\|bg-primary-500\|text-primary-500\|olive-\|blue-\|backdrop-blur" src || echo "clean"
```
Expected: `clean`. The only allowed match is `ring-primary-500`, and the pattern above does not match it.

- [ ] **Step 8: Types, lint, tests, build**

Run: `corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 build`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add src
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(pages): iOS styling for explore, profiles, projects, stories, visit" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Verification, spec amendments, preview deploy

**Files:**
- Modify: `docs/superpowers/specs/2026-09-24-ios-minimal-redesign-design.md`

- [ ] **Step 1: Full automated gate**

Run: `corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 build`
Expected: every suite passes (about 130 tests), with no type or lint errors, and the build succeeds.

- [ ] **Step 2: Manual QA with `corepack pnpm@12.5.1 dev`**

Check each item, and fix anything that fails before continuing:
1. **390×844, `/en`, every tab:**
   - the tab bar never covers content, including the footer;
   - the active tab matches the page, and a church profile keeps Explore active;
   - no horizontal page scroll.
2. **Language sheet:**
   - opens from the globe button;
   - Tab stays inside it; Esc closes it and focus returns to the button;
   - choosing العربية keeps the same page.
3. **`/ar` at 390px:**
   - tab bar, chevrons, arrows and the sites strip all mirror;
   - the back-to-top button sits at the inline end, which is the left in RTL.
4. **Back-to-top:**
   - hidden at the top, appears after about one screen;
   - tapping it scrolls smoothly up and moves focus to main.
5. **Hero:** the photo slowly zooms. In Chrome, scrolling fades and scales the photo and lifts the text.
6. **Reduced motion** (DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce"): the hero is static, content isn't hidden, and back-to-top jumps instantly.
7. **768×1024 and 1280×900:** the top bar shows the text nav, the tab bar is gone, and the Explore map shows beside the list.
8. **Explore on a phone:** "Map" shows the map above the list, and search doesn't zoom the page on focus (16px input).
9. **Console:** no errors or hydration warnings on any page.

- [ ] **Step 3: Amend the spec to match what was built**

In `docs/superpowers/specs/2026-09-24-ios-minimal-redesign-design.md`:
1. `Status: Approved (design) — awaiting spec review` becomes `Status: Approved — implemented per docs/superpowers/plans/2026-09-24-ios-minimal-redesign.md`.
2. §5, `BottomTabBar` bullet: "`<main>` gets matching bottom padding on mobile." becomes "`<body>` gets matching bottom padding on mobile (so the footer clears the bar too)."
3. §5, `LanguageSheet` bullet: "(native `<dialog>`, focus-trapped, Esc/backdrop to close)" becomes "(a `role="dialog"` `aria-modal` panel portaled to `<body>`, not native `<dialog>`: jsdom lacks it, and the frosted bar's `backdrop-filter` would trap a fixed child. Focus moves in and Tab is trapped. Esc or a backdrop tap closes it and returns focus to the button.)"
4. §9, `AppFooter`: "(on mobile it sits above the tab bar via `<main>`'s bottom padding)" becomes "(on mobile it clears the tab bar via `<body>`'s bottom padding)".
5. §9, i18n keys: add `Common.skipToContent`, `Navigation.primaryNav`, `Navigation.footerNav`, `Explore.viewMode`.
6. §10:
   - "focus-visible rings in `sea`" becomes "focus-visible rings in `primary-500` (3.71:1 on linen, which passes the 3:1 non-text rule)".
   - "sheet is a modal `<dialog>` with labelled title" becomes "sheet is a `role="dialog"` `aria-modal` panel with a labelled title".

```bash
git add docs/superpowers/specs/2026-09-24-ios-minimal-redesign-design.md
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "docs: align redesign spec with implementation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Preview deploy (ask the user before pushing)**

The push publishes to GitHub. After the user says yes:
```bash
git push -u origin feat/ios-minimal-redesign
```
Vercel builds a preview for the branch. Run Lighthouse (mobile) on the preview URL for `/en` and `/en/explore`. The target is **≥ 90** for both Performance and Accessibility. Record the scores in the hand-off message.

- [ ] **Step 5: Release (ask the user first)**

Once the user approves the preview, merge and push. The Vercel production deploy runs from `main`:
```bash
git checkout main && git merge --ff-only feat/ios-minimal-redesign && git push origin main
```
