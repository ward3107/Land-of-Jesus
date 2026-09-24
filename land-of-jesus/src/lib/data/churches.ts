import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEMO_CHURCHES, getDemoChurch, type DemoChurch } from '@/lib/demo/data';
import type { Locale } from '@/lib/i18n/config';

/**
 * Church data access. Queries the normalized Supabase schema and maps rows to
 * the shared `DemoChurch` shape the pages/components already use. Falls back to
 * the bundled demo data on any error or when the table is empty, so the site
 * renders whether or not the database is populated.
 */

// Local free-licensed photos by slug (the DB seeds no media_assets yet).
const IMAGE_BY_SLUG: Record<string, string> = {
  'basilica-annunciation-nazareth': '/images/churches/annunciation.jpg',
  'church-nativity-bethlehem': '/images/churches/nativity.jpg',
  'holy-sepulchre-jerusalem': '/images/churches/holy-sepulchre.jpg',
};

const CHURCH_SELECT =
  'slug,name,name_ar,name_he,status,' +
  'church_locations(city,region,country,latitude,longitude),' +
  'church_visiting_info(is_open_to_visitors,opening_hours,admission_info,accessibility_info),' +
  'church_descriptions(locale,overview,story,heritage,community),' +
  'heritage_items(title,item_type,date_period,is_published),' +
  'church_updates(title,content,published_at,is_published),' +
  'denominations(name,name_ar,name_he),' +
  'projects(slug,title,is_published,project_budgets(total_amount,raised_amount))';

type Row = Record<string, unknown>;
const first = <T>(v: unknown): T | undefined => (Array.isArray(v) ? (v[0] as T) : (v as T)) ?? undefined;
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function pickLocale(locale: Locale, en: string, ar?: string | null, he?: string | null): string {
  if (locale === 'ar') return ar || en;
  if (locale === 'he') return he || en;
  return en;
}

function mapChurch(row: Row, locale: Locale): DemoChurch {
  const loc = first<Row>(row.church_locations) ?? {};
  const vi = first<Row>(row.church_visiting_info) ?? {};
  const descriptions = arr<Row>(row.church_descriptions);
  const desc = (descriptions.find((d) => d.locale === locale) ??
    descriptions.find((d) => d.locale === 'en') ??
    descriptions[0] ??
    {}) as Row;
  const denom = first<Row>(row.denominations);
  const slug = String(row.slug);
  const dbProjects = arr<Row>(row.projects).filter((p) => p.is_published);
  const fallback = getDemoChurch(slug);

  return {
    slug,
    name: pickLocale(locale, String(row.name ?? ''), row.name_ar as string, row.name_he as string),
    name_ar: (row.name_ar as string) ?? '',
    name_he: (row.name_he as string) ?? '',
    location: {
      address: '—',
      city: (loc.city as string) ?? '',
      region: (loc.region as string) ?? '',
      country: (loc.country as string) ?? '',
      latitude: Number(loc.latitude) || 0,
      longitude: Number(loc.longitude) || 0,
    },
    tradition: denom
      ? pickLocale(locale, String(denom.name ?? ''), denom.name_ar as string, denom.name_he as string)
      : fallback?.tradition ?? '',
    denomination: (denom?.name as string) ?? fallback?.denomination ?? '',
    status: (row.status as DemoChurch['status']) ?? 'LISTED',
    description: {
      overview: (desc.overview as string) ?? '',
      story: (desc.story as string) ?? '',
      heritage: (desc.heritage as string) ?? '',
      community: (desc.community as string) ?? '',
    },
    visitingInfo: {
      isOpen: (vi.is_open_to_visitors as boolean | null) ?? null,
      hours: (vi.opening_hours as Record<string, string> | null) ?? null,
      admission: (vi.admission_info as string | null) ?? null,
      accessibility: (vi.accessibility_info as string | null) ?? null,
    },
    heritageItems: arr<Row>(row.heritage_items)
      .filter((h) => h.is_published)
      .map((h) => ({ title: String(h.title ?? ''), type: (h.item_type as string) ?? '', period: (h.date_period as string) ?? '' })),
    projects: dbProjects.map((p) => {
      const b = first<Row>(p.project_budgets) ?? {};
      const total = Number(b.total_amount) || 0;
      const raised = Number(b.raised_amount) || 0;
      return {
        slug: String(p.slug),
        title: String(p.title ?? ''),
        progress: total ? Math.round((raised / total) * 100) : 0,
        goal: `$${total.toLocaleString()}`,
        status: '',
      };
    }),
    updates: arr<Row>(row.church_updates)
      .filter((u) => u.is_published)
      .map((u) => ({
        title: String(u.title ?? ''),
        date: u.published_at ? new Date(String(u.published_at)).toLocaleDateString() : '',
        content: String(u.content ?? ''),
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
    return (data as unknown as Row[]).map((r) => mapChurch(r, locale));
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
    return mapChurch(data as unknown as Row, locale);
  } catch {
    return getDemoChurch(slug);
  }
}
