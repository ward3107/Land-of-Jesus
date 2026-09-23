-- hardening.test.sql
-- Phase F: rate limiting, moderation-field protection, suspension enforcement,
-- verification requests, GDPR export/delete, abuse reports, and retention purge.
-- Runs after delivery (alphabetical) on the shared DB; cleans up after itself.

-- ==========================================================================
-- 1. Rate limiting: the 3rd call in a window of max 2 is refused.
-- ==========================================================================
do $$
declare a boolean; b boolean; c boolean;
begin
  a := public.check_rate_limit('test:hardening', 'subj-1', 2, 3600);
  b := public.check_rate_limit('test:hardening', 'subj-1', 2, 3600);
  c := public.check_rate_limit('test:hardening', 'subj-1', 2, 3600);
  if not (a and b and not c) then
    raise exception 'HARDEN1 FAIL: rate limit gave % % % (want t t f)', a, b, c;
  end if;
  raise notice 'HARDEN1 PASS: fixed-window rate limit allows up to max then refuses';
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('8f888888-8888-8888-8888-888888888888', 'owner-f@example.com', '{"display_name":"Owner F"}'),
  ('9a999999-9999-9999-9999-999999999999', 'sub-f@example.com', '{"display_name":"Sub F"}');

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"8f888888-8888-8888-8888-888888888888","role":"authenticated"}', false);
select public.create_organization('Phase F Org', 'phase-f-org', 'Hardening test', 'Community', 'IL', 'en');
reset role;

select id as org_id from public.organizations where slug = 'phase-f-org' \gset
select id as chan_id from public.channels where organization_id = :'org_id' and is_default \gset

-- Subscriber follows (gives export something to return).
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"9a999999-9999-9999-9999-999999999999","role":"authenticated"}', false);
select public.follow_organization(:'org_id', 'en', 'join:test');
reset role;

-- ==========================================================================
-- 2. Moderation fields: an owner cannot self-verify or self-suspend.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"8f888888-8888-8888-8888-888888888888","role":"authenticated"}', false);
do $$
declare v_org uuid := (select id from public.organizations where slug = 'phase-f-org');
begin
  begin
    update public.organizations set is_suspended = true where id = v_org;
    raise exception 'HARDEN2 FAIL: owner was allowed to self-suspend';
  exception when insufficient_privilege then null; end;

  begin
    update public.organizations set verification_status = 'VERIFIED' where id = v_org;
    raise exception 'HARDEN2 FAIL: owner was allowed to self-verify';
  exception when insufficient_privilege then null; end;

  raise notice 'HARDEN2 PASS: owner cannot self-verify or self-suspend';
end $$;

-- 3. But an owner CAN request verification (→ PENDING).
select public.request_verification(:'org_id');
reset role;
do $$
declare v_status app.verification_status;
begin
  select verification_status into v_status from public.organizations where slug = 'phase-f-org';
  if v_status <> 'PENDING' then raise exception 'HARDEN3 FAIL: verification not PENDING (%)', v_status; end if;
  raise notice 'HARDEN3 PASS: owner requested verification (PENDING)';
end $$;

-- ==========================================================================
-- 4. GDPR export returns the caller's own data.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"9a999999-9999-9999-9999-999999999999","role":"authenticated"}', false);
do $$
declare v jsonb;
begin
  v := public.export_my_data();
  if not (v ? 'profile') then raise exception 'HARDEN4 FAIL: export missing profile'; end if;
  if (v -> 'profile' ->> 'id') <> '9a999999-9999-9999-9999-999999999999' then
    raise exception 'HARDEN4 FAIL: export has wrong profile'; end if;
  if jsonb_array_length(v -> 'follows') <> 1 then
    raise exception 'HARDEN4 FAIL: export follows = % (want 1)', jsonb_array_length(v -> 'follows'); end if;
  raise notice 'HARDEN4 PASS: GDPR export returns the caller''s profile + follows';
end $$;

-- 5. Abuse report inserts a row.
select public.report_organization(:'org_id', 'spam', 'Test report');
reset role;
do $$
declare v_reports int;
begin
  select count(*) into v_reports from public.abuse_reports
    where organization_id = (select id from public.organizations where slug = 'phase-f-org');
  if v_reports <> 1 then raise exception 'HARDEN5 FAIL: abuse_reports = % (want 1)', v_reports; end if;
  raise notice 'HARDEN5 PASS: abuse report recorded';
end $$;

-- ==========================================================================
-- 6. A suspended org cannot enqueue a message.
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"8f888888-8888-8888-8888-888888888888","role":"authenticated"}', false);
insert into public.messages (id, organization_id, default_locale, state)
values ('8f888888-0000-0000-0000-0000000000a1', :'org_id', 'en', 'DRAFT');
insert into public.message_translations (message_id, locale, title, body)
values ('8f888888-0000-0000-0000-0000000000a1', 'en', 'Hi', 'Body');
insert into public.message_channels (message_id, channel_id)
values ('8f888888-0000-0000-0000-0000000000a1', :'chan_id');
reset role;

-- Suspend as a trusted backend ('{}' → null auth.uid bypasses the owner guard;
-- '' would break auth.uid()'s JSON cast in the local shim).
select set_config('request.jwt.claims', '{}', false);
update public.organizations set is_suspended = true where id = :'org_id';

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"8f888888-8888-8888-8888-888888888888","role":"authenticated"}', false);
do $$
begin
  begin
    perform public.enqueue_message('8f888888-0000-0000-0000-0000000000a1');
    raise exception 'HARDEN6 FAIL: suspended org was allowed to enqueue';
  exception when insufficient_privilege then null; end;
  raise notice 'HARDEN6 PASS: suspended org cannot enqueue';
end $$;
reset role;
do $$
declare v_state app.message_state;
begin
  select state into v_state from public.messages where id = '8f888888-0000-0000-0000-0000000000a1';
  if v_state <> 'DRAFT' then raise exception 'HARDEN6 FAIL: message advanced despite suspension (%)', v_state; end if;
end $$;

-- ==========================================================================
-- 7. GDPR delete removes the caller's profile (and cascades their data).
-- ==========================================================================
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"9a999999-9999-9999-9999-999999999999","role":"authenticated"}', false);
select public.delete_my_account();
reset role;
do $$
declare v_prof int; v_follows int;
begin
  select count(*) into v_prof from public.profiles where id = '9a999999-9999-9999-9999-999999999999';
  select count(*) into v_follows from public.organization_followers where profile_id = '9a999999-9999-9999-9999-999999999999';
  if v_prof <> 0 then raise exception 'HARDEN7 FAIL: profile not deleted'; end if;
  if v_follows <> 0 then raise exception 'HARDEN7 FAIL: follows not cascaded'; end if;
  raise notice 'HARDEN7 PASS: GDPR delete removed profile + cascaded data';
end $$;

-- ==========================================================================
-- 8. Retention purge (service_role) deletes aged rows.
-- ==========================================================================
insert into public.delivery_jobs (id, organization_id, message_id, idempotency_key, status)
values ('8f888888-0000-0000-0000-0000000000b1', :'org_id', '8f888888-0000-0000-0000-0000000000a1', 'harden-purge-job', 'COMPLETED');
insert into public.delivery_attempts (job_id, organization_id, push_token, idempotency_key, status, created_at)
values ('8f888888-0000-0000-0000-0000000000b1', :'org_id', 'ExponentPushToken[pppppppppppppppppppppp]', 'harden-old-attempt', 'SENT_TO_PROVIDER', now() - interval '200 days');

select set_config('request.jwt.claims', '{"role":"service_role"}', false);
do $$
declare v jsonb;
begin
  v := public.purge_expired_data(90, 180);
  if (v ->> 'deleted_attempts')::int < 1 then
    raise exception 'HARDEN8 FAIL: purge deleted % attempts (want >=1)', v ->> 'deleted_attempts'; end if;
  raise notice 'HARDEN8 PASS: retention purge removed aged attempts';
end $$;

-- ==========================================================================
-- Teardown.
-- ==========================================================================
reset role;
select set_config('request.jwt.claims', '{}', false);
delete from public.organizations where slug = 'phase-f-org'; -- cascades org-scoped rows
delete from public.rate_limits where action = 'test:hardening';
delete from public.profiles where id = '8f888888-8888-8888-8888-888888888888';
delete from auth.users where id in
  ('8f888888-8888-8888-8888-888888888888', '9a999999-9999-9999-9999-999999999999');

select 'ALL HARDENING TESTS PASSED' as result;
