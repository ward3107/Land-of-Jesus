/**
 * Analytics from *measured* signals only.
 *
 * We never fabricate open/tap rates the transport cannot report. Everything here
 * is derived from what actually happened: provider acceptance, failures, token
 * invalidation, message states, and join-funnel events. See docs/ANALYTICS.md
 * and docs/DECISIONS.md §9.
 */

/** Raw per-outcome counts from delivery_attempts (+ resolved audience). */
export interface DeliveryTotals {
  /** Distinct recipients the pipeline attempted (accepted + failed + invalid). */
  attempted: number;
  /** Accepted by the provider (SENT_TO_PROVIDER or DELIVERED). */
  accepted: number;
  /** Transient/permanent send failures that were not a dead token. */
  failed: number;
  /** Tokens the provider reported permanently invalid (cleaned up). */
  invalid: number;
}

export interface DeliverySummary extends DeliveryTotals {
  /** accepted / attempted, in [0,1]; 0 when nothing was attempted. */
  deliveryRate: number;
  /** (failed + invalid) / attempted, in [0,1]. */
  failureRate: number;
}

export function summarizeDelivery(totals: DeliveryTotals): DeliverySummary {
  const attempted = Math.max(0, totals.attempted);
  const denom = attempted === 0 ? 1 : attempted;
  return {
    ...totals,
    attempted,
    deliveryRate: attempted === 0 ? 0 : totals.accepted / denom,
    failureRate: attempted === 0 ? 0 : (totals.failed + totals.invalid) / denom,
  };
}

/** Format a 0..1 rate as a whole-number percent, e.g. 0.9333 → "93%". */
export function formatRate(rate: number): string {
  const clamped = Math.max(0, Math.min(1, rate));
  return `${Math.round(clamped * 100)}%`;
}

/** Message counts by lifecycle bucket, for the overview + analytics tiles. */
export interface MessageCounts {
  sent: number;
  scheduled: number;
  failed: number;
}

/** Join-funnel counts (from join_events), for signup-source attribution. */
export interface JoinFunnel {
  scans: number;
  opens: number;
  installs: number;
  follows: number;
}

/** Scan → follow conversion, in [0,1]; 0 when there were no scans. */
export function joinConversionRate(funnel: JoinFunnel): number {
  return funnel.scans === 0 ? 0 : Math.min(1, funnel.follows / funnel.scans);
}
