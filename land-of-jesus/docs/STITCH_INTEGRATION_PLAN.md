# Stitch Integration Plan — Phase 1 Audit

Date: 2026-09-24
Status: **Audit complete — awaiting approval before any UI implementation.**
Scope: Apply/complete the Stitch design system on top of the existing Land of
Jesus platform, preserving all business logic, routing, i18n, and data.

> **Important context discovered during audit:** the Stitch design is *already
> partially applied* in this codebase (see `docs/STITCH-MIGRATION.md` and
> `src/lib/utils/design-tokens.ts`). This is therefore not a from-scratch skin —
> it is **completing and correcting a half-wired design system**, extracting
> shared components from duplicated inline markup, and adding the missing global
> chrome. There is no separate Stitch HTML export in the tar; the tokens file +
> the already-built screens are the design reference.

---

## A. Current application architecture

| Area | Finding |
| --- | --- |
| Framework | **Next.js 16.3.5** (App Router, very new — `AGENTS.md` warns APIs differ), **React 19.2.8** |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` in `globals.css`, PostCSS plugin) |
| i18n | **next-intl v4**, `[locale]` routing, `localePrefix: 'always'`, RTL for ar/he |
| Data | **Supabase** (`@supabase/ssr`) — server/client/admin helpers in `src/lib/supabase/` |
| Icons | `lucide-react` |
| Maps | `mapbox-gl` + `react-map-gl` **installed but unused** (placeholder in Explore) |
| Validation | `zod` **installed but unused** |
| Tests | `vitest` + `@playwright/test` installed; **no test files present** |
| Utilities | `cn()` (clsx + tailwind-merge), `formatDate/Number`, `slugify`, `truncate` |

**Layout structure (notable):** `src/app/layout.tsx` loads the fonts but returns
bare `children` (no `<html>/<body>`); the `<html dir>`/`<body>` live in
`src/app/[locale]/layout.tsx`. `src/app/page.tsx` is **leftover
create-next-app boilerplate** (unreachable — middleware redirects `/`→`/en`).

## B. Stitch design architecture (as extracted)

- `src/lib/utils/design-tokens.ts` — a **complete token set**: terracotta
  `primary` (50–950), `stone`, `olive`, semantic colors; a type scale;
  spacing/radii/shadows; breakpoints; motion; z-index. Fonts: **EB Garamond**
  (serif headings) + **Plus Jakarta Sans** (sans body).
- Visual language: warm heritage/editorial — stone/amber/terracotta, serif
  display headings, generous section padding (`py-24`), 16:10 church imagery,
  rounded cards with soft shadows.

## C. Existing pages / routes

| Route | File | State |
| --- | --- | --- |
| `/` | `app/page.tsx` | ⚠️ create-next-app boilerplate, effectively dead |
| `/[locale]` | `app/[locale]/page.tsx` | Homepage — rich, `'use client'`, **hardcoded demo data**, partial i18n |
| `/[locale]/explore` | `.../explore/page.tsx` | Map/List discovery — `'use client'`, `DEMO_CHURCHES` array, map placeholder |
| `/[locale]/churches/[slug]` | `.../churches/[slug]/page.tsx` | Church profile — server component, `DEMO_CHURCHES` record |
| `/[locale]/projects/[slug]` | `.../projects/[slug]/page.tsx` | Project profile — demo data, "prototype, no payment" notice |

**Referenced in links/nav but NOT built:** `/stories`, `/visit`, `/projects`
(list), `/heritage`, `/account`, `/church-portal`, `/admin`.

## D. Stitch screens (design reference)

From `docs/STITCH-MIGRATION.md`: **Homepage**, **Explore** (map+list+filters),
**Church Profile** (hero, quick facts, story, heritage, community, visit,
projects, updates), **Project Profile** (progress, budget, timeline,
verification, updates). These map 1:1 to the four built pages.

## E. Mapping — existing page ↔ Stitch screen

| Stitch screen | Existing page | Gap |
| --- | --- | --- |
| Homepage | `/[locale]` ✅ | Design tokens/fonts not wired; demo data; missing header/footer; partial i18n |
| Explore | `/[locale]/explore` ✅ | Real map not integrated (placeholder); demo data; filters non-functional |
| Church Profile | `/[locale]/churches/[slug]` ✅ | Demo data; sections need componentizing |
| Project Profile | `/[locale]/projects/[slug]` ✅ | Demo data; payment intentionally disabled |
| Global chrome (header/nav/footer) | **none** ❌ | Must be created |
| Account / Church Portal / Admin | **none** ❌ | Out of scope for design pass (future) |

## F. Components that can be reused (exist)

`ui/button` (CVA variants), `ui/card` (+ Header/Title/Desc/Content/Footer),
`ui/badge`, `ui/skeleton`. The `cn()` util. The token file (as the source for
the Tailwind theme).

## G. Components that must be created

- **Layout:** `AppHeader` (logo, nav, `LocaleSwitcher`, account CTA),
  `AppFooter`, `MobileNav` (drawer), `Container`/`Section` primitives,
  `SectionHeading`.
- **Domain:** `ChurchCard`, `ProjectCard` (+ `ProgressBar`), `TraditionCard`,
  `Hero`, `FilterPanel`, `SearchBar`, `ViewToggle` (list/map), `MapMarker`,
  `EmptyState`, `Breadcrumb`, `Tag`/status pill (fold into `Badge`).
- **UI gaps:** `Input`, `Select`, `Checkbox` (Explore filters use raw elements),
  `LoadingState` (skeleton compositions), form field + label wiring.

These currently exist only as **duplicated inline markup** across home / explore
/ church / project (church cards, project progress bars, status pills, section
headers all repeated).

## H. Missing design states

- Loading (skeletons exist but unused on any page), error boundaries, real empty
  states (only Explore-list has one), focus/hover consistency, disabled states
  (project "support" button), 404 for unknown church/project slug (church uses
  `notFound()` ✅; verify project does too), mobile navigation, locale-switch UI.

## I. Potential conflicts (current app ↔ intended Stitch design)

1. **Design tokens are NOT wired to Tailwind v4.** `globals.css` is still
   create-next-app boilerplate: no `@theme` mapping for `primary`/`olive`, wrong
   font vars (`--font-geist-*`), `body { font-family: Arial }`. Consequence:
   `bg-primary-500` / `text-primary-500` (used by `Button` primary + `Badge`
   primary) **produce no color** in Tailwind v4 (only `stone`/`amber`/`green`
   defaults resolve). This is why pages lean on `stone-*`/`amber-*` instead of
   the terracotta brand.
2. **Fonts loaded but never applied.** Root layout builds the font CSS-vars but
   its `variable` classes are never placed on `<html>`/`<body>`, and the locale
   layout's `<body>` omits them → EB Garamond / Plus Jakarta effectively don't
   render; `font-serif`/`font-sans` fall back.
3. **Two layouts, split `<html>`.** `<html>` lives in the nested locale layout,
   not root — fragile under Next 16; must be handled carefully when adding fonts.
4. **Partial i18n.** Only headings use `t()`; section subtitles, card labels,
   CTAs ("View All Churches"), empty states, and filter options are hardcoded
   English. `Navigation`/`Footer` translation keys exist but are unused (no
   components consume them).
5. **Duplicate message dirs** — `messages/` (used by `request.ts`) and
   `src/messages/` (orphan). One must be removed to avoid drift.
6. **RTL correctness.** `dir` is set, but components use physical utilities
   (`ml-*`, `mr-*`, `left/right`, `border-r`, `translate-x`) that won't mirror
   for ar/he. Needs logical properties (`ms-*`, `me-*`, `ps/pe`, `start/end`).

## J. Risk areas (where functionality could break)

- **Wiring `primary` into the theme will visibly change the app** (primary is
  currently invisible → will become terracotta). Intended, but must be reviewed.
- **Next 16 / React 19 / Tailwind 4 are pre-stable** (`AGENTS.md` explicitly
  warns). Follow the bundled docs; avoid patterns from older Next.
- **Data is 100% demo/hardcoded.** The brief says "don't replace real data with
  mocked data" — but there is **no live data wired yet**; the schema (26 tables +
  RLS) exists but no page queries it. **Wiring Supabase data is a separate track
  from the design pass** and is flagged as a product decision (see below).
- **Splitting `<html>` across layouts** — moving fonts/attributes risks hydration
  errors if done naively.
- **`app/page.tsx` boilerplate** and boilerplate `public/*.svg` should be removed
  to avoid confusion.

---

## Proposed component architecture

```
src/components/
  layout/
    AppHeader.tsx        SiteHeader with nav + LocaleSwitcher + account CTA
    AppFooter.tsx        tagline, links, copyright (uses Footer.* i18n)
    MobileNav.tsx        drawer for < md
    LocaleSwitcher.tsx   en/ar/he, preserves path, sets dir
    Container.tsx        max-width + gutter primitive
    Section.tsx          vertical rhythm wrapper (py-24 etc.)
    SectionHeading.tsx   centered title + subtitle
  churches/
    ChurchCard.tsx       image ratio 16:10, name, location, status pills
    ChurchHero.tsx       profile hero
  projects/
    ProjectCard.tsx      title, church, ProgressBar, goal
    ProgressBar.tsx      accessible progress (role=progressbar)
  explore/
    SearchBar.tsx  FilterPanel.tsx  ViewToggle.tsx  MapMarker.tsx
  common/
    Hero.tsx  EmptyState.tsx  Breadcrumb.tsx  Tag.tsx
  ui/ (existing) button, card, badge, skeleton  + new: input, select, checkbox
```

Design-system home: **wire `design-tokens.ts` → `globals.css` `@theme`** so
`primary`/`olive`/type/radii/shadows become real Tailwind v4 utilities; apply the
font variables on `<html>`; delete boilerplate. Tokens stay the single source of
truth — no scattered hex values.

## Implementation order (proposed)

1. **Phase 2 — Design-system foundation** (prerequisite, low risk, high leverage)
   - Wire tokens into `globals.css` `@theme`; fix fonts; remove `Arial`/boilerplate.
   - Remove `app/page.tsx` boilerplate + unused `public/*.svg`; dedupe message dirs.
2. **Phase 3 — Shared components**
   - Layout (`Container`, `Section`, `SectionHeading`, `AppHeader`, `AppFooter`,
     `LocaleSwitcher`, `MobileNav`) → then domain cards (`ChurchCard`,
     `ProjectCard`, `ProgressBar`, `TraditionCard`) → form primitives.
3. **Phase 4 — First page: Homepage** *(then STOP for review per your instruction)*
   - Rebuild `/[locale]` from the new components + tokens; full i18n; RTL-correct;
     responsive; preserve every existing link/route. Establishes the pattern.
4. **Remaining pages** (after Homepage is approved): Explore → Church Profile →
   Project Profile, each: apply components, keep behavior, i18n, RTL, states.
5. **QA each step:** `pnpm lint`, `tsc`, `build`, run the app, check console,
   hydration, RTL, mobile, a11y.

### Separately flagged product decisions (need your call, not blocking the design pass)
- **Demo data → Supabase:** should page data stay demo during the design pass and
  be wired to Supabase as a follow-up track, or be wired as each page is migrated?
  (Recommendation: keep demo now, wire data as a dedicated track after the visual
  system is approved — smaller, reviewable diffs.)
- **Missing routes** (`/stories`, `/visit`, `/projects` list, header nav targets):
  build minimal pages, or point nav only at existing routes for now?

---

## Page-by-page migration plan

| # | Page | Depends on | Actions | Preserve |
| --- | --- | --- | --- | --- |
| 0 | Design system + layout | — | Wire tokens/fonts; AppHeader/Footer/LocaleSwitcher; Container/Section | i18n config, routing, `dir` |
| 1 | **Homepage** `/[locale]` | 0 | Componentize hero/traditions/featured/projects/visit/CTA; full i18n; RTL; responsive | All links (`/explore`, `/churches/*`, `/projects/*`), CTA targets |
| 2 | Explore | 0,1 | `SearchBar`/`FilterPanel`/`ViewToggle`/`ChurchCard`; wire filters to state; keep map placeholder or integrate Mapbox | list/map toggle, query-param intent (`?view=map`, `?tradition=`) |
| 3 | Church Profile | 0,1 | Section components; hero; status pills; projects list via `ProjectCard` | `notFound()` behavior, section structure, slug routing |
| 4 | Project Profile | 0,1 | `ProgressBar`, budget/timeline/verification sections | **disabled payment + prototype notice** |

**Gate:** no page migration begins until Phase 2 + the Homepage pattern (Phase 4
step 1) are approved.
