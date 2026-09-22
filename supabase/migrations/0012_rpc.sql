-- 0012_rpc.sql
-- Public RPCs (callable via PostgREST). SECURITY DEFINER where an operation must
-- span the RLS boundary atomically (e.g. creating an org AND its first owner
-- membership, which the row-level policies alone cannot bootstrap).

-- Create an organization and make the caller its OWNER, atomically.
create or replace function public.create_organization(
  p_name text,
  p_slug citext,
  p_description text default null,
  p_category text default null,
  p_country text default null,
  p_default_locale text default 'en'
)
returns public.organizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;

  insert into public.organizations (name, slug, description, category, country, default_locale, created_by)
  values (p_name, p_slug, p_description, p_category, p_country, p_default_locale, v_uid)
  returning * into v_org;

  insert into public.organization_members (organization_id, profile_id, role)
  values (v_org.id, v_uid, 'ORGANIZATION_OWNER');

  -- A sensible default channel so the org can send immediately.
  insert into public.channels (organization_id, name, slug, is_default)
  values (v_org.id, 'Announcements', 'announcements', true);

  insert into public.audit_logs (organization_id, actor_id, action, target_type, target_id)
  values (v_org.id, v_uid, 'organization.created', 'organization', v_org.id);

  return v_org;
end;
$$;

-- Follow an organization (explicit opt-in). Idempotent; re-follow reactivates.
create or replace function public.follow_organization(
  p_organization_id uuid,
  p_language text default null,
  p_signup_source text default null
)
returns public.organization_followers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.organization_followers;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = 'insufficient_privilege';
  end if;

  insert into public.organization_followers (organization_id, profile_id, language, signup_source, active)
  values (p_organization_id, v_uid, p_language, p_signup_source, true)
  on conflict (organization_id, profile_id)
  do update set active = true, unfollowed_at = null, updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.unfollow_organization(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  update public.organization_followers
  set active = false, unfollowed_at = now(), updated_at = now()
  where organization_id = p_organization_id and profile_id = v_uid;
end;
$$;

-- Enqueue a message for delivery. Requires send permission; transitions the
-- message state and creates an idempotent delivery job. The audience is resolved
-- asynchronously by the worker (never inline in a request).
create or replace function public.enqueue_message(p_message_id uuid)
returns public.delivery_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_msg public.messages;
  v_job public.delivery_jobs;
  v_key text;
begin
  select * into v_msg from public.messages where id = p_message_id;
  if not found then
    raise exception 'Message not found' using errcode = 'no_data_found';
  end if;
  if not app.can_send_messages(v_msg.organization_id) then
    raise exception 'Not permitted to send messages for this organization'
      using errcode = 'insufficient_privilege';
  end if;
  if v_msg.state not in ('DRAFT', 'SCHEDULED') then
    raise exception 'Message % is not in a sendable state (%)', v_msg.id, v_msg.state
      using errcode = 'check_violation';
  end if;

  -- Idempotency: one job per message per scheduled instant (or "immediate").
  v_key := 'msg:' || v_msg.id::text || ':at:' || coalesce(v_msg.scheduled_at::text, 'now');

  insert into public.delivery_jobs (organization_id, message_id, idempotency_key, status)
  values (v_msg.organization_id, v_msg.id, v_key, 'PENDING')
  on conflict (idempotency_key) do update set updated_at = now()
  returning * into v_job;

  update public.messages set state = 'QUEUED', locked_at = now()
  where id = v_msg.id and state in ('DRAFT', 'SCHEDULED');

  return v_job;
end;
$$;

grant execute on function
  public.create_organization(text, citext, text, text, text, text),
  public.follow_organization(uuid, text, text),
  public.unfollow_organization(uuid),
  public.enqueue_message(uuid)
to authenticated;
