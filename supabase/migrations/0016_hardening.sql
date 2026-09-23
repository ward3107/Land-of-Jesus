-- 0016_hardening.sql
-- Phase F hardening: rate limiting, abuse reports, moderation-field protection
-- (self-verify / self-unsuspend closed), suspension enforcement on send,
-- verification requests, GDPR export/delete, and a retention purge.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app.abuse_report_status as enum ('open', 'reviewing', 'actioned', 'dismissed');

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). RPC-managed only; no direct table access.
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  subject text not null,
  window_start timestamptz not null,
  count int not null default 0,
  unique (action, subject, window_start)
);
create index idx_rate_limits_window on public.rate_limits (window_start);
alter table public.rate_limits enable row level security; -- deny all; the RPC bypasses via SECURITY DEFINER

-- Increment the counter for (action, subject) in the current window and report
-- whether the caller is still within `p_max`. Deterministic window alignment.
create or replace function public.check_rate_limit(
  p_action text,
  p_subject text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / greatest(p_window_seconds, 1)) * greatest(p_window_seconds, 1));
  v_count int;
begin
  insert into public.rate_limits (action, subject, window_start, count)
  values (p_action, p_subject, v_window, 1)
  on conflict (action, subject, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;
  return v_count <= p_max;
end;
$$;

grant execute on function public.check_rate_limit(text, text, int, int) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Abuse reports. Anyone signed in may report; platform admins triage.
-- ---------------------------------------------------------------------------
create table public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 80),
  details text check (char_length(details) <= 2000),
  status app.abuse_report_status not null default 'open',
  created_at timestamptz not null default now()
);
create index idx_abuse_reports_org on public.abuse_reports (organization_id, status);
alter table public.abuse_reports enable row level security;

create policy abuse_reports_insert_self on public.abuse_reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy abuse_reports_select_admin on public.abuse_reports
  for select to authenticated using (app.is_platform_admin());
create policy abuse_reports_update_admin on public.abuse_reports
  for all to authenticated using (app.is_platform_admin()) with check (app.is_platform_admin());

-- Report an organization (rate-limited per reporter).
create or replace function public.report_organization(
  p_org uuid,
  p_reason text,
  p_details text default null
)
returns public.abuse_reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.abuse_reports;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;
  if not public.check_rate_limit('abuse_report', v_uid::text, 5, 3600) then
    raise exception 'Too many reports — please try again later' using errcode = 'check_violation';
  end if;
  insert into public.abuse_reports (organization_id, reporter_id, reason, details)
  values (p_org, v_uid, left(coalesce(p_reason, 'unspecified'), 80), left(p_details, 2000))
  returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.report_organization(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Moderation-field protection: an org admin may REQUEST verification (PENDING)
-- but may never self-grant VERIFIED/REJECTED or toggle suspension. Only a
-- platform admin (or a null-uid trusted backend) may. Closes a privilege hole.
-- ---------------------------------------------------------------------------
create or replace function app.protect_org_moderation_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not app.is_platform_admin() then
    if new.verification_status is distinct from old.verification_status
       and new.verification_status <> 'PENDING' then
      raise exception 'Only a platform admin may verify or reject an organization'
        using errcode = 'insufficient_privilege';
    end if;
    if new.is_suspended is distinct from old.is_suspended then
      raise exception 'Only a platform admin may change suspension'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_protect_org_moderation
  before update on public.organizations
  for each row execute function app.protect_org_moderation_fields();

-- An owner requests verification; sets PENDING and records an audit row.
create or replace function public.request_verification(p_org uuid)
returns public.organizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org public.organizations;
begin
  if not app.can_manage_org(p_org) then
    raise exception 'Only an owner may request verification' using errcode = 'insufficient_privilege';
  end if;

  update public.organizations
  set verification_status = 'PENDING'
  where id = p_org and verification_status in ('UNVERIFIED', 'REJECTED')
  returning * into v_org;

  if v_org.id is not null then
    insert into public.organization_verifications (organization_id, status, notes)
    values (p_org, 'PENDING', 'Requested by owner');
  else
    select * into v_org from public.organizations where id = p_org; -- already pending/verified
  end if;

  return v_org;
end;
$$;

grant execute on function public.request_verification(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Suspension enforcement + send rate limit, folded into enqueue_message.
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_message(p_message_id uuid)
returns public.delivery_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_msg public.messages;
  v_job public.delivery_jobs;
  v_key text;
  v_suspended boolean;
begin
  select * into v_msg from public.messages where id = p_message_id;
  if not found then
    raise exception 'Message not found' using errcode = 'no_data_found';
  end if;
  if not app.can_send_messages(v_msg.organization_id) then
    raise exception 'Not permitted to send messages for this organization'
      using errcode = 'insufficient_privilege';
  end if;

  select is_suspended into v_suspended from public.organizations where id = v_msg.organization_id;
  if v_suspended then
    raise exception 'Organization is suspended and cannot send' using errcode = 'insufficient_privilege';
  end if;

  if not public.check_rate_limit('message_send', v_msg.organization_id::text, 60, 3600) then
    raise exception 'Send rate limit exceeded — try again later' using errcode = 'check_violation';
  end if;

  if v_msg.state not in ('DRAFT', 'SCHEDULED', 'QUEUED') then
    raise exception 'Message % is not in a sendable state (%)', v_msg.id, v_msg.state
      using errcode = 'check_violation';
  end if;

  v_key := 'msg:' || v_msg.id::text || ':at:' || coalesce(v_msg.scheduled_at::text, 'now');

  insert into public.delivery_jobs (organization_id, message_id, idempotency_key, status)
  values (v_msg.organization_id, v_msg.id, v_key, 'PENDING')
  on conflict (idempotency_key) do update set updated_at = now()
  returning * into v_job;

  update public.messages set state = 'QUEUED', locked_at = now()
  where id = v_msg.id and state in ('DRAFT', 'SCHEDULED');

  return v_job;
end;
$$;

-- ---------------------------------------------------------------------------
-- GDPR: self-service export and account deletion (subscriber-owned data).
-- ---------------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;
  return jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'follows', (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
                  from public.organization_followers f where f.profile_id = v_uid),
    'channel_subscriptions', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
                  from public.channel_subscriptions c where c.profile_id = v_uid),
    'devices', (select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
                  from public.devices d where d.profile_id = v_uid),
    'notification_preferences', (select coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb)
                  from public.notification_preferences n where n.profile_id = v_uid),
    'exported_at', now()
  );
end;
$$;

grant execute on function public.export_my_data() to authenticated;

-- Hard-delete the caller's account data. De-attributes authored content
-- (created_by → null) so FKs don't block, then deletes the profile, which
-- cascades follows, subscriptions, devices, tokens and preferences.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;

  update public.organizations set created_by = null where created_by = v_uid;
  update public.messages set created_by = null where created_by = v_uid;
  update public.segments set created_by = null where created_by = v_uid;
  update public.media_assets set created_by = null where created_by = v_uid;
  update public.join_links set created_by = null where created_by = v_uid;

  delete from public.profiles where id = v_uid; -- cascades subscriber-owned rows
end;
$$;

grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Retention: worker-only purge of aged delivery attempts and join events.
-- ---------------------------------------------------------------------------
create or replace function public.purge_expired_data(
  p_attempt_days int default 90,
  p_event_days int default 180
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempts int;
  v_events int;
begin
  perform app.assert_worker();
  delete from public.delivery_attempts where created_at < now() - make_interval(days => p_attempt_days);
  get diagnostics v_attempts = row_count;
  delete from public.join_events where created_at < now() - make_interval(days => p_event_days);
  get diagnostics v_events = row_count;
  return jsonb_build_object('deleted_attempts', v_attempts, 'deleted_join_events', v_events);
end;
$$;

revoke execute on function public.purge_expired_data(int, int) from public, anon, authenticated;
grant execute on function public.purge_expired_data(int, int) to service_role;
