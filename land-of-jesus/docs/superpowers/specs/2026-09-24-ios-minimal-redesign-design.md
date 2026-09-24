# iOS-Minimal, Mobile-First Redesign — Design

Date: 2026-09-24
Status: Approved — implemented per docs/superpowers/plans/2026-09-24-ios-minimal-redesign.md
Scope: Part 1 of 2. Part 2 (many more languages) gets its own spec next.

## 1. Goals

- The site is used mostly on phones, so design **mobile-first**; desktop is an
  enhancement, not the baseline.
- A **near-iOS minimal** look: native system fonts, large titles, calm spacing,
  rounded corners, frosted bars, subtle press feedback.
- **Colors taken from the Holy Land photos** already on the site.
- A new **"living photo" hero**, **motion** as content scrolls into view, a
  **better scrolling experience**, and a **back-to-top** button.
- Keep everything that works: routes, Supabase data layer, i18n + RTL, SEO
  server rendering, accessibility (WCAG AA).

## 2. Non-goals (this part)

New languages (Part 2), dark mode, page-transition animations, accounts/portal,
any change to the data model or routes.

## 3. Decisions (approved)

| Topic | Decision |
| --- | --- |
| Fonts | System fonts only: titles `ui-serif` (Apple "New York", Georgia fallback); UI/body `system-ui` (San Francisco / Roboto / Segoe). Removes EB Garamond + Plus Jakarta downloads. |
| Palette | Photo-derived tokens (§4) replace the terracotta `primary`. |
| Mobile navigation | iOS bottom tab bar (< 768px); frosted top bar with title + language button. Desktop keeps a top menu. |
| Hero | "Living photo": full-screen Jerusalem photo, slow zoom, large title; scroll fades/scales the photo; swipeable sacred-sites strip below. |
| Motion engine | Native CSS + a tiny IntersectionObserver hook. No animation library. |

Why system fonts: they render every script (Chinese, Japanese, Cyrillic, Greek,
Armenian, Amharic, Arabic, Hebrew) natively on each device, which Part 2 needs,
and they cost zero download bytes.

## 4. Design tokens (in `globals.css` `@theme`)

Extracted by k-means clustering of the five site photos
(`public/images/hero-jerusalem.jpg`, `visit.jpg`, `churches/*.jpg`).

### Semantic colors

| Token | Hex | Source / role | Contrast |
| --- | --- | --- | --- |
| `--color-linen` | `#f6f3ec` | page background (lightened pale stone) | — |
| `--color-surface` | `#ffffff` | cards, sheets | — |
| `--color-hairline` | `#ded9cf` | separators, card borders (pale stone) | — |
| `--color-sand` | `#cdbb9f` | subtle fills, chips (Jerusalem stone) | — |
| `--color-gold` | `#e0c68e` | highlights, progress fill tint (limestone at golden hour) | night text 8.8:1 |
| `--color-night` | `#32261d` | primary text (cedar shadow) | on linen 13.3:1 |
| `--color-muted` | `#6b645b` | secondary text | on linen 5.3:1 |
| `--color-sea` | `#4a6891` | links, info (Galilee sea, darkened) | on linen 5.2:1 |
| `--color-sky` | `#aabdd8` | info tint (Galilee sky) | — |
| `--color-hills` | `#455f3f` | verified / success (Galilee hills) | white on it 7.1:1 |
| `--color-olive` | `#4f4e37` | tertiary accent (olive) | — |

### `primary` scale → cedar (existing `primary-*` classes shift automatically)

`50 #faf6ef · 100 #f3eadb · 200 #e6d4b8 · 300 #d4b98f · 400 #b8925f ·
500 #9a7748 · 600 #81623f · 700 #6b5033 · 800 #54402a · 900 #3f2f20 · 950 #2a1f15`

Buttons use `primary-600` (white text 5.6:1); pressed/hover `primary-700`
(7.5:1).

### Type, shape, motion

- `--font-serif: ui-serif, "New York", Georgia, "Times New Roman", serif`
- `--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`
- Large title: 34px/1.1 mobile, 48–56px desktop, serif, weight 600.
- Radii: 12px controls, 20px cards, 28px sheets, full for pills/tab indicator.
- Shadows only on floating elements (tab bar, sheet, back-to-top, hero cards).
- Motion: durations 200/400/700ms; easing `cubic-bezier(0.22, 1, 0.36, 1)`
  (iOS-like ease-out); Ken Burns 20s. All disabled under
  `prefers-reduced-motion` (existing global rule).

## 5. Layout & navigation

- `app/[locale]/layout.tsx` exports `viewport` with `viewportFit: 'cover'` and
  `themeColor: '#f6f3ec'`; heights use `svh`/`dvh` so iOS Safari toolbars do not
  cut content.
- **`TopBar`** (all sizes, restyled `AppHeader`): sticky, frosted
  (`backdrop-blur` + translucent linen), 52px tall; brand wordmark; on desktop
  the text nav + language button; on mobile only brand + language button.
- **`BottomTabBar`** (`md:hidden`): fixed bottom, frosted, 5 tabs (Home,
  Explore, Projects, Stories, Visit) with Lucide icons + labels, active tab in
  `primary-600` with `aria-current="page"`; bottom padding
  `env(safe-area-inset-bottom)`; ≥44px targets. `<body>` gets matching bottom
  padding on mobile (so the footer clears the bar too).
- **`LanguageSheet`**: the language button opens an iOS-style bottom sheet
  (a `role="dialog"` `aria-modal` panel portaled to `<body>`, not native `<dialog>`: jsdom lacks it, and the frosted bar's `backdrop-filter` would trap a fixed child. Focus moves in and Tab is trapped. Esc or a backdrop tap closes it and returns focus to the button.) listing locales from
  `lib/i18n/config.ts`, each in its own script. Built to scale to dozens of
  languages (Part 2).

## 6. Hero — "living photo" (`components/home/Hero.tsx`)

- 100svh, full-bleed `HERO_IMAGE` with a bottom-weighted night-cedar gradient
  for legibility; serif large title, subtitle, two buttons (Explore / Open map).
- Ken Burns: CSS `@keyframes` scale 1 → 1.08 over 20s, alternate, infinite.
- Scroll effect (progressive enhancement): inside
  `@supports (animation-timeline: scroll())`, the photo fades to 0.35 and scales
  to 1.12 and the text block rises 40px as the hero scrolls out. Without support
  (or with reduced motion) the hero is static — no JS.
- **`SiteStrip`** directly below: horizontal `scroll-snap-type: x mandatory`
  row of church cards (photo 4:5, name, city), 78vw wide on phones, 300px on
  desktop, `scroll-padding-inline`, hidden scrollbar, keyboard-scrollable
  (`tabIndex=0`, labelled region). Data from `getChurches(locale)`.

## 7. Motion & scrolling UX

- **`Reveal`** (client): wraps content; an IntersectionObserver
  (`threshold 0.15`, `rootMargin '0px 0px -10% 0px'`) adds `is-visible` once;
  CSS fades from `opacity 0; translateY(16px)` to rest in 700ms. `delay` prop
  for staggered grids (60ms steps). Renders visible immediately when reduced
  motion is set or JS is off (content never hidden from crawlers/no-JS).
- **Press feedback**: `active:scale-[0.97]` + 150ms transition on buttons and
  tappable cards.
- **Scrolling**: `scroll-behavior: smooth` (reduced-motion aware),
  `scroll-padding-top` = top bar height so anchors are not hidden,
  `overscroll-behavior: contain` in the sheet, scroll-snap on strips.
- **`BackToTop`** (client): appears (fade + scale) after `scrollY > 0.8 ×
  innerHeight`; fixed at `inset-inline-end: 16px` (auto-mirrors in RTL) and
  above the tab bar on mobile (`bottom: calc(tabbar + safe-area + 16px)`), 24px
  on desktop; 48px circle, `aria-label` translated; on click scrolls to top
  (smooth unless reduced motion) and moves focus to the skip target / page
  heading. Throttled scroll listener via `requestAnimationFrame`, passive.

## 8. Pages

| Page | Changes |
| --- | --- |
| Home | New Hero + SiteStrip; sections restyled with tokens; `Reveal` on sections and grids. |
| Explore | Sticky frosted search/filter bar; list = iOS grouped cards on mobile; map unchanged (MapLibre). |
| Church profile | Photo header with large serif title overlay; sections as grouped white cards on linen; action row as iOS pills. |
| Project profile | Same header treatment; progress bar uses `primary-600` on `gold` track; prototype/disabled-payment notices kept. |
| Projects, Stories, Visit | Restyled cards + large titles + `Reveal`. |

## 9. Components

- **New**: `layout/TopBar`, `layout/BottomTabBar`, `layout/LanguageSheet`,
  `layout/BackToTop`, `motion/Reveal`, `home/Hero`, `home/SiteStrip`.
- **Updated**: `globals.css` tokens; `ui/button` variants (pill, filled, tinted,
  plain); `ui/card`; `ChurchCard`, `ProjectCard`, `ProgressBar`, `Section`,
  `SectionHeading`, `ImagePlaceholder`; `AppFooter` restyled and shown on all
  sizes (on mobile it clears the tab bar via `<body>`'s bottom padding).
- **Replaced**: `AppHeader` → `TopBar` (same file role, new design).
- **Removed**: `next/font` EB Garamond + Plus Jakarta loaders; `LocaleSwitcher`
  (the `LanguageSheet` replaces it on every screen size).
- New i18n keys (en/ar/he, parity-checked): tab labels reuse `Navigation.*`;
  add `Common.skipToContent`, `Navigation.primaryNav`, `Navigation.footerNav`, `Explore.viewMode`.

## 10. Accessibility & performance

- WCAG AA contrast (table §4); focus-visible rings in `primary-500` (3.71:1 on linen, which passes the 3:1 non-text rule); tab bar and sheet
  fully keyboard operable; `aria-current` on active tab; sheet is a `role="dialog"` `aria-modal` panel with a labelled title; reduced motion honored everywhere.
- No font downloads; no animation library; Hero image `priority`; SiteStrip
  images `loading="lazy"`; `backdrop-filter` only on bars/sheet.
- Target Lighthouse mobile ≥ 90 performance and accessibility.

## 11. Verification

- `tsc`, `eslint`, `next build` green; i18n parity check.
- Screenshots at 390×844 (iPhone), 768×1024, 1280×900; Arabic RTL at 390px;
  reduced-motion emulation.
- Check: tab bar never covers content; back-to-top appears/hides and returns
  focus; sheet opens/closes with keyboard; swipe strip snaps; hero static under
  reduced motion; no console errors.
- Lighthouse mobile on the Vercel preview.

## 12. Risks

- CSS scroll-driven animations are not in every browser (Firefox) — used only as
  progressive enhancement; the hero is fine static.
- `backdrop-filter` can be costly on low-end Android — limited to three
  surfaces; solid fallback via `@supports not (backdrop-filter: blur(1px))`.
- Fixed bottom bar + iOS Safari dynamic toolbar — mitigated with `svh`/`dvh`
  and safe-area insets; verified on the 390px screenshot.
- Dropping the Garamond changes the brand feel slightly; `ui-serif` (New York)
  keeps a serif voice on Apple devices, Georgia elsewhere.
