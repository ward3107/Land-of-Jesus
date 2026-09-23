-- analytics.test.sql
-- Verifies organization_analytics aggregates measured signals correctly and is
-- gated to org members. Runs first among the SQL tests (alphabetical) on a fresh
-- database; uses its own ids/slugs and cleans up after itself.

insert into auth.users (id, email, raw_user_meta_data) values
  ('6f666666-6666-6666-6666-666666666666', 'owner-e@example.com', '{"display_name":"Owner E"}'),
  ('7a777777-7777-7777-7777-777777777777', 'outsider-e@example.com', '{"display_name":"Outsider E"}');

-- Owner creates the org (membership + default channel via RPC).
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"6f666666-6666-6666-6666-666666666666","role":"authenticated"}', false);
select public.create_organization('Phase E Org', 'phase-e-org', 'Analytics test', 'Community', 'IL', 'en');
reset role;

select id as org_id from public.organizations where slug = 'phase-e-org' \gset

-- Fixtures inserted directly (as superuser, bypassing RLS) to exercise the
-- aggregates: 1 active follower, 1 SENT message, 1 COMPLETED job, delivery
-- attempts (2 accepted, 1 failed, 1 invalid), and join events (3 scans, 1 follow).
insert into public.organization_followers (organization_id, profile_id, active, language)
values (:'org_id', '6f666666-6666-6666-6666-666666666666', true, 'en');

insert into public.messages (id, organization_id, default_locale, state)
values ('6f666666-0000-0000-0000-0000000000a1', :'org_id', 'en', 'SENT');

insert into public.delivery_jobs (id, organization_id, message_id, idempotency_key, status, sent_count, failed_count, audience_size)
values ('6f666666-0000-0000-0000-0000000000b1', :'org_id', '6f666666-0000-0000-0000-0000000000a1',
        'analytics-test-job', 'COMPLETED', 2, 2, 4);

insert into public.delivery_attempts (job_id, organization_id, push_token, idempotency_key, status) values
  ('6f666666-0000-0000-0000-0000000000b1', :'org_id', 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]', 'att-1', 'SENT_TO_PROVIDER'),
  ('6f666666-0000-0000-0000-0000000000b1', :'org_id', 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]', 'att-2', 'DELIVERED'),
  ('6f666666-0000-0000-0000-0000000000b1', :'org_id', 'ExponentPushToken[cccccccccccccccccccccc]', 'att-3', 'FAILED'),
  ('6f666666-0000-0000-0000-0000000000b1', :'org_id', 'ExponentPushToken[dddddddddddddddddddddd]', 'att-4', 'TOKEN_INVALID');

insert into public.join_links (id, organization_id, code, campaign)
values ('6f666666-0000-0000-0000-0000000000c1', :'org_id', 'phase-e-code', 'whatsapp-migration');
insert into public.join_events (join_link_id, organization_id, event_type) values
  ('6f666666-0000-0000-0000-0000000000c1', :'org_id', 'scan'),
  ('6f666666-0000-0000-0000-0000000000c1', :'org_id', 'scan'),
  ('6f666666-0000-0000-0000-0000000000c1', :'org_id', 'scan'),
  ('6f666666-0000-0000-0000-0000000000c1', :'org_id', 'follow');

-- The owner (a member) reads the analytics.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"6f666666-6666-6666-6666-666666666666","role":"authenticated"}', false);

do $$
declare r record;
begin
  select * into r from public.organization_analytics(
    (select id from public.organizations where slug = 'phase-e-org'));
  if r.followers_active <> 1 then raise exception 'ANALYTICS1 FAIL: followers_active = % (want 1)', r.followers_active; end if;
  if r.messages_sent <> 1 then raise exception 'ANALYTICS1 FAIL: messages_sent = % (want 1)', r.messages_sent; end if;
  if r.jobs_completed <> 1 then raise exception 'ANALYTICS1 FAIL: jobs_completed = % (want 1)', r.jobs_completed; end if;
  if r.attempts_attempted <> 4 then raise exception 'ANALYTICS1 FAIL: attempts_attempted = % (want 4)', r.attempts_attempted; end if;
  if r.attempts_accepted <> 2 then raise exception 'ANALYTICS1 FAIL: attempts_accepted = % (want 2)', r.attempts_accepted; end if;
  if r.attempts_failed <> 1 then raise exception 'ANALYTICS1 FAIL: attempts_failed = % (want 1)', r.attempts_failed; end if;
  if r.attempts_invalid <> 1 then raise exception 'ANALYTICS1 FAIL: attempts_invalid = % (want 1)', r.attempts_invalid; end if;
  if r.join_scans <> 3 then raise exception 'ANALYTICS1 FAIL: join_scans = % (want 3)', r.join_scans; end if;
  if r.join_follows <> 1 then raise exception 'ANALYTICS1 FAIL: join_follows = % (want 1)', r.join_follows; end if;
  raise notice 'ANALYTICS1 PASS: measured aggregates are correct';
end $$;

-- An outsider (non-member) is refused.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"7a777777-7777-7777-7777-777777777777","role":"authenticated"}', false);
do $$
begin
  begin
    perform 1 from public.organization_analytics(
      (select id from public.organizations where slug = 'phase-e-org'));
    raise exception 'ANALYTICS2 FAIL: non-member could read analytics';
  exception
    when insufficient_privilege then
      raise notice 'ANALYTICS2 PASS: analytics refused to a non-member';
  end;
end $$;

-- Teardown.
reset role;
select set_config('request.jwt.claims', '', false);
delete from public.organizations where slug = 'phase-e-org'; -- cascades org-scoped rows
delete from public.profiles where id in
  ('6f666666-6666-6666-6666-666666666666', '7a777777-7777-7777-7777-777777777777');
delete from auth.users where id in
  ('6f666666-6666-6666-6666-666666666666', '7a777777-7777-7777-7777-777777777777');

select 'ALL ANALYTICS TESTS PASSED' as result;
