# Many Languages (Part 2) — Design

Date: 2026-09-25
Status: Approved (design)
Scope: Part 2 of 2 of the redesign. Part 1 (iOS-minimal redesign) is live.

## 1. Goals

- Offer the site in the languages of the largest Christian pilgrim groups to the
  Holy Land: 22 languages in total.
- Translate everything a visitor reads: UI text (menus, buttons, headings, page
  titles) **and** the database content (church, tradition and project texts).
- Never show a blank: every translated field falls back to English.
- Keep routes, RTL behaviour, accessibility and the Part 1 design intact.

## 2. Non-goals

Map place-name language (OpenFreeMap labels stay local + Latin); translating the
bundled demo fallback data (`src/lib/demo/data.ts`, used only when Supabase is
unreachable); an admin/translator UI; new RTL languages.

## 3. Decisions (approved)

| Topic | Decision |
| --- | --- |
| Languages | Pilgrim set: en, ar, he + es, pt (Brazilian), fr, it, de, pl, ru, uk, ro, el, hy, ka, am, zh (Simplified), ja, ko, fil, id, hi. RTL: ar, he only. |
| Translator | Claude translates all UI strings and database content now; files/rows stay editable for later native-speaker polish. |
| Database content | Translated now, stored in the **existing** `translations` table (entity_type, entity_id, field, locale, content, status); church narratives in the existing per-locale `church_descriptions`. No schema change. |
| Missing content | Write short, factual Overview/Story/Community descriptions for the Church of the Nativity and the Church of the Holy Sepulchre (currently empty), in all 22 languages. |
| Picker | Language sheet gains a search field; rows show native name + English name. |

## 4. Locales

`src/lib/i18n/config.ts` becomes the single list, in picker order (the current
language is marked with a check mark, not moved to the top):

| Code | Native name | English name | Dir |
| --- | --- | --- | --- |
| en | English | English | ltr |
| ar | العربية | Arabic | rtl |
| he | עברית | Hebrew | rtl |
| es | Español | Spanish | ltr |
| pt | Português | Portuguese | ltr |
| fr | Français | French | ltr |
| it | Italiano | Italian | ltr |
| de | Deutsch | German | ltr |
| pl | Polski | Polish | ltr |
| ro | Română | Romanian | ltr |
| el | Ελληνικά | Greek | ltr |
| ru | Русский | Russian | ltr |
| uk | Українська | Ukrainian | ltr |
| hy | Հայերեն | Armenian | ltr |
| ka | ქართული | Georgian | ltr |
| am | አማርኛ | Amharic | ltr |
| hi | हिन्दी | Hindi | ltr |
| zh | 简体中文 | Chinese (Simplified) | ltr |
| ja | 日本語 | Japanese | ltr |
| ko | 한국어 | Korean | ltr |
| fil | Filipino | Filipino | ltr |
| id | Bahasa Indonesia | Indonesian | ltr |

- `localeNames` keeps the native name; a new `localeEnglishNames` holds the
  English name (search + secondary label).
- `generateStaticParams`, middleware and `getRequestConfig` already derive from
  `locales`, so routing extends automatically. Browser-language detection
  (next-intl `Accept-Language` + `NEXT_LOCALE` cookie) already works for any
  listed locale.
- Intl formatting (`formatDate`, `formatNumber`, dates in the data layer) uses
  the locale code directly (`new Intl.DateTimeFormat(locale, …)`), replacing the
  3-entry maps and the locale-less `toLocaleDateString()` calls.

## 5. UI text

- 19 new files `messages/{locale}.json`, same keys as `en.json` (~180 strings),
  translated by Claude. ICU placeholders (e.g. `{year}`) preserved verbatim.
- New keys (all 22 locales):
  - `Metadata.title`, `Metadata.description` — used by a `generateMetadata`
    in `src/app/[locale]/layout.tsx` so the browser tab/SEO text is localized
    (root layout keeps the English default).
  - `Explore.viewChurch` — replaces the hard-coded "View church →" in
    `ChurchMap`'s popup.
  - `Common.searchLanguages`, `Common.noLanguageMatch` — language sheet search.
- The messages test iterates over `locales` from config: every locale has
  exactly the `en` key set, no empty strings, and the same ICU placeholders as
  `en` for each key.

## 6. Database content

### 6.1 Storage

Existing tables, no schema change:

- `translations` rows with `status = 'PUBLISHED'` (the only status the public
  RLS policy exposes), `source_locale = 'en'`. Keys:

| entity_type | entity_id | fields |
| --- | --- | --- |
| `church` | churches.id | `name` |
| `church_location` | church_locations.id | `city`, `country` |
| `denomination` | denominations.id | `name` |
| `heritage_item` | heritage_items.id | `title`, `item_type`, `date_period` |
| `church_update` | church_updates.id | `title`, `content` |
| `project` | projects.id | `title`, `short_description`, `full_description`, `category` |
| `project_timeline` | project_timelines.id | `phase` |
| `project_update` | project_updates.id | `title`, `content` |
| `project_budget` | project_budgets.id | `item.<index>` (budget_items JSONB line names) |

- `church_descriptions` rows (one per church × locale) for
  overview/story/heritage/community — the table is already per-locale.

### 6.2 Seed file

`supabase/migrations/006_translations_content.sql`, run once by the user in
the Supabase SQL editor (the connected Supabase account cannot reach this
project). Idempotent: `INSERT … ON CONFLICT (entity_type, entity_id, field,
locale) DO UPDATE SET content = EXCLUDED.content, status = 'PUBLISHED'` and
`ON CONFLICT (church_id, locale) DO UPDATE` for descriptions. Entity IDs are
read from the live database when the file is generated (the seed uses fixed
UUIDs). English source rows are not duplicated into `translations` — English
stays in the base columns. Arabic and Hebrew are included too (so the legacy
`_ar`/`_he` columns are no longer the only source), but the legacy columns keep
working.

### 6.3 Data layer

`src/lib/data/translate.ts` (new, pure + one fetch helper):

- `fetchTranslations(supabase, locale, entityIds): Promise<TranslationMap>` —
  one query `translations?locale=eq.X&entity_id=in.(…)&status=eq.PUBLISHED`,
  returns `Map<"entity_type:entity_id:field", content>`. Skipped for `en`.
  Errors → empty map (page still renders in English).
- `t(map, type, id, field, fallback)` — returns the translation or the
  fallback (never empty: empty translation strings count as missing).

`churches.ts` / `projects.ts`:

- Selects add the `id` of every translatable entity.
- Fallback chain per field: `translations[locale]` → legacy `_ar`/`_he`
  column (for ar/he) → English column.
- Descriptions: `church_descriptions` row for the locale → `en` row → first.
- `pickLocale` is replaced by the chain above.
- Pages and components are unchanged (they already receive mapped strings).

## 7. Language sheet

- Search input at the top of the sheet (`type="search"`, 16px, labelled by
  `Common.searchLanguages`); filters case-insensitively on native **and**
  English name and the code; `Common.noLanguageMatch` when empty. Focus lands on
  the current language as before (search is one Tab/tap away); Escape still
  closes.
- Each row: native name (in its own `lang`/`dir`) + English name in muted text
  (hidden for English itself).
- Sheet body scrolls (already `max-h-[85dvh] overflow-y-auto`); the search bar
  stays pinned at the top of the sheet.

## 8. Fonts & layout

- System fonts already cover every script (iOS/macOS, Android Noto, Windows).
  Armenian/Georgian/Amharic/Devanagari/CJK fall back per glyph from
  `ui-serif`/`system-ui`.
- Long translations: check that tab-bar labels (11px, 5 across) don't overflow
  — they may wrap to two lines or truncate with ellipsis; buttons use
  `whitespace-nowrap` and must not overflow at 375px.

## 9. Testing & verification

- Unit: config (22 locales, unique codes, dir), messages parity/placeholders
  for all locales, `translate.ts` (map lookup, fallback on missing/empty),
  data-layer mapping with a translation map, language-sheet search.
- Build: all locales statically generated (`next build`).
- Manual: 390px screenshots in ru, zh, ja, am, hy, ka, hi, el, ar;
  language search; browser-language redirect from `/`; a church page in a new
  language shows translated DB content after the SQL is applied (and English
  before it).

## 10. Risks

- Translation quality in lower-resource languages (Amharic, Armenian,
  Georgian): accepted; one file per language for later review.
- Seed SQL size (~ content fields × 21 locales): a few hundred rows — fine for
  the SQL editor.
- Build time grows ~7× (22 locales); currently ~20 static pages → ~220.
- Text expansion (German, Greek, Russian) in tab bar and buttons: covered by the
  overflow check in §8.
