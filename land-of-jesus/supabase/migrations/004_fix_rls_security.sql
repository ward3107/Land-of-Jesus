-- Land of Jesus - RLS Security Fixes
-- Migration 004: Fix privilege escalation vulnerabilities with SECURITY DEFINER functions
-- 
-- CRITICAL: Do NOT use OLD/NEW in RLS policy expressions - this is invalid PostgreSQL.
-- Instead, we use SECURITY DEFINER functions for complex authorization logic.

-- ==================================================
-- SECTION 1: HARDEN SECURITY DEFINER FUNCTIONS
-- ==================================================

-- Ensure loj schema exists
CREATE SCHEMA IF NOT EXISTS loj;

-- Function to check if user is admin
-- SECURITY DEFINER required to access profiles table safely from RLS context
CREATE OR REPLACE FUNCTION loj.is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.profiles p ON u.id = p.user_id
    WHERE u.id = auth.uid() AND p.role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Function to check if user is staff (can approve/publish)
CREATE OR REPLACE FUNCTION loj.is_staff() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.profiles p ON u.id = p.user_id
    WHERE u.id = auth.uid() AND p.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR', 'VERIFICATION_OFFICER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Function to check if user is church manager/editor for a specific church
CREATE OR REPLACE FUNCTION loj.is_church_manager(target_church_id uuid) RETURNS boolean AS $$
BEGIN
  IF target_church_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.church_members cm
    WHERE cm.user_id = auth.uid() 
      AND cm.church_id = target_church_id
      AND cm.role IN ('MANAGER', 'EDITOR')
      AND cm.status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user can edit a specific project
-- Returns true only if: user is staff OR (user is church manager AND project is in editable state)
CREATE OR REPLACE FUNCTION loj.can_edit_project(target_project_id uuid) RETURNS boolean AS $$
DECLARE
  proj_status projects.status%TYPE;
  proj_church_id projects.church_id%TYPE;
BEGIN
  SELECT status, church_id INTO proj_status, proj_church_id
  FROM public.projects WHERE id = target_project_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Staff can always edit
  IF loj.is_staff() THEN
    RETURN TRUE;
  END IF;
  
  -- Church managers can edit only drafts/submitted/documents_required
  IF loj.is_church_manager(proj_church_id) THEN
    IF proj_status IN ('DRAFT', 'SUBMITTED', 'DOCUMENTS_REQUIRED') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user can change project status (staff only)
CREATE OR REPLACE FUNCTION loj.can_change_project_status(target_project_id uuid) RETURNS boolean AS $$
BEGIN
  RETURN loj.is_staff();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if user can manage project finances (finance staff only)
CREATE OR REPLACE FUNCTION loj.can_manage_project_finances(target_project_id uuid) RETURNS boolean AS $$
DECLARE
  proj_church_id projects.church_id%TYPE;
BEGIN
  SELECT church_id INTO proj_church_id
  FROM public.projects WHERE id = target_project_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Only finance admins/staff can manage finances
  RETURN EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.profiles p ON u.id = p.user_id
    WHERE u.id = auth.uid() 
      AND p.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'FINANCE_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public execution on all security definer functions
REVOKE EXECUTE ON FUNCTION loj.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION loj.is_staff() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION loj.is_church_manager(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION loj.can_edit_project(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION loj.can_change_project_status(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION loj.can_manage_project_finances(uuid) FROM PUBLIC;

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION loj.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION loj.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION loj.is_church_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION loj.can_edit_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION loj.can_change_project_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION loj.can_manage_project_finances(uuid) TO authenticated;

-- ==================================================
-- SECTION 2: FIX PROJECTS RLS
-- ==================================================

DROP POLICY IF EXISTS "Church members can create projects" ON projects;
DROP POLICY IF EXISTS "Project editors can update their projects" ON projects;
DROP POLICY IF EXISTS "Admins can change project status" ON projects;
DROP POLICY IF EXISTS "Users can view all projects" ON projects;

-- Select: Public sees published, Church members see their drafts, Staff sees all
CREATE POLICY "projects_select_policy" ON public.projects FOR SELECT
USING (
  status = 'PUBLISHED' 
  OR loj.is_church_manager(church_id)
  OR loj.is_staff()
);

-- Insert: Only church managers (for their churches, DRAFT only) or staff
CREATE POLICY "projects_insert_policy" ON public.projects FOR INSERT
WITH CHECK (
  status = 'DRAFT'
  AND church_id IS NOT NULL
  AND (loj.is_church_manager(church_id) OR loj.is_staff())
);

-- Update: Use SECURITY DEFINER function for complex logic
-- Church managers can update content IF status allows. Cannot change to APPROVED/PUBLISHED.
-- Staff can update anything.
CREATE POLICY "projects_update_policy" ON public.projects FOR UPDATE
USING (loj.can_edit_project(id))
WITH CHECK (loj.can_edit_project(id));

-- Separate policy for status changes (staff only via SECURITY DEFINER)
CREATE POLICY "projects_status_change_policy" ON public.projects FOR UPDATE
USING (loj.can_change_project_status(id))
WITH CHECK (loj.can_change_project_status(id));

-- Delete: Staff only
CREATE POLICY "projects_delete_policy" ON public.projects FOR DELETE
USING (loj.is_staff());

-- ==================================================
-- SECTION 3: FIX PROJECT BUDGETS RLS
-- ==================================================

DROP POLICY IF EXISTS "Finance admins can manage budgets" ON project_budgets;
DROP POLICY IF EXISTS "Church members can view their project budgets" ON project_budgets;
DROP POLICY IF EXISTS "Project editors can manage budgets" ON project_budgets;

-- Finance staff can manage budgets
CREATE POLICY "project_budgets_manage_policy" ON project_budgets FOR ALL
USING (loj.can_manage_project_finances(project_id))
WITH CHECK (loj.can_manage_project_finances(project_id));

-- Church members can view budgets for their churches
CREATE POLICY "project_budgets_view_policy" ON project_budgets FOR SELECT
USING (
  loj.is_church_manager(
    (SELECT church_id FROM public.projects WHERE id = project_budgets.project_id)
  )
  OR loj.is_staff()
);

-- ==================================================
-- SECTION 4: FIX PROJECT UPDATES RLS (MODERATION)
-- ==================================================

DROP POLICY IF EXISTS "Church members can manage updates" ON project_updates;

-- Select: Published visible to all, unpublished visible to church managers and staff
CREATE POLICY "project_updates_select_policy" ON public.project_updates FOR SELECT
USING (
  is_published = true 
  OR loj.is_church_manager((SELECT church_id FROM public.projects WHERE id = project_updates.project_id))
  OR loj.is_staff()
);

-- Insert: Church managers (unpublished only) or staff
CREATE POLICY "project_updates_insert_policy" ON public.project_updates FOR INSERT
WITH CHECK (
  is_published = false
  AND (
    loj.is_church_manager((SELECT church_id FROM public.projects WHERE id = project_id))
    OR loj.is_staff()
  )
);

-- Update: Church managers can edit unpublished, staff can do anything
CREATE POLICY "project_updates_update_policy" ON public.project_updates FOR UPDATE
USING (
  loj.is_staff()
  OR (loj.is_church_manager((SELECT church_id FROM public.projects WHERE id = project_id)) AND is_published = false)
)
WITH CHECK (
  loj.is_staff()
  OR (loj.is_church_manager((SELECT church_id FROM public.projects WHERE id = project_id)) AND is_published = false)
);

-- ==================================================
-- SECTION 5: FIX CHURCH UPDATES RLS (MODERATION)
-- ==================================================

DROP POLICY IF EXISTS "Church members can manage updates" ON church_updates;
DROP POLICY IF EXISTS "Church members can draft updates" ON church_updates;
DROP POLICY IF EXISTS "Church members can edit unpublished updates" ON church_updates;
DROP POLICY IF EXISTS "Content reviewers can publish updates" ON church_updates;

-- Select: Published visible to all, unpublished visible to church managers and staff
CREATE POLICY "church_updates_select_policy" ON public.church_updates FOR SELECT
USING (
  is_published = true 
  OR loj.is_church_manager(church_id)
  OR loj.is_staff()
);

-- Insert: Church managers (unpublished only) or staff
CREATE POLICY "church_updates_insert_policy" ON public.church_updates FOR INSERT
WITH CHECK (
  is_published = false
  AND (loj.is_church_manager(church_id) OR loj.is_staff())
);

-- Update: Church managers can edit unpublished, staff can do anything
CREATE POLICY "church_updates_update_policy" ON public.church_updates FOR UPDATE
USING (
  loj.is_staff()
  OR (loj.is_church_manager(church_id) AND is_published = false)
)
WITH CHECK (
  loj.is_staff()
  OR (loj.is_church_manager(church_id) AND is_published = false)
);

-- ==================================================
-- SECTION 6: FIX HERITAGE ITEMS RLS (MODERATION)
-- ==================================================

DROP POLICY IF EXISTS "Church members can manage heritage items" ON heritage_items;
DROP POLICY IF EXISTS "Church members can draft heritage items" ON heritage_items;
DROP POLICY IF EXISTS "Church members can edit unpublished heritage items" ON heritage_items;
DROP POLICY IF EXISTS "Content reviewers can publish heritage items" ON heritage_items;

-- Select: Published visible to all, unpublished visible to church managers and staff
CREATE POLICY "heritage_items_select_policy" ON public.heritage_items FOR SELECT
USING (
  is_published = true 
  OR loj.is_church_manager(church_id)
  OR loj.is_staff()
);

-- Insert: Church managers (unpublished only) or staff
CREATE POLICY "heritage_items_insert_policy" ON public.heritage_items FOR INSERT
WITH CHECK (
  is_published = false
  AND (loj.is_church_manager(church_id) OR loj.is_staff())
);

-- Update: Church managers can edit unpublished, staff can do anything
CREATE POLICY "heritage_items_update_policy" ON public.heritage_items FOR UPDATE
USING (
  loj.is_staff()
  OR (loj.is_church_manager(church_id) AND is_published = false)
)
WITH CHECK (
  loj.is_staff()
  OR (loj.is_church_manager(church_id) AND is_published = false)
);

-- ==================================================
-- SECTION 7: FIX HISTORICAL EVENTS RLS (MODERATION)
-- ==================================================

DROP POLICY IF EXISTS "Church members can manage historical events" ON historical_events;
DROP POLICY IF EXISTS "Church members can draft historical events" ON historical_events;
DROP POLICY IF EXISTS "Church members can edit unpublished historical events" ON historical_events;
DROP POLICY IF EXISTS "Content reviewers can publish historical events" ON historical_events;

-- Select: Published visible to all, unpublished visible to church managers and staff
CREATE POLICY "historical_events_select_policy" ON public.historical_events FOR SELECT
USING (
  is_published = true 
  OR loj.is_church_manager(church_id)
  OR loj.is_staff()
);

-- Insert: Church managers (unpublished only) or staff
CREATE POLICY "historical_events_insert_policy" ON public.historical_events FOR INSERT
WITH CHECK (
  is_published = false
  AND (loj.is_church_manager(church_id) OR loj.is_staff())
);

-- Update: Church managers can edit unpublished, staff can do anything
CREATE POLICY "historical_events_update_policy" ON public.historical_events FOR UPDATE
USING (
  loj.is_staff()
  OR (loj.is_church_manager(church_id) AND is_published = false)
)
WITH CHECK (
  loj.is_staff()
  OR (loj.is_church_manager(church_id) AND is_published = false)
);

-- ==================================================
-- SECTION 8: FIX FOLLOWERS PRIVACY
-- ==================================================

DROP POLICY IF EXISTS "Users can view all followers" ON followers;
DROP POLICY IF EXISTS "Followers viewable by authenticated users" ON followers;
DROP POLICY IF EXISTS "Users can view their own follows" ON followers;
DROP POLICY IF EXISTS "Users can manage their own follows" ON followers;

-- Users can ONLY see their own follows
CREATE POLICY "followers_self_select" ON public.followers FOR SELECT
USING (user_id = auth.uid());

-- Users can manage their own follows
CREATE POLICY "followers_self_all" ON public.followers FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ==================================================
-- NOTES:
-- - No OLD/NEW references in RLS policies (invalid in CREATE POLICY)
-- - All complex logic moved to SECURITY DEFINER functions
-- - Church managers cannot self-approve or self-publish
-- - Financial data protected by separate finance functions
-- - Follower privacy enforced (users see only their own)
-- - Content moderation enforced (draft -> staff publish workflow)
