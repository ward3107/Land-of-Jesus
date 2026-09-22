/**
 * Scheduling.
 *
 * Rules of the road (see docs/DECISIONS.md):
 *   - All instants are stored and compared in UTC.
 *   - A recurring schedule is expressed as a wall-clock time in an IANA time
 *     zone; the next fire instant is computed with correct DST handling using
 *     the platform Intl database (Node ships full ICU).
 *
 * The recurrence model is intentionally small for the MVP (`once`, `daily`,
 * `weekly`) but shaped so richer rules can be added without changing callers.
 */

export type ScheduleKind = 'now' | 'once' | 'daily' | 'weekly';

export interface OnceSchedule {
  kind: 'once';
  /** ISO-8601 UTC instant. */
  runAt: string;
}

export interface NowSchedule {
  kind: 'now';
}

export interface DailySchedule {
  kind: 'daily';
  timeZone: string; // IANA, e.g. "Asia/Jerusalem"
  hour: number; // 0-23 local wall-clock
  minute: number; // 0-59
}

export interface WeeklySchedule {
  kind: 'weekly';
  timeZone: string;
  /** 0 = Sunday … 6 = Saturday, in the target time zone. */
  weekday: number;
  hour: number;
  minute: number;
}

export type Schedule = NowSchedule | OnceSchedule | DailySchedule | WeeklySchedule;

/**
 * The offset (localWallTime − UTC) in **minutes** for `instant` in `timeZone`.
 * Positive east of UTC. Uses `Intl` so it is DST-aware and dependency-free.
 */
export function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(instant);
  const get = (t: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === t)?.value);
  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return Math.round((asIfUtc - instant.getTime()) / 60000);
}

/**
 * Convert a wall-clock time in `timeZone` to the corresponding UTC instant,
 * handling DST transitions. A double-pass corrects the offset at the DST edge.
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset1 = timeZoneOffsetMinutes(new Date(naiveUtc), timeZone);
  let ts = naiveUtc - offset1 * 60000;
  const offset2 = timeZoneOffsetMinutes(new Date(ts), timeZone);
  if (offset2 !== offset1) {
    ts = naiveUtc - offset2 * 60000;
  }
  return new Date(ts);
}

/** The local calendar/clock fields of `instant` as seen in `timeZone`. */
export function zonedParts(
  instant: Date,
  timeZone: string,
): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = dtf.formatToParts(instant);
  const get = (t: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === t)?.value ?? '';
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  };
}

function assertTime(hour: number, minute: number): void {
  if (hour < 0 || hour > 23) throw new RangeError(`hour out of range: ${hour}`);
  if (minute < 0 || minute > 59) throw new RangeError(`minute out of range: ${minute}`);
}

/**
 * Compute the next fire instant (UTC) strictly after `now`.
 * Returns `null` for schedules that do not recur once elapsed (`now`, past `once`).
 */
export function computeNextRun(schedule: Schedule, now: Date = new Date()): Date | null {
  switch (schedule.kind) {
    case 'now':
      return null;
    case 'once': {
      const at = new Date(schedule.runAt);
      return at.getTime() > now.getTime() ? at : null;
    }
    case 'daily': {
      assertTime(schedule.hour, schedule.minute);
      const local = zonedParts(now, schedule.timeZone);
      let candidate = zonedWallTimeToUtc(
        local.year,
        local.month,
        local.day,
        schedule.hour,
        schedule.minute,
        schedule.timeZone,
      );
      if (candidate.getTime() <= now.getTime()) {
        const next = new Date(candidate.getTime() + 24 * 3600 * 1000);
        const p = zonedParts(next, schedule.timeZone);
        candidate = zonedWallTimeToUtc(
          p.year,
          p.month,
          p.day,
          schedule.hour,
          schedule.minute,
          schedule.timeZone,
        );
      }
      return candidate;
    }
    case 'weekly': {
      assertTime(schedule.hour, schedule.minute);
      if (schedule.weekday < 0 || schedule.weekday > 6) {
        throw new RangeError(`weekday out of range: ${schedule.weekday}`);
      }
      // Search up to 8 days ahead for the next matching weekday/time.
      for (let addDays = 0; addDays <= 7; addDays++) {
        const probe = new Date(now.getTime() + addDays * 24 * 3600 * 1000);
        const p = zonedParts(probe, schedule.timeZone);
        if (p.weekday !== schedule.weekday) continue;
        const candidate = zonedWallTimeToUtc(
          p.year,
          p.month,
          p.day,
          schedule.hour,
          schedule.minute,
          schedule.timeZone,
        );
        if (candidate.getTime() > now.getTime()) return candidate;
      }
      return null;
    }
  }
}

/** Whether a message should be dispatched now given its schedule and the clock. */
export function isDue(schedule: Schedule, now: Date = new Date()): boolean {
  if (schedule.kind === 'now') return true;
  if (schedule.kind === 'once') return new Date(schedule.runAt).getTime() <= now.getTime();
  // For recurring schedules, "due" is decided by the worker off the stored
  // next_run_at column, not recomputed here.
  return false;
}
