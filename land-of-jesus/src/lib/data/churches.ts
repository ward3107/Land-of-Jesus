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
  // Translations are only ever fetched for non-English locales (fetchTranslations
  // short-circuits for 'en'); guard here too so a caller passing a stale/non-empty
  // map alongside locale 'en' still renders English, per the fallback-chain rule.
  const tx = (type: string, entity: Row | undefined, field: string, fallback: string) =>
    locale === 'en' ? fallback : tr(translations, type, entityId(entity), field, fallback);

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
