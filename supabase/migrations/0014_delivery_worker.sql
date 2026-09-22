-- 0014_delivery_worker.sql
-- Server-side delivery worker RPCs. These are SECURITY DEFINER and worker-only:
-- they are callable exclusively with the service_role JWT (the trusted backend),
-- never by an end user. They provide the three operations the pipeline cannot do
-- from ordinary RLS-scoped queries:
--   1. claim_delivery_jobs   — atomically lease PENDING jobs (skip-locked).
--   2. resolve_delivery_audience — join followers → channels → devices → tokens.
--   3. enqueue_due_scheduled — promote due one-off SCHEDULED messages to jobs.
--   4. finalize_delivery_job — record counts and advance the message state.
-- See docs/PUSH-NOTIFICATIONS.md §Delivery worker.

-- Only the service_role JWT may act as the worker.
create or replace function app.assert_worker()
returns void
language plpgsql
stable
as $$
begin
  if coalesce(auth.role(), 'anon') <> 'service_role' then
    raise exception 'worker-only function' using errcode = 'insufficient_privilege';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Atomically claim a batch of pending jobs. `for update skip locked` lets
--    several worker instances run concurrently without double-processing a job.
-- ---------------------------------------------------------------------------
create or replace function public.claim_delivery_jobs(p_limit int default 10)
returns setof public.delivery_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform app.assert_worker();

  return query
  update public.delivery_jobs j
  set status = 'PROCESSING', started_at = coalesce(j.started_at, now())
  where j.id in (
    select d.id from public.delivery_jobs d
    where d.status in ('PENDING', 'QUEUED')
    order by d.created_at
    limit greatest(p_limit, 0)
    for update skip locked
  )
  returning j.*;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Resolve a job's candidate audience: one row per (device, valid token) for
--    active followers who opted into at least one of the message's channels.
--    Follower attributes + subscribed channels come back so the worker can apply
--    the segment and notification-preference gates in TypeScript (the same pure
--    logic the composer preview uses — see docs/DECISIONS.md).
-- ---------------------------------------------------------------------------
create or replace function public.resolve_delivery_audience(p_job_id uuid)
returns table (
  profile_id uuid,
  device_id uuid,
  push_token text,
  provider text,
  device_locale text,
  follower_language text,
  follower_location text,
  follower_tags text[],
  follower_signup_source text,
  channel_ids uuid[]
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_message uuid;
begin
  perform app.assert_worker();

  select dj.organization_id, dj.message_id into v_org, v_message
  from public.delivery_jobs dj where dj.id = p_job_id;
  if v_message is null then
    return;
  end if;

  return query
  select
    f.profile_id,
    d.id,
    pt.token,
    pt.provider,
    d.locale,
    f.language,
    f.location,
    f.tags,
    f.signup_source,
    array_agg(distinct cs.channel_id)
  from public.organization_followers f
  join public.channel_subscriptions cs
    on cs.profile_id = f.profile_id and cs.organization_id = v_org and cs.active
  join public.message_channels mc
    on mc.channel_id = cs.channel_id and mc.message_id = v_message
  join public.devices d on d.profile_id = f.profile_id
  join public.push_tokens pt on pt.device_id = d.id and pt.is_valid
  where f.organization_id = v_org and f.active
  group by f.profile_id, d.id, pt.token, pt.provider, d.locale,
           f.language, f.location, f.tags, f.signup_source;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Promote due one-off SCHEDULED messages (scheduled_at in the past) into
--    delivery jobs. The idempotency key matches enqueue_message(), so a message
--    already enqueued for the same instant is never double-queued.
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_due_scheduled(p_now timestamptz default now())
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int := 0;
  r record;
  v_key text;
begin
  perform app.assert_worker();

  for r in
    select m.id, m.organization_id, m.scheduled_at
    from public.messages m
    where m.state = 'SCHEDULED'
      and m.scheduled_at is not null
      and m.scheduled_at <= p_now
    for update skip locked
  loop
    v_key := 'msg:' || r.id::text || ':at:' || coalesce(r.scheduled_at::text, 'now');

    insert into public.delivery_jobs (organization_id, message_id, idempotency_key, status)
    values (r.organization_id, r.id, v_key, 'PENDING')
    on conflict (idempotency_key) do nothing;

    update public.messages set state = 'QUEUED', locked_at = now() where id = r.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Record a job's terminal outcome and advance the message state. Only a
--    mid-flight message (QUEUED/PROCESSING) is advanced, so a concurrent path
--    cannot be clobbered. Content stays frozen (enforced by trg_messages_freeze).
-- ---------------------------------------------------------------------------
create or replace function public.finalize_delivery_job(
  p_job_id uuid,
  p_sent int,
  p_failed int,
  p_status app.delivery_job_status,
  p_message_state app.message_state
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_message uuid;
begin
  perform app.assert_worker();

  update public.delivery_jobs
  set status = p_status,
      sent_count = p_sent,
      failed_count = p_failed,
      audience_size = coalesce(audience_size, p_sent + p_failed),
      completed_at = now()
  where id = p_job_id
  returning message_id into v_message;

  if v_message is not null then
    update public.messages
    set state = p_message_state
    where id = v_message and state in ('QUEUED', 'PROCESSING');
  end if;
end;
$$;

-- Worker-only: lock these down to service_role (the function bodies also assert).
revoke execute on function
  public.claim_delivery_jobs(int),
  public.resolve_delivery_audience(uuid),
  public.enqueue_due_scheduled(timestamptz),
  public.finalize_delivery_job(uuid, int, int, app.delivery_job_status, app.message_state)
from public, anon, authenticated;

grant execute on function
  public.claim_delivery_jobs(int),
  public.resolve_delivery_audience(uuid),
  public.enqueue_due_scheduled(timestamptz),
  public.finalize_delivery_job(uuid, int, int, app.delivery_job_status, app.message_state)
to service_role;
