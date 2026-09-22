-- 0005_messages_media.sql
-- Messages, their per-language variants, channel targeting, and media assets.

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('image', 'audio', 'video', 'file')),
  storage_path text not null, -- path in the Supabase Storage bucket
  mime_type text,
  byte_size bigint check (byte_size >= 0),
  width int,
  height int,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index idx_media_org on public.media_assets (organization_id);

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  -- match = 'all' (AND) or 'any' (OR)
  match_mode text not null default 'all' check (match_mode in ('all', 'any')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_segments_org on public.segments (organization_id);

create trigger trg_segments_updated_at
  before update on public.segments
  for each row execute function app.set_updated_at();

-- A segment is a set of rules over voluntarily-provided attributes.
create table public.segment_rules (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references public.segments (id) on delete cascade,
  field text not null check (field in ('language', 'channel', 'location', 'tag', 'signup_source')),
  operator text not null check (operator in ('eq', 'in', 'contains', 'exists')),
  values text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_segment_rules_segment on public.segment_rules (segment_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  default_locale text not null default 'en' check (default_locale in ('ar', 'he', 'en')),
  state app.message_state not null default 'DRAFT',
  -- Optional targeting: a saved segment (null = all active followers of the channels)
  segment_id uuid references public.segments (id) on delete set null,
  image_asset_id uuid references public.media_assets (id) on delete set null,
  audio_asset_id uuid references public.media_assets (id) on delete set null,
  video_url text,
  link_url text,
  cta_label text,
  cta_url text,
  scheduled_at timestamptz, -- UTC; null = send now
  expires_at timestamptz,
  created_by uuid references public.profiles (id),
  -- Set once delivery begins; content is frozen thereafter (enforced by trigger).
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or scheduled_at is null or expires_at > scheduled_at)
);

create index idx_messages_org_state on public.messages (organization_id, state);
create index idx_messages_scheduled on public.messages (scheduled_at) where state = 'SCHEDULED';

create trigger trg_messages_updated_at
  before update on public.messages
  for each row execute function app.set_updated_at();

-- One row per language variant.
create table public.message_translations (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  locale text not null check (locale in ('ar', 'he', 'en')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  unique (message_id, locale)
);

create index idx_message_translations_message on public.message_translations (message_id);

-- Which channels a message is published to.
create table public.message_channels (
  message_id uuid not null references public.messages (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  primary key (message_id, channel_id)
);
