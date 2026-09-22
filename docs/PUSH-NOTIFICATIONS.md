# Push notifications

The app's own push system is the **primary** channel. Everything is built behind
a vendor-neutral abstraction so FCM/APNs/OneSignal/Web Push can be added later
without touching business logic.

## The abstraction

`packages/push` defines:

```ts
interface NotificationProvider {
  readonly name: string;
  send(messages: readonly PushMessage[]): Promise<SendResult>;
}
```

`ExpoPushProvider` implements it for the MVP. Its HTTP transport is **injectable**
(`ExpoTransport`), so it is fully unit-tested without network and can be mocked
in CI or run behind a proxy.

`SendResult` returns per-message `tickets` and a list of `invalidTokens` the
worker must purge.

## Data model

```
profile ─< devices ─< push_tokens
```

A user may have many devices; each device has a current token. Tokens expire and
are invalidated automatically: when a provider reports `DeviceNotRegistered`
(app uninstalled) or `MismatchSenderId`, the worker sets
`push_tokens.is_valid = false` with a reason, and that token is never targeted
again.

## Delivery pipeline & idempotency

```
enqueue_message (RPC) ─▶ delivery_jobs (idempotency_key UNIQUE)
   worker resolves audience: segment rules → active followers → channel opt-in
                             → devices → valid tokens
   ─▶ delivery_batches (≤ MAX_PUSH_BATCH_SIZE = 100)
   ─▶ provider.send(batch)
   ─▶ delivery_attempts (idempotency_key = dj:<jobId>:dev:<deviceId>, UNIQUE)
```

- **No browser fan-out.** A request only *enqueues*; the worker fans out.
- **Exactly-once under retries.** `deliveryIdempotencyKey(jobId, deviceId)` +
  the `UNIQUE` attempt key mean a retried job/batch upserts existing attempts
  instead of re-sending. `buildDeliveryBatches` also de-dupes a device that
  matches an audience through multiple channels.
- **Rate control & retry** live in the worker (Phase D): bounded concurrency,
  exponential backoff on `MessageRateExceeded`, receipts checked asynchronously.

## Measured analytics only

We record what a provider can actually report: accepted-by-provider (ticket ok),
delivery receipts where available, and token invalidation. We do **not** invent
open/tap metrics the transport cannot measure (see
[DECISIONS.md](./DECISIONS.md)).

## Web Push (future)

The same `NotificationProvider` seam accepts a `WebPushProvider` later; the MVP
targets the native app and does not block on it.
