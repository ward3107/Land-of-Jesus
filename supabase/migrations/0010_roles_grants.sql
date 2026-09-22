-- 0010_roles_grants.sql
-- Ensure the Supabase API roles exist (idempotent) and grant baseline table
-- privileges. RLS policies (next migration) do the actual gating; grants only
-- decide which verbs a role may attempt.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema app to anon, authenticated, service_role;

-- Authenticated users may attempt all verbs (RLS decides on which rows).
grant select, insert, update, delete on all tables in schema public to authenticated;
-- Anonymous visitors may read public discovery data and record funnel events.
grant select on all tables in schema public to anon;
grant insert on public.join_events to anon;
-- The server-side worker uses service_role, which also bypasses RLS.
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema app to anon, authenticated, service_role;

-- Apply the same defaults to tables/functions created by later migrations.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema app grant execute on functions to anon, authenticated, service_role;
