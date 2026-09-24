import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEMO_PROJECTS, getDemoProject, type DemoProject } from '@/lib/demo/data';
import type { Locale } from '@/lib/i18n/config';

/**
 * Project data access — mirrors churches.ts: query Supabase, map to the shared
 * `DemoProject` shape, fall back to bundled demo data on error/empty.
 */

const PROJECT_SELECT =
  'slug,title,title_ar,title_he,short_description,full_description,category,status,' +
  'churches(slug,name),' +
  'project_budgets(total_amount,raised_amount,currency,budget_items),' +
  'project_timelines(phase,start_date,end_date,is_completed),' +
  'project_verifications(status,verification_type,reviewed_at),' +
  'project_updates(title,content,update_type,published_at,is_published)';

type Row = Record<string, unknown>;
const first = <T>(v: unknown): T | undefined => (Array.isArray(v) ? (v[0] as T) : (v as T)) ?? undefined;
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function pickLocale(locale: Locale, en: string, ar?: string | null, he?: string | null): string {
  if (locale === 'ar') return ar || en;
  if (locale === 'he') return he || en;
  return en;
}

function mapProject(row: Row, locale: Locale): DemoProject {
  const b = first<Row>(row.project_budgets) ?? {};
  const church = first<Row>(row.churches);
  const ver = first<Row>(row.project_verifications);
  const total = Number(b.total_amount) || 0;
  const raised = Number(b.raised_amount) || 0;
  const budgetItems = Array.isArray(b.budget_items) ? (b.budget_items as Row[]) : [];

  return {
    slug: String(row.slug),
    title: pickLocale(locale, String(row.title ?? ''), row.title_ar as string, row.title_he as string),
    title_ar: (row.title_ar as string) ?? '',
    title_he: (row.title_he as string) ?? '',
    church: church ? { slug: String(church.slug), name: String(church.name) } : null,
    shortDescription: (row.short_description as string) ?? '',
    fullDescription: (row.full_description as string) ?? '',
    category: (row.category as string) ?? '',
    status: (row.status as string) ?? '',
    budget: { total, raised, currency: (b.currency as string) ?? 'USD' },
    progress: total ? Math.round((raised / total) * 100) : 0,
    timelines: arr<Row>(row.project_timelines).map((t) => ({
      phase: String(t.phase ?? ''),
      startDate: String(t.start_date ?? ''),
      endDate: String(t.end_date ?? ''),
      completed: !!t.is_completed,
    })),
    budgetItems: budgetItems.map((i) => ({ item: String(i.item ?? ''), amount: Number(i.amount) || 0 })),
    verification: {
      status: (ver?.status as string) ?? '',
      type: (ver?.verification_type as string) ?? '',
      reviewedAt: (ver?.reviewed_at as string) ?? '',
    },
    updates: arr<Row>(row.project_updates)
      .filter((u) => u.is_published)
      .map((u) => ({
        title: String(u.title ?? ''),
        content: String(u.content ?? ''),
        type: (u.update_type as string) ?? '',
        date: u.published_at ? new Date(String(u.published_at)).toLocaleDateString() : '',
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
    return (data as unknown as Row[]).map((r) => mapProject(r, locale));
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
    return mapProject(data as unknown as Row, locale);
  } catch {
    return getDemoProject(slug);
  }
}
