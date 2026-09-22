-- delivery_pipeline.test.sql
-- Integration test for the Phase D delivery worker RPCs, exercised end to end:
--   create_organization → follow + channel opt-in + device + push token →
--   author message → enqueue_message → (as service_role) claim_delivery_jobs →
--   resolve_delivery_audience → finalize_delivery_job → SENT.
-- Also covers enqueue_due_scheduled and the worker-only guard.
-- Run with psql -v ON_ERROR_STOP=1. Prints "ALL DELIVERY PIPELINE TESTS PASSED".
--
-- Runs first among the SQL tests (alphabetical) on a freshly-migrated database;
-- uses its own ids/slugs so it never collides with the other test files.

insert into auth.users (id, email, raw_user_meta_data) values
  ('4d444444-4444-4444-4444-444444444444', 'owner-d@example.com', '{"display_name":"Owner D"}'),
  ('5e555555-5555-5555-5555-555555555555', 'sub-d@example.com', '{"display_name":"Sub D"}');

-- ==========================================================================
-- Step 1: owner creates an org (owner membership + default channel via RPC).
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"4d444444-4444-4444-4444-444444444444","role":"authenticated"}', false);
select public.create_organization('Phase D Church', 'phase-d-church', 'Delivery test org', 'Community', 'IL', 'en');

reset role;
select id as org_id from public.organizations where slug = 'phase-d-church' \gset
select id as chan_id from public.channels where organization_id = :'org_id' and is_default \gset

-- ==========================================================================
-- Step 2: subscriber follows, opts into the default channel, registers a
--         device and a valid push token (all self-owned under RLS).
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"5e555555-5555-5555-5555-555555555555","role":"authenticated"}', false);

select public.follow_organization(:'org_id', 'en', 'qr:phase-d');
insert into public.channel_subscriptions (organization_id, channel_id, profile_id)
values (:'org_id', :'chan_id', '5e555555-5555-5555-5555-555555555555');
insert into public.devices (id, profile_id, platform, install_id, locale)
values ('5e555555-0000-0000-0000-000000000001', '5e555555-5555-5555-5555-555555555555', 'ios', 'install-d', 'en');
insert into public.push_tokens (device_id, profile_id, provider, token, is_valid)
values ('5e555555-0000-0000-0000-000000000001', '5e555555-5555-5555-5555-555555555555', 'expo',
        'ExponentPushToken[dddddddddddddddddddddd]', true);

-- ==========================================================================
-- Step 3: owner authors an immediate message and enqueues it.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"4d444444-4444-4444-4444-444444444444","role":"authenticated"}', false);

insert into public.messages (id, organization_id, default_locale, state)
values ('44444444-5555-6666-7777-888888888888', :'org_id', 'en', 'DRAFT');
insert into public.message_translations (message_id, locale, title, body)
values ('44444444-5555-6666-7777-888888888888', 'en', 'Service tonight', 'Doors open at 7pm.');
insert into public.message_channels (message_id, channel_id)
values ('44444444-5555-6666-7777-888888888888', :'chan_id');

select public.enqueue_message('44444444-5555-6666-7777-888888888888');

reset role;
select id as job_now from public.delivery_jobs
  where message_id = '44444444-5555-6666-7777-888888888888' \gset

-- ==========================================================================
-- Step 4: the worker (service_role) claims the job, resolves the audience,
--         and finalizes it.
-- ==========================================================================
select set_config('request.jwt.claims', '{"role":"service_role"}', false);

do $$
declare v_claimed int;
begin
  select count(*) into v_claimed from public.claim_delivery_jobs(10)
    where message_id = '44444444-5555-6666-7777-888888888888';
  if v_claimed <> 1 then raise exception 'DELIVERY1 FAIL: expected to claim 1 job (got %)', v_claimed; end if;
  raise notice 'DELIVERY1 PASS: worker claimed the pending job';
end $$;

do $$
declare v_aud int; v_token text; v_job uuid;
begin
  select id into v_job from public.delivery_jobs
    where message_id = '44444444-5555-6666-7777-888888888888';
  select count(*), min(push_token) into v_aud, v_token
    from public.resolve_delivery_audience(v_job);
  if v_aud <> 1 then raise exception 'DELIVERY2 FAIL: expected 1 audience row (got %)', v_aud; end if;
  if v_token <> 'ExponentPushToken[dddddddddddddddddddddd]' then
    raise exception 'DELIVERY2 FAIL: wrong token resolved (%)', v_token; end if;
  raise notice 'DELIVERY2 PASS: audience resolved to the subscriber''s valid token';
end $$;

select public.finalize_delivery_job(:'job_now', 1, 0, 'COMPLETED', 'SENT');

do $$
declare v_state app.message_state; v_status app.delivery_job_status; v_sent int;
begin
  select state into v_state from public.messages where id = '44444444-5555-6666-7777-888888888888';
  if v_state <> 'SENT' then raise exception 'DELIVERY3 FAIL: message not SENT (got %)', v_state; end if;

  select status, sent_count into v_status, v_sent from public.delivery_jobs
    where message_id = '44444444-5555-6666-7777-888888888888';
  if v_status <> 'COMPLETED' or v_sent <> 1 then
    raise exception 'DELIVERY3 FAIL: job not completed with 1 sent (status % sent %)', v_status, v_sent; end if;
  raise notice 'DELIVERY3 PASS: job completed, message SENT, sent_count=1';
end $$;

-- ==========================================================================
-- Step 5: a due one-off SCHEDULED message is promoted by enqueue_due_scheduled.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"4d444444-4444-4444-4444-444444444444","role":"authenticated"}', false);
insert into public.messages (id, organization_id, default_locale, state, scheduled_at)
values ('44444444-5555-6666-7777-999999999999', :'org_id', 'en', 'SCHEDULED', now() - interval '1 minute');
insert into public.message_translations (message_id, locale, title, body)
values ('44444444-5555-6666-7777-999999999999', 'en', 'Reminder', 'Bring a friend.');
insert into public.message_channels (message_id, channel_id)
values ('44444444-5555-6666-7777-999999999999', :'chan_id');

reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', false);
select public.enqueue_due_scheduled(now());

do $$
declare v_state app.message_state; v_jobs int;
begin
  select state into v_state from public.messages where id = '44444444-5555-6666-7777-999999999999';
  if v_state <> 'QUEUED' then raise exception 'DELIVERY4 FAIL: scheduled message not QUEUED (got %)', v_state; end if;
  select count(*) into v_jobs from public.delivery_jobs where message_id = '44444444-5555-6666-7777-999999999999';
  if v_jobs <> 1 then raise exception 'DELIVERY4 FAIL: due message not enqueued (% jobs)', v_jobs; end if;
  raise notice 'DELIVERY4 PASS: due scheduled message promoted to a job';
end $$;

-- ==========================================================================
-- Step 6: the worker RPCs are refused to a non-service-role caller.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"5e555555-5555-5555-5555-555555555555","role":"authenticated"}', false);
do $$
begin
  begin
    perform 1 from public.claim_delivery_jobs(10);
    raise exception 'DELIVERY5 FAIL: authenticated user was allowed to claim jobs';
  exception
    when insufficient_privilege then
      raise notice 'DELIVERY5 PASS: worker RPC refused to a non-service-role caller';
  end;
end $$;

-- ==========================================================================
-- Teardown: db-verify runs every *.test.sql against one shared database, so
-- this test removes its own fixtures to stay isolated from the other files.
-- ==========================================================================
reset role;
select set_config('request.jwt.claims', '', false);
delete from public.organizations where slug = 'phase-d-church'; -- cascades org-scoped rows
delete from public.push_tokens where profile_id = '5e555555-5555-5555-5555-555555555555';
delete from public.devices where profile_id = '5e555555-5555-5555-5555-555555555555';
delete from public.profiles where id in
  ('4d444444-4444-4444-4444-444444444444', '5e555555-5555-5555-5555-555555555555');
delete from auth.users where id in
  ('4d444444-4444-4444-4444-444444444444', '5e555555-5555-5555-5555-555555555555');

select 'ALL DELIVERY PIPELINE TESTS PASSED' as result;
