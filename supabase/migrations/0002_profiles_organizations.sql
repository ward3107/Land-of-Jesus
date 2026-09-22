-- 0002_profiles_organizations.sql
-- Identity + tenant root: profiles, organizations, memberships, verifications.

-- A profile is the app-level identity that mirrors auth.users (Supabase Auth).
-- Privacy-first: no phone number, minimal PII (see docs/PRIVACY.md).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_locale text not null default 'en' check (preferred_locale in ('ar', 'he', 'en')),
  -- Cross-tenant platform capability. Only ever set by a platform operator.
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();

-- The tenant root. Every tenant-scoped row carries an organization_id FK.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug citext not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  description text,
  logo_url text,
  category text,
  country text, -- ISO 3166-1 alpha-2
  default_locale text not null default 'en' check (default_locale in ('ar', 'he', 'en')),
  verification_status app.verification_status not null default 'UNVERIFIED',
  -- Platform moderation: a suspended org cannot send.
  is_suspended boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function app.set_updated_at();

-- Which profiles administer which organizations, and in what role.
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role app.membership_role not null default 'ORGANIZATION_ADMIN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index idx_org_members_profile on public.organization_members (profile_id);
create index idx_org_members_org on public.organization_members (organization_id);

create trigger trg_org_members_updated_at
  before update on public.organization_members
  for each row execute function app.set_updated_at();

-- Verification audit trail. Only a platform admin may grant VERIFIED.
create table public.organization_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  status app.verification_status not null,
  reviewer_id uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_org_verifications_org on public.organization_verifications (organization_id);
