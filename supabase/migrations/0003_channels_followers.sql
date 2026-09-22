-- 0003_channels_followers.sql
-- The subscriber side: channels (topics), explicit follows, channel opt-ins,
-- and per-subscriber notification preferences.

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,60}$'),
  description text,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index idx_channels_org on public.channels (organization_id);

create trigger trg_channels_updated_at
  before update on public.channels
  for each row execute function app.set_updated_at();

-- Following is ALWAYS explicit (opt-in). Unfollowing sets active=false rather
-- than deleting, so we retain consent history without keeping people subscribed.
create table public.organization_followers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  active boolean not null default true,
  -- Voluntary, low-sensitivity segmentation attributes.
  language text check (language in ('ar', 'he', 'en')),
  location text,
  tags text[] not null default '{}',
  signup_source text, -- e.g. 'qr:campaign-a', 'link', 'search'
  followed_at timestamptz not null default now(),
  unfollowed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index idx_followers_org_active on public.organization_followers (organization_id, active);
create index idx_followers_profile on public.organization_followers (profile_id);
create index idx_followers_tags on public.organization_followers using gin (tags);

create trigger trg_followers_updated_at
  before update on public.organization_followers
  for each row execute function app.set_updated_at();

-- Channel-level opt-in. A follower chooses which channels they want.
create table public.channel_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (channel_id, profile_id)
);

create index idx_channel_subs_channel on public.channel_subscriptions (channel_id, active);
create index idx_channel_subs_profile on public.channel_subscriptions (profile_id);

-- Notification preferences: org-level and channel-level mute + quiet hours.
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  channel_id uuid references public.channels (id) on delete cascade,
  -- Master switch when both org and channel are null.
  notifications_enabled boolean not null default true,
  quiet_hours_start smallint check (quiet_hours_start between 0 and 23),
  quiet_hours_end smallint check (quiet_hours_end between 0 and 23),
  updated_at timestamptz not null default now(),
  -- Exactly one scope granularity per row.
  unique (profile_id, organization_id, channel_id)
);

create index idx_notif_prefs_profile on public.notification_preferences (profile_id);

create trigger trg_notif_prefs_updated_at
  before update on public.notification_preferences
  for each row execute function app.set_updated_at();
