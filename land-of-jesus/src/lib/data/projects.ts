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
  // Translations are only ever fetched for non-English locales (fetchTranslations
  // short-circuits for 'en'); guard here too so a caller passing a stale/non-empty
  // map alongside locale 'en' still renders English, per the fallback-chain rule.
  const tx = (type: string, entity: Row | undefined, field: string, fallback: string) =>
    locale === 'en' ? fallback : tr(translations, type, entityId(entity), field, fallback);

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
