-- 0009_triggers_logic.sql
-- Domain triggers: auto-provision a profile on signup, and freeze message
-- content once delivery has begun.

-- When a new auth.users row is created, mirror a public.profiles row. On
-- Supabase auth.users lives in the auth schema; this trigger keeps profiles in
-- sync. Locale/display_name can be seeded from the signup metadata.
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, preferred_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', null),
    coalesce(new.raw_user_meta_data ->> 'preferred_locale', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- Content freeze: once a message leaves DRAFT/SCHEDULED it is being delivered,
-- so its content columns may not change. Only state and locked_at may advance.
create or replace function app.enforce_message_freeze()
returns trigger
language plpgsql
as $$
begin
  -- If the OLD row was already locked (past editable states), reject content edits.
  if old.state not in ('DRAFT', 'SCHEDULED') then
    if new.default_locale is distinct from old.default_locale
      or new.segment_id is distinct from old.segment_id
      or new.image_asset_id is distinct from old.image_asset_id
      or new.audio_asset_id is distinct from old.audio_asset_id
      or new.video_url is distinct from old.video_url
      or new.link_url is distinct from old.link_url
      or new.cta_label is distinct from old.cta_label
      or new.cta_url is distinct from old.cta_url
      or new.scheduled_at is distinct from old.scheduled_at
    then
      raise exception 'Message % content is frozen in state %', old.id, old.state
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_messages_freeze
  before update on public.messages
  for each row execute function app.enforce_message_freeze();
