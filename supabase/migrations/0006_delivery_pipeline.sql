-- 0006_delivery_pipeline.sql
-- Asynchronous delivery: scheduled_messages -> delivery_jobs -> delivery_batches
-- -> delivery_attempts. Idempotency is enforced by a unique key per attempt so a
-- retried job never double-sends (see docs/PUSH-NOTIFICATIONS.md).

-- Recurring / future scheduling metadata, kept separate from the message so a
-- single message template can drive many fires later.
create table public.scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  kind app.schedule_kind not null,
  time_zone text, -- IANA; required for daily/weekly
  run_at timestamptz, -- for 'once'
  hour smallint check (hour between 0 and 23),
  minute smallint check (minute between 0 and 59),
  weekday smallint check (weekday between 0 and 6),
  next_run_at timestamptz, -- computed by the scheduler worker (UTC)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_scheduled_next_run on public.scheduled_messages (next_run_at) where is_active;

create trigger trg_scheduled_updated_at
  before update on public.scheduled_messages
  for each row execute function app.set_updated_at();

-- One delivery job per "fire" of a message. Idempotency key makes job creation
-- safe to retry (unique per message + fire timestamp).
create table public.delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  status app.delivery_job_status not null default 'PENDING',
  idempotency_key text not null unique,
  audience_size int,
  sent_count int not null default 0,
  failed_count int not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_delivery_jobs_org on public.delivery_jobs (organization_id, status);
create index idx_delivery_jobs_message on public.delivery_jobs (message_id);

create trigger trg_delivery_jobs_updated_at
  before update on public.delivery_jobs
  for each row execute function app.set_updated_at();

-- Provider-sized batches (<=100 for Expo).
create table public.delivery_batches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.delivery_jobs (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sequence int not null,
  size int not null,
  status app.delivery_job_status not null default 'PENDING',
  provider_request_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, sequence)
);

create index idx_delivery_batches_job on public.delivery_batches (job_id);

create trigger trg_delivery_batches_updated_at
  before update on public.delivery_batches
  for each row execute function app.set_updated_at();

-- One attempt per (job, device). The unique idempotency_key is the exactly-once
-- guarantee: a retried worker upserts on this key instead of inserting a dup.
create table public.delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.delivery_jobs (id) on delete cascade,
  batch_id uuid references public.delivery_batches (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  push_token text not null,
  -- deliveryIdempotencyKey(jobId, deviceId) from @communitydirect/core.
  idempotency_key text not null unique,
  status app.delivery_status not null default 'PENDING',
  provider_receipt_id text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_delivery_attempts_job on public.delivery_attempts (job_id, status);

create trigger trg_delivery_attempts_updated_at
  before update on public.delivery_attempts
  for each row execute function app.set_updated_at();
