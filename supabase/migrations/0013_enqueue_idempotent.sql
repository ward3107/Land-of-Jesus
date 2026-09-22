-- 0013_enqueue_idempotent.sql
-- Make enqueue_message fully idempotent. The original (0012) raised if the
-- message was already QUEUED, so a retried enqueue failed instead of no-op'ing.
-- Now a second call for an already-QUEUED message returns the existing job
-- without error; only PROCESSING/terminal states are rejected.

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
  -- DRAFT/SCHEDULED start delivery; QUEUED is a safe idempotent retry.
  if v_msg.state not in ('DRAFT', 'SCHEDULED', 'QUEUED') then
    raise exception 'Message % is not in a sendable state (%)', v_msg.id, v_msg.state
      using errcode = 'check_violation';
  end if;

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
