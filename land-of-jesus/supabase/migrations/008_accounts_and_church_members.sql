-- Account foundation: profiles, platform staff, and exact church memberships.
-- Apply after 001-007. Memberships are assigned only by trusted operators;
-- an authenticated visitor cannot make themselves a church representative.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role public.user_role;

-- Create a profile for every new Supabase Auth user, including pilgrims who
-- have no church affiliation. Keep existing profiles and backfill older users.
CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_profile_after_auth_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_auth_user();

INSERT INTO public.profiles (id, email)
SELECT id, COALESCE(email, '') FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- A legal organization can operate several churches. Staff access therefore
-- belongs to a particular church, not automatically to every church owned by
-- the same organization.
CREATE TABLE public.church_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role NOT NULL CHECK (role IN ('CHURCH_MANAGER', 'CHURCH_EDITOR')),
  status text NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (church_id, user_id)
);

CREATE INDEX church_members_user_status_idx ON public.church_members (user_id, status);
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.church_members FROM anon, authenticated;
GRANT SELECT ON public.church_members TO authenticated;

CREATE POLICY church_members_read_own ON public.church_members
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Platform-wide privileges live on the profile and are assigned by trusted
-- operators only. No client UPDATE policy exists on profiles or memberships.
CREATE OR REPLACE FUNCTION loj.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND platform_role IN ('SUPER_ADMIN', 'EXECUTIVE')
  );
$$;

CREATE OR REPLACE FUNCTION loj.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND platform_role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR', 'VERIFICATION_OFFICER')
  );
$$;

CREATE OR REPLACE FUNCTION loj.is_church_manager(target_church_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.church_members
    WHERE church_id = target_church_id AND user_id = auth.uid()
      AND status = 'ACTIVE' AND role IN ('CHURCH_MANAGER', 'CHURCH_EDITOR')
  );
$$;

CREATE OR REPLACE FUNCTION loj.can_manage_project_finances(target_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = target_project_id)
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND platform_role IN ('SUPER_ADMIN', 'EXECUTIVE', 'FINANCE_ADMIN')
    );
$$;

-- Older RLS policies use these public helpers. Route all of them through the
-- same platform and per-church model, so organization membership cannot grant
-- unintentional access to other churches or platform administration.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT loj.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_church_member(p_church_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT loj.is_church_manager(p_church_id);
$$;

CREATE OR REPLACE FUNCTION public.can_change_project_status()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND platform_role IN ('SUPER_ADMIN', 'EXECUTIVE', 'VERIFICATION_OFFICER')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project_finances()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND platform_role IN ('SUPER_ADMIN', 'EXECUTIVE', 'FINANCE_ADMIN')
  );
$$;

-- Migration 004 grants function execution but omits schema access for signed-in
-- users. Its RLS policies call loj.* directly, so both privileges are needed.
GRANT USAGE ON SCHEMA loj TO authenticated;

COMMIT;
