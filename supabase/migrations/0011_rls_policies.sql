-- 0011_rls_policies.sql
-- Enable Row Level Security on every table and define tenant-isolation policies.
-- The single invariant: no authenticated user may read or write another
-- organization's data. Helper functions (app.*) are SECURITY DEFINER and bypass
-- RLS internally to avoid recursion. See docs/MULTITENANCY.md.

-- Enable RLS everywhere. Default with no matching policy = deny.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_verifications enable row level security;
alter table public.channels enable row level security;
alter table public.organization_followers enable row level security;
alter table public.channel_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.devices enable row level security;
alter table public.push_tokens enable row level security;
alter table public.media_assets enable row level security;
alter table public.segments enable row level security;
alter table public.segment_rules enable row level security;
alter table public.messages enable row level security;
alter table public.message_translations enable row level security;
alter table public.message_channels enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.delivery_jobs enable row level security;
alter table public.delivery_batches enable row level security;
alter table public.delivery_attempts enable row level security;
alter table public.join_links enable row level security;
alter table public.join_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.security_events enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: a user sees/edits only their own profile (+ platform admin).
-- ---------------------------------------------------------------------------
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or app.is_platform_admin());

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Prevent privilege escalation: a non-platform-admin cannot set the admin flag.
create or replace function app.protect_profile_admin_flag()
returns trigger
language plpgsql
as $$
begin
  -- Only guard end-user (JWT-bearing) contexts. A null auth.uid() means a
  -- trusted backend / service-role context (no end user), which may set the flag.
  if new.is_platform_admin is distinct from old.is_platform_admin
     and auth.uid() is not null
     and not app.is_platform_admin() then
    raise exception 'Only a platform admin may change is_platform_admin'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger trg_protect_profile_admin_flag
  before update on public.profiles
  for each row execute function app.protect_profile_admin_flag();

-- ---------------------------------------------------------------------------
-- organizations: public discovery (read), owner-managed writes.
-- ---------------------------------------------------------------------------
create policy organizations_public_read on public.organizations
  for select to anon, authenticated
  using (true);

create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (created_by = auth.uid());

create policy organizations_update on public.organizations
  for update to authenticated
  using (app.can_manage_org(id))
  with check (app.can_manage_org(id));

create policy organizations_delete on public.organizations
  for delete to authenticated
  using (app.can_manage_org(id));

-- ---------------------------------------------------------------------------
-- organization_members: visible to fellow members; managed by owners.
-- ---------------------------------------------------------------------------
create policy org_members_select on public.organization_members
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy org_members_write on public.organization_members
  for all to authenticated
  using (app.can_manage_org(organization_id))
  with check (app.can_manage_org(organization_id));

-- ---------------------------------------------------------------------------
-- organization_verifications: members read; only platform admins write.
-- ---------------------------------------------------------------------------
create policy org_verifications_select on public.organization_verifications
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy org_verifications_write on public.organization_verifications
  for all to authenticated
  using (app.is_platform_admin())
  with check (app.is_platform_admin());

-- ---------------------------------------------------------------------------
-- channels: public read (discovery/following); owner/admin write.
-- ---------------------------------------------------------------------------
create policy channels_public_read on public.channels
  for select to anon, authenticated
  using (not is_archived or app.is_org_member(organization_id));

create policy channels_write on public.channels
  for all to authenticated
  using (app.can_send_messages(organization_id))
  with check (app.can_send_messages(organization_id));

-- ---------------------------------------------------------------------------
-- organization_followers: a subscriber owns their follow; admins manage the list.
-- ---------------------------------------------------------------------------
create policy followers_select on public.organization_followers
  for select to authenticated
  using (profile_id = auth.uid() or app.is_org_member(organization_id));

create policy followers_insert_self on public.organization_followers
  for insert to authenticated
  with check (profile_id = auth.uid());

create policy followers_update on public.organization_followers
  for update to authenticated
  using (profile_id = auth.uid() or app.can_send_messages(organization_id))
  with check (profile_id = auth.uid() or app.can_send_messages(organization_id));

create policy followers_delete_self on public.organization_followers
  for delete to authenticated
  using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- channel_subscriptions: owned by subscriber; readable by admins.
-- ---------------------------------------------------------------------------
create policy channel_subs_select on public.channel_subscriptions
  for select to authenticated
  using (profile_id = auth.uid() or app.is_org_member(organization_id));

create policy channel_subs_write_self on public.channel_subscriptions
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notification_preferences / devices / push_tokens: strictly self-owned.
-- Admins never see device-level PII (privacy requirement).
-- ---------------------------------------------------------------------------
create policy notif_prefs_self on public.notification_preferences
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy devices_self on public.devices
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy push_tokens_self on public.push_tokens
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- media_assets / segments / segment_rules: org-scoped content.
-- ---------------------------------------------------------------------------
create policy media_select on public.media_assets
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy media_write on public.media_assets
  for all to authenticated
  using (app.can_edit_content(organization_id))
  with check (app.can_edit_content(organization_id));

create policy segments_select on public.segments
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy segments_write on public.segments
  for all to authenticated
  using (app.can_send_messages(organization_id))
  with check (app.can_send_messages(organization_id));

create policy segment_rules_select on public.segment_rules
  for select to authenticated
  using (
    exists (
      select 1 from public.segments s
      where s.id = segment_rules.segment_id and app.is_org_member(s.organization_id)
    )
  );

create policy segment_rules_write on public.segment_rules
  for all to authenticated
  using (
    exists (
      select 1 from public.segments s
      where s.id = segment_rules.segment_id and app.can_send_messages(s.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.segments s
      where s.id = segment_rules.segment_id and app.can_send_messages(s.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- messages / translations / channels: org-scoped; editors create/edit content.
-- ---------------------------------------------------------------------------
create policy messages_select on public.messages
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy messages_insert on public.messages
  for insert to authenticated
  with check (app.can_edit_content(organization_id));

create policy messages_update on public.messages
  for update to authenticated
  using (app.can_edit_content(organization_id))
  with check (app.can_edit_content(organization_id));

create policy messages_delete on public.messages
  for delete to authenticated
  using (app.can_send_messages(organization_id));

create policy message_translations_select on public.message_translations
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_translations.message_id and app.is_org_member(m.organization_id)
    )
  );

create policy message_translations_write on public.message_translations
  for all to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_translations.message_id and app.can_edit_content(m.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_translations.message_id and app.can_edit_content(m.organization_id)
    )
  );

create policy message_channels_select on public.message_channels
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_channels.message_id and app.is_org_member(m.organization_id)
    )
  );

create policy message_channels_write on public.message_channels
  for all to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_channels.message_id and app.can_edit_content(m.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_channels.message_id and app.can_edit_content(m.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- scheduling & delivery: members read; the worker (service_role) writes.
-- ---------------------------------------------------------------------------
create policy scheduled_select on public.scheduled_messages
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy scheduled_write on public.scheduled_messages
  for all to authenticated
  using (app.can_send_messages(organization_id))
  with check (app.can_send_messages(organization_id));

create policy delivery_jobs_select on public.delivery_jobs
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy delivery_batches_select on public.delivery_batches
  for select to authenticated
  using (app.is_org_member(organization_id));

create policy delivery_attempts_select on public.delivery_attempts
  for select to authenticated
  using (app.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- join links & events: public read of active links; members manage.
-- ---------------------------------------------------------------------------
create policy join_links_public_read on public.join_links
  for select to anon, authenticated
  using (is_active or app.is_org_member(organization_id));

create policy join_links_write on public.join_links
  for all to authenticated
  using (app.can_send_messages(organization_id))
  with check (app.can_send_messages(organization_id));

create policy join_events_insert_public on public.join_events
  for insert to anon, authenticated
  with check (true);

create policy join_events_select on public.join_events
  for select to authenticated
  using (app.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- audit & security logs: owners read their org's audit; platform reads security.
-- ---------------------------------------------------------------------------
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (organization_id is not null and app.can_manage_org(organization_id));

create policy security_events_select on public.security_events
  for select to authenticated
  using (app.is_platform_admin());
