# Runbooks

Operational procedures for CommunityDirect. Keep this current; it is the first
thing to reach for during an incident.

## Environments

| Env | Supabase project | Admin (Vercel) | Worker |
|-----|------------------|----------------|--------|
| **local** | ephemeral (`scripts/db-verify.sh`) or `supabase start` | `pnpm --filter @communitydirect/admin dev` | `pnpm --filter @communitydirect/worker start` |
| **staging** | a dedicated Supabase project | Vercel preview / a `staging` project | worker with staging env |
| **production** | production Supabase project | Vercel production | scheduled worker |

Each environment has its **own** Supabase project and its own secrets. Never
point staging at production data.

### Setting up staging

1. Create a new Supabase project; apply migrations in order
   (`supabase db push`, or run `supabase/migrations/*.sql` sequentially).
2. Set the admin env (Vercel project or `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.
3. Set the worker env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   optionally `EXPO_ACCESS_TOKEN`, `WORKER_BATCH_LIMIT`,
   `WORKER_BATCH_INTERVAL_MS`, `WORKER_POLL_INTERVAL_MS`.
4. Verify RLS/migrations: `bash scripts/db-verify.sh` against a throwaway DB
   mirrors what CI runs.

Secrets live only in the environment (Vercel/hosting secret store). `.env*` is
git-ignored; only `.env.example` is committed. The **service-role key** bypasses
RLS — keep it to the worker/server, never a client bundle.

## Deploying

- **Admin (web):** merges to `main` deploy via Vercel. CI (`.github/workflows/ci.yml`)
  must be green: lint · typecheck · test · build, migrations/RLS, and Playwright E2E.
- **Database:** apply new `supabase/migrations/*.sql` in order before/with the
  deploy. Migrations are additive and ordered; never edit a merged migration —
  add a new one.
- **Worker:** deploy `apps/worker` (runs via `tsx`); provide the server env above.

## Running the delivery worker

- One pass: `pnpm --filter @communitydirect/worker start`
- Continuous: `pnpm --filter @communitydirect/worker start -- --loop`
  (`WORKER_POLL_INTERVAL_MS`, default 5000).

Each tick promotes due schedules (`enqueue_due_scheduled` + recurring),
claims pending jobs (`claim_delivery_jobs`, `FOR UPDATE SKIP LOCKED` — safe to
run multiple workers), and delivers with retry/backoff, rate control and
invalid-token cleanup. Delivery is idempotent, so a crashed tick is safe to
re-run.

## Retention job

Run periodically (e.g. daily cron) with the service-role env:

```sql
select public.purge_expired_data(90, 180); -- attempts>90d, join_events>180d
```

or from any service-role client. It returns the deleted counts.

## Real device push test

`pnpm --filter @communitydirect/worker test-push -- 'ExponentPushToken[…]'` sends
one push through the production provider and prints the ticket. Use it to confirm
delivery on a physical device (see [PUSH-NOTIFICATIONS.md](./PUSH-NOTIFICATIONS.md)).

## Incident response

1. **A message isn't delivering.**
   - Check the message state and its `delivery_jobs` row (admin → Analytics →
     Recent sends). `FAILED`/`PARTIALLY_FAILED` → inspect `delivery_attempts`.
   - Is the org suspended? A suspended org can't send (banner in admin).
   - Rate limited? Sends are capped at 60/hour/org; wait for the window.
   - Worker running? Jobs stuck in `PENDING`/`PROCESSING` mean the worker isn't
     ticking — restart it. Re-running is safe (idempotent).
2. **Vulnerable dependency blocks a Vercel deploy.** Vercel's security gate can
   fail an otherwise-good build (e.g. a Next.js CVE). Bump to the patched version
   on the same minor line, validate locally (typecheck/lint/build/E2E), and push.
3. **Bad deploy / regression.** Roll back the Vercel deployment to the previous
   production build. Code fixes go through a normal PR; never edit a merged
   migration — add a corrective migration.
4. **Abuse.** Triage `abuse_reports` (platform admin). Suspend an org by setting
   `organizations.is_suspended = true` as a platform admin; it can no longer send.

## Rollback notes

- **Web:** Vercel keeps prior deployments — promote the last good one.
- **Database:** forward-only. Write a new migration that reverses the change;
  do not delete or rewrite a merged migration (checkouts depend on it).
- **Worker:** redeploy the previous revision; in-flight jobs remain idempotent.
