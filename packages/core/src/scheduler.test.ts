import { describe, expect, it } from 'vitest';
import {
  computeNextRun,
  isDue,
  timeZoneOffsetMinutes,
  zonedWallTimeToUtc,
  type Schedule,
} from './scheduler';

describe('timezone math (DST-aware)', () => {
  it('reports the correct offset across a DST boundary in Asia/Jerusalem', () => {
    // Israel Daylight Time (summer) is UTC+3.
    const summer = new Date('2026-07-01T12:00:00Z');
    expect(timeZoneOffsetMinutes(summer, 'Asia/Jerusalem')).toBe(180);
    // Israel Standard Time (winter) is UTC+2.
    const winter = new Date('2026-01-01T12:00:00Z');
    expect(timeZoneOffsetMinutes(winter, 'Asia/Jerusalem')).toBe(120);
  });

  it('converts a wall-clock time to UTC differently in summer vs winter', () => {
    // 07:00 local in summer (UTC+3) -> 04:00 UTC
    const summer = zonedWallTimeToUtc(2026, 7, 15, 7, 0, 'Asia/Jerusalem');
    expect(summer.toISOString()).toBe('2026-07-15T04:00:00.000Z');
    // 07:00 local in winter (UTC+2) -> 05:00 UTC
    const winter = zonedWallTimeToUtc(2026, 1, 15, 7, 0, 'Asia/Jerusalem');
    expect(winter.toISOString()).toBe('2026-01-15T05:00:00.000Z');
  });
});

describe('computeNextRun', () => {
  it('returns null for send-now', () => {
    expect(computeNextRun({ kind: 'now' })).toBeNull();
  });

  it('handles a future one-off and a past one-off', () => {
    const now = new Date('2026-05-01T00:00:00Z');
    expect(
      computeNextRun({ kind: 'once', runAt: '2026-05-02T00:00:00Z' }, now)?.toISOString(),
    ).toBe('2026-05-02T00:00:00.000Z');
    expect(computeNextRun({ kind: 'once', runAt: '2026-04-01T00:00:00Z' }, now)).toBeNull();
  });

  it('daily 07:00 Asia/Jerusalem: next run is today if not yet elapsed', () => {
    const schedule: Schedule = { kind: 'daily', timeZone: 'Asia/Jerusalem', hour: 7, minute: 0 };
    // 03:00 UTC on a summer day is 06:00 local — before 07:00, so run today.
    const now = new Date('2026-07-15T03:00:00Z');
    expect(computeNextRun(schedule, now)?.toISOString()).toBe('2026-07-15T04:00:00.000Z');
  });

  it('daily 07:00 Asia/Jerusalem: rolls to tomorrow once elapsed', () => {
    const schedule: Schedule = { kind: 'daily', timeZone: 'Asia/Jerusalem', hour: 7, minute: 0 };
    // 05:00 UTC on a summer day is 08:00 local — after 07:00, so run tomorrow.
    const now = new Date('2026-07-15T05:00:00Z');
    expect(computeNextRun(schedule, now)?.toISOString()).toBe('2026-07-16T04:00:00.000Z');
  });

  it('daily schedule keeps the same local wall-clock time across a DST change', () => {
    const schedule: Schedule = { kind: 'daily', timeZone: 'Asia/Jerusalem', hour: 7, minute: 0 };
    const summer = computeNextRun(schedule, new Date('2026-07-15T05:00:00Z'))!;
    const winter = computeNextRun(schedule, new Date('2026-01-15T05:00:00Z'))!;
    // Same 07:00 local, but different UTC instants because the offset changed.
    expect(summer.toISOString()).toBe('2026-07-16T04:00:00.000Z');
    expect(winter.toISOString()).toBe('2026-01-16T05:00:00.000Z');
  });

  it('weekly schedule finds the next matching weekday', () => {
    // 2026-05-01 is a Friday. Next Monday (weekday 1) at 09:00 UTC.
    const schedule: Schedule = { kind: 'weekly', timeZone: 'UTC', weekday: 1, hour: 9, minute: 0 };
    const now = new Date('2026-05-01T00:00:00Z');
    expect(computeNextRun(schedule, now)?.toISOString()).toBe('2026-05-04T09:00:00.000Z');
  });

  it('validates time ranges', () => {
    expect(() =>
      computeNextRun({ kind: 'daily', timeZone: 'UTC', hour: 25, minute: 0 }),
    ).toThrow(RangeError);
  });
});

describe('isDue', () => {
  it('send-now is always due', () => {
    expect(isDue({ kind: 'now' })).toBe(true);
  });
  it('one-off is due once its time has passed', () => {
    const now = new Date('2026-05-01T12:00:00Z');
    expect(isDue({ kind: 'once', runAt: '2026-05-01T11:00:00Z' }, now)).toBe(true);
    expect(isDue({ kind: 'once', runAt: '2026-05-01T13:00:00Z' }, now)).toBe(false);
  });
});
