-- 0008_tenancy_helpers.sql
-- Security-definer helper functions used by RLS policies.
--
-- These are SECURITY DEFINER so they run as the (table-owning) definer and thus
-- BYPASS RLS internally. That is what prevents infinite recursion: a policy on
-- organization_members can call app.is_org_member() without re-triggering the
-- same policy. Each function pins search_path to avoid hijacking.

-- Current authenticated profile id (Supabase provides auth.uid()).
create or replace function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid();
$$;

create or replace function app.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function app.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.is_platform_admin() or exists (
    select 1 from public.organization_members m
    where m.organization_id = org and m.profile_id = auth.uid()
  );
$$;

create or replace function app.has_org_role(org uuid, roles app.membership_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.is_platform_admin() or exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.profile_id = auth.uid()
      and m.role = any(roles)
  );
$$;

-- Convenience wrappers mirroring the app-layer permission matrix.
create or replace function app.can_manage_org(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.has_org_role(org, array['ORGANIZATION_OWNER']::app.membership_role[]);
$$;

create or replace function app.can_send_messages(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.has_org_role(
    org,
    array['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN']::app.membership_role[]
  );
$$;

create or replace function app.can_edit_content(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app.has_org_role(
    org,
    array['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'CONTENT_EDITOR']::app.membership_role[]
  );
$$;
