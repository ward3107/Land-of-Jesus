import type { Tables } from '@communitydirect/core';
import { createSupabaseServerClient } from './supabase/server';

export interface OrgAnalytics {
  followers_active: number;
  messages_sent: number;
  messages_scheduled: number;
  messages_failed: number;
  jobs_total: number;
  jobs_completed: number;
  attempts_attempted: number;
  attempts_accepted: number;
  attempts_failed: number;
  attempts_invalid: number;
  join_scans: number;
  join_follows: number;
}

/** Measured analytics for an organization (one round-trip via the RPC). */
export async function fetchOrganizationAnalytics(organizationId: string): Promise<OrgAnalytics | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('organization_analytics', { p_org: organizationId });
    if (error || !data || data.length === 0) return null;
    return data[0] as OrgAnalytics;
  } catch {
    return null;
  }
}

export interface RecentJob {
  id: string;
  status: Tables<'delivery_jobs'>['status'];
  audience_size: number | null;
  sent_count: number;
  failed_count: number;
  completed_at: string | null;
  created_at: string;
  title: string | null;
}

/** Recent delivery jobs with their message's default-locale title. */
export async function listRecentJobs(organizationId: string, limit = 15): Promise<RecentJob[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('delivery_jobs')
    .select(
      'id, status, audience_size, sent_count, failed_count, completed_at, created_at, messages(default_locale, message_translations(locale, title))',
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((j) => {
    const rel = (j as unknown as {
      messages?:
        | { default_locale: string; message_translations?: { locale: string; title: string }[] }
        | { default_locale: string; message_translations?: { locale: string; title: string }[] }[];
    }).messages;
    const msg = Array.isArray(rel) ? rel[0] : rel;
    const translations = msg?.message_translations ?? [];
    const preferred = translations.find((t) => t.locale === msg?.default_locale) ?? translations[0];
    return {
      id: j.id,
      status: j.status,
      audience_size: j.audience_size,
      sent_count: j.sent_count,
      failed_count: j.failed_count,
      completed_at: j.completed_at,
      created_at: j.created_at,
      title: preferred?.title ?? null,
    };
  });
}
