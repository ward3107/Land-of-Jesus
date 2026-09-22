-- 0004_devices_push_tokens.sql
-- Devices and push tokens. A user may have many devices; a device has one
-- current push token. Tokens are invalidated automatically when a provider
-- reports them dead (see docs/PUSH-NOTIFICATIONS.md).

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform app.push_platform not null,
  -- Opaque per-install identifier from the client; lets us dedupe re-installs.
  install_id text not null,
  device_name text,
  app_version text,
  locale text check (locale in ('ar', 'he', 'en')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, install_id)
);

create index idx_devices_profile on public.devices (profile_id);

create trigger trg_devices_updated_at
  before update on public.devices
  for each row execute function app.set_updated_at();

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'expo', -- 'expo' | 'fcm' | 'apns' (future)
  token text not null,
  is_valid boolean not null default true,
  invalidated_at timestamptz,
  invalidation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A physical token is unique per provider; a re-registration upserts.
  unique (provider, token)
);

create index idx_push_tokens_device on public.push_tokens (device_id);
create index idx_push_tokens_valid on public.push_tokens (profile_id) where is_valid;

create trigger trg_push_tokens_updated_at
  before update on public.push_tokens
  for each row execute function app.set_updated_at();
