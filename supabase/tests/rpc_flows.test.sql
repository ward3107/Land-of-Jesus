-- rpc_flows.test.sql
-- Integration test for the Phase B RPC flows, exercised as real authenticated
-- users through RLS + SECURITY DEFINER RPCs:
--   create_organization → membership/default channel → follow_organization
--   → channel_subscriptions → message + enqueue_message (idempotent).
-- Run with psql -v ON_ERROR_STOP=1. Prints "ALL RPC FLOW TESTS PASSED".
--
-- Note: psql does not interpolate :'vars' inside DO blocks, so assertions look
-- the org up by its known slug and the message up by its fixed id.

insert into auth.users (id, email, raw_user_meta_data) values
  ('1a111111-1111-1111-1111-111111111111', 'owner-b@example.com', '{"display_name":"Owner B"}'),
  ('2b222222-2222-2222-2222-222222222222', 'sub-b@example.com', '{"display_name":"Sub B"}');

-- ==========================================================================
-- Step 1: U1 creates an organization via the RPC.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"1a111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
select public.create_organization('Phase B Church', 'phase-b-church', 'A test org', 'Community', 'IL', 'ar');

reset role;
select id as org_id from public.organizations where slug = 'phase-b-church' \gset
select id as chan_id from public.channels where organization_id = :'org_id' and is_default \gset

do $$
declare v_members int; v_channels int; v_audit int;
begin
  select count(*) into v_members from public.organization_members
    where organization_id = (select id from public.organizations where slug = 'phase-b-church')
      and profile_id = '1a111111-1111-1111-1111-111111111111'
      and role = 'ORGANIZATION_OWNER';
  if v_members <> 1 then raise exception 'FLOW1 FAIL: owner membership not created (got %)', v_members; end if;

  select count(*) into v_channels from public.channels
    where organization_id = (select id from public.organizations where slug = 'phase-b-church') and is_default;
  if v_channels <> 1 then raise exception 'FLOW1 FAIL: default channel not created (got %)', v_channels; end if;

  select count(*) into v_audit from public.audit_logs
    where organization_id = (select id from public.organizations where slug = 'phase-b-church')
      and action = 'organization.created';
  if v_audit <> 1 then raise exception 'FLOW1 FAIL: audit log not written'; end if;

  raise notice 'FLOW1 PASS: create_organization set up org, owner, default channel, audit';
end $$;

-- ==========================================================================
-- Step 2: U1 authors a message and enqueues it (idempotent).
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"1a111111-1111-1111-1111-111111111111","role":"authenticated"}', false);

insert into public.messages (id, organization_id, default_locale, state)
values ('11111111-2222-3333-4444-555555555555', :'org_id', 'ar', 'DRAFT');
insert into public.message_translations (message_id, locale, title, body)
values ('11111111-2222-3333-4444-555555555555', 'ar', 'صباح الخير', 'نهارك سعيد');
insert into public.message_channels (message_id, channel_id)
values ('11111111-2222-3333-4444-555555555555', :'chan_id');

select public.enqueue_message('11111111-2222-3333-4444-555555555555');
select public.enqueue_message('11111111-2222-3333-4444-555555555555');

reset role;
do $$
declare v_state app.message_state; v_jobs int;
begin
  select state into v_state from public.messages where id = '11111111-2222-3333-4444-555555555555';
  if v_state <> 'QUEUED' then raise exception 'FLOW2 FAIL: message not QUEUED (got %)', v_state; end if;

  select count(*) into v_jobs from public.delivery_jobs
    where message_id = '11111111-2222-3333-4444-555555555555';
  if v_jobs <> 1 then raise exception 'FLOW2 FAIL: enqueue not idempotent (% jobs)', v_jobs; end if;

  raise notice 'FLOW2 PASS: message queued once, enqueue is idempotent';
end $$;

-- ==========================================================================
-- Step 3: U2 follows the org and opts into the default channel.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"2b222222-2222-2222-2222-222222222222","role":"authenticated"}', false);

select public.follow_organization(:'org_id', 'ar', 'qr:campaign-a');
insert into public.channel_subscriptions (organization_id, channel_id, profile_id)
values (:'org_id', :'chan_id', '2b222222-2222-2222-2222-222222222222');

reset role;
do $$
declare v_follow int; v_active boolean; v_sub int;
begin
  select count(*), bool_or(active) into v_follow, v_active from public.organization_followers
    where organization_id = (select id from public.organizations where slug = 'phase-b-church')
      and profile_id = '2b222222-2222-2222-2222-222222222222';
  if v_follow <> 1 or not v_active then raise exception 'FLOW3 FAIL: follow not active'; end if;

  select count(*) into v_sub from public.channel_subscriptions
    where profile_id = '2b222222-2222-2222-2222-222222222222' and active
      and channel_id = (
        select id from public.channels
        where organization_id = (select id from public.organizations where slug = 'phase-b-church')
          and is_default
      );
  if v_sub <> 1 then raise exception 'FLOW3 FAIL: channel opt-in missing'; end if;

  raise notice 'FLOW3 PASS: subscriber followed org and opted into channel';
end $$;

-- ==========================================================================
-- Step 4: idempotent re-follow (unfollow then follow reactivates one row).
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"2b222222-2222-2222-2222-222222222222","role":"authenticated"}', false);
select public.unfollow_organization(:'org_id');
select public.follow_organization(:'org_id', 'ar', 'qr:campaign-a');

reset role;
do $$
declare v_rows int; v_active boolean;
begin
  select count(*), bool_or(active) into v_rows, v_active from public.organization_followers
    where organization_id = (select id from public.organizations where slug = 'phase-b-church')
      and profile_id = '2b222222-2222-2222-2222-222222222222';
  if v_rows <> 1 then raise exception 'FLOW4 FAIL: re-follow duplicated rows (%)', v_rows; end if;
  if not v_active then raise exception 'FLOW4 FAIL: re-follow did not reactivate'; end if;
  raise notice 'FLOW4 PASS: unfollow/re-follow keeps a single, reactivated row';
end $$;

reset role;
select 'ALL RPC FLOW TESTS PASSED' as result;
