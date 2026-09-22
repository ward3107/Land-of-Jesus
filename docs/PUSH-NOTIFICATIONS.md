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
- **Rate control & retry** live in the worker: a configurable gap between
  provider requests and exponential backoff (`backoffMs`) on transient errors
  (`MessageRateExceeded`, `Unknown`, missing ticket) up to `maxAttempts`.
- **Invalid-token cleanup.** Tickets whose error is permanent
  (`DeviceNotRegistered`, `MismatchSenderId`) mark the token
  `is_valid = false`; it is never targeted again.

## Delivery worker (Phase D)

The worker lives in `apps/worker` and is vendor-neutral: the pure orchestration
is `runDeliveryJob` in `@communitydirect/push` (`pipeline.ts`), driven by a
`DeliveryPort` and a `NotificationProvider`. It is unit-tested end-to-end with an
in-memory store + mock provider (18 cases: happy path, dedupe, segment/quiet-hour
skips, invalid-token cleanup, transient retry/backoff, partial failure,
idempotent re-run). Production wiring is `SupabaseDeliveryStore` (service-role)
+ `ExpoPushProvider`.

One tick:

1. `enqueue_due_scheduled(now)` promotes due one-off `SCHEDULED` messages to jobs;
   recurring `scheduled_messages` fire via `computeNextRun` (DST-correct) which
   advances `next_run_at`.
2. `claim_delivery_jobs(limit)` leases `PENDING`/`QUEUED` jobs with
   `FOR UPDATE SKIP LOCKED` (safe for concurrent workers).
3. For each job: `resolve_delivery_audience` (SQL) returns candidate
   device/token rows; the worker applies the **segment** and
   **notification-preference** gates in TypeScript with the *same*
   `matchesSegment` / `shouldNotify` the composer preview uses (no preview↔send
   drift), batches, sends, records attempts, and calls `finalize_delivery_job`.

Run it: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpm --filter
@communitydirect/worker start` (add `-- --loop` to poll). The service-role key
bypasses RLS, so it lives only in the worker's environment — never committed,
never shipped to a client (see [SECURITY.md](./SECURITY.md)).

## Measured analytics only

We record what a provider can actually report: accepted-by-provider (ticket ok),
delivery receipts where available, and token invalidation. We do **not** invent
open/tap metrics the transport cannot measure (see
[DECISIONS.md](./DECISIONS.md)).

## Web Push (future)

The same `NotificationProvider` seam accepts a `WebPushProvider` later; the MVP
targets the native app and does not block on it.
