# Database

PostgreSQL (via Supabase). Every tenant-scoped row carries an `organization_id`
and is gated by RLS. Enums and helper functions live in a private `app` schema;
data lives in `public`.

## Migrations

Ordered SQL in `supabase/migrations/`:

| File | Contents |
| --- | --- |
| `0001_extensions_and_enums.sql` | `pgcrypto`, `citext`, `app` schema, enums, `set_updated_at`. |
| `0002_profiles_organizations.sql` | `profiles`, `organizations`, `organization_members`, `organization_verifications`. |
| `0003_channels_followers.sql` | `channels`, `organization_followers`, `channel_subscriptions`, `notification_preferences`. |
| `0004_devices_push_tokens.sql` | `devices`, `push_tokens`. |
| `0005_messages_media.sql` | `media_assets`, `segments`, `segment_rules`, `messages`, `message_translations`, `message_channels`. |
| `0006_delivery_pipeline.sql` | `scheduled_messages`, `delivery_jobs`, `delivery_batches`, `delivery_attempts`. |
| `0007_join_audit.sql` | `join_links`, `join_events`, `audit_logs`, `security_events`. |
| `0008_tenancy_helpers.sql` | `SECURITY DEFINER` helpers: `is_org_member`, `has_org_role`, `can_*`. |
| `0009_triggers_logic.sql` | `handle_new_user`, message content freeze. |
| `0010_roles_grants.sql` | `anon` / `authenticated` / `service_role` grants. |
| `0011_rls_policies.sql` | Enable RLS + all policies + privilege-escalation guard. |
| `0012_rpc.sql` | `create_organization`, `follow_organization`, `enqueue_message`, … |
| `0013_enqueue_idempotent.sql` | Make `enqueue_message` a true no-op on retry (idempotent re-enqueue). |

## Entity map

```
auth.users 1─1 profiles ─┬─< organization_members >─ organizations ─┬─< channels
                          │                                          ├─< segments ─< segment_rules
                          ├─< organization_followers >───────────────┤
                          ├─< channel_subscriptions >─── channels     ├─< messages ─┬─< message_translations
                          ├─< devices ─< push_tokens                   │             └─< message_channels
                          └─< notification_preferences                 ├─< media_assets
                                                                       ├─< scheduled_messages
organizations ─< delivery_jobs ─< delivery_batches ─< delivery_attempts
organizations ─< join_links ─< join_events
organizations ─< audit_logs        (platform) security_events
```

## Key modelling decisions

- **Tenant key everywhere.** Delivery tables carry a redundant `organization_id`
  so RLS is a single-column predicate (fast, no joins in the hot path).
- **Explicit consent, retained history.** Unfollowing sets
  `organization_followers.active = false` (with `unfollowed_at`) rather than
  deleting — we keep the consent trail without keeping people subscribed.
- **Idempotency in the schema.** `delivery_jobs.idempotency_key` and
  `delivery_attempts.idempotency_key` are `UNIQUE`; retries upsert, never
  duplicate. The attempt key equals `deliveryIdempotencyKey(jobId, deviceId)`
  from `@communitydirect/core`.
- **Segments as data.** A `segment` + `segment_rules` mirror the rule model in
  `@communitydirect/core`, so previews (in-memory) and delivery (SQL) agree.
- **Minimal PII.** No phone numbers. Device rows are visible only to their owner.

## Generating TypeScript types

```bash
supabase gen types typescript --local > packages/core/src/database.types.ts
```

Until a project is linked, `packages/core/src/database.types.ts` is maintained by
hand in sync with these migrations and consumed by the typed Supabase clients.

## Delivery worker functions (migration `0014`)

Four SECURITY DEFINER functions, callable **only** with the `service_role` JWT
(each asserts `app.assert_worker()` and execute is revoked from
`anon`/`authenticated`):

- `claim_delivery_jobs(limit)` — atomically lease `PENDING`/`QUEUED` jobs to
  `PROCESSING` using `FOR UPDATE SKIP LOCKED` (concurrency-safe).
- `resolve_delivery_audience(job_id)` — one row per (device, valid token) for
  active followers who opted into a targeted channel, with follower attributes so
  the worker applies segment + preference gates in TypeScript.
- `enqueue_due_scheduled(now)` — promote due one-off `SCHEDULED` messages to jobs
  (idempotency key matches `enqueue_message`, so no double-queue).
- `finalize_delivery_job(job_id, sent, failed, status, message_state)` — record
  counts and advance the (mid-flight) message state; content stays frozen.

## Integration tests

`supabase/tests/rpc_flows.test.sql` exercises the full Phase B flow as real
authenticated users through RLS + the SECURITY DEFINER RPCs. `supabase/tests/
delivery_pipeline.test.sql` (Phase D) drives a message from
`enqueue_message` → `claim_delivery_jobs` → `resolve_delivery_audience` →
`finalize_delivery_job` → `SENT`, plus `enqueue_due_scheduled` and the
worker-only guard. Run all with `bash scripts/db-verify.sh`.
