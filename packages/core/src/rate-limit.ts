/**
 * Fixed-window rate-limit math, mirroring the `check_rate_limit` SQL function so
 * the app can pre-check, show "try again in N seconds", and keep the limits in
 * one place. The database remains the authority (see supabase/migrations/0016).
 */

export interface RateLimitRule {
  action: string;
  max: number;
  windowSeconds: number;
}

/** Canonical limits for the platform's sensitive actions. */
export const RATE_LIMITS = {
  messageSend: { action: 'message_send', max: 60, windowSeconds: 3600 },
  abuseReport: { action: 'abuse_report', max: 5, windowSeconds: 3600 },
} as const satisfies Record<string, RateLimitRule>;

/** Epoch-ms start of the fixed window containing `nowMs`, aligned to the window. */
export function windowStart(nowMs: number, windowSeconds: number): number {
  const w = Math.max(1, Math.floor(windowSeconds)) * 1000;
  return Math.floor(nowMs / w) * w;
}

/** Whether an incrementing counter is still within its allowance. */
export function isWithinLimit(count: number, max: number): boolean {
  return count <= max;
}

/** Seconds until the current window resets (for a Retry-After style hint). */
export function retryAfterSeconds(nowMs: number, windowSeconds: number): number {
  const w = Math.max(1, Math.floor(windowSeconds));
  const end = windowStart(nowMs, w) + w * 1000;
  return Math.max(1, Math.ceil((end - nowMs) / 1000));
}
