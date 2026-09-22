-- 00_auth_shim.local.sql
-- LOCAL-ONLY compatibility shim. On hosted Supabase the `auth` schema,
-- `auth.users`, and `auth.uid()/auth.jwt()/auth.role()` already exist and are
-- managed by Supabase Auth. This file recreates just enough of them so the same
-- migrations can be applied and RLS can be tested against a plain PostgreSQL.
-- It is NOT part of supabase/migrations and never runs in production.

create extension if not exists "pgcrypto";

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Reads the current request's JWT claims from a GUC, exactly like Supabase.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', 'anon');
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;
