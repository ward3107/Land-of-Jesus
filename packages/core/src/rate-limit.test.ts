import { describe, expect, it } from 'vitest';
import { isWithinLimit, RATE_LIMITS, retryAfterSeconds, windowStart } from './rate-limit';

describe('windowStart', () => {
  it('aligns to the window boundary', () => {
    const w = 3600; // 1h
    const t = Date.UTC(2026, 0, 1, 10, 42, 30); // 10:42:30
    expect(windowStart(t, w)).toBe(Date.UTC(2026, 0, 1, 10, 0, 0));
  });
  it('two instants in the same window share a start', () => {
    const w = 60;
    const a = Date.UTC(2026, 0, 1, 0, 0, 5);
    const b = Date.UTC(2026, 0, 1, 0, 0, 55);
    expect(windowStart(a, w)).toBe(windowStart(b, w));
  });
});

describe('isWithinLimit', () => {
  it('allows up to and including max', () => {
    expect(isWithinLimit(1, 2)).toBe(true);
    expect(isWithinLimit(2, 2)).toBe(true);
    expect(isWithinLimit(3, 2)).toBe(false);
  });
});

describe('retryAfterSeconds', () => {
  it('counts down to the next window boundary', () => {
    const w = 3600;
    const t = Date.UTC(2026, 0, 1, 10, 0, 0) + 10_000; // 10s into the window
    expect(retryAfterSeconds(t, w)).toBe(3590);
  });
  it('is at least 1', () => {
    const w = 60;
    const t = windowStart(Date.now(), w) + 60_000 - 1; // 1ms before reset
    expect(retryAfterSeconds(t, w)).toBe(1);
  });
});

describe('RATE_LIMITS', () => {
  it('defines the platform actions', () => {
    expect(RATE_LIMITS.messageSend.action).toBe('message_send');
    expect(RATE_LIMITS.abuseReport.max).toBe(5);
  });
});
