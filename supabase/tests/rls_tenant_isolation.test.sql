-- rls_tenant_isolation.test.sql
-- Proves the multi-tenant isolation invariant end-to-end against real RLS.
-- Run with psql -v ON_ERROR_STOP=1: any failed assertion RAISEs and aborts the
-- run with a non-zero exit code. Prints "ALL RLS TESTS PASSED" on success.
--
-- Fixed identities:
--   A_OWNER 111... owns ORG_A       B_OWNER 222... owns ORG_B
--   SUB     333... follows ORG_A    PLAT    444... is a platform admin

-- --------------------------------------------------------------------------
-- Seed (as the migration superuser, bypassing RLS).
-- --------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a-owner@example.com', '{"display_name":"A Owner"}'),
  ('22222222-2222-2222-2222-222222222222', 'b-owner@example.com', '{"display_name":"B Owner"}'),
  ('33333333-3333-3333-3333-333333333333', 'sub@example.com', '{"display_name":"Sub"}'),
  ('44444444-4444-4444-4444-444444444444', 'plat@example.com', '{"display_name":"Platform"}');

update public.profiles set is_platform_admin = true
  where id = '44444444-4444-4444-4444-444444444444';

insert into public.organizations (id, name, slug, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Org A', 'org-a', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Org B', 'org-b', '22222222-2222-2222-2222-222222222222');

insert into public.organization_members (organization_id, profile_id, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'ORGANIZATION_OWNER'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'ORGANIZATION_OWNER');

insert into public.channels (id, organization_id, name, slug, is_default) values
  ('acacacac-acac-acac-acac-acacacacacac', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Daily', 'daily', true),
  ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Daily', 'daily', true);

insert into public.messages (id, organization_id, default_locale, state, created_by) values
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en', 'DRAFT', '11111111-1111-1111-1111-111111111111'),
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'en', 'DRAFT', '22222222-2222-2222-2222-222222222222');

insert into public.organization_followers (organization_id, profile_id, active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', true);

-- Helper to impersonate a user for the current transaction.
-- (Inlined per-test below via set local role + request.jwt.claims.)

-- ==========================================================================
-- TEST 1: Org A owner sees only Org A's message.
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  do $$
  declare n int;
  begin
    select count(*) into n from public.messages;
    if n <> 1 then raise exception 'TEST1 FAIL: A owner sees % messages, expected 1', n; end if;
    if not exists (select 1 from public.messages where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then
      raise exception 'TEST1 FAIL: A owner cannot see own org message';
    end if;
    raise notice 'TEST1 PASS: A owner sees only its own org message';
  end $$;
rollback;

-- ==========================================================================
-- TEST 2: Org B owner sees only Org B's message.
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  do $$
  declare n int;
  begin
    select count(*) into n from public.messages;
    if n <> 1 then raise exception 'TEST2 FAIL: B owner sees % messages, expected 1', n; end if;
    if exists (select 1 from public.messages where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then
      raise exception 'TEST2 FAIL: B owner can see org A message (LEAK)';
    end if;
    raise notice 'TEST2 PASS: B owner cannot see org A data';
  end $$;
rollback;

-- ==========================================================================
-- TEST 3: Org A owner CANNOT write into Org B (WITH CHECK denies).
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  do $$
  declare blocked boolean := false;
  begin
    begin
      insert into public.messages (organization_id, default_locale, state)
      values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'en', 'DRAFT');
    exception when insufficient_privilege or check_violation then
      blocked := true;
    end;
    if not blocked then raise exception 'TEST3 FAIL: A owner inserted into org B (CROSS-TENANT WRITE)'; end if;
    raise notice 'TEST3 PASS: cross-tenant write blocked by RLS';
  end $$;
rollback;

-- ==========================================================================
-- TEST 4: A plain subscriber sees no admin data but sees public orgs + own follow.
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  do $$
  declare n_msgs int; n_orgs int; n_follow int;
  begin
    select count(*) into n_msgs from public.messages;
    if n_msgs <> 0 then raise exception 'TEST4 FAIL: subscriber sees % messages, expected 0', n_msgs; end if;
    select count(*) into n_orgs from public.organizations;
    if n_orgs < 2 then raise exception 'TEST4 FAIL: subscriber cannot discover public orgs'; end if;
    select count(*) into n_follow from public.organization_followers;
    if n_follow <> 1 then raise exception 'TEST4 FAIL: subscriber sees % follow rows, expected 1 (own)', n_follow; end if;
    raise notice 'TEST4 PASS: subscriber is confined to public data + own records';
  end $$;
rollback;

-- ==========================================================================
-- TEST 5: Platform admin sees across all tenants.
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
  do $$
  declare n int;
  begin
    select count(*) into n from public.messages;
    if n <> 2 then raise exception 'TEST5 FAIL: platform admin sees % messages, expected 2', n; end if;
    raise notice 'TEST5 PASS: platform admin has cross-tenant visibility';
  end $$;
rollback;

-- ==========================================================================
-- TEST 6: Message content freeze once delivery has begun.
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
  do $$
  declare frozen boolean := false;
  begin
    -- DRAFT -> QUEUED is allowed (no content change).
    update public.messages set state = 'QUEUED'
      where id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
    -- Editing content after QUEUED must be rejected by the freeze trigger.
    begin
      update public.messages set video_url = 'https://example.com/x'
        where id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
    exception when check_violation then
      frozen := true;
    end;
    if not frozen then raise exception 'TEST6 FAIL: message content was editable after QUEUED'; end if;
    raise notice 'TEST6 PASS: message content frozen after send begins';
  end $$;
rollback;

-- ==========================================================================
-- TEST 7: Subscriber cannot escalate to platform admin (privilege guard).
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  do $$
  declare blocked boolean := false;
  begin
    begin
      update public.profiles set is_platform_admin = true
        where id = '33333333-3333-3333-3333-333333333333';
    exception when insufficient_privilege then
      blocked := true;
    end;
    if not blocked then raise exception 'TEST7 FAIL: subscriber escalated to platform admin'; end if;
    raise notice 'TEST7 PASS: privilege escalation blocked';
  end $$;
rollback;

select 'ALL RLS TESTS PASSED' as result;
