/**
 * Push delivery: batching, idempotency and de-duplication primitives.
 *
 * The delivery pipeline (Admin → Message → Audience → Delivery Job → Batches →
 * Provider → Attempts) must never send a subscriber the same message twice, even
 * if a job or batch is retried. We achieve this with a deterministic idempotency
 * key per (delivery job, device) pair: the worker upserts an attempt keyed by
 * that string, so a retry updates the existing row instead of inserting a new one.
 */

/** Expo's Push API accepts at most 100 messages per HTTP request. */
export const MAX_PUSH_BATCH_SIZE = 100;

export interface DeliveryRecipient {
  /** The delivery job this recipient belongs to. */
  jobId: string;
  deviceId: string;
  pushToken: string;
}

/**
 * Deterministic key for a delivery attempt. Same (jobId, deviceId) always maps
 * to the same key, so an at-least-once worker becomes effectively exactly-once
 * when the attempts table has a UNIQUE constraint on this key.
 */
export function deliveryIdempotencyKey(jobId: string, deviceId: string): string {
  return `dj:${jobId}:dev:${deviceId}`;
}

/**
 * Remove duplicate recipients within a job. Duplicates can arise when a
 * subscriber matches an audience through multiple channels, or registers the
 * same push token on two device rows. We de-dupe on (jobId, pushToken) so a
 * physical device is only ever pushed once per job.
 */
export function dedupeRecipients(recipients: readonly DeliveryRecipient[]): DeliveryRecipient[] {
  const seen = new Set<string>();
  const out: DeliveryRecipient[] = [];
  for (const r of recipients) {
    const key = `${r.jobId}::${r.pushToken}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/** Split an array into fixed-size chunks. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) throw new RangeError('chunk size must be > 0');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Build provider-sized, de-duplicated batches for a job. Each returned batch is
 * ready to be handed to a {@link NotificationProvider} in the push package.
 */
export function buildDeliveryBatches(
  recipients: readonly DeliveryRecipient[],
  batchSize: number = MAX_PUSH_BATCH_SIZE,
): DeliveryRecipient[][] {
  return chunk(dedupeRecipients(recipients), Math.min(batchSize, MAX_PUSH_BATCH_SIZE));
}
