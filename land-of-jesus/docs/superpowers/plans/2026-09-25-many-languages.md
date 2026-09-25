# Many Languages (Part 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Offer the Land of Jesus site in 22 languages. That covers the UI text, and it covers the database content through the existing `translations` table, with English as the fallback everywhere.

**Architecture:**
- **Locales:** they live in `src/lib/i18n/config.ts`. Routing, middleware and static params already derive from that list.
- **UI text:** one JSON file per locale in `messages/`.
- **Database content:** translated content is authored as one JSON file per locale in `supabase/content-i18n/`. A generator script turns those files into an idempotent SQL seed (`006_translations_content.sql`), which the user runs once in Supabase.
- **Data layer:** it fetches the locale's rows from `translations` in one query per page. It overlays them on the English columns, falling back to the legacy `_ar`/`_he` columns and then to English.

**Tech Stack:** Next.js 16.3.5 App Router, next-intl 4.14.5, Supabase (`@supabase/ssr`), Vitest 5 + jsdom + Testing Library, Node 24 (for the `.mjs` generator).

**Spec:** `docs/superpowers/specs/2026-09-25-many-languages-design.md`

## Global Constraints

- Work from `land-of-jesus/`, the app root. The git root is its parent, but git commands work from here. Quote paths containing `[locale]` or `[slug]`.
- `pnpm` is **not on PATH**. Always use `corepack pnpm@12.5.1 …`:
  - tests: `corepack pnpm@12.5.1 exec vitest run`
  - types: `corepack pnpm@12.5.1 exec tsc --noEmit`
  - lint: `corepack pnpm@12.5.1 lint`
  - build: `corepack pnpm@12.5.1 build`
- Vitest globals are **off**. Import `describe, it, expect, vi, beforeEach, afterEach` from `'vitest'`.
- Commit identity and trailer (never change git config):
  `git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "<subject>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`
- No new runtime dependencies.
- RTL: use logical utilities only (`ms-/me-/ps-/pe-/start-/end-/text-start`). Directional icons get `rtl:-scale-x-100`.
- **Final locale list, in this exact order** (code, native name, English name). RTL is `ar` and `he` only:
  - en English · English
  - ar العربية · Arabic
  - he עברית · Hebrew
  - es Español · Spanish
  - pt Português · Portuguese
  - fr Français · French
  - it Italiano · Italian
  - de Deutsch · German
  - pl Polski · Polish
  - ro Română · Romanian
  - el Ελληνικά · Greek
  - ru Русский · Russian
  - uk Українська · Ukrainian
  - hy Հայերեն · Armenian
  - ka ქართული · Georgian
  - am አማርኛ · Amharic
  - hi हिन्दी · Hindi
  - zh 简体中文 · Chinese (Simplified)
  - ja 日本語 · Japanese
  - ko 한국어 · Korean
  - fil Filipino · Filipino
  - id Bahasa Indonesia · Indonesian
- **Translation rules** (UI and database content):
  - Translate every value; never change keys or key order.
  - Keep ICU placeholders such as `{year}` exactly.
  - Write natural, idiomatic, polite/formal-register text suitable for pilgrims. Don't translate word for word.
  - Use the established Christian terminology and church names of that language's Christian community.
  - In running text, translate the brand "Land of Jesus" as its meaning, as `ar.json`/`he.json` already do. The TopBar wordmark stays in English because it is hard-coded.
  - Portuguese is Brazilian. Chinese is Simplified (zh-Hans). Filipino is standard Tagalog-based Filipino.
  - Files are UTF-8 JSON with 2-space indent and a trailing newline. No `\u` escapes.
- **Database content:**
  - `translations` rows are written only by the generator, with `status = 'PUBLISHED'` and `source_locale = 'en'`.
  - English is never inserted into `translations`; it stays in the base columns.
  - Descriptions go to `church_descriptions` (per locale, English included).
- **Fallback chain for every translated database field:** `translations[locale]` → legacy `_ar`/`_he` column (ar/he only) → English column. A blank translation counts as missing.

---

### Task 1: Locale-aware formatting (dates, numbers, weekdays)

**Files:**
- Modify: `src/lib/utils/index.ts` (`formatDate`, `formatNumber`; add `weekdayName`)
- Modify: `src/app/[locale]/churches/[slug]/page.tsx` (opening-hours weekday label)
- Test: `tests/unit/utils/format.test.ts`

**Interfaces:**
- Produces:
  - `formatDate(date: Date | string | null, locale = 'en'): string`
  - `formatNumber(num: number, locale = 'en'): string`
  - `weekdayName(day: string, locale = 'en'): string`: takes an English day key such as `'monday'` and returns the short localized name. Unknown keys come back unchanged.
  - All three accept any BCP 47 locale code (`'uk'`, `'zh'`, `'fil'`, …).

- [ ] **Step 0: Branch**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/many-languages
```

- [ ] **Step 1: Write the failing test**

`tests/unit/utils/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber, weekdayName } from '@/lib/utils';

const MID_JANUARY = new Date(Date.UTC(2025, 0, 15, 12));

describe('formatDate', () => {
  it('formats in any locale, not just en/ar/he', () => {
    expect(formatDate(MID_JANUARY, 'en')).toBe('January 15, 2025');
    expect(formatDate(MID_JANUARY, 'de')).toBe('15. Januar 2025');
    expect(formatDate(MID_JANUARY, 'ru')).toContain('января');
  });

  it('returns an empty string for missing or invalid dates', () => {
    expect(formatDate(null, 'en')).toBe('');
    expect(formatDate('not a date', 'en')).toBe('');
  });
});

describe('formatNumber', () => {
  it('uses the locale separators', () => {
    expect(formatNumber(1234567.5, 'en')).toBe('1,234,567.5');
    expect(formatNumber(1234567.5, 'de')).toBe('1.234.567,5');
  });
});

describe('weekdayName', () => {
  it('localizes English day keys', () => {
    expect(weekdayName('monday', 'en')).toBe('Mon');
    expect(weekdayName('monday', 'de')).toBe('Mo.');
    expect(weekdayName('sunday', 'ru')).toBe('вс');
    expect(weekdayName('monday', 'ja')).toBe('月');
  });

  it('is case-insensitive and leaves unknown keys alone', () => {
    expect(weekdayName('Friday', 'en')).toBe('Fri');
    expect(weekdayName('funday', 'en')).toBe('funday');
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/utils`
Expected: FAIL. `weekdayName` is not exported, and `formatDate(…, 'de')` returns the en-US format because `de` isn't in the old map.

- [ ] **Step 3: Implement**

In `src/lib/utils/index.ts`, replace the whole `formatDate` function and the whole `formatNumber` function with the code below. Leave the rest of the file unchanged.

```ts
/**
 * Format a date for display in the given locale (any BCP 47 code: 'en', 'uk', 'zh', 'fil', …).
 */
export function formatDate(date: Date | string | null, locale = 'en'): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';

  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(dateObj);
}

/**
 * Format a number with the locale's separators.
 */
export function formatNumber(num: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale).format(num);
}

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Short localized weekday name for an English day key ('monday' → 'Mon' / 'пн' / '月').
 * Unknown keys are returned unchanged.
 */
export function weekdayName(day: string, locale = 'en'): string {
  const index = WEEKDAY_INDEX[day.toLowerCase()];
  if (index === undefined) return day;
  // 7 January 2024 was a Sunday; adding the index gives the requested weekday.
  const date = new Date(Date.UTC(2024, 0, 7 + index, 12));
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date);
}
```

In `src/app/[locale]/churches/[slug]/page.tsx`:
- add `weekdayName` to the imports: `import { cn, weekdayName } from '@/lib/utils';`. That line currently imports only `cn`.
- in the opening-hours list, replace
  `<dt className="capitalize text-stone-600">{day.slice(0, 3)}</dt>`
  with
  `<dt className="text-stone-600">{weekdayName(day, locale)}</dt>`

- [ ] **Step 4: Run the test and confirm it passes**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/utils`
Expected: PASS (5 tests).

- [ ] **Step 5: Full suite, types and lint, then commit**

```bash
corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
git add src/lib/utils/index.ts "src/app/[locale]/churches/[slug]/page.tsx" tests/unit/utils
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): locale-aware dates, numbers and weekday names for any locale" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Move remaining hard-coded English into messages, and harden the messages test

**Files:**
- Modify: `messages/en.json`, `messages/ar.json`, `messages/he.json` (new keys, added with a script)
- Modify: `src/app/[locale]/layout.tsx` (add `generateMetadata`)
- Modify: `src/components/explore/ChurchMap.tsx` (popup link text)
- Modify: `src/app/[locale]/explore/ExploreView.tsx` (city filter options)
- Modify: `src/app/[locale]/projects/[slug]/page.tsx` (current-condition text, status, update type)
- Modify: `tests/unit/explore/ChurchMap.test.tsx` (render with intl)
- Replace: `tests/unit/i18n/messages.test.ts`

**Interfaces:**
- Produces these message keys in every locale, used by later tasks and by all translation batches:
  - `Metadata.title`, `Metadata.description`
  - `Explore.viewChurch`, `Explore.cityNazareth`, `Explore.cityBethlehem`, `Explore.cityJerusalem`
  - `Common.searchLanguages`, `Common.noLanguageMatch` (Task 3 uses these)
  - `ProjectProfile.currentConditionBody`
  - `ProjectStatus.{DRAFT, SUBMITTED, INITIAL_REVIEW, DOCUMENTS_REQUIRED, DUE_DILIGENCE, APPROVED, PUBLISHED, FUNDING, FUNDED, IMPLEMENTATION, EVIDENCE_REVIEW, COMPLETED, SUSPENDED, REJECTED, ARCHIVED}`
  - `UpdateType.{milestone, progress, challenge}`
- Produces `tests/unit/i18n/messages.test.ts`. It iterates over **`locales` from `@/lib/i18n/config`**, so every future locale is checked automatically.

- [ ] **Step 1: Replace the messages test**

`tests/unit/i18n/messages.test.ts` (whole file):
```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '@/lib/i18n/config';

type Messages = { [key: string]: string | Messages };

const load = (locale: string): Messages =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as Messages;

function flatten(obj: Messages, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') out[`${prefix}${key}`] = value;
    else Object.assign(out, flatten(value, `${prefix}${key}.`));
  }
  return out;
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

const en = flatten(load('en'));
const enKeys = Object.keys(en).sort();

const REQUIRED_KEYS = [
  'Common.backToTop',
  'Common.language',
  'Common.close',
  'Common.skipToContent',
  'Common.searchLanguages',
  'Common.noLanguageMatch',
  'Navigation.primaryNav',
  'Navigation.footerNav',
  'HomePage.swipeHint',
  'Explore.viewMode',
  'Explore.viewChurch',
  'Explore.cityNazareth',
  'Explore.cityBethlehem',
  'Explore.cityJerusalem',
  'Metadata.title',
  'Metadata.description',
  'ProjectProfile.currentConditionBody',
  'ProjectStatus.APPROVED',
  'ProjectStatus.IMPLEMENTATION',
  'UpdateType.milestone',
  'UpdateType.progress',
];

describe('messages/en.json', () => {
  it.each(REQUIRED_KEYS)('defines %s', (key) => {
    expect(en[key]?.trim()).toBeTruthy();
  });
});

describe.each(locales.filter((l) => l !== 'en'))('messages/%s.json', (locale) => {
  const messages = flatten(load(locale));

  it('has exactly the English keys', () => {
    expect(Object.keys(messages).sort()).toEqual(enKeys);
  });

  it('has no empty strings', () => {
    expect(Object.entries(messages).filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([]);
  });

  it('keeps every ICU placeholder', () => {
    for (const key of enKeys) expect(placeholders(messages[key] ?? ''), key).toEqual(placeholders(en[key]));
  });

  it('is actually translated (at most 15% of strings identical to English)', () => {
    const identical = enKeys.filter((k) => messages[k] === en[k]);
    expect(identical.length / enKeys.length, identical.join(', ')).toBeLessThanOrEqual(0.15);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n`
Expected: FAIL. `defines Common.searchLanguages` fails, and so do the other new keys.

- [ ] **Step 3: Add the keys with a script** (it keeps key order and the files' format)

```bash
node <<'EOF'
const fs = require('fs');
const STATUS = ['DRAFT','SUBMITTED','INITIAL_REVIEW','DOCUMENTS_REQUIRED','DUE_DILIGENCE','APPROVED','PUBLISHED','FUNDING','FUNDED','IMPLEMENTATION','EVIDENCE_REVIEW','COMPLETED','SUSPENDED','REJECTED','ARCHIVED'];
const zip = (values) => Object.fromEntries(STATUS.map((k, i) => [k, values[i]]));
const add = {
  en: {
    Common: { searchLanguages: 'Search languages', noLanguageMatch: 'No matching language' },
    Explore: { viewChurch: 'View church', cityNazareth: 'Nazareth', cityBethlehem: 'Bethlehem', cityJerusalem: 'Jerusalem' },
    ProjectProfile: { currentConditionBody: 'The basilica shows signs of weathering and structural stress after decades of exposure. The facade requires careful cleaning and repointing, while the roof needs waterproofing to prevent water damage to the interior. This restoration will preserve this sacred site for future generations of pilgrims and worshippers.' },
    Metadata: { title: 'Land of Jesus — Where Christian heritage lives', description: 'Discover the living Christian heritage of the Holy Land. Explore churches, sacred places and living Christian communities.' },
    ProjectStatus: zip(['Draft','Submitted','Initial review','Documents required','Due diligence','Approved','Published','Fundraising','Funded','In progress','Evidence review','Completed','Suspended','Rejected','Archived']),
    UpdateType: { milestone: 'Milestone', progress: 'Progress', challenge: 'Challenge' },
  },
  ar: {
    Common: { searchLanguages: 'ابحث عن لغة', noLanguageMatch: 'لا توجد لغة مطابقة' },
    Explore: { viewChurch: 'عرض الكنيسة', cityNazareth: 'الناصرة', cityBethlehem: 'بيت لحم', cityJerusalem: 'القدس' },
    ProjectProfile: { currentConditionBody: 'تظهر على البازيليكا علامات التآكل والإجهاد الإنشائي بعد عقود من التعرض للعوامل الجوية. تحتاج الواجهة إلى تنظيف دقيق وإعادة ترميم الفواصل، بينما يحتاج السقف إلى عزل مائي لمنع تسرب المياه إلى الداخل. سيحافظ هذا الترميم على هذا الموقع المقدس للأجيال القادمة من الحجاج والمصلين.' },
    Metadata: { title: 'أرض يسوع — حيث يعيش التراث المسيحي', description: 'اكتشف التراث المسيحي الحي في الأرض المقدسة. استكشف الكنائس والأماكن المقدسة والمجتمعات المسيحية الحية.' },
    ProjectStatus: zip(['مسودة','مُقدَّم','مراجعة أولية','مستندات مطلوبة','العناية الواجبة','مُعتمَد','منشور','جمع التبرعات','مُموَّل','قيد التنفيذ','مراجعة الأدلة','مكتمل','معلّق','مرفوض','مؤرشف']),
    UpdateType: { milestone: 'إنجاز', progress: 'تقدّم', challenge: 'تحدٍّ' },
  },
  he: {
    Common: { searchLanguages: 'חיפוש שפה', noLanguageMatch: 'לא נמצאה שפה מתאימה' },
    Explore: { viewChurch: 'לצפייה בכנסייה', cityNazareth: 'נצרת', cityBethlehem: 'בית לחם', cityJerusalem: 'ירושלים' },
    ProjectProfile: { currentConditionBody: 'הבזיליקה מראה סימני בלייה ועומס מבני לאחר עשרות שנים של חשיפה לפגעי מזג האוויר. החזית זקוקה לניקוי זהיר ולחידוש המישקים, והגג זקוק לאיטום כדי למנוע נזקי מים לפנים המבנה. שיקום זה ישמר את האתר הקדוש לדורות הבאים של עולי רגל ומתפללים.' },
    Metadata: { title: 'ארץ ישוע — היכן שהמורשת הנוצרית חיה', description: 'גלו את המורשת הנוצרית החיה של ארץ הקודש. חקרו כנסיות, מקומות קדושים וקהילות נוצריות חיות.' },
    ProjectStatus: zip(['טיוטה','הוגש','בדיקה ראשונית','נדרשים מסמכים','בדיקת נאותות','אושר','פורסם','בגיוס כספים','מומן','בביצוע','בדיקת ראיות','הושלם','מושהה','נדחה','בארכיון']),
    UpdateType: { milestone: 'אבן דרך', progress: 'התקדמות', challenge: 'אתגר' },
  },
};
for (const [locale, sections] of Object.entries(add)) {
  const file = `messages/${locale}.json`;
  const messages = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [section, entries] of Object.entries(sections)) messages[section] = { ...(messages[section] ?? {}), ...entries };
  fs.writeFileSync(file, JSON.stringify(messages, null, 2) + '\n');
}
EOF
git diff --stat messages
```
Expected: 3 files changed, only insertions (plus a changed trailing-comma line per section).

- [ ] **Step 4: Use the keys in the code**

a) `src/app/[locale]/layout.tsx`:
- change the `next` type import to `import type { Metadata, Viewport } from 'next';`
- add this export directly after the `viewport` export:
```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return { title: t('title'), description: t('description') };
}
```

b) `src/components/explore/ChurchMap.tsx`:
- add `import { useTranslations } from 'next-intl';` and `import { ArrowRight } from 'lucide-react';` to the imports;
- add `const t = useTranslations('Explore');` as the first line inside `ChurchMap`;
- replace the popup link's content `View church →` with:
```tsx
              {t('viewChurch')}
              <ArrowRight className="ms-1 inline h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
```

c) `tests/unit/explore/ChurchMap.test.tsx`: `ChurchMap` now needs next-intl.
- replace `import { render } from '@testing-library/react';` with `import { renderWithIntl } from '../helpers/intl';`
- replace `render(<ChurchMap churches={[]} />);` with `renderWithIntl(<ChurchMap churches={[]} />);`

d) `src/app/[locale]/explore/ExploreView.tsx`: replace the three hard-coded city options with:
```tsx
                    <option value="nazareth">{t('cityNazareth')}</option>
                    <option value="bethlehem">{t('cityBethlehem')}</option>
                    <option value="jerusalem">{t('cityJerusalem')}</option>
```

e) `src/app/[locale]/projects/[slug]/page.tsx`:
- after `const t = await getTranslations('ProjectProfile');` add:
```ts
  const tStatus = await getTranslations('ProjectStatus');
  const tUpdateType = await getTranslations('UpdateType');
  const statusLabel = tStatus.has(project.status)
    ? tStatus(project.status)
    : project.status.toLowerCase().replace(/_/g, ' ');
  const updateTypeLabel = (type: string) => (tUpdateType.has(type) ? tUpdateType(type) : type);
```
- replace the whole hard-coded paragraph inside the "current condition" card (the `<p …>The basilica shows signs … worshippers.</p>`) with:
```tsx
                <p className="leading-relaxed text-stone-700">{t('currentConditionBody')}</p>
```
- replace `<span className="capitalize">{update.type}</span>` with `<span className="capitalize">{updateTypeLabel(update.type)}</span>`
- replace `{project.status.toLowerCase().replace('_', ' ')}` with `{statusLabel}`

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `corepack pnpm@12.5.1 exec vitest run`
Expected: PASS, with messages tests for `ar` and `he` (4 each) plus 21 required keys.

- [ ] **Step 6: Types, lint and build, then commit**

```bash
corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 build
git add messages src tests
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): translate page titles, map popup, filters, project status and update types" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Language registry English names, sheet search, tab-label overflow guard

**Files:**
- Modify: `src/lib/i18n/config.ts` (add `localeEnglishNames` and `matchesLocaleQuery`)
- Modify: `src/components/layout/LanguageSheet.tsx` (search, secondary English name, pinned header)
- Modify: `src/components/layout/BottomTabBar.tsx` (labels truncate instead of overflowing)
- Test: `tests/unit/i18n/config.test.ts` (new)
- Modify: `tests/unit/layout/LanguageSheet.test.tsx`

**Interfaces:**
- Consumes: `Common.searchLanguages` and `Common.noLanguageMatch` (Task 2).
- Produces:
  - `localeEnglishNames: Record<Locale, string>`
  - `matchesLocaleQuery(locale: Locale, query: string): boolean`. It matches case-insensitively on the native name, the English name, or the code, and an empty query matches everything.
  - Every translation batch adds its locales to `locales`, `localeNames` and `localeEnglishNames`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/i18n/config.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  getDirection,
  localeEnglishNames,
  localeNames,
  locales,
  matchesLocaleQuery,
  rtlLocales,
} from '@/lib/i18n/config';

describe('locale registry', () => {
  it('has unique codes, each with a native and an English name', () => {
    expect(new Set(locales).size).toBe(locales.length);
    for (const l of locales) {
      expect(localeNames[l]?.trim(), l).toBeTruthy();
      expect(localeEnglishNames[l]?.trim(), l).toBeTruthy();
    }
    expect(Object.keys(localeNames).sort()).toEqual([...locales].sort());
    expect(Object.keys(localeEnglishNames).sort()).toEqual([...locales].sort());
  });

  it('starts with English and keeps Arabic and Hebrew as the only RTL languages', () => {
    expect(locales[0]).toBe('en');
    expect([...rtlLocales].sort()).toEqual(['ar', 'he']);
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
  });
});

describe('matchesLocaleQuery', () => {
  it('matches native name, English name or code, case-insensitively', () => {
    expect(matchesLocaleQuery('ar', 'ARAB')).toBe(true);
    expect(matchesLocaleQuery('ar', 'العر')).toBe(true);
    expect(matchesLocaleQuery('he', 'he')).toBe(true);
    expect(matchesLocaleQuery('he', 'arab')).toBe(false);
  });

  it('matches everything for an empty or blank query', () => {
    expect(matchesLocaleQuery('en', '')).toBe(true);
    expect(matchesLocaleQuery('en', '   ')).toBe(true);
  });
});
```

In `tests/unit/layout/LanguageSheet.test.tsx`:
- add `import { locales } from '@/lib/i18n/config';` below the other imports;
- replace the test `'opens a labelled modal listing every locale in its own script, focusing the current one'` with:
```tsx
  it('opens a labelled modal listing every locale in its own script, focusing the current one', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    const dialog = screen.getByRole('dialog', { name: 'Language' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const options = within(dialog)
      .getAllByRole('button')
      .filter((b) => b.hasAttribute('lang'));
    expect(options.map((b) => b.getAttribute('lang'))).toEqual([...locales]);
    const current = within(dialog).getByRole('button', { name: /^English/ });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: /^العربية/ })).toHaveAttribute('dir', 'rtl');
  });

  it('shows the English name under other languages', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    expect(screen.getByRole('button', { name: /^العربية/ })).toHaveTextContent('Arabic');
    expect(screen.getByRole('button', { name: /^English/ }).textContent).toBe('English');
  });

  it('filters languages by native or English name', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search languages' }), { target: { value: 'hebr' } });
    const options = within(screen.getByRole('dialog'))
      .getAllByRole('button')
      .filter((b) => b.hasAttribute('lang'));
    expect(options.map((b) => b.getAttribute('lang'))).toEqual(['he']);
  });

  it('says so when no language matches', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search languages' }), { target: { value: 'xyz' } });
    expect(screen.getByText('No matching language')).toBeInTheDocument();
  });
```
- in `'switches locale and stays on the same page'`, change `{ name: 'العربية' }` to `{ name: /^العربية/ }`;
- in `'does nothing when the current language is chosen'`, change `{ name: 'English' }` to `{ name: /^English/ }`.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n/config.test.ts tests/unit/layout/LanguageSheet.test.tsx`
Expected: FAIL. `localeEnglishNames` and `matchesLocaleQuery` are not exported, and there is no searchbox.

- [ ] **Step 3: Implement**

`src/lib/i18n/config.ts`: add the following after the `localeNames` constant. Keep everything else as is.
```ts
/**
 * English locale names (secondary label + search in the language sheet)
 */
export const localeEnglishNames: Record<Locale, string> = {
  en: 'English',
  ar: 'Arabic',
  he: 'Hebrew',
};

/**
 * Does a language-sheet search query match this locale (native name, English name or code)?
 */
export function matchesLocaleQuery(locale: Locale, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return [localeNames[locale], localeEnglishNames[locale], locale].some((s) => s.toLocaleLowerCase().includes(q));
}
```
Also update the file's header comment line `Supported locales: en (default), ar, he` to `Supported locales: see \`locales\` below (en is the default)`.

`src/components/layout/LanguageSheet.tsx`:
- imports: add `Search` to the lucide import (`import { Check, Globe, Search, X } from 'lucide-react';`). Replace the config import with:
  `import { getDirection, localeEnglishNames, localeNames, locales, matchesLocaleQuery, type Locale } from '@/lib/i18n/config';`
- change `const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';` to
  `const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';`
- after `const titleId = useId();` add `const searchId = useId();` and `const [query, setQuery] = useState('');`
- the trigger's `onClick={() => setOpen(true)}` becomes `onClick={() => { setQuery(''); setOpen(true); }}`
- replace everything inside the dialog panel (from the grabber `<div className="mx-auto mt-2 h-1.5 …` through the closing `</ul>`) with:
```tsx
                <div className="sticky top-0 z-10 bg-linen">
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
                  <div className="relative mx-4 mb-3">
                    <label htmlFor={searchId} className="sr-only">
                      {t('searchLanguages')}
                    </label>
                    <Search
                      className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id={searchId}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('searchLanguages')}
                      autoComplete="off"
                      className="h-10 w-full rounded-control bg-stone-100 pe-3 ps-9 text-base text-night placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                {visibleLocales.length === 0 ? (
                  <p role="status" className="px-5 pb-8 pt-4 text-center text-muted">
                    {t('noLanguageMatch')}
                  </p>
                ) : (
                  <ul className="mx-4 mb-4 divide-y divide-hairline overflow-hidden rounded-control bg-surface">
                    {visibleLocales.map((l) => {
                      const current = l === locale;
                      return (
                        <li key={l}>
                          <button
                            type="button"
                            lang={l}
                            dir={getDirection(l)}
                            aria-current={current ? 'true' : undefined}
                            onClick={() => choose(l)}
                            className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-start text-base text-night transition-colors hover:bg-stone-50 active:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                          >
                            <span className="flex min-w-0 flex-col">
                              <span>{localeNames[l]}</span>
                              {l !== 'en' ? (
                                <span lang="en" dir="ltr" className="text-sm text-muted">
                                  {localeEnglishNames[l]}
                                </span>
                              ) : null}
                            </span>
                            {current ? <Check className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
```
- just before `return (`, add `const visibleLocales = locales.filter((l) => matchesLocaleQuery(l, query));`

`src/components/layout/BottomTabBar.tsx`: long translations (German, Greek, Russian) must not overflow the five equal tabs.
- `<li key={item.href} className="flex-1">` becomes `<li key={item.href} className="min-w-0 flex-1">`
- `<span>{t(item.key)}</span>` becomes `<span className="max-w-full truncate px-0.5">{t(item.key)}</span>`

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `corepack pnpm@12.5.1 exec vitest run`
Expected: PASS, including 4 config tests and 10 LanguageSheet tests.

- [ ] **Step 5: Types and lint, then commit**

```bash
corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
git add src/lib/i18n/config.ts src/components/layout tests/unit/i18n/config.test.ts tests/unit/layout/LanguageSheet.test.tsx
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): searchable language sheet with English names; tab labels never overflow" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Data layer, overlaying database translations on every content field

**Files:**
- Create: `src/lib/data/translate.ts`
- Modify (replace whole file): `src/lib/data/churches.ts`, `src/lib/data/projects.ts`
- Test: `tests/unit/data/translate.test.ts`, `tests/unit/data/mapping.test.ts`

**Interfaces:**
- Consumes: `formatDate(date, locale)` (Task 1).
- Produces, from `src/lib/data/translate.ts`:
  - `type TranslationMap = ReadonlyMap<string, string>`
  - `translationKey(entityType: string, entityId: string, field: string): string`, which returns `` `${entityType}:${entityId}:${field}` ``. The generator (Task 5) uses the same key format.
  - `entityId(row: Record<string, unknown> | undefined | null): string | undefined`
  - `tr(translations, entityType, id, field, fallback): string`
  - `legacyLocalized(locale: string, en: unknown, ar?: unknown, he?: unknown): string`
  - `fetchTranslations(supabase, locale: string, entityIds: string[]): Promise<TranslationMap>`
- Produces, from `churches.ts`: `mapChurch(row, locale: string, translations?)` and `churchEntityIds(row)`, exported for tests. `locale` is a plain string so the tests can use locales (`ru`, `de`) that are registered only later. Also `getChurches` and `getChurchBySlug`, with unchanged signatures.
- Produces, from `projects.ts`: `mapProject(row, locale: string, translations?)` and `projectEntityIds(row)`. Also `getProjects` and `getProjectBySlug`, with unchanged signatures.
- Entity types and fields (these must match the content files in Task 5):

  | entity_type | fields |
  | --- | --- |
  | `church` | `name`, `tradition`, `denomination` |
  | `church_location` | `city`, `country` |
  | `church_visiting_info` | `admission_info`, `accessibility_info` |
  | `denomination` | `name` |
  | `heritage_item` | `title`, `item_type`, `date_period` |
  | `church_update` | `title`, `content` |
  | `project` | `title`, `short_description`, `full_description`, `category` |
  | `project_budget` | `item.<index>` |
  | `project_timeline` | `phase` |
  | `project_update` | `title`, `content` |

- [ ] **Step 1: Write the failing tests**

`tests/unit/data/translate.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import {
  entityId,
  fetchTranslations,
  legacyLocalized,
  tr,
  translationKey,
} from '@/lib/data/translate';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

type Client = Parameters<typeof fetchTranslations>[0];

function fakeClient(result: { data: unknown; error: unknown } | Error) {
  const calls: unknown[][] = [];
  const builder = {
    select: (...args: unknown[]) => (calls.push(['select', ...args]), builder),
    eq: (...args: unknown[]) => (calls.push(['eq', ...args]), builder),
    in: (...args: unknown[]) => {
      calls.push(['in', ...args]);
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    },
  };
  const from = vi.fn((table: string) => (calls.push(['from', table]), builder));
  return { client: { from } as unknown as Client, from, calls };
}

describe('tr', () => {
  const map = new Map([
    [translationKey('church', 'c1', 'name'), 'Храм'],
    [translationKey('church', 'c1', 'blank'), '   '],
  ]);

  it('returns the translation when present', () => {
    expect(tr(map, 'church', 'c1', 'name', 'Church')).toBe('Храм');
  });

  it('falls back when missing, blank, or the entity has no id', () => {
    expect(tr(map, 'church', 'c2', 'name', 'Church')).toBe('Church');
    expect(tr(map, 'church', 'c1', 'blank', 'Church')).toBe('Church');
    expect(tr(map, 'church', undefined, 'name', 'Church')).toBe('Church');
  });
});

describe('legacyLocalized', () => {
  it('uses the Arabic/Hebrew legacy columns only for ar/he and only when non-empty', () => {
    expect(legacyLocalized('ar', 'Church', 'كنيسة', 'כנסייה')).toBe('كنيسة');
    expect(legacyLocalized('he', 'Church', 'كنيسة', 'כנסייה')).toBe('כנסייה');
    expect(legacyLocalized('he', 'Church', 'كنيسة', '')).toBe('Church');
    expect(legacyLocalized('ru', 'Church', 'كنيسة', 'כנסייה')).toBe('Church');
    expect(legacyLocalized('en', null)).toBe('');
  });
});

describe('entityId', () => {
  it('reads the id of a row', () => {
    expect(entityId({ id: 'x1' })).toBe('x1');
    expect(entityId({})).toBeUndefined();
    expect(entityId(undefined)).toBeUndefined();
  });
});

describe('fetchTranslations', () => {
  it('does not query for English or when there are no ids', async () => {
    const { client, from } = fakeClient({ data: [], error: null });
    expect((await fetchTranslations(client, 'en', ['c1'])).size).toBe(0);
    expect((await fetchTranslations(client, 'ru', [])).size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });

  it('queries published rows for the locale and de-duplicated ids, keyed by translationKey', async () => {
    const { client, calls } = fakeClient({
      data: [{ entity_type: 'church', entity_id: 'c1', field: 'name', content: 'Храм' }],
      error: null,
    });
    const map = await fetchTranslations(client, 'ru', ['c1', 'c1', 'l1']);
    expect(map.get(translationKey('church', 'c1', 'name'))).toBe('Храм');
    expect(calls).toEqual([
      ['from', 'translations'],
      ['select', 'entity_type,entity_id,field,content'],
      ['eq', 'locale', 'ru'],
      ['eq', 'status', 'PUBLISHED'],
      ['in', 'entity_id', ['c1', 'l1']],
    ]);
  });

  it('returns an empty map on an error result or a thrown error', async () => {
    expect((await fetchTranslations(fakeClient({ data: null, error: { message: 'x' } }).client, 'ru', ['c1'])).size).toBe(0);
    expect((await fetchTranslations(fakeClient(new Error('network')).client, 'ru', ['c1'])).size).toBe(0);
  });
});
```

`tests/unit/data/mapping.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { churchEntityIds, mapChurch } from '@/lib/data/churches';
import { mapProject, projectEntityIds } from '@/lib/data/projects';

vi.mock('@/lib/supabase/server', () => ({ createSupabaseServerClient: vi.fn() }));

const churchRow = {
  id: 'c1',
  slug: 'basilica-annunciation-nazareth',
  name: 'Basilica of the Annunciation',
  name_ar: 'كنيسة البشارة',
  name_he: 'בזיליקת הבשורה',
  status: 'LISTED',
  church_locations: [{ id: 'l1', city: 'Nazareth', region: 'Northern District', country: 'Israel', latitude: 32.7, longitude: 35.3 }],
  church_visiting_info: [{ id: 'v1', is_open_to_visitors: true, opening_hours: null, admission_info: 'Free admission.', accessibility_info: null }],
  church_descriptions: [
    { locale: 'en', overview: 'EN overview', story: 'EN story', heritage: '', community: 'EN community' },
    { locale: 'ru', overview: 'RU overview', story: 'RU story', heritage: '', community: 'RU community' },
  ],
  heritage_items: [{ id: 'h1', title: 'Annunciation Grotto', title_ar: null, title_he: null, item_type: 'Archaeological Site', date_period: '20th century', is_published: true }],
  church_updates: [{ id: 'u1', title: 'Christmas', title_ar: null, title_he: null, content: 'Join us', published_at: '2025-01-15T12:00:00Z', is_published: true }],
  denominations: { id: 'd1', name: 'Roman Catholic', name_ar: 'الكاثوليكية الرومانية', name_he: 'קתולית רומית' },
  projects: [{ id: 'p1', slug: 'basilica-restoration-phase1', title: 'Basilica Restoration - Phase 1', title_ar: null, title_he: null, is_published: true, project_budgets: [{ total_amount: 100, raised_amount: 25 }] }],
};

const ru = new Map([
  ['church:c1:name', 'Базилика Благовещения'],
  ['church_location:l1:city', 'Назарет'],
  ['denomination:d1:name', 'Римско-католическая церковь'],
  ['church_visiting_info:v1:admission_info', 'Вход свободный.'],
  ['heritage_item:h1:title', 'Грот Благовещения'],
  ['church_update:u1:title', 'Рождество'],
  ['project:p1:title', 'Реставрация базилики — этап 1'],
]);

describe('mapChurch', () => {
  it('overlays translations and falls back to English field by field', () => {
    const c = mapChurch(churchRow, 'ru', ru);
    expect(c.name).toBe('Базилика Благовещения');
    expect(c.location.city).toBe('Назарет');
    expect(c.location.country).toBe('Israel');
    expect(c.tradition).toBe('Римско-католическая церковь');
    expect(c.denomination).toBe('Римско-католическая церковь');
    expect(c.visitingInfo.admission).toBe('Вход свободный.');
    expect(c.visitingInfo.accessibility).toBeNull();
    expect(c.heritageItems[0]).toEqual({ title: 'Грот Благовещения', type: 'Archaeological Site', period: '20th century' });
    expect(c.updates[0].title).toBe('Рождество');
    expect(c.updates[0].content).toBe('Join us');
    expect(c.updates[0].date).toContain('января');
    expect(c.projects[0].title).toBe('Реставрация базилики — этап 1');
    expect(c.description.overview).toBe('RU overview');
  });

  it('uses the legacy Arabic columns when no translation exists', () => {
    const c = mapChurch(churchRow, 'ar');
    expect(c.name).toBe('كنيسة البشارة');
    expect(c.tradition).toBe('الكاثوليكية الرومانية');
    expect(c.description.overview).toBe('EN overview');
  });

  it('stays English for en', () => {
    const c = mapChurch(churchRow, 'en', ru);
    expect(c.name).toBe('Basilica of the Annunciation');
    expect(c.updates[0].date).toBe('January 15, 2025');
  });

  it('collects every translatable id', () => {
    expect(churchEntityIds(churchRow).sort()).toEqual(['c1', 'd1', 'h1', 'l1', 'p1', 'u1', 'v1']);
  });
});

const projectRow = {
  id: 'p1',
  slug: 'basilica-restoration-phase1',
  title: 'Basilica Restoration - Phase 1',
  title_ar: 'ترميم البازيليكا - المرحلة الأولى',
  title_he: 'שיקום הבזיליקה - שלב 1',
  short_description: 'Restoration of the main nave.',
  full_description: 'Full text.',
  category: 'Restoration',
  status: 'APPROVED',
  churches: { id: 'c1', slug: 'basilica-annunciation-nazareth', name: 'Basilica of the Annunciation', name_ar: 'كنيسة البشارة', name_he: 'בזיליקת הבשורה' },
  project_budgets: [{ id: 'b1', total_amount: 250000, raised_amount: 45000, currency: 'USD', budget_items: [{ item: 'Structural assessment', amount: 25000 }, { item: 'Facade cleaning', amount: 80000 }] }],
  project_timelines: [{ id: 't1', phase: 'Assessment', start_date: '2025-01-01', end_date: '2025-03-01', is_completed: true }],
  project_verifications: [],
  project_updates: [{ id: 'pu1', title: 'Assessment Complete', content: 'Done.', update_type: 'milestone', published_at: '2025-01-15T12:00:00Z', is_published: true }],
};

const de = new Map([
  ['project:p1:title', 'Restaurierung der Basilika – Phase 1'],
  ['project:p1:category', 'Restaurierung'],
  ['church:c1:name', 'Verkündigungsbasilika'],
  ['project_budget:b1:item.1', 'Fassadenreinigung'],
  ['project_timeline:t1:phase', 'Bewertung'],
  ['project_update:pu1:title', 'Bewertung abgeschlossen'],
]);

describe('mapProject', () => {
  it('overlays translations and falls back to English field by field', () => {
    const p = mapProject(projectRow, 'de', de);
    expect(p.title).toBe('Restaurierung der Basilika – Phase 1');
    expect(p.category).toBe('Restaurierung');
    expect(p.church?.name).toBe('Verkündigungsbasilika');
    expect(p.shortDescription).toBe('Restoration of the main nave.');
    expect(p.budgetItems.map((i) => i.item)).toEqual(['Structural assessment', 'Fassadenreinigung']);
    expect(p.timelines[0].phase).toBe('Bewertung');
    expect(p.updates[0].title).toBe('Bewertung abgeschlossen');
    expect(p.updates[0].date).toBe('15. Januar 2025');
    expect(p.progress).toBe(18);
  });

  it('uses the legacy Hebrew columns when no translation exists', () => {
    const p = mapProject(projectRow, 'he');
    expect(p.title).toBe('שיקום הבזיליקה - שלב 1');
    expect(p.church?.name).toBe('בזיליקת הבשורה');
  });

  it('collects every translatable id', () => {
    expect(projectEntityIds(projectRow).sort()).toEqual(['b1', 'c1', 'p1', 'pu1', 't1']);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/data`
Expected: FAIL with "Failed to resolve import "@/lib/data/translate"".

- [ ] **Step 3: Implement**

`src/lib/data/translate.ts`:
```ts
import type { createSupabaseServerClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Database content translations for one locale, keyed by translationKey().
 * Rows live in the `translations` table (written by supabase/migrations/006,
 * generated from supabase/content-i18n/*.json). English is never stored there —
 * it stays in each table's own columns.
 */
export type TranslationMap = ReadonlyMap<string, string>;

export const translationKey = (entityType: string, entityId: string, field: string): string =>
  `${entityType}:${entityId}:${field}`;

export function entityId(row: Record<string, unknown> | undefined | null): string | undefined {
  return row && row.id != null ? String(row.id) : undefined;
}

/** The translation for (entity, field), or `fallback` when missing or blank. */
export function tr(
  translations: TranslationMap,
  entityType: string,
  id: string | undefined,
  field: string,
  fallback: string,
): string {
  if (!id) return fallback;
  const value = translations.get(translationKey(entityType, id, field));
  return value && value.trim() ? value : fallback;
}

/** English value, or the legacy `_ar` / `_he` column for Arabic / Hebrew when it is filled. */
export function legacyLocalized(locale: string, en: unknown, ar?: unknown, he?: unknown): string {
  if (locale === 'ar' && typeof ar === 'string' && ar.trim()) return ar;
  if (locale === 'he' && typeof he === 'string' && he.trim()) return he;
  return en == null ? '' : String(en);
}

/**
 * One query for all published translations of the given entities in `locale`.
 * English and empty id lists skip the query; any error yields an empty map so the
 * page still renders (in English).
 */
export async function fetchTranslations(
  supabase: SupabaseServerClient,
  locale: string,
  entityIds: string[],
): Promise<TranslationMap> {
  const ids = [...new Set(entityIds)];
  if (locale === 'en' || ids.length === 0) return new Map();
  try {
    const { data, error } = await supabase
      .from('translations')
      .select('entity_type,entity_id,field,content')
      .eq('locale', locale)
      .eq('status', 'PUBLISHED')
      .in('entity_id', ids);
    if (error || !data) return new Map();
    return new Map(
      (data as Array<Record<string, unknown>>).map((r) => [
        translationKey(String(r.entity_type), String(r.entity_id), String(r.field)),
        String(r.content ?? ''),
      ]),
    );
  } catch {
    return new Map();
  }
}
```

`src/lib/data/churches.ts` (whole file):
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEMO_CHURCHES, getDemoChurch, type DemoChurch } from '@/lib/demo/data';
import type { Locale } from '@/lib/i18n/config';
import { formatDate } from '@/lib/utils';
import { entityId, fetchTranslations, legacyLocalized, tr, type TranslationMap } from './translate';

/**
 * Church data access. Queries the normalized Supabase schema and maps rows to
 * the shared `DemoChurch` shape the pages/components already use. Text fields
 * are overlaid with the locale's rows from `translations` (fallback: legacy
 * _ar/_he column, then English). Falls back to the bundled demo data on any
 * error or when the table is empty, so the site renders whether or not the
 * database is populated.
 */

// Local free-licensed photos by slug (the DB seeds no media_assets yet).
const IMAGE_BY_SLUG: Record<string, string> = {
  'basilica-annunciation-nazareth': '/images/churches/annunciation.jpg',
  'church-nativity-bethlehem': '/images/churches/nativity.jpg',
  'holy-sepulchre-jerusalem': '/images/churches/holy-sepulchre.jpg',
};

const CHURCH_SELECT =
  'id,slug,name,name_ar,name_he,status,' +
  'church_locations(id,city,region,country,latitude,longitude),' +
  'church_visiting_info(id,is_open_to_visitors,opening_hours,admission_info,accessibility_info),' +
  'church_descriptions(locale,overview,story,heritage,community),' +
  'heritage_items(id,title,title_ar,title_he,item_type,date_period,is_published),' +
  'church_updates(id,title,title_ar,title_he,content,published_at,is_published),' +
  'denominations(id,name,name_ar,name_he),' +
  'projects(id,slug,title,title_ar,title_he,is_published,project_budgets(total_amount,raised_amount))';

type Row = Record<string, unknown>;
const first = <T>(v: unknown): T | undefined => (Array.isArray(v) ? (v[0] as T) : (v as T)) ?? undefined;
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown): string => (v == null ? '' : String(v));

/** Ids of every translatable entity in a church row (for one translations query). */
export function churchEntityIds(row: Row): string[] {
  return [
    entityId(row),
    entityId(first<Row>(row.church_locations)),
    entityId(first<Row>(row.church_visiting_info)),
    entityId(first<Row>(row.denominations)),
    ...arr<Row>(row.heritage_items).map(entityId),
    ...arr<Row>(row.church_updates).map(entityId),
    ...arr<Row>(row.projects).map(entityId),
  ].filter((id): id is string => !!id);
}

export function mapChurch(row: Row, locale: string, translations: TranslationMap = new Map()): DemoChurch {
  const tx = (type: string, entity: Row | undefined, field: string, fallback: string) =>
    tr(translations, type, entityId(entity), field, fallback);

  const loc = first<Row>(row.church_locations) ?? {};
  const vi = first<Row>(row.church_visiting_info) ?? {};
  const descriptions = arr<Row>(row.church_descriptions);
  const desc = (descriptions.find((d) => d.locale === locale) ??
    descriptions.find((d) => d.locale === 'en') ??
    descriptions[0] ??
    {}) as Row;
  const denom = first<Row>(row.denominations);
  const denomName = denom ? legacyLocalized(locale, denom.name, denom.name_ar, denom.name_he) : '';
  const slug = String(row.slug);
  const dbProjects = arr<Row>(row.projects).filter((p) => p.is_published);
  const fallback = getDemoChurch(slug);

  return {
    slug,
    name: tx('church', row, 'name', legacyLocalized(locale, row.name, row.name_ar, row.name_he)),
    name_ar: (row.name_ar as string) ?? '',
    name_he: (row.name_he as string) ?? '',
    location: {
      address: '—',
      city: tx('church_location', loc, 'city', str(loc.city)),
      region: str(loc.region),
      country: tx('church_location', loc, 'country', str(loc.country)),
      latitude: Number(loc.latitude) || 0,
      longitude: Number(loc.longitude) || 0,
    },
    tradition: denom
      ? tx('denomination', denom, 'name', denomName)
      : tx('church', row, 'tradition', fallback?.tradition ?? ''),
    denomination: denom
      ? tx('denomination', denom, 'name', denomName)
      : tx('church', row, 'denomination', fallback?.denomination ?? ''),
    status: (row.status as DemoChurch['status']) ?? 'LISTED',
    description: {
      overview: str(desc.overview),
      story: str(desc.story),
      heritage: str(desc.heritage),
      community: str(desc.community),
    },
    visitingInfo: {
      isOpen: (vi.is_open_to_visitors as boolean | null) ?? null,
      hours: (vi.opening_hours as Record<string, string> | null) ?? null,
      admission: vi.admission_info ? tx('church_visiting_info', vi, 'admission_info', str(vi.admission_info)) : null,
      accessibility: vi.accessibility_info
        ? tx('church_visiting_info', vi, 'accessibility_info', str(vi.accessibility_info))
        : null,
    },
    heritageItems: arr<Row>(row.heritage_items)
      .filter((h) => h.is_published)
      .map((h) => ({
        title: tx('heritage_item', h, 'title', legacyLocalized(locale, h.title, h.title_ar, h.title_he)),
        type: tx('heritage_item', h, 'item_type', str(h.item_type)),
        period: tx('heritage_item', h, 'date_period', str(h.date_period)),
      })),
    projects: dbProjects.map((p) => {
      const b = first<Row>(p.project_budgets) ?? {};
      const total = Number(b.total_amount) || 0;
      const raised = Number(b.raised_amount) || 0;
      return {
        slug: String(p.slug),
        title: tx('project', p, 'title', legacyLocalized(locale, p.title, p.title_ar, p.title_he)),
        progress: total ? Math.round((raised / total) * 100) : 0,
        goal: `$${total.toLocaleString()}`,
        status: '',
      };
    }),
    updates: arr<Row>(row.church_updates)
      .filter((u) => u.is_published)
      .map((u) => ({
        title: tx('church_update', u, 'title', legacyLocalized(locale, u.title, u.title_ar, u.title_he)),
        date: u.published_at ? formatDate(String(u.published_at), locale) : '',
        content: tx('church_update', u, 'content', str(u.content)),
      })),
    hasProjects: dbProjects.length > 0,
    image: IMAGE_BY_SLUG[slug] ?? fallback?.image ?? '',
  };
}

export async function getChurches(locale: Locale): Promise<DemoChurch[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('churches')
      .select(CHURCH_SELECT)
      .eq('is_published', true)
      .order('created_at', { ascending: true });
    if (error || !data || data.length === 0) return DEMO_CHURCHES;
    const rows = data as unknown as Row[];
    const translations = await fetchTranslations(supabase, locale, rows.flatMap(churchEntityIds));
    return rows.map((r) => mapChurch(r, locale, translations));
  } catch {
    return DEMO_CHURCHES;
  }
}

export async function getChurchBySlug(slug: string, locale: Locale): Promise<DemoChurch | undefined> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('churches')
      .select(CHURCH_SELECT)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error || !data) return getDemoChurch(slug);
    const row = data as unknown as Row;
    const translations = await fetchTranslations(supabase, locale, churchEntityIds(row));
    return mapChurch(row, locale, translations);
  } catch {
    return getDemoChurch(slug);
  }
}
```

`src/lib/data/projects.ts` (whole file):
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEMO_PROJECTS, getDemoProject, type DemoProject } from '@/lib/demo/data';
import type { Locale } from '@/lib/i18n/config';
import { formatDate } from '@/lib/utils';
import { entityId, fetchTranslations, legacyLocalized, tr, type TranslationMap } from './translate';

/**
 * Project data access — mirrors churches.ts: query Supabase, map to the shared
 * `DemoProject` shape with text overlaid from `translations`, fall back to
 * bundled demo data on error/empty.
 */

const PROJECT_SELECT =
  'id,slug,title,title_ar,title_he,short_description,full_description,category,status,' +
  'churches(id,slug,name,name_ar,name_he),' +
  'project_budgets(id,total_amount,raised_amount,currency,budget_items),' +
  'project_timelines(id,phase,start_date,end_date,is_completed),' +
  'project_verifications(status,verification_type,reviewed_at),' +
  'project_updates(id,title,content,update_type,published_at,is_published)';

type Row = Record<string, unknown>;
const first = <T>(v: unknown): T | undefined => (Array.isArray(v) ? (v[0] as T) : (v as T)) ?? undefined;
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown): string => (v == null ? '' : String(v));

/** Ids of every translatable entity in a project row (for one translations query). */
export function projectEntityIds(row: Row): string[] {
  return [
    entityId(row),
    entityId(first<Row>(row.churches)),
    entityId(first<Row>(row.project_budgets)),
    ...arr<Row>(row.project_timelines).map(entityId),
    ...arr<Row>(row.project_updates).map(entityId),
  ].filter((id): id is string => !!id);
}

export function mapProject(row: Row, locale: string, translations: TranslationMap = new Map()): DemoProject {
  const tx = (type: string, entity: Row | undefined, field: string, fallback: string) =>
    tr(translations, type, entityId(entity), field, fallback);

  const b = first<Row>(row.project_budgets) ?? {};
  const church = first<Row>(row.churches);
  const ver = first<Row>(row.project_verifications);
  const total = Number(b.total_amount) || 0;
  const raised = Number(b.raised_amount) || 0;
  const budgetItems = Array.isArray(b.budget_items) ? (b.budget_items as Row[]) : [];

  return {
    slug: String(row.slug),
    title: tx('project', row, 'title', legacyLocalized(locale, row.title, row.title_ar, row.title_he)),
    title_ar: (row.title_ar as string) ?? '',
    title_he: (row.title_he as string) ?? '',
    church: church
      ? {
          slug: String(church.slug),
          name: tx('church', church, 'name', legacyLocalized(locale, church.name, church.name_ar, church.name_he)),
        }
      : null,
    shortDescription: tx('project', row, 'short_description', str(row.short_description)),
    fullDescription: tx('project', row, 'full_description', str(row.full_description)),
    category: tx('project', row, 'category', str(row.category)),
    status: str(row.status),
    budget: { total, raised, currency: (b.currency as string) ?? 'USD' },
    progress: total ? Math.round((raised / total) * 100) : 0,
    timelines: arr<Row>(row.project_timelines).map((t) => ({
      phase: tx('project_timeline', t, 'phase', str(t.phase)),
      startDate: str(t.start_date),
      endDate: str(t.end_date),
      completed: !!t.is_completed,
    })),
    budgetItems: budgetItems.map((i, index) => ({
      item: tx('project_budget', b, `item.${index}`, str(i.item)),
      amount: Number(i.amount) || 0,
    })),
    verification: {
      status: (ver?.status as string) ?? '',
      type: (ver?.verification_type as string) ?? '',
      reviewedAt: (ver?.reviewed_at as string) ?? '',
    },
    updates: arr<Row>(row.project_updates)
      .filter((u) => u.is_published)
      .map((u) => ({
        title: tx('project_update', u, 'title', str(u.title)),
        content: tx('project_update', u, 'content', str(u.content)),
        type: (u.update_type as string) ?? '',
        date: u.published_at ? formatDate(String(u.published_at), locale) : '',
      })),
  };
}

export async function getProjects(locale: Locale): Promise<DemoProject[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('is_published', true)
      .order('created_at', { ascending: true });
    if (error || !data || data.length === 0) return DEMO_PROJECTS;
    const rows = data as unknown as Row[];
    const translations = await fetchTranslations(supabase, locale, rows.flatMap(projectEntityIds));
    return rows.map((r) => mapProject(r, locale, translations));
  } catch {
    return DEMO_PROJECTS;
  }
}

export async function getProjectBySlug(slug: string, locale: Locale): Promise<DemoProject | undefined> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    if (error || !data) return getDemoProject(slug);
    const row = data as unknown as Row;
    const translations = await fetchTranslations(supabase, locale, projectEntityIds(row));
    return mapProject(row, locale, translations);
  } catch {
    return getDemoProject(slug);
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/data`
Expected: PASS (14 tests).

- [ ] **Step 5: Full suite, types, lint and build, then a live check**

Run: `corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 build`
Expected: all PASS.

Then start `corepack pnpm@12.5.1 start -p 3100` in the background and check the pages with curl:
- `curl -s http://localhost:3100/en/churches/basilica-annunciation-nazareth` returns 200 and contains `Basilica of the Annunciation`.
- `curl -s http://localhost:3100/ar/churches/basilica-annunciation-nazareth` contains `كنيسة البشارة`. The legacy column still works because the `translations` table is empty until Task 5's SQL is run.

Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src/lib/data tests/unit/data
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): overlay database translations on church and project content" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Translated content source files, SQL generator and seed (en, ar, he)

**Files:**
- Create: `supabase/content-i18n/en.json`, `supabase/content-i18n/ar.json`, `supabase/content-i18n/he.json`
- Create: `scripts/build-content-sql.mjs`
- Create (generated): `supabase/migrations/006_translations_content.sql`
- Modify: `package.json` (add the `content:sql` script)
- Modify: `docs/DEPLOY.md` (mention 006)
- Test: `tests/unit/content/content-sql.test.ts`, `tests/unit/content/content-i18n.test.ts`

**Interfaces:**
- Consumes: key format `entity_type:entity_id:field` and the entity/field table from Task 4. Also `locales` from config.
- Produces the content file shape that every translation batch fills in:
  ```json
  {
    "fields": { "<entity_type>:<entity_id>:<field>": "<text>", "...": "..." },
    "descriptions": { "<church_id>": { "overview": "…", "story": "…", "community": "…" } }
  }
  ```
  `en.json` is the source: every other locale must have exactly its `fields` keys and `descriptions` church ids.
- Produces from `scripts/build-content-sql.mjs`:
  - `sqlString(value): string`
  - `parseKey(key): { entityType, entityId, field }`
  - `buildContentSql(files: Record<locale, ContentFile>): string`
  - `readContentFiles(root?): Record<locale, ContentFile>`
  - `CONTENT_DIR`, `OUTPUT_FILE`
- Command: `corepack pnpm@12.5.1 content:sql` regenerates the SQL. Every batch runs it.

- [ ] **Step 1: Write the failing tests**

`tests/unit/content/content-sql.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { buildContentSql, parseKey, sqlString } from '../../../scripts/build-content-sql.mjs';

describe('sqlString', () => {
  it('quotes and escapes single quotes', () => {
    expect(sqlString("Saint Peter's")).toBe("'Saint Peter''s'");
  });
});

describe('parseKey', () => {
  it('splits entity type, id and a dotted field', () => {
    expect(parseKey('project_budget:c0cc6e00-2657-4be2-8f20-29faf38a448d:item.2')).toEqual({
      entityType: 'project_budget',
      entityId: 'c0cc6e00-2657-4be2-8f20-29faf38a448d',
      field: 'item.2',
    });
  });

  it('rejects malformed keys', () => {
    expect(() => parseKey('church:only-two')).toThrow(/Bad content key/);
  });
});

describe('buildContentSql', () => {
  const files = {
    en: {
      fields: { 'church:c1:name': 'Basilica' },
      descriptions: { c1: { overview: 'EN o', story: 'EN s', community: 'EN c' } },
    },
    ru: {
      fields: { 'church:c1:name': "Храм Петра'" },
      descriptions: { c1: { overview: 'RU o', story: 'RU s', community: 'RU c' } },
    },
  };
  const sql = buildContentSql(files);

  it('wraps everything in one transaction', () => {
    expect(sql.startsWith('-- 006')).toBe(true);
    expect(sql).toContain('BEGIN;');
    expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true);
  });

  it('upserts published translations for non-English locales only', () => {
    expect(sql).toContain(
      "INSERT INTO translations (entity_type, entity_id, field, locale, content, status, source_locale) VALUES ('church', 'c1', 'name', 'ru', 'Храм Петра''', 'PUBLISHED', 'en') ON CONFLICT (entity_type, entity_id, field, locale) DO UPDATE SET content = EXCLUDED.content, status = 'PUBLISHED', updated_at = NOW();",
    );
    expect(sql).not.toContain("'name', 'en'");
  });

  it('upserts descriptions for every locale, English included', () => {
    expect(sql).toContain(
      "INSERT INTO church_descriptions (church_id, locale, overview, story, community) VALUES ('c1', 'en', 'EN o', 'EN s', 'EN c') ON CONFLICT (church_id, locale) DO UPDATE SET overview = EXCLUDED.overview, story = EXCLUDED.story, community = EXCLUDED.community;",
    );
    expect(sql).toContain("VALUES ('c1', 'ru', 'RU o', 'RU s', 'RU c')");
  });

  it('is deterministic (English first, then locales alphabetically)', () => {
    expect(buildContentSql({ ru: files.ru, en: files.en })).toBe(sql);
    expect(sql.indexOf('-- en')).toBeLessThan(sql.indexOf('-- ru'));
  });
});
```

`tests/unit/content/content-i18n.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '@/lib/i18n/config';
import { OUTPUT_FILE, buildContentSql, readContentFiles } from '../../../scripts/build-content-sql.mjs';

type ContentFile = {
  fields: Record<string, string>;
  descriptions: Record<string, { overview: string; story: string; community: string }>;
};

const files = readContentFiles() as Record<string, ContentFile>;
const en = files.en;
const CHURCH_IDS = [
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
];

describe('supabase/content-i18n', () => {
  it('has a file for every site locale and nothing else', () => {
    expect(Object.keys(files).sort()).toEqual([...locales].sort());
  });

  it('describes all three churches in English', () => {
    expect(Object.keys(en.descriptions).sort()).toEqual(CHURCH_IDS);
  });

  it('keeps the committed SQL in sync with the content files', () => {
    const committed = readFileSync(resolve(process.cwd(), OUTPUT_FILE), 'utf8').replace(/\r\n/g, '\n');
    expect(committed).toBe(buildContentSql(files));
  });
});

describe.each(locales.filter((l) => l !== 'en'))('supabase/content-i18n/%s.json', (locale) => {
  const file = files[locale];

  it('has exactly the English field keys and churches', () => {
    expect(Object.keys(file.fields).sort()).toEqual(Object.keys(en.fields).sort());
    expect(Object.keys(file.descriptions).sort()).toEqual(Object.keys(en.descriptions).sort());
  });

  it('has no empty text', () => {
    const empty = Object.entries(file.fields).filter(([, v]) => !v.trim()).map(([k]) => k);
    for (const [id, d] of Object.entries(file.descriptions)) {
      for (const [k, v] of Object.entries(d)) if (!v.trim()) empty.push(`${id}.${k}`);
    }
    expect(empty).toEqual([]);
  });

  it('is actually translated (at most 30% of fields identical to English)', () => {
    const keys = Object.keys(en.fields);
    const identical = keys.filter((k) => file.fields[k] === en.fields[k]);
    expect(identical.length / keys.length, identical.join(', ')).toBeLessThanOrEqual(0.3);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/content`
Expected: FAIL with "Failed to resolve import "../../../scripts/build-content-sql.mjs"".

- [ ] **Step 3: Write the generator**

`scripts/build-content-sql.mjs`:
```js
/**
 * Builds supabase/migrations/006_translations_content.sql from the translated
 * database content in supabase/content-i18n/{locale}.json.
 *
 *   corepack pnpm@12.5.1 content:sql
 *
 * The output is idempotent (upserts) and safe to re-run in the Supabase SQL
 * editor. English stays in each table's own columns; only church descriptions
 * are written for English.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const CONTENT_DIR = 'supabase/content-i18n';
export const OUTPUT_FILE = 'supabase/migrations/006_translations_content.sql';

/** A Postgres string literal. */
export function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** "entity_type:entity_id:field" → parts (the field may contain dots, e.g. "item.2"). */
export function parseKey(key) {
  const [entityType, entityId, ...rest] = key.split(':');
  const field = rest.join(':');
  if (!entityType || !entityId || !field) throw new Error(`Bad content key: ${key}`);
  return { entityType, entityId, field };
}

/** SQL for all locales: English first, then the rest alphabetically. */
export function buildContentSql(files) {
  const locales = Object.keys(files).sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
  const lines = [
    '-- 006: translated church & project content (generated by scripts/build-content-sql.mjs from supabase/content-i18n — do not edit by hand).',
    '-- Safe to re-run: every statement is an upsert.',
    'BEGIN;',
    '',
  ];
  for (const locale of locales) {
    const { fields = {}, descriptions = {} } = files[locale];
    lines.push(`-- ${locale}`);
    for (const [churchId, d] of Object.entries(descriptions).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(
        `INSERT INTO church_descriptions (church_id, locale, overview, story, community) VALUES (${sqlString(churchId)}, ${sqlString(locale)}, ${sqlString(d.overview)}, ${sqlString(d.story)}, ${sqlString(d.community)})` +
          ' ON CONFLICT (church_id, locale) DO UPDATE SET overview = EXCLUDED.overview, story = EXCLUDED.story, community = EXCLUDED.community;',
      );
    }
    if (locale !== 'en') {
      for (const [key, content] of Object.entries(fields).sort(([a], [b]) => a.localeCompare(b))) {
        const { entityType, entityId, field } = parseKey(key);
        lines.push(
          `INSERT INTO translations (entity_type, entity_id, field, locale, content, status, source_locale) VALUES (${sqlString(entityType)}, ${sqlString(entityId)}, ${sqlString(field)}, ${sqlString(locale)}, ${sqlString(content)}, 'PUBLISHED', 'en')` +
            " ON CONFLICT (entity_type, entity_id, field, locale) DO UPDATE SET content = EXCLUDED.content, status = 'PUBLISHED', updated_at = NOW();",
        );
      }
    }
    lines.push('');
  }
  lines.push('COMMIT;', '');
  return lines.join('\n');
}

/** Every supabase/content-i18n/{locale}.json, keyed by locale. */
export function readContentFiles(root = process.cwd()) {
  const dir = resolve(root, CONTENT_DIR);
  return Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(dir, f), 'utf8'))]),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  writeFileSync(resolve(process.cwd(), OUTPUT_FILE), buildContentSql(readContentFiles()));
  process.stdout.write(`wrote ${OUTPUT_FILE}\n`);
}
```

`package.json`: add to `"scripts"` after `"test": "vitest run"`:
```json
    "test": "vitest run",
    "content:sql": "node scripts/build-content-sql.mjs"
```

- [ ] **Step 4: Write the English source file**

`supabase/content-i18n/en.json`: the live database text, plus new descriptions for churches 2 and 3, which have none today. Write it exactly as below.
```json
{
  "fields": {
    "church:10000000-0000-0000-0000-000000000001:name": "Basilica of the Annunciation",
    "church:10000000-0000-0000-0000-000000000002:name": "Church of the Nativity",
    "church:10000000-0000-0000-0000-000000000003:name": "Church of the Holy Sepulchre",
    "church:10000000-0000-0000-0000-000000000003:tradition": "Multiple traditions",
    "church:10000000-0000-0000-0000-000000000003:denomination": "Shared custody (Status Quo)",
    "church_location:6ffdfa99-c891-497d-95b6-c31c1871edb0:city": "Nazareth",
    "church_location:6ffdfa99-c891-497d-95b6-c31c1871edb0:country": "Israel",
    "church_location:ccf9bbf7-269f-4ef4-9ca5-316722c6912b:city": "Bethlehem",
    "church_location:ccf9bbf7-269f-4ef4-9ca5-316722c6912b:country": "Palestine",
    "church_location:7640808e-d414-4487-84c0-5358c46481a7:city": "Jerusalem",
    "church_location:7640808e-d414-4487-84c0-5358c46481a7:country": "Israel",
    "church_visiting_info:89ec3b57-4387-4c24-8ee4-c72083195c07:admission_info": "Free admission. Guided tours available.",
    "church_visiting_info:89ec3b57-4387-4c24-8ee4-c72083195c07:accessibility_info": "Wheelchair accessible entrance available.",
    "church_visiting_info:34a96c2a-68fd-4a37-8df7-ede5a4d02b7e:admission_info": "Free admission. Dress code enforced.",
    "church_visiting_info:ade66480-3d19-4e93-a149-4f796bdeb466:admission_info": "Free admission. Security check required.",
    "church_visiting_info:ade66480-3d19-4e93-a149-4f796bdeb466:accessibility_info": "Limited accessibility due to historic structure.",
    "denomination:6f2d792b-f27f-4444-89ac-641e2d2a4f13:name": "Roman Catholic",
    "denomination:0db1eb82-d58b-47fb-9380-6c1b4ffb4500:name": "Greek Orthodox",
    "denomination:97ee35d5-05a9-43fc-9e89-df4355769b2c:name": "Armenian Apostolic",
    "denomination:b1a58480-2cba-4466-8112-dd76a9539c40:name": "Maronite",
    "denomination:7aec87c6-13da-4804-880d-656a13e22679:name": "Anglican",
    "denomination:6ce83261-cfe6-492b-bce7-6f1ff925f17f:name": "Lutheran",
    "denomination:2872bb10-4bcb-4020-8756-50c3a68bfde1:name": "Roman Catholic",
    "denomination:583fb75e-c251-4394-8ad2-4963162efb30:name": "Greek Orthodox",
    "denomination:b5cc5a2b-d121-4745-9742-ca75349f2cd8:name": "Armenian Apostolic",
    "heritage_item:430318b0-2404-4a94-a591-a127cc2be370:title": "Annunciation Grotto",
    "heritage_item:430318b0-2404-4a94-a591-a127cc2be370:item_type": "Archaeological Site",
    "heritage_item:430318b0-2404-4a94-a591-a127cc2be370:date_period": "1st century (traditional)",
    "heritage_item:de95fbf6-d9a4-460d-be59-9ae2672d8d64:title": "Bronze Statue of Gabriel",
    "heritage_item:de95fbf6-d9a4-460d-be59-9ae2672d8d64:item_type": "Artwork",
    "heritage_item:de95fbf6-d9a4-460d-be59-9ae2672d8d64:date_period": "20th century",
    "church_update:ba05a1f8-57a8-428d-955b-849cafe8e2d7:title": "Christmas Celebrations 2025",
    "church_update:ba05a1f8-57a8-428d-955b-849cafe8e2d7:content": "Join us for special Christmas masses and celebrations. Schedule available on our website.",
    "church_update:c9d47aef-6caf-43fc-bb95-ac3ea1c0fca9:title": "Restoration Project Update",
    "church_update:c9d47aef-6caf-43fc-bb95-ac3ea1c0fca9:content": "Phase 1 of our restoration project has begun. Thank you for your support.",
    "project:20000000-0000-0000-0000-000000000001:title": "Basilica Restoration - Phase 1",
    "project:20000000-0000-0000-0000-000000000001:short_description": "Restoration of the main nave and facade of the Basilica of the Annunciation.",
    "project:20000000-0000-0000-0000-000000000001:full_description": "This project focuses on the critical restoration needs of the basilica, including structural repairs, cleaning of the facade, and preservation of original architectural elements. The work will ensure the building remains safe and accessible for future generations.",
    "project:20000000-0000-0000-0000-000000000001:category": "Restoration",
    "project:20000000-0000-0000-0000-000000000002:title": "Holy Land Heritage Documentation",
    "project:20000000-0000-0000-0000-000000000002:short_description": "Digital documentation of Christian heritage sites across the Holy Land.",
    "project:20000000-0000-0000-0000-000000000002:full_description": "A comprehensive initiative to photograph, scan, and document Christian heritage sites, artifacts, and manuscripts throughout Israel and surrounding regions. This digital archive will preserve invaluable historical records for researchers and future generations.",
    "project:20000000-0000-0000-0000-000000000002:category": "Documentation",
    "project_budget:c0cc6e00-2657-4be2-8f20-29faf38a448d:item.0": "Structural assessment",
    "project_budget:c0cc6e00-2657-4be2-8f20-29faf38a448d:item.1": "Facade cleaning",
    "project_budget:c0cc6e00-2657-4be2-8f20-29faf38a448d:item.2": "Stone repair",
    "project_budget:c0cc6e00-2657-4be2-8f20-29faf38a448d:item.3": "Roof waterproofing",
    "project_budget:c8ade19f-c3e6-4888-aba3-eae30d9d2cc7:item.0": "Photography equipment",
    "project_budget:c8ade19f-c3e6-4888-aba3-eae30d9d2cc7:item.1": "3D scanning",
    "project_budget:c8ade19f-c3e6-4888-aba3-eae30d9d2cc7:item.2": "Archive platform",
    "project_budget:c8ade19f-c3e6-4888-aba3-eae30d9d2cc7:item.3": "Personnel",
    "project_timeline:89e6e629-f814-4110-aedb-596c86a0a274:phase": "Assessment",
    "project_timeline:f9a32782-9a17-4495-a171-1ada0b35e23c:phase": "Facade Work",
    "project_timeline:4cfdc838-0e12-4be6-8b3f-4059e1f852f0:phase": "Interior Restoration",
    "project_timeline:cb06d699-4cf9-476e-9bf8-50725b111a77:phase": "Planning",
    "project_timeline:113367d8-7c0b-4813-ba40-13bc6a340bba:phase": "Field Documentation",
    "project_timeline:cb46e693-83d4-46d7-8a89-e249e43e39e9:phase": "Platform Development",
    "project_update:593f2031-2c23-4d15-86c5-7487a8296b4f:title": "Assessment Complete",
    "project_update:593f2031-2c23-4d15-86c5-7487a8296b4f:content": "The structural assessment phase has been completed successfully. Engineers have identified key areas requiring attention.",
    "project_update:ee7631c8-fb98-4e45-b8ea-9fa78251cd23:title": "First 50 Sites Documented",
    "project_update:ee7631c8-fb98-4e45-b8ea-9fa78251cd23:content": "We have successfully documented our first 50 heritage sites with high-resolution photography and 3D scans."
  },
  "descriptions": {
    "10000000-0000-0000-0000-000000000001": {
      "overview": "The Basilica of the Annunciation is a Catholic church in Nazareth, Israel. It is one of the largest churches in the Middle East and marks the traditional site where the Archangel Gabriel announced to Mary that she would bear Jesus.",
      "story": "The current basilica was built in 1969, designed by Italian architect Giovanni Muzio. It stands over the ruins of earlier Byzantine and Crusader churches. The site has been a place of Christian pilgrimage since ancient times.",
      "community": "The church serves the local Catholic community in Nazareth and welcomes pilgrims from around the world. Regular masses are held in multiple languages."
    },
    "10000000-0000-0000-0000-000000000002": {
      "overview": "The Church of the Nativity in Bethlehem stands over the grotto that Christian tradition has honoured since the 2nd century as the birthplace of Jesus. It is one of the oldest continuously used churches in the world and a UNESCO World Heritage Site.",
      "story": "The first basilica was commissioned by Emperor Constantine and his mother Helena around 327 AD. After it was damaged in the 6th century, Emperor Justinian rebuilt it on a larger scale, and much of today's church dates from that rebuilding. Crusader-era mosaics and painted columns still survive inside.",
      "community": "The church is shared by the Greek Orthodox, Roman Catholic (Franciscan) and Armenian Apostolic communities under the historic Status Quo arrangement. Local Christian families of Bethlehem worship here alongside pilgrims from around the world, especially at Christmas."
    },
    "10000000-0000-0000-0000-000000000003": {
      "overview": "The Church of the Holy Sepulchre in the Old City of Jerusalem contains the two holiest sites of Christianity: Golgotha, where Jesus was crucified, and the tomb where he was buried and rose again, according to tradition.",
      "story": "Emperor Constantine built the first church here in the 4th century; it was dedicated in 335 AD. It was destroyed in 1009 and rebuilt in the 11th century, and the Crusaders gave it much of its present form in the 12th century. The Edicule over the tomb was restored in 2016–2017.",
      "community": "Care of the church is shared by the Greek Orthodox, Roman Catholic (Franciscan) and Armenian Apostolic churches, with the Coptic, Ethiopian and Syriac Orthodox communities also holding chapels, under the Status Quo of 1852. Its doors are opened each morning by Muslim families who have kept the keys for centuries."
    }
  }
}
```

- [ ] **Step 5: Write the Arabic and Hebrew content files**

Create `supabase/content-i18n/ar.json` and `supabase/content-i18n/he.json`. Each has exactly the same `fields` keys and `descriptions` church ids as `en.json`, with every value in that language. Follow the translation rules in Global Constraints.

**Reuse the text already in the database wherever it exists; don't retranslate it.**
- `church:<id>:name`: the `name_ar` / `name_he` values:

  | church id | ar | he |
  | --- | --- | --- |
  | …0001 | كنيسة البشارة | בזיליקת הבשורה |
  | …0002 | كنيسة المهد | כנסיית המולד |
  | …0003 | كنيسة القيامة | כנסיית הקבר |

- `denomination:<id>:name`: the `name_ar` / `name_he` values:

  | id | ar | he |
  | --- | --- | --- |
  | 6f2d792b… | الكاثوليكية الرومانية | קתולית רומית |
  | 0db1eb82… | الروم الأرثوذكس | יווני אורתודוקסי |
  | 97ee35d5… | الأرمن الأرثوذكس | ארמני אפוסטולי |
  | b1a58480… | الموارنة | מרוני |
  | 7aec87c6… | الأنجليكان | אנגליקני |
  | 6ce83261… | اللوثرية | לותרני |
  | 2872bb10… | روم كاثوليك | קתולי רומי |
  | 583fb75e… | روم أرثوذكس | יווני אורתודוקסי |
  | b5cc5a2b… | أرمن أرثوذكس | ארמני אפוסטולי |

- `heritage_item:<id>:title`:

  | id | ar | he |
  | --- | --- | --- |
  | 430318b0… | مغارة البشارة | מערת הבשורה |
  | de95fbf6… | تمثال برونزي لجبرائيل | פסל ברונזה של גבריאל |

- `church_update:<id>:title`:

  | id | ar | he |
  | --- | --- | --- |
  | ba05a1f8… | احتفالات عيد الميلاد 2025 | חגיגות חג המולד 2025 |
  | c9d47aef… | تحديث مشروع الترميم | עדכון פרויקט השיקום |

- `project:<id>:title`:

  | id | ar | he |
  | --- | --- | --- |
  | 2…01 | ترميم البازيليكا - المرحلة الأولى | שיקום הבזיליקה - שלב 1 |
  | 2…02 | توثيق تراث الأرض المقدسة | תיעוד מורשת ארץ הקודש |

- Church 1's description (`10000000-0000-0000-0000-000000000001`, overview/story/community): copy the existing rows from the live database. Fetch them with:
  ```bash
  U=$(grep '^NEXT_PUBLIC_SUPABASE_URL' .env.local | cut -d= -f2- | tr -d '\r"'); K=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY' .env.local | cut -d= -f2- | tr -d '\r"')
  curl -s "$U/rest/v1/church_descriptions?select=locale,overview,story,community&church_id=eq.10000000-0000-0000-0000-000000000001" -H "apikey: $K" -H "Authorization: Bearer $K"
  ```

**Translate every other value** (cities, countries, the Holy Sepulchre tradition/denomination, visiting info, heritage type/period, update contents, project descriptions/categories, budget items, phases, project updates, and the church 2 and church 3 descriptions) into natural Arabic and natural Hebrew. Use the conventional place names:
- Arabic: الناصرة، بيت لحم، القدس، إسرائيل، فلسطين
- Hebrew: נצרת, בית לחם, ירושלים, ישראל, פלסטין

- [ ] **Step 6: Generate the SQL and run the tests**

```bash
corepack pnpm@12.5.1 content:sql
corepack pnpm@12.5.1 exec vitest run tests/unit/content
```
Expected: `wrote supabase/migrations/006_translations_content.sql`, then PASS: 7 generator tests, plus 3 file tests and 3 × 2 locale tests.

Sanity-check the SQL:
```bash
grep -c "INSERT INTO translations" supabase/migrations/006_translations_content.sql
grep -c "INSERT INTO church_descriptions" supabase/migrations/006_translations_content.sql
```
Expected: `122` translation rows (61 fields × ar, he) and `9` description rows (3 churches × en, ar, he).

- [ ] **Step 7: Document**

In `docs/DEPLOY.md`, change the sentence "Real data appears once `supabase/APPLY_ALL.sql` (and `005_public_read_fix.sql`) have been run in the Supabase project." to:
```md
Real data appears once `supabase/APPLY_ALL.sql` (and `005_public_read_fix.sql`) have been run in the Supabase project. Translated church/project content for all site languages comes from `supabase/migrations/006_translations_content.sql` — generated by `corepack pnpm@12.5.1 content:sql` from `supabase/content-i18n/*.json`; re-run it in the SQL editor whenever those files change (it only upserts).
```

- [ ] **Step 8: Full suite, types and lint, then commit**

```bash
corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
git add scripts supabase/content-i18n supabase/migrations/006_translations_content.sql package.json docs/DEPLOY.md tests/unit/content
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): translated content sources + SQL generator (en/ar/he) and 006 seed" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Language batch 1 (Spanish, Portuguese, French, Italian)

**Files:**
- Modify: `src/lib/i18n/config.ts` (`locales`, `localeNames`, `localeEnglishNames`)
- Create: `messages/es.json`, `messages/pt.json`, `messages/fr.json`, `messages/it.json`
- Create: `supabase/content-i18n/es.json`, `pt.json`, `fr.json`, `it.json`
- Modify (generated): `supabase/migrations/006_translations_content.sql`

**Interfaces:**
- Consumes:
  - `messages/en.json` (source of all UI keys, from Task 2);
  - `supabase/content-i18n/en.json` (source of all content, from Task 5);
  - `corepack pnpm@12.5.1 content:sql`;
  - the tests `tests/unit/i18n/messages.test.ts`, `tests/unit/i18n/config.test.ts` and `tests/unit/content/content-i18n.test.ts`. They iterate over `locales`, so they fail until every file below exists and is complete.

- [ ] **Step 1: Register the locales, which makes the tests fail**

In `src/lib/i18n/config.ts`, extend the three constants:
```ts
export const locales = ['en', 'ar', 'he', 'es', 'pt', 'fr', 'it'] as const;
```
```ts
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  he: 'עברית',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  it: 'Italiano',
};
```
```ts
export const localeEnglishNames: Record<Locale, string> = {
  en: 'English',
  ar: 'Arabic',
  he: 'Hebrew',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  it: 'Italian',
};
```
Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n tests/unit/content`
Expected: FAIL. The message and content files for es/pt/fr/it are missing (ENOENT, or "has a file for every site locale").

- [ ] **Step 2: Translate the UI**

For each of `es`, `pt`, `fr` and `it`, create `messages/<code>.json` as a translation of `messages/en.json`. Keep the same keys in the same order and translate every value. Follow the translation rules in Global Constraints: keep `{year}`, write natural and polite text, and use Brazilian Portuguese. Check `messages/ar.json` for how context-dependent strings were handled (the brand in running text, tab labels).

Keep bottom-tab labels (`Navigation.home|explore|projects|stories|visit`) to about 12 characters. They sit in 5 narrow tabs and are truncated beyond that.

- [ ] **Step 3: Translate the database content**

For each of `es`, `pt`, `fr` and `it`, create `supabase/content-i18n/<code>.json` from `supabase/content-i18n/en.json`. It needs the same `fields` keys and `descriptions` church ids, with every value translated.

Use the established church names:

| | Annunciation (…0001) | Nativity (…0002) | Holy Sepulchre (…0003) |
| --- | --- | --- | --- |
| es | Basílica de la Anunciación | Basílica de la Natividad | Iglesia del Santo Sepulcro |
| pt | Basílica da Anunciação | Basílica da Natividade | Igreja do Santo Sepulcro |
| fr | Basilique de l'Annonciation | Basilique de la Nativité | Église du Saint-Sépulcre |
| it | Basilica dell'Annunciazione | Basilica della Natività | Basilica del Santo Sepolcro |

Place names:
- es: Nazaret, Belén, Jerusalén, Israel, Palestina
- pt: Nazaré, Belém, Jerusalém, Israel, Palestina
- fr: Nazareth, Bethléem, Jérusalem, Israël, Palestine
- it: Nazareth, Betlemme, Gerusalemme, Israele, Palestina

Translate the denominations with the usual terms, for example es "Católica romana", "Ortodoxa griega", "Apostólica armenia".

- [ ] **Step 4: Regenerate the SQL and run the tests**

```bash
corepack pnpm@12.5.1 content:sql
corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
```
Expected: all PASS, with 4 messages tests and 3 content tests for each new locale.

- [ ] **Step 5: Build, then commit**

```bash
corepack pnpm@12.5.1 build
git add src/lib/i18n/config.ts messages supabase/content-i18n supabase/migrations/006_translations_content.sql
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): add Spanish, Portuguese, French and Italian" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Language batch 2 (German, Polish, Romanian, Greek)

**Files:**
- Modify: `src/lib/i18n/config.ts` (`locales`, `localeNames`, `localeEnglishNames`)
- Create: `messages/de.json`, `messages/pl.json`, `messages/ro.json`, `messages/el.json`
- Create: `supabase/content-i18n/de.json`, `pl.json`, `ro.json`, `el.json`
- Modify (generated): `supabase/migrations/006_translations_content.sql`

**Interfaces:**
- Consumes:
  - `messages/en.json` (source of all UI keys);
  - `supabase/content-i18n/en.json` (source of all content);
  - `corepack pnpm@12.5.1 content:sql`;
  - the tests `tests/unit/i18n/messages.test.ts`, `tests/unit/i18n/config.test.ts` and `tests/unit/content/content-i18n.test.ts`, which iterate over `locales`.

- [ ] **Step 1: Register the locales, which makes the tests fail**

In `src/lib/i18n/config.ts`, set:
```ts
export const locales = ['en', 'ar', 'he', 'es', 'pt', 'fr', 'it', 'de', 'pl', 'ro', 'el'] as const;
```
and add these entries after `it:` in `localeNames`:
```ts
  de: 'Deutsch',
  pl: 'Polski',
  ro: 'Română',
  el: 'Ελληνικά',
```
and after `it:` in `localeEnglishNames`:
```ts
  de: 'German',
  pl: 'Polish',
  ro: 'Romanian',
  el: 'Greek',
```
Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n tests/unit/content`
Expected: FAIL because the de/pl/ro/el files are missing.

- [ ] **Step 2: Translate the UI**

For each of `de`, `pl`, `ro` and `el`, create `messages/<code>.json` as a translation of `messages/en.json`. Keep the same keys in the same order and translate every value. Follow the translation rules in Global Constraints: keep `{year}`, write natural and polite text, and use the formal Sie form in German. Check `messages/ar.json` for context-dependent strings.

Keep bottom-tab labels (`Navigation.home|explore|projects|stories|visit`) to about 12 characters. German and Greek run long, so pick short forms, for example de "Entdecken" and el "Εξερεύνηση".

- [ ] **Step 3: Translate the database content**

For each of `de`, `pl`, `ro` and `el`, create `supabase/content-i18n/<code>.json` from `supabase/content-i18n/en.json`. It needs the same `fields` keys and `descriptions` church ids, with every value translated.

Use the established church names:

| | Annunciation (…0001) | Nativity (…0002) | Holy Sepulchre (…0003) |
| --- | --- | --- | --- |
| de | Verkündigungsbasilika | Geburtskirche | Grabeskirche |
| pl | Bazylika Zwiastowania | Bazylika Narodzenia Pańskiego | Bazylika Grobu Świętego |
| ro | Bazilica Buneivestiri | Biserica Nașterii Domnului | Biserica Sfântului Mormânt |
| el | Βασιλική του Ευαγγελισμού | Ναός της Γεννήσεως | Ναός της Αναστάσεως |

Place names:
- de: Nazareth, Bethlehem, Jerusalem, Israel, Palästina
- pl: Nazaret, Betlejem, Jerozolima, Izrael, Palestyna
- ro: Nazaret, Betleem, Ierusalim, Israel, Palestina
- el: Ναζαρέτ, Βηθλεέμ, Ιερουσαλήμ, Ισραήλ, Παλαιστίνη

For denominations, use each community's usual terms. For example, el "Ρωμαιοκαθολική", "Ελληνορθόδοξη", "Αρμενική Αποστολική".

- [ ] **Step 4: Regenerate the SQL and run the tests**

```bash
corepack pnpm@12.5.1 content:sql
corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
```
Expected: all PASS.

- [ ] **Step 5: Build, then commit**

```bash
corepack pnpm@12.5.1 build
git add src/lib/i18n/config.ts messages supabase/content-i18n supabase/migrations/006_translations_content.sql
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): add German, Polish, Romanian and Greek" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Language batch 3 (Russian, Ukrainian, Armenian, Georgian)

**Files:**
- Modify: `src/lib/i18n/config.ts` (`locales`, `localeNames`, `localeEnglishNames`)
- Create: `messages/ru.json`, `messages/uk.json`, `messages/hy.json`, `messages/ka.json`
- Create: `supabase/content-i18n/ru.json`, `uk.json`, `hy.json`, `ka.json`
- Modify (generated): `supabase/migrations/006_translations_content.sql`

**Interfaces:**
- Consumes:
  - `messages/en.json` (source of all UI keys);
  - `supabase/content-i18n/en.json` (source of all content);
  - `corepack pnpm@12.5.1 content:sql`;
  - the tests `tests/unit/i18n/messages.test.ts`, `tests/unit/i18n/config.test.ts` and `tests/unit/content/content-i18n.test.ts`, which iterate over `locales`.

- [ ] **Step 1: Register the locales, which makes the tests fail**

In `src/lib/i18n/config.ts`, set:
```ts
export const locales = ['en', 'ar', 'he', 'es', 'pt', 'fr', 'it', 'de', 'pl', 'ro', 'el', 'ru', 'uk', 'hy', 'ka'] as const;
```
and add these entries after `el:` in `localeNames`:
```ts
  ru: 'Русский',
  uk: 'Українська',
  hy: 'Հայերեն',
  ka: 'ქართული',
```
and after `el:` in `localeEnglishNames`:
```ts
  ru: 'Russian',
  uk: 'Ukrainian',
  hy: 'Armenian',
  ka: 'Georgian',
```
Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n tests/unit/content`
Expected: FAIL because the ru/uk/hy/ka files are missing.

- [ ] **Step 2: Translate the UI**

For each of `ru`, `uk`, `hy` and `ka`, create `messages/<code>.json` as a translation of `messages/en.json`. Keep the same keys in the same order and translate every value. Follow the translation rules in Global Constraints: keep `{year}`, write natural and polite text, and use the formal "Вы" form in Russian and Ukrainian.
- Ukrainian must be genuine Ukrainian (not Russian with Ukrainian letters).
- Armenian is Eastern Armenian in the modern orthography.
- Georgian is standard modern Georgian.

Keep bottom-tab labels to about 12 characters.

- [ ] **Step 3: Translate the database content**

For each of `ru`, `uk`, `hy` and `ka`, create `supabase/content-i18n/<code>.json` from `supabase/content-i18n/en.json`. It needs the same `fields` keys and `descriptions` church ids, with every value translated. Use Orthodox and Apostolic church usage.

Established church names:

| | Annunciation (…0001) | Nativity (…0002) | Holy Sepulchre (…0003) |
| --- | --- | --- | --- |
| ru | Базилика Благовещения | Храм Рождества Христова | Храм Гроба Господня |
| uk | Базиліка Благовіщення | Храм Різдва Христового | Храм Гробу Господнього |
| hy | Ավետման բազիլիկ | Սուրբ Ծննդյան տաճար | Սուրբ Հարության տաճար |
| ka | ხარების ბაზილიკა | შობის ტაძარი | უფლის საფლავის ტაძარი |

Place names:
- ru: Назарет, Вифлеем, Иерусалим, Израиль, Палестина
- uk: Назарет, Вифлеєм, Єрусалим, Ізраїль, Палестина
- hy: Նազարեթ, Բեթղեհեմ, Երուսաղեմ, Իսրայել, Պաղեստին
- ka: ნაზარეთი, ბეთლემი, იერუსალიმი, ისრაელი, პალესტინა

Where you know a more established form for the Armenian or Georgian names, use it and note it in your report.

- [ ] **Step 4: Regenerate the SQL and run the tests**

```bash
corepack pnpm@12.5.1 content:sql
corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
```
Expected: all PASS.

- [ ] **Step 5: Build, then commit**

```bash
corepack pnpm@12.5.1 build
git add src/lib/i18n/config.ts messages supabase/content-i18n supabase/migrations/006_translations_content.sql
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): add Russian, Ukrainian, Armenian and Georgian" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Language batch 4 (Amharic, Hindi, Chinese, Japanese)

**Files:**
- Modify: `src/lib/i18n/config.ts` (`locales`, `localeNames`, `localeEnglishNames`)
- Create: `messages/am.json`, `messages/hi.json`, `messages/zh.json`, `messages/ja.json`
- Create: `supabase/content-i18n/am.json`, `hi.json`, `zh.json`, `ja.json`
- Modify (generated): `supabase/migrations/006_translations_content.sql`

**Interfaces:**
- Consumes:
  - `messages/en.json` (source of all UI keys);
  - `supabase/content-i18n/en.json` (source of all content);
  - `corepack pnpm@12.5.1 content:sql`;
  - the tests `tests/unit/i18n/messages.test.ts`, `tests/unit/i18n/config.test.ts` and `tests/unit/content/content-i18n.test.ts`, which iterate over `locales`.

- [ ] **Step 1: Register the locales, which makes the tests fail**

In `src/lib/i18n/config.ts`, set:
```ts
export const locales = ['en', 'ar', 'he', 'es', 'pt', 'fr', 'it', 'de', 'pl', 'ro', 'el', 'ru', 'uk', 'hy', 'ka', 'am', 'hi', 'zh', 'ja'] as const;
```
and add these entries after `ka:` in `localeNames`:
```ts
  am: 'አማርኛ',
  hi: 'हिन्दी',
  zh: '简体中文',
  ja: '日本語',
```
and after `ka:` in `localeEnglishNames`:
```ts
  am: 'Amharic',
  hi: 'Hindi',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
```
Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n tests/unit/content`
Expected: FAIL because the am/hi/zh/ja files are missing.

- [ ] **Step 2: Translate the UI**

For each of `am`, `hi`, `zh` and `ja`, create `messages/<code>.json` as a translation of `messages/en.json`. Keep the same keys in the same order and translate every value. Follow the translation rules in Global Constraints: keep `{year}` and write natural, polite text.
- Amharic uses Ge'ez script and Ethiopian Orthodox Christian terminology.
- Hindi uses Devanagari. Use the terms Indian Christians use, such as गिरजाघर and तीर्थयात्री.
- Chinese is Simplified, with Catholic/Protestant-neutral terms where possible (教堂, 朝圣者).
- Japanese is polite です/ます style.

Keep bottom-tab labels short: about 12 characters, or about 4–6 CJK characters.

- [ ] **Step 3: Translate the database content**

For each of `am`, `hi`, `zh` and `ja`, create `supabase/content-i18n/<code>.json` from `supabase/content-i18n/en.json`. It needs the same `fields` keys and `descriptions` church ids, with every value translated.

Established church names:

| | Annunciation (…0001) | Nativity (…0002) | Holy Sepulchre (…0003) |
| --- | --- | --- | --- |
| am | የብሥራት ባዚሊካ | የልደት ቤተ ክርስቲያን | የቅዱስ መቃብር ቤተ ክርስቲያን |
| hi | घोषणा का महागिरजाघर | जन्म का गिरजाघर | पवित्र कब्र का गिरजाघर |
| zh | 天使报喜堂 | 主诞堂 | 圣墓教堂 |
| ja | 受胎告知教会 | 聖誕教会 | 聖墳墓教会 |

Place names:
- am: ናዝሬት, ቤተልሔም, ኢየሩሳሌም, እስራኤል, ፍልስጤም
- hi: नासरत, बेथलहम, यरूशलेम, इस्राएल, फ़िलिस्तीन
- zh: 拿撒勒, 伯利恒, 耶路撒冷, 以色列, 巴勒斯坦
- ja: ナザレ, ベツレヘム, エルサレム, イスラエル, パレスチナ

Where you know a more established form for the Amharic or Hindi names, use it and note it in your report.

- [ ] **Step 4: Regenerate the SQL and run the tests**

```bash
corepack pnpm@12.5.1 content:sql
corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
```
Expected: all PASS.

- [ ] **Step 5: Build, then commit**

```bash
corepack pnpm@12.5.1 build
git add src/lib/i18n/config.ts messages supabase/content-i18n supabase/migrations/006_translations_content.sql
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): add Amharic, Hindi, Chinese and Japanese" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Language batch 5 (Korean, Filipino, Indonesian)

**Files:**
- Modify: `src/lib/i18n/config.ts` (`locales`, `localeNames`, `localeEnglishNames`)
- Create: `messages/ko.json`, `messages/fil.json`, `messages/id.json`
- Create: `supabase/content-i18n/ko.json`, `fil.json`, `id.json`
- Modify (generated): `supabase/migrations/006_translations_content.sql`
- Modify: `tests/unit/i18n/config.test.ts` (lock in the final list of 22)

**Interfaces:**
- Consumes:
  - `messages/en.json` (source of all UI keys);
  - `supabase/content-i18n/en.json` (source of all content);
  - `corepack pnpm@12.5.1 content:sql`;
  - the tests `tests/unit/i18n/messages.test.ts`, `tests/unit/i18n/config.test.ts` and `tests/unit/content/content-i18n.test.ts`, which iterate over `locales`.

- [ ] **Step 1: Lock the final list in the config test and register the locales**

In `tests/unit/i18n/config.test.ts`, add this test inside `describe('locale registry', …)`:
```ts
  it('offers the 22 pilgrim languages in picker order', () => {
    expect(locales).toEqual([
      'en', 'ar', 'he', 'es', 'pt', 'fr', 'it', 'de', 'pl', 'ro', 'el',
      'ru', 'uk', 'hy', 'ka', 'am', 'hi', 'zh', 'ja', 'ko', 'fil', 'id',
    ]);
  });
```
In `src/lib/i18n/config.ts`, set:
```ts
export const locales = ['en', 'ar', 'he', 'es', 'pt', 'fr', 'it', 'de', 'pl', 'ro', 'el', 'ru', 'uk', 'hy', 'ka', 'am', 'hi', 'zh', 'ja', 'ko', 'fil', 'id'] as const;
```
and add these entries after `ja:` in `localeNames`:
```ts
  ko: '한국어',
  fil: 'Filipino',
  id: 'Bahasa Indonesia',
```
and after `ja:` in `localeEnglishNames`:
```ts
  ko: 'Korean',
  fil: 'Filipino',
  id: 'Indonesian',
```
Run: `corepack pnpm@12.5.1 exec vitest run tests/unit/i18n tests/unit/content`
Expected: FAIL because the ko/fil/id files are missing.

- [ ] **Step 2: Translate the UI**

For each of `ko`, `fil` and `id`, create `messages/<code>.json` as a translation of `messages/en.json`. Keep the same keys in the same order and translate every value. Follow the translation rules in Global Constraints: keep `{year}` and write natural, polite text.
- Korean uses the polite 합니다/해요 style.
- Filipino is standard Filipino, with English loanwords only where Filipinos normally use them.
- Indonesian is standard Bahasa Indonesia.

Keep bottom-tab labels to about 12 characters.

- [ ] **Step 3: Translate the database content**

For each of `ko`, `fil` and `id`, create `supabase/content-i18n/<code>.json` from `supabase/content-i18n/en.json`. It needs the same `fields` keys and `descriptions` church ids, with every value translated.

Established church names:

| | Annunciation (…0001) | Nativity (…0002) | Holy Sepulchre (…0003) |
| --- | --- | --- | --- |
| ko | 주님 탄생 예고 대성당 | 예수 탄생 교회 | 성묘 교회 |
| fil | Basilika ng Pagpapahayag | Simbahan ng Kapanganakan | Simbahan ng Banal na Libingan |
| id | Basilika Kabar Sukacita | Gereja Kelahiran | Gereja Makam Kudus |

Place names:
- ko: 나자렛, 베들레헴, 예루살렘, 이스라엘, 팔레스타인
- fil: Nazaret, Betlehem, Jerusalem, Israel, Palestina
- id: Nazaret, Betlehem, Yerusalem, Israel, Palestina

- [ ] **Step 4: Regenerate the SQL and run the tests**

```bash
corepack pnpm@12.5.1 content:sql
corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint
```
Expected: all PASS, including `offers the 22 pilgrim languages in picker order`.

Check the SQL size:
```bash
grep -c "INSERT INTO translations" supabase/migrations/006_translations_content.sql
grep -c "INSERT INTO church_descriptions" supabase/migrations/006_translations_content.sql
```
Expected: `1281` (61 fields × 21 locales) and `66` (3 churches × 22 locales).

- [ ] **Step 5: Build, then commit**

```bash
corepack pnpm@12.5.1 build
git add src/lib/i18n/config.ts messages supabase/content-i18n supabase/migrations/006_translations_content.sql tests/unit/i18n/config.test.ts
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "feat(i18n): add Korean, Filipino and Indonesian (22 languages)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Verification, SQL hand-off and release

**Files:**
- Modify: `docs/superpowers/specs/2026-09-25-many-languages-design.md` (status line only)

- [ ] **Step 1: Full automated gate**

Run: `corepack pnpm@12.5.1 exec vitest run && corepack pnpm@12.5.1 exec tsc --noEmit && corepack pnpm@12.5.1 lint && corepack pnpm@12.5.1 build`
Expected: everything passes, and the build output lists `/[locale]` pages for all 22 locales.

- [ ] **Step 2: Manual QA** with `corepack pnpm@12.5.1 start -p 3100` (or the dev server) at 390×844

1. `/ru`, `/zh`, `/ja`, `/am`, `/hy`, `/ka`, `/hi`, `/el`, `/de`: check the home page, a church page and a project page.
   - UI text is translated.
   - Every script renders; there are no tofu boxes.
   - Nothing overflows horizontally: `document.documentElement.scrollWidth === clientWidth`.
   - No bottom-tab label overflows its tab. For every label `span`, `scrollWidth <= clientWidth + 1` or it is visibly truncated.
2. Language sheet:
   - all 22 languages are listed, each with its English name;
   - typing `рус`, `japan` or `ქარ` filters to the right language;
   - choosing a language keeps the current page.
3. `curl -sI -H 'Accept-Language: ru-RU,ru;q=0.9' http://localhost:3100/` redirects to `/ru`.
4. The browser tab title is translated. Check `document.title` on `/ja`.
5. Before the SQL has been run, a church page in `/ru` shows English database content. There are no blanks and no errors.

- [ ] **Step 3: Ask the user to run the SQL**

Ask the user to run `supabase/migrations/006_translations_content.sql` in the Supabase SQL editor for the Land of Jesus project. It is idempotent and only upserts. Then verify:
```bash
U=$(grep '^NEXT_PUBLIC_SUPABASE_URL' .env.local | cut -d= -f2- | tr -d '\r"'); K=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY' .env.local | cut -d= -f2- | tr -d '\r"')
curl -s -D - -o /dev/null "$U/rest/v1/translations?select=id" -H "apikey: $K" -H "Authorization: Bearer $K" -H "Prefer: count=exact" -H "Range: 0-0" | grep -i content-range
```
Expected: `0-0/1281`.

Then `/ru/churches/holy-sepulchre-jerusalem` should show `Храм Гроба Господня`, with a Russian description, city and admission text.

- [ ] **Step 4: Mark the spec implemented, then push for a preview (ask the user first)**

In the spec, change `Status: Approved (design)` to `Status: Implemented per docs/superpowers/plans/2026-09-25-many-languages.md`.

```bash
git add docs/superpowers/specs/2026-09-25-many-languages-design.md
git -c user.name="Waseem" -c user.email="wasya92@gmail.com" commit -m "docs: mark many-languages spec implemented" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/many-languages
```
Check the Vercel preview for the branch in a few languages.

- [ ] **Step 5: Release (ask the user first)**

```bash
git checkout main && git merge --ff-only feat/many-languages && git push origin main
```
