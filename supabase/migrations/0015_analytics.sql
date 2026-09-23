-- 0015_analytics.sql
-- Org analytics from MEASURED signals only (no fabricated open/tap metrics).
-- SECURITY DEFINER so the aggregates run efficiently in one round-trip, gated by
-- an explicit membership check (mirrors the RLS a member already has). See
-- docs/ANALYTICS.md.

create or replace function public.organization_analytics(p_org uuid)
returns table (
  followers_active bigint,
  messages_sent bigint,
  messages_scheduled bigint,
  messages_failed bigint,
  jobs_total bigint,
  jobs_completed bigint,
  attempts_attempted bigint,
  attempts_accepted bigint,
  attempts_failed bigint,
  attempts_invalid bigint,
  join_scans bigint,
  join_follows bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not app.is_org_member(p_org) then
    raise exception 'Not a member of this organization' using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    (select count(*) from public.organization_followers f
       where f.organization_id = p_org and f.active),
    (select count(*) from public.messages m
       where m.organization_id = p_org and m.state = 'SENT'),
    (select count(*) from public.messages m
       where m.organization_id = p_org and m.state = 'SCHEDULED'),
    (select count(*) from public.messages m
       where m.organization_id = p_org and m.state in ('FAILED', 'PARTIALLY_FAILED')),
    (select count(*) from public.delivery_jobs j where j.organization_id = p_org),
    (select count(*) from public.delivery_jobs j
       where j.organization_id = p_org and j.status = 'COMPLETED'),
    (select count(*) from public.delivery_attempts a
       where a.organization_id = p_org
         and a.status in ('SENT_TO_PROVIDER', 'DELIVERED', 'FAILED', 'TOKEN_INVALID')),
    (select count(*) from public.delivery_attempts a
       where a.organization_id = p_org and a.status in ('SENT_TO_PROVIDER', 'DELIVERED')),
    (select count(*) from public.delivery_attempts a
       where a.organization_id = p_org and a.status = 'FAILED'),
    (select count(*) from public.delivery_attempts a
       where a.organization_id = p_org and a.status = 'TOKEN_INVALID'),
    (select count(*) from public.join_events e
       where e.organization_id = p_org and e.event_type = 'scan'),
    (select count(*) from public.join_events e
       where e.organization_id = p_org and e.event_type = 'follow');
end;
$$;

grant execute on function public.organization_analytics(uuid) to authenticated;
