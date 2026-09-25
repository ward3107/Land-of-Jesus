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
