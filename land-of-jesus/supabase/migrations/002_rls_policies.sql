-- Land of Jesus - Row Level Security Policies
-- Migration 002: RLS policies for all tables

-- ==================================================
-- ENABLE RLS ON ALL TABLES
-- ==================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE denominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecclesiastical_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_visiting_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heritage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- HELPER FUNCTIONS
-- ==================================================

-- Check if user has admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    JOIN profiles p ON p.id = om.user_id
    WHERE p.id = auth.uid()
    AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is church manager/editor for a specific church
CREATE OR REPLACE FUNCTION is_church_member(p_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM churches c
    JOIN organization_members om ON om.organization_id = c.organization_id
    JOIN profiles p ON p.id = om.user_id
    WHERE c.id = p_church_id
    AND p.id = auth.uid()
    AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'CHURCH_MANAGER', 'CHURCH_EDITOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit a project
CREATE OR REPLACE FUNCTION can_edit_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_church_id UUID;
BEGIN
  SELECT church_id INTO v_church_id FROM projects WHERE id = p_project_id;
  
  IF v_church_id IS NULL THEN
    RETURN is_admin();
  END IF;
  
  RETURN is_church_member(v_church_id) OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- PUBLIC READ ACCESS
-- ==================================================

-- Denominations: everyone can read
CREATE POLICY "Denominations are viewable by everyone"
  ON denominations FOR SELECT
  TO public
  USING (true);

-- Ecclesiastical authorities: everyone can read
CREATE POLICY "Ecclesiastical authorities are viewable by everyone"
  ON ecclesiastical_authorities FOR SELECT
  TO public
  USING (true);

-- Churches: only published churches visible to public
CREATE POLICY "Published churches are viewable by everyone"
  ON churches FOR SELECT
  TO public
  USING (is_published = true);

-- Church locations: visible for published churches
CREATE POLICY "Church locations viewable for published churches"
  ON church_locations FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM churches WHERE id = church_locations.church_id AND is_published = true
    )
  );

-- Church contacts: visible for published churches
CREATE POLICY "Church contacts viewable for published churches"
  ON church_contacts FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM churches WHERE id = church_contacts.church_id AND is_published = true
    )
  );

-- Church visiting info: visible for published churches
CREATE POLICY "Church visiting info viewable for published churches"
  ON church_visiting_info FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM churches WHERE id = church_visiting_info.church_id AND is_published = true
    )
  );

-- Church descriptions: visible for published churches
CREATE POLICY "Church descriptions viewable for published churches"
  ON church_descriptions FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM churches WHERE id = church_descriptions.church_id AND is_published = true
    )
  );

-- Heritage items: only published items from published churches
CREATE POLICY "Published heritage items viewable by everyone"
  ON heritage_items FOR SELECT
  TO public
  USING (is_published = true AND EXISTS (
    SELECT 1 FROM churches WHERE id = heritage_items.church_id AND is_published = true
  ));

-- Historical events: only published events from published churches
CREATE POLICY "Published historical events viewable by everyone"
  ON historical_events FOR SELECT
  TO public
  USING (is_published = true AND EXISTS (
    SELECT 1 FROM churches WHERE id = historical_events.church_id AND is_published = true
  ));

-- Church updates: only published updates from published churches
CREATE POLICY "Published church updates viewable by everyone"
  ON church_updates FOR SELECT
  TO public
  USING (is_published = true AND EXISTS (
    SELECT 1 FROM churches WHERE id = church_updates.church_id AND is_published = true
  ));

-- Projects: only published projects
CREATE POLICY "Published projects viewable by everyone"
  ON projects FOR SELECT
  TO public
  USING (is_published = true);

-- Project budgets: visible for published projects
CREATE POLICY "Project budgets viewable for published projects"
  ON project_budgets FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_budgets.project_id AND is_published = true
    )
  );

-- Project updates: only published updates
CREATE POLICY "Published project updates viewable by everyone"
  ON project_updates FOR SELECT
  TO public
  USING (is_published = true);

-- Project timelines: visible for published projects
CREATE POLICY "Project timelines viewable for published projects"
  ON project_timelines FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_timelines.project_id AND is_published = true
    )
  );

-- Translations: only published translations
CREATE POLICY "Published translations viewable by everyone"
  ON translations FOR SELECT
  TO public
  USING (status = 'PUBLISHED');

-- Media assets: visible based on permissions
CREATE POLICY "Media assets with public permission viewable by everyone"
  ON media_assets FOR SELECT
  TO public
  USING (usage_permission = 'public');

-- ==================================================
-- AUTHENTICATED USER ACCESS
-- ==================================================

-- Profiles: users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Followers: authenticated users can read all followers
CREATE POLICY "Followers viewable by authenticated users"
  ON followers FOR SELECT
  TO authenticated
  USING (true);

-- Followers: users can insert their own follows
CREATE POLICY "Users can follow churches and projects"
  ON followers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Followers: users can delete their own follows
CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Saved places: authenticated users can read their own saved places
CREATE POLICY "Users can view their own saved places"
  ON saved_places FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Saved places: users can insert their own saved places
CREATE POLICY "Users can save places"
  ON saved_places FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Saved places: users can delete their own saved places
CREATE POLICY "Users can remove saved places"
  ON saved_places FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==================================================
-- CHURCH MEMBER ACCESS
-- ==================================================

-- Churches: members can read their churches regardless of publish status
CREATE POLICY "Church members can view their churches"
  ON churches FOR SELECT
  TO authenticated
  USING (is_church_member(id));

-- Church descriptions: members can edit
CREATE POLICY "Church members can edit descriptions"
  ON church_descriptions FOR ALL
  TO authenticated
  USING (is_church_member(church_id))
  WITH CHECK (is_church_member(church_id));

-- Church contacts: members can edit
CREATE POLICY "Church members can edit contacts"
  ON church_contacts FOR ALL
  TO authenticated
  USING (is_church_member(church_id))
  WITH CHECK (is_church_member(church_id));

-- Church visiting info: members can edit
CREATE POLICY "Church members can edit visiting info"
  ON church_visiting_info FOR ALL
  TO authenticated
  USING (is_church_member(church_id))
  WITH CHECK (is_church_member(church_id));

-- Church updates: members can manage
CREATE POLICY "Church members can manage updates"
  ON church_updates FOR ALL
  TO authenticated
  USING (is_church_member(church_id))
  WITH CHECK (is_church_member(church_id));

-- Heritage items: members can manage
CREATE POLICY "Church members can manage heritage items"
  ON heritage_items FOR ALL
  TO authenticated
  USING (is_church_member(church_id))
  WITH CHECK (is_church_member(church_id));

-- Historical events: members can manage
CREATE POLICY "Church members can manage historical events"
  ON historical_events FOR ALL
  TO authenticated
  USING (is_church_member(church_id))
  WITH CHECK (is_church_member(church_id));

-- ==================================================
-- PROJECT ACCESS
-- ==================================================

-- Projects: members can read their projects regardless of publish status
CREATE POLICY "Project members can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (can_edit_project(id));

-- Projects: members can create/edit their projects
CREATE POLICY "Church members can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    church_id IS NULL OR is_church_member(church_id)
  );

CREATE POLICY "Project editors can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (can_edit_project(id))
  WITH CHECK (can_edit_project(id));

-- Project budgets: editors can manage
CREATE POLICY "Project editors can manage budgets"
  ON project_budgets FOR ALL
  TO authenticated
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- Project documents: editors can manage
CREATE POLICY "Project editors can manage documents"
  ON project_documents FOR ALL
  TO authenticated
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- Project updates: editors can manage
CREATE POLICY "Project editors can manage updates"
  ON project_updates FOR ALL
  TO authenticated
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- Project timelines: editors can manage
CREATE POLICY "Project editors can manage timelines"
  ON project_timelines FOR ALL
  TO authenticated
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- ==================================================
-- ADMIN ONLY ACCESS
-- ==================================================

-- Organizations: admins can manage
CREATE POLICY "Admins can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Organization members: admins can manage
CREATE POLICY "Admins can view organization members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can manage organization members"
  ON organization_members FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Church verifications: admins can manage
CREATE POLICY "Admins can view church verifications"
  ON church_verifications FOR SELECT
  TO authenticated
  USING (is_admin() OR is_church_member(church_id));

CREATE POLICY "Admins can manage church verifications"
  ON church_verifications FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Project verifications: admins can manage
CREATE POLICY "Admins can view project verifications"
  ON project_verifications FOR SELECT
  TO authenticated
  USING (is_admin() OR can_edit_project(project_id));

CREATE POLICY "Admins can manage project verifications"
  ON project_verifications FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Audit logs: admins can view
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Security events: admins can view
CREATE POLICY "Admins can view security events"
  ON security_events FOR SELECT
  TO authenticated
  USING (is_admin());

-- ==================================================
-- MEDIA ACCESS
-- ==================================================

-- Media assets: owners and admins can manage
CREATE POLICY "Media owners can view their assets"
  ON media_assets FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() 
    OR is_admin()
    OR (owner_entity_type = 'church' AND is_church_member(owner_entity_id))
    OR (owner_entity_type = 'project' AND can_edit_project(owner_entity_id))
  );

CREATE POLICY "Authenticated users can upload media"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Media owners can update their assets"
  ON media_assets FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() 
    OR is_admin()
  )
  WITH CHECK (
    uploaded_by = auth.uid() 
    OR is_admin()
  );

-- ==================================================
-- TRANSLATIONS ACCESS
-- ==================================================

-- Translations: reviewers and admins can update
CREATE POLICY "Translators can update translations"
  ON translations FOR UPDATE
  TO authenticated
  USING (reviewed_by = auth.uid() OR is_admin())
  WITH CHECK (reviewed_by = auth.uid() OR is_admin());
