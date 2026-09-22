/**
 * Pure mappers from database rows to the pipeline's domain types. Kept free of
 * any Supabase import so they are unit-testable, and so the store stays a thin
 * shell around queries.
 */
import type {
  Locale,
  NotificationPreference,
  Schedule,
  SegmentDefinition,
  SegmentField,
  SegmentOperator,
  SubscriberProjection,
} from '@communitydirect/core';
import type { AudienceCandidate } from '@communitydirect/push';

export interface AudienceRow {
  profile_id: string;
  device_id: string;
  push_token: string;
  provider: string;
  device_locale: string | null;
  follower_language: string | null;
  follower_location: string | null;
  follower_tags: string[];
  follower_signup_source: string | null;
  channel_ids: string[];
}

export interface PreferenceRow {
  profile_id: string;
  organization_id: string | null;
  channel_id: string | null;
  notifications_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
}

export interface SegmentRuleRow {
  field: string;
  operator: string;
  values: string[];
}

export interface ScheduledRow {
  kind: 'now' | 'once' | 'daily' | 'weekly';
  time_zone: string | null;
  run_at: string | null;
  hour: number | null;
  minute: number | null;
  weekday: number | null;
}

export function toPreference(row: PreferenceRow): NotificationPreference {
  return {
    organizationId: row.organization_id,
    channelId: row.channel_id,
    notificationsEnabled: row.notifications_enabled,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
  };
}

export function toSegmentDefinition(
  matchMode: 'all' | 'any',
  rules: readonly SegmentRuleRow[],
): SegmentDefinition {
  return {
    match: matchMode,
    rules: rules.map((r) => ({
      field: r.field as SegmentField,
      operator: r.operator as SegmentOperator,
      values: r.values ?? [],
    })),
  };
}

export function toProjection(row: AudienceRow, organizationId: string): SubscriberProjection {
  return {
    id: row.profile_id,
    organizationId,
    language: row.follower_language,
    channelIds: row.channel_ids ?? [],
    location: row.follower_location,
    tags: row.follower_tags ?? [],
    signupSource: row.follower_signup_source,
    active: true, // resolve_delivery_audience only returns active followers
  };
}

export function toCandidate(
  row: AudienceRow,
  preferences: NotificationPreference[],
  localHour: number,
  organizationId: string,
): AudienceCandidate {
  return {
    profileId: row.profile_id,
    deviceId: row.device_id,
    pushToken: row.push_token,
    locale: (row.device_locale ?? row.follower_language) as Locale | null,
    localHour,
    preferences,
    projection: toProjection(row, organizationId),
  };
}

/** Convert a scheduled_messages row into a recurrence for computeNextRun. */
export function toRecurrence(row: ScheduledRow): Schedule | null {
  if (row.kind === 'daily' && row.time_zone != null && row.hour != null && row.minute != null) {
    return { kind: 'daily', timeZone: row.time_zone, hour: row.hour, minute: row.minute };
  }
  if (
    row.kind === 'weekly' &&
    row.time_zone != null &&
    row.hour != null &&
    row.minute != null &&
    row.weekday != null
  ) {
    return {
      kind: 'weekly',
      timeZone: row.time_zone,
      weekday: row.weekday,
      hour: row.hour,
      minute: row.minute,
    };
  }
  return null;
}

/** Group preference rows by profile id. */
export function groupPreferences(rows: readonly PreferenceRow[]): Map<string, NotificationPreference[]> {
  const byProfile = new Map<string, NotificationPreference[]>();
  for (const row of rows) {
    const list = byProfile.get(row.profile_id) ?? [];
    list.push(toPreference(row));
    byProfile.set(row.profile_id, list);
  }
  return byProfile;
}
