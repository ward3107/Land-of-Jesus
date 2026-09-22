import {
  matchesSegment,
  type SegmentDefinition,
  type SubscriberProjection,
  type Tables,
} from '@communitydirect/core';
import { createSupabaseServerClient } from './supabase/server';

export type ChannelRow = Pick<Tables<'channels'>, 'id' | 'name' | 'slug' | 'is_default'>;
export type SegmentSummary = Pick<Tables<'segments'>, 'id' | 'name' | 'match_mode'> & {
  rules: { field: string; operator: string; values: string[] }[];
};

/** Non-archived channels for the org, default first. */
export async function listChannels(organizationId: string): Promise<ChannelRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('channels')
    .select('id, name, slug, is_default')
    .eq('organization_id', organizationId)
    .eq('is_archived', false)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });
  return (data ?? []) as ChannelRow[];
}

/** Saved segments (with their rules) for the org. */
export async function listSegments(organizationId: string): Promise<SegmentSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('segments')
    .select('id, name, match_mode, segment_rules(field, operator, values)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    match_mode: s.match_mode,
    rules: ((s as { segment_rules?: { field: string; operator: string; values: string[] }[] }).segment_rules ?? []).map(
      (r) => ({ field: r.field, operator: r.operator, values: r.values ?? [] }),
    ),
  }));
}

export interface MessageListItem {
  id: string;
  state: Tables<'messages'>['state'];
  scheduled_at: string | null;
  created_at: string;
  title: string | null;
  locales: string[];
}

/** Recent messages with their default-locale title for a compact list. */
export async function listMessages(organizationId: string, limit = 50): Promise<MessageListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('messages')
    .select('id, state, scheduled_at, created_at, default_locale, message_translations(locale, title)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((m) => {
    const translations =
      (m as { message_translations?: { locale: string; title: string }[] }).message_translations ?? [];
    const preferred =
      translations.find((t) => t.locale === m.default_locale) ?? translations[0];
    return {
      id: m.id,
      state: m.state,
      scheduled_at: m.scheduled_at,
      created_at: m.created_at,
      title: preferred?.title ?? null,
      locales: translations.map((t) => t.locale),
    };
  });
}

export interface ScheduledListItem {
  id: string;
  kind: Tables<'scheduled_messages'>['kind'];
  time_zone: string | null;
  next_run_at: string | null;
  is_active: boolean;
  title: string | null;
}

/** Active recurring schedules + upcoming one-off SCHEDULED messages. */
export async function listScheduled(organizationId: string): Promise<{
  recurring: ScheduledListItem[];
  oneOff: MessageListItem[];
}> {
  const supabase = await createSupabaseServerClient();
  const [{ data: recurringRows }, all] = await Promise.all([
    supabase
      .from('scheduled_messages')
      .select('id, kind, time_zone, next_run_at, is_active, messages(default_locale, message_translations(locale, title))')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('next_run_at', { ascending: true }),
    listMessages(organizationId, 100),
  ]);

  const recurring: ScheduledListItem[] = (recurringRows ?? []).map((r) => {
    // The message FK is a to-one relation; Supabase's generic inference can't tell
    // cardinality from the hand-written types, so normalize object-or-array here.
    const rel = (r as unknown as {
      messages?:
        | { default_locale: string; message_translations?: { locale: string; title: string }[] }
        | { default_locale: string; message_translations?: { locale: string; title: string }[] }[];
    }).messages;
    const msg = Array.isArray(rel) ? rel[0] : rel;
    const translations = msg?.message_translations ?? [];
    const preferred = translations.find((t) => t.locale === msg?.default_locale) ?? translations[0];
    return {
      id: r.id,
      kind: r.kind,
      time_zone: r.time_zone,
      next_run_at: r.next_run_at,
      is_active: r.is_active,
      title: preferred?.title ?? null,
    };
  });

  const oneOff = all.filter((m) => m.state === 'SCHEDULED' && m.scheduled_at != null);
  return { recurring, oneOff };
}

/**
 * Build org-scoped subscriber projections for reach estimation. Only carries the
 * low-sensitivity attributes an admin already sees on the Subscribers page — no
 * device data (privacy-first, see docs/PRIVACY.md).
 */
export async function fetchAudienceProjections(
  organizationId: string,
  limit = 2000,
): Promise<SubscriberProjection[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data: followers }, { data: subs }] = await Promise.all([
    supabase
      .from('organization_followers')
      .select('profile_id, language, location, tags, signup_source')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .limit(limit),
    supabase
      .from('channel_subscriptions')
      .select('profile_id, channel_id')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .limit(limit * 10),
  ]);

  const channelsByProfile = new Map<string, string[]>();
  for (const s of subs ?? []) {
    const list = channelsByProfile.get(s.profile_id) ?? [];
    list.push(s.channel_id);
    channelsByProfile.set(s.profile_id, list);
  }

  return (followers ?? []).map((f) => ({
    id: f.profile_id,
    organizationId,
    language: f.language,
    channelIds: channelsByProfile.get(f.profile_id) ?? [],
    location: f.location,
    tags: f.tags,
    signupSource: f.signup_source,
    active: true,
  }));
}

/** Reach = active subscribers of a targeted channel who also match the segment. */
export function estimateReach(
  projections: readonly SubscriberProjection[],
  channelIds: readonly string[],
  segment: SegmentDefinition | null,
): number {
  return projections.filter(
    (p) =>
      p.channelIds.some((c) => channelIds.includes(c)) &&
      (segment == null || matchesSegment(segment, p)),
  ).length;
}
