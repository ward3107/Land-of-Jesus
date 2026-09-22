-- 0001_extensions_and_enums.sql
-- Foundation: extensions, the private `app` helper schema, enums, and a generic
-- updated_at trigger. Everything here is dependency-free (no table references).

create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "citext"; -- case-insensitive text (emails)

-- Private schema for tenancy/security helper functions. Not exposed via the API.
create schema if not exists app;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Organization-scoped membership roles. Platform super admin is a separate
-- boolean flag on profiles (a cross-tenant capability, not an org membership).
create type app.membership_role as enum (
  'ORGANIZATION_OWNER',
  'ORGANIZATION_ADMIN',
  'CONTENT_EDITOR',
  'ANALYST'
);

create type app.verification_status as enum (
  'UNVERIFIED',
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

create type app.message_state as enum (
  'DRAFT',
  'SCHEDULED',
  'QUEUED',
  'PROCESSING',
  'SENT',
  'PARTIALLY_FAILED',
  'FAILED',
  'CANCELLED'
);

create type app.schedule_kind as enum ('now', 'once', 'daily', 'weekly');

create type app.push_platform as enum ('ios', 'android', 'web');

create type app.delivery_job_status as enum (
  'PENDING',
  'RESOLVING',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

-- Per-recipient delivery outcome.
create type app.delivery_status as enum (
  'PENDING',
  'QUEUED',
  'SENT_TO_PROVIDER',
  'DELIVERED',
  'FAILED',
  'TOKEN_INVALID',
  'SKIPPED'
);

create type app.join_event_type as enum ('scan', 'open', 'install', 'follow');

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
