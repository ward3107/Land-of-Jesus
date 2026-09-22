-- 0007_join_audit.sql
-- Growth (join links / QR) and governance (audit + security logs).

create table public.join_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{4,40}$'),
  channel_id uuid references public.channels (id) on delete set null,
  campaign text, -- e.g. 'whatsapp-migration-a'
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index idx_join_links_org on public.join_links (organization_id);

-- Anonymous-friendly funnel events. profile_id is null until the user has an
-- account; we never require identity to scan or view a landing page.
create table public.join_events (
  id uuid primary key default gen_random_uuid(),
  join_link_id uuid not null references public.join_links (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type app.join_event_type not null,
  profile_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_join_events_link on public.join_events (join_link_id, event_type);

-- Admin action audit trail (who did what, within which tenant).
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_audit_logs_org on public.audit_logs (organization_id, created_at desc);

-- Platform-wide security events (auth anomalies, rate-limit trips, abuse reports).
create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_security_events_kind on public.security_events (kind, created_at desc);
