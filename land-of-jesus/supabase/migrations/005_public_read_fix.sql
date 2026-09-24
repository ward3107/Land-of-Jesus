-- 005_public_read_fix.sql
-- Fix public (anon) read of published projects and their budgets.
--
-- Migration 004 gated public project visibility on `status = 'PUBLISHED'` and
-- called SECURITY DEFINER auth helpers that were revoked from anon. The seed
-- (and the app) treat `is_published = true` as "public", and projects there are
-- APPROVED/IMPLEMENTATION, so anon could not read any project. This restores the
-- intended public read without weakening the manager/staff paths.

-- 1. Let anon evaluate the auth helpers inside RLS. They are SECURITY DEFINER and
--    return FALSE when there is no authenticated user (auth.uid() IS NULL), so
--    this grants no data by itself — it only avoids "permission denied for
--    function" when a policy ORs them in.
GRANT USAGE ON SCHEMA loj TO anon;
GRANT EXECUTE ON FUNCTION loj.is_staff() TO anon;
GRANT EXECUTE ON FUNCTION loj.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION loj.is_church_manager(uuid) TO anon;
GRANT EXECUTE ON FUNCTION loj.can_edit_project(uuid) TO anon;
GRANT EXECUTE ON FUNCTION loj.can_change_project_status(uuid) TO anon;
GRANT EXECUTE ON FUNCTION loj.can_manage_project_finances(uuid) TO anon;

-- 2. Projects: public sees PUBLISHED rows keyed on is_published (matches churches
--    and the seed), plus the existing manager/staff visibility.
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects FOR SELECT
USING (
  is_published = true
  OR loj.is_church_manager(church_id)
  OR loj.is_staff()
);

-- 3. Project budgets: public read for budgets belonging to published projects
--    (004 dropped the public policy, leaving only manager/staff).
DROP POLICY IF EXISTS "project_budgets_view_policy" ON public.project_budgets;
CREATE POLICY "project_budgets_view_policy" ON public.project_budgets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_budgets.project_id AND p.is_published = true
  )
  OR loj.is_church_manager((SELECT church_id FROM public.projects WHERE id = project_budgets.project_id))
  OR loj.is_staff()
);
