import { describe, expect, it } from 'vitest';
import {
  buildDeliveryBatches,
  chunk,
  dedupeRecipients,
  deliveryIdempotencyKey,
  MAX_PUSH_BATCH_SIZE,
  type DeliveryRecipient,
} from './push-idempotency';

describe('push idempotency', () => {
  it('produces a stable, deterministic key for a (job, device) pair', () => {
    const a = deliveryIdempotencyKey('job-1', 'dev-1');
    const b = deliveryIdempotencyKey('job-1', 'dev-1');
    expect(a).toBe(b);
    expect(deliveryIdempotencyKey('job-1', 'dev-2')).not.toBe(a);
    expect(deliveryIdempotencyKey('job-2', 'dev-1')).not.toBe(a);
  });

  it('de-duplicates a device that appears twice in one job', () => {
    const recipients: DeliveryRecipient[] = [
      { jobId: 'j1', deviceId: 'd1', pushToken: 'ExponentPushToken[AAA]' },
      { jobId: 'j1', deviceId: 'd2', pushToken: 'ExponentPushToken[AAA]' }, // same token, two rows
      { jobId: 'j1', deviceId: 'd3', pushToken: 'ExponentPushToken[BBB]' },
    ];
    const deduped = dedupeRecipients(recipients);
    expect(deduped).toHaveLength(2);
    expect(deduped.map((r) => r.pushToken)).toEqual([
      'ExponentPushToken[AAA]',
      'ExponentPushToken[BBB]',
    ]);
  });

  it('a retried job yields the same batches (no duplicate sends)', () => {
    const recipients: DeliveryRecipient[] = Array.from({ length: 250 }, (_, i) => ({
      jobId: 'j1',
      deviceId: `d${i}`,
      pushToken: `ExponentPushToken[${i}]`,
    }));
    const first = buildDeliveryBatches(recipients);
    const retry = buildDeliveryBatches(recipients);
    expect(first).toEqual(retry);
  });

  it('respects the provider max batch size (100)', () => {
    const recipients: DeliveryRecipient[] = Array.from({ length: 250 }, (_, i) => ({
      jobId: 'j1',
      deviceId: `d${i}`,
      pushToken: `ExponentPushToken[${i}]`,
    }));
    const batches = buildDeliveryBatches(recipients);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(MAX_PUSH_BATCH_SIZE);
    expect(batches[2]).toHaveLength(50);
    expect(batches.every((b) => b.length <= MAX_PUSH_BATCH_SIZE)).toBe(true);
  });

  it('chunk rejects non-positive sizes', () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow(RangeError);
  });
});
