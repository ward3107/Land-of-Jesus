-- Land of Jesus - RLS Security Fixes
-- Migration 004: Fix privilege escalation vulnerabilities

-- ==================================================
-- FIX PROJECT CREATION: Require church_id and membership
-- ==================================================

DROP POLICY IF EXISTS "Church members can create projects" ON projects;

CREATE POLICY "Church members can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    church_id IS NOT NULL 
    AND is_church_member(church_id)
    AND status = 'DRAFT'
  );

-- ==================================================
-- FIX PROJECT UPDATE: Prevent unauthorized status/financial changes
-- ==================================================

DROP POLICY IF EXISTS "Project editors can update their projects" ON projects;

CREATE POLICY "Project editors can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (can_edit_project(id))
  WITH CHECK (
    can_edit_project(id)
    AND status = OLD.status  -- Prevent status changes by church members
    AND raised_amount = OLD.raised_amount  -- Prevent financial manipulation
  );

-- ==================================================
-- ADD ADMIN-ONLY STATUS CHANGE POLICY
-- ==================================================

CREATE POLICY "Admins can change project status"
  ON projects FOR UPDATE
  TO authenticated
  USING (can_change_project_status())
  WITH CHECK (can_change_project_status());

-- ==================================================
-- FIX PROJECT BUDGETS: Only finance admins can modify
-- ==================================================

DROP POLICY IF EXISTS "Project editors can manage budgets" ON project_budgets;

CREATE POLICY "Finance admins can manage budgets"
  ON project_budgets FOR ALL
  TO authenticated
  USING (can_manage_project_finances())
  WITH CHECK (can_manage_project_finances());

-- Church members can view budgets but not edit
CREATE POLICY "Church members can view their project budgets"
  ON project_budgets FOR SELECT
  TO authenticated
  USING (can_edit_project(project_id));

-- ==================================================
-- FIX CONTENT MODERATION: Church members cannot self-publish
-- ==================================================

-- Church updates: members can draft/edit, but only admins/content editors can publish
DROP POLICY IF EXISTS "Church members can manage updates" ON church_updates;

CREATE POLICY "Church members can draft updates"
  ON church_updates FOR INSERT
  TO authenticated
  WITH CHECK (is_church_member(church_id) AND NOT is_published);

CREATE POLICY "Church members can edit unpublished updates"
  ON church_updates FOR UPDATE
  TO authenticated
  USING (is_church_member(church_id) AND NOT is_published)
  WITH CHECK (is_church_member(church_id) AND NOT is_published);

CREATE POLICY "Content reviewers can publish updates"
  ON church_updates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN profiles p ON p.id = om.user_id
      WHERE p.id = auth.uid()
      AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN profiles p ON p.id = om.user_id
      WHERE p.id = auth.uid()
      AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR')
    )
  );

-- Heritage items: same moderation pattern
DROP POLICY IF EXISTS "Church members can manage heritage items" ON heritage_items;

CREATE POLICY "Church members can draft heritage items"
  ON heritage_items FOR INSERT
  TO authenticated
  WITH CHECK (is_church_member(church_id) AND NOT is_published);

CREATE POLICY "Church members can edit unpublished heritage items"
  ON heritage_items FOR UPDATE
  TO authenticated
  USING (is_church_member(church_id) AND NOT is_published)
  WITH CHECK (is_church_member(church_id) AND NOT is_published);

CREATE POLICY "Content reviewers can publish heritage items"
  ON heritage_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN profiles p ON p.id = om.user_id
      WHERE p.id = auth.uid()
      AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN profiles p ON p.id = om.user_id
      WHERE p.id = auth.uid()
      AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR')
    )
  );

-- Historical events: same moderation pattern
DROP POLICY IF EXISTS "Church members can manage historical events" ON historical_events;

CREATE POLICY "Church members can draft historical events"
  ON historical_events FOR INSERT
  TO authenticated
  WITH CHECK (is_church_member(church_id) AND NOT is_published);

CREATE POLICY "Church members can edit unpublished historical events"
  ON historical_events FOR UPDATE
  TO authenticated
  USING (is_church_member(church_id) AND NOT is_published)
  WITH CHECK (is_church_member(church_id) AND NOT is_published);

CREATE POLICY "Content reviewers can publish historical events"
  ON historical_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN profiles p ON p.id = om.user_id
      WHERE p.id = auth.uid()
      AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN profiles p ON p.id = om.user_id
      WHERE p.id = auth.uid()
      AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CONTENT_EDITOR')
    )
  );

-- ==================================================
-- FIX FOLLOWERS PRIVACY: Users can only see their own follows
-- ==================================================

DROP POLICY IF EXISTS "Users can view all followers" ON followers;

-- Users can view their own follows
CREATE POLICY "Users can view their own follows"
  ON followers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can follow/unfollow
CREATE POLICY "Users can manage their own follows"
  ON followers FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public follower counts via secure function (not direct table access)
-- This will be implemented in a future migration if needed
