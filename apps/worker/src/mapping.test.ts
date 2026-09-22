import { describe, expect, it } from 'vitest';
import {
  groupPreferences,
  toCandidate,
  toPreference,
  toRecurrence,
  toSegmentDefinition,
  type AudienceRow,
  type PreferenceRow,
  type ScheduledRow,
} from './mapping';

const audienceRow: AudienceRow = {
  profile_id: 'p1',
  device_id: 'd1',
  push_token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  provider: 'expo',
  device_locale: 'ar',
  follower_language: 'en',
  follower_location: 'Haifa',
  follower_tags: ['volunteer'],
  follower_signup_source: 'qr:a',
  channel_ids: ['ch1', 'ch2'],
};

describe('toPreference', () => {
  it('maps snake_case columns to the domain shape', () => {
    const row: PreferenceRow = {
      profile_id: 'p1',
      organization_id: 'org1',
      channel_id: null,
      notifications_enabled: false,
      quiet_hours_start: 22,
      quiet_hours_end: 7,
    };
    expect(toPreference(row)).toEqual({
      organizationId: 'org1',
      channelId: null,
      notificationsEnabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    });
  });
});

describe('toSegmentDefinition', () => {
  it('rebuilds a segment definition from rows', () => {
    const def = toSegmentDefinition('any', [
      { field: 'language', operator: 'eq', values: ['he'] },
      { field: 'tag', operator: 'in', values: ['a', 'b'] },
    ]);
    expect(def.match).toBe('any');
    expect(def.rules).toHaveLength(2);
    expect(def.rules[0]).toEqual({ field: 'language', operator: 'eq', values: ['he'] });
  });
});

describe('toCandidate', () => {
  it('prefers the device locale and carries the org-scoped projection', () => {
    const c = toCandidate(audienceRow, [], 9, 'org1');
    expect(c.locale).toBe('ar'); // device locale wins over follower language
    expect(c.localHour).toBe(9);
    expect(c.projection).toEqual({
      id: 'p1',
      organizationId: 'org1',
      language: 'en',
      channelIds: ['ch1', 'ch2'],
      location: 'Haifa',
      tags: ['volunteer'],
      signupSource: 'qr:a',
      active: true,
    });
  });

  it('falls back to the follower language when no device locale', () => {
    const c = toCandidate({ ...audienceRow, device_locale: null }, [], 0, 'org1');
    expect(c.locale).toBe('en');
  });
});

describe('toRecurrence', () => {
  it('builds a daily schedule', () => {
    const row: ScheduledRow = { kind: 'daily', time_zone: 'Asia/Jerusalem', run_at: null, hour: 8, minute: 30, weekday: null };
    expect(toRecurrence(row)).toEqual({ kind: 'daily', timeZone: 'Asia/Jerusalem', hour: 8, minute: 30 });
  });

  it('builds a weekly schedule', () => {
    const row: ScheduledRow = { kind: 'weekly', time_zone: 'Asia/Jerusalem', run_at: null, hour: 18, minute: 0, weekday: 5 };
    expect(toRecurrence(row)).toEqual({ kind: 'weekly', timeZone: 'Asia/Jerusalem', weekday: 5, hour: 18, minute: 0 });
  });

  it('returns null for incomplete or non-recurring rows', () => {
    expect(toRecurrence({ kind: 'once', time_zone: null, run_at: '2026-01-01T00:00:00Z', hour: null, minute: null, weekday: null })).toBeNull();
    expect(toRecurrence({ kind: 'daily', time_zone: null, run_at: null, hour: 8, minute: 0, weekday: null })).toBeNull();
  });
});

describe('groupPreferences', () => {
  it('groups rows by profile id', () => {
    const rows: PreferenceRow[] = [
      { profile_id: 'p1', organization_id: 'org1', channel_id: null, notifications_enabled: true, quiet_hours_start: null, quiet_hours_end: null },
      { profile_id: 'p1', organization_id: null, channel_id: null, notifications_enabled: true, quiet_hours_start: null, quiet_hours_end: null },
      { profile_id: 'p2', organization_id: 'org1', channel_id: null, notifications_enabled: false, quiet_hours_start: null, quiet_hours_end: null },
    ];
    const grouped = groupPreferences(rows);
    expect(grouped.get('p1')).toHaveLength(2);
    expect(grouped.get('p2')).toHaveLength(1);
  });
});
