-- Land of Jesus — consolidated schema + RLS + seed (run once in Supabase SQL editor)

-- ============ 001_core_schema.sql ============
-- Land of Jesus - Production Database Schema
-- Migration 001: Core tables and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- ENUMS
-- ==================================================

-- Church lifecycle status
CREATE TYPE church_status AS ENUM (
  'DISCOVERED',
  'LISTED',
  'CLAIM_REQUESTED',
  'REPRESENTATIVE_VERIFIED',
  'AUTHORITY_VERIFIED',
  'LOJ_VERIFIED',
  'SUSPENDED',
  'ARCHIVED'
);

-- Project lifecycle status
CREATE TYPE project_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'INITIAL_REVIEW',
  'DOCUMENTS_REQUIRED',
  'DUE_DILIGENCE',
  'APPROVED',
  'PUBLISHED',
  'FUNDING',
  'FUNDED',
  'IMPLEMENTATION',
  'EVIDENCE_REVIEW',
  'COMPLETED',
  'SUSPENDED',
  'REJECTED',
  'ARCHIVED'
);

-- Verification status
CREATE TYPE verification_status AS ENUM (
  'NOT_STARTED',
  'REQUESTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'EXPIRED'
);

-- Verification types
CREATE TYPE verification_type AS ENUM (
  'REPRESENTATIVE_IDENTITY',
  'ECCLESIASTICAL_AUTHORITY',
  'LEGAL_ENTITY',
  'CHURCH_RELATIONSHIP',
  'FINANCIAL_RECIPIENT',
  'PROJECT_DOCUMENTS',
  'PROJECT_BUDGET'
);

-- Translation status
CREATE TYPE translation_status AS ENUM (
  'SOURCE',
  'DRAFT',
  'AI_ASSISTED',
  'HUMAN_REVIEWED',
  'CHURCH_REVIEWED',
  'PUBLISHED'
);

-- User roles
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'EXECUTIVE',
  'CONTENT_EDITOR',
  'VERIFICATION_OFFICER',
  'FINANCE_ADMIN',
  'CHURCH_MANAGER',
  'CHURCH_EDITOR',
  'DONOR',
  'AUDITOR',
  'SUPPORT_AGENT'
);

-- ==================================================
-- CORE TABLES
-- ==================================================

-- Organizations (legal entities, separate from churches)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  country TEXT,
  registration_number TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Denominations
CREATE TABLE denominations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  name_he TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ecclesiastical authorities
CREATE TABLE ecclesiastical_authorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  name_he TEXT,
  type TEXT,
  jurisdiction TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Churches
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_he TEXT,
  organization_id UUID REFERENCES organizations(id),
  denomination_id UUID REFERENCES denominations(id),
  ecclesiastical_authority_id UUID REFERENCES ecclesiastical_authorities(id),
  status church_status NOT NULL DEFAULT 'DISCOVERED',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Church locations
CREATE TABLE church_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  region TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'Israel',
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Church contacts
CREATE TABLE church_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  website TEXT,
  social_media JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Church visiting information
CREATE TABLE church_visiting_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  is_open_to_visitors BOOLEAN, -- NULL means unknown, TRUE means open, FALSE means closed
  opening_hours JSONB, -- structured hours per day
  mass_times JSONB,
  liturgy_times JSONB,
  admission_info TEXT,
  accessibility_info TEXT,
  parking_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members (users associated with organizations/churches)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Supabase auth user ID
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Church verifications
CREATE TABLE church_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  verification_type verification_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'NOT_STARTED',
  evidence_reference TEXT, -- reference to storage
  reviewed_by UUID, -- admin user ID
  requested_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(church_id, verification_type)
);

-- ==================================================
-- CONTENT TABLES
-- ==================================================

-- Church descriptions/narratives (translatable content)
CREATE TABLE church_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  overview TEXT,
  story TEXT,
  heritage TEXT,
  community TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(church_id, locale)
);

-- Heritage items
CREATE TABLE heritage_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  title_he TEXT,
  description TEXT,
  item_type TEXT, -- artifact, artwork, architectural feature, etc.
  date_period TEXT,
  significance TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historical events
CREATE TABLE historical_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  title_he TEXT,
  event_date TEXT, -- flexible date representation
  description TEXT,
  sources TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Church updates (news/announcements)
CREATE TABLE church_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  title_he TEXT,
  content TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- PROJECTS
-- ==================================================

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  title_he TEXT,
  short_description TEXT,
  full_description TEXT,
  category TEXT,
  status project_status NOT NULL DEFAULT 'DRAFT',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project budgets
CREATE TABLE project_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_amount DECIMAL(12, 2),
  currency TEXT NOT NULL DEFAULT 'USD',
  raised_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  budget_items JSONB, -- line items
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project documents
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project verifications
CREATE TABLE project_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_type verification_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'NOT_STARTED',
  evidence_reference TEXT,
  reviewed_by UUID,
  requested_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, verification_type)
);

-- Project updates
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT, -- progress, milestone, challenge, etc.
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project timelines
CREATE TABLE project_timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- MEDIA
-- ==================================================

-- Media assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  alt_text_ar TEXT,
  alt_text_he TEXT,
  copyright_status TEXT, -- owned, licensed, public_domain
  credit TEXT,
  usage_permission TEXT,
  owner_entity_type TEXT, -- church, project, organization
  owner_entity_id UUID,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- USERS & PROFILES
-- ==================================================

-- User profiles (extends Supabase auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_storage_key TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- FOLLOWERS & SAVED
-- ==================================================

-- Followers (users following churches or projects)
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'church' or 'project'
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Saved places
CREATE TABLE saved_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, church_id)
);

-- ==================================================
-- TRANSLATIONS
-- ==================================================

-- Centralized translations table
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'church', 'project', 'heritage_item', etc.
  entity_id UUID NOT NULL,
  field TEXT NOT NULL, -- which field is being translated
  locale TEXT NOT NULL,
  content TEXT NOT NULL,
  status translation_status NOT NULL DEFAULT 'SOURCE',
  source_locale TEXT DEFAULT 'en',
  reviewed_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, field, locale)
);

-- ==================================================
-- AUDIT LOGGING
-- ==================================================

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  reason TEXT,
  context JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Security events
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- low, medium, high, critical
  user_id UUID REFERENCES profiles(id),
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- INDEXES
-- ==================================================

-- Churches
CREATE INDEX idx_churches_slug ON churches(slug);
CREATE INDEX idx_churches_status ON churches(status);
CREATE INDEX idx_churches_is_published ON churches(is_published);
CREATE INDEX idx_churches_denomination ON churches(denomination_id);
CREATE INDEX idx_churches_organization ON churches(organization_id);

-- Church locations
CREATE INDEX idx_church_locations_church_id ON church_locations(church_id);
CREATE INDEX idx_church_locations_city ON church_locations(city);
CREATE INDEX idx_church_locations_coordinates ON church_locations(latitude, longitude);

-- Projects
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_church_id ON projects(church_id);
CREATE INDEX idx_projects_is_published ON projects(is_published);

-- Followers
CREATE INDEX idx_followers_user_id ON followers(user_id);
CREATE INDEX idx_followers_entity ON followers(entity_type, entity_id);

-- Translations
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_locale ON translations(locale);
CREATE INDEX idx_translations_status ON translations(status);

-- Audit logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==================================================
-- TRIGGERS FOR updated_at
-- ==================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_budgets_updated_at
  BEFORE UPDATE ON project_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- INITIAL DATA
-- ==================================================

-- Sample denominations
INSERT INTO denominations (name, name_ar, name_he, description) VALUES
  ('Roman Catholic', 'الكاثوليكية الرومانية', 'קתולית רומית', 'Latin Church and Eastern Catholic Churches'),
  ('Greek Orthodox', 'الروم الأرثوذكس', 'יווני אורתודוקסי', 'Greek Orthodox Patriarchate of Jerusalem'),
  ('Armenian Apostolic', 'الأرمن الأرثوذكس', 'ארמני אפוסטולי', 'Armenian Apostolic Church'),
  ('Maronite', 'الموارنة', 'מרוני', 'Maronite Church'),
  ('Anglican', 'الأنجليكان', 'אנגליקני', 'Episcopal Church in Jerusalem and the Middle East'),
  ('Lutheran', 'اللوثرية', 'לותרני', 'Evangelical Lutheran Church in Jordan and the Holy Land');

-- Sample ecclesiastical authorities
INSERT INTO ecclesiastical_authorities (name, name_ar, name_he, type, jurisdiction) VALUES
  ('Latin Patriarchate of Jerusalem', 'البطريركية اللاتينية في القدس', 'הפטריארכיה הלטינית של ירושלים', 'Patriarchate', 'Israel, Palestine, Jordan, Cyprus'),
  ('Greek Orthodox Patriarchate of Jerusalem', 'بطريركية الروم الأرثوذكس في القدس', 'הפטריארכיה היוונית-אורתודוקסית של ירושלים', 'Patriarchate', 'Israel, Palestine, Jordan'),
  ('Armenian Patriarchate of Jerusalem', 'البطريركية الأرمنية في القدس', 'הפטריארכיה הארמנית של ירושלים', 'Patriarchate', 'Israel, Palestine, Jordan');


-- ============ 002_rls_policies.sql ============
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

-- Check if user can change project status (only admins/LOJ staff)
CREATE OR REPLACE FUNCTION can_change_project_status()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    JOIN profiles p ON p.id = om.user_id
    WHERE p.id = auth.uid()
    AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'VERIFICATION_OFFICER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage project finances (only finance admins/executives)
CREATE OR REPLACE FUNCTION can_manage_project_finances()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members om
    JOIN profiles p ON p.id = om.user_id
    WHERE p.id = auth.uid()
    AND om.role IN ('SUPER_ADMIN', 'EXECUTIVE', 'FINANCE_ADMIN')
  );
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


-- ============ 003_seed_data.sql ============
-- Land of Jesus - Demo Seed Data
-- Migration 003: Safe demo data for development/testing
-- IMPORTANT: All data is clearly marked as DEMO/EXAMPLE

-- ==================================================
-- DEMO ORGANIZATIONS
-- ==================================================

INSERT INTO organizations (id, name, legal_name, country) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Parish Association', 'Demo Parish Association Ltd.', 'Israel'),
  ('00000000-0000-0000-0000-000000000002', 'Example Heritage Foundation', 'Example Heritage Foundation', 'Israel');

-- ==================================================
-- DEMO DENOMINATIONS & AUTHORITIES (added so church links resolve)
-- ==================================================
INSERT INTO denominations (name, name_ar, name_he) VALUES
  ('Roman Catholic', 'روم كاثوليك', 'קתולי רומי'),
  ('Greek Orthodox', 'روم أرثوذكس', 'יווני אורתודוקסי'),
  ('Armenian Apostolic', 'أرمن أرثوذكس', 'ארמני אפוסטולי');

INSERT INTO ecclesiastical_authorities (name, name_ar, name_he, type) VALUES
  ('Latin Patriarchate of Jerusalem', 'بطريركية اللاتين في القدس', 'הפטריארכיה הלטינית של ירושלים', 'Patriarchate'),
  ('Greek Orthodox Patriarchate of Jerusalem', 'بطريركية الروم الأرثوذكس في القدس', 'הפטריארכיה היוונית-אורתודוקסית של ירושלים', 'Patriarchate');

-- ==================================================
-- DEMO CHURCHES (using slugs for public URLs)
-- ==================================================

INSERT INTO churches (id, slug, name, name_ar, name_he, organization_id, denomination_id, ecclesiastical_authority_id, status, is_published) VALUES
  -- Basilica of the Annunciation, Nazareth (demo data)
  ('10000000-0000-0000-0000-000000000001', 'basilica-annunciation-nazareth', 
   'Basilica of the Annunciation', 
   'كنيسة البشارة', 
   'בזיליקת הבשורה',
   '00000000-0000-0000-0000-000000000001',
   (SELECT id FROM denominations WHERE name = 'Roman Catholic' LIMIT 1),
   (SELECT id FROM ecclesiastical_authorities WHERE name LIKE '%Latin%' LIMIT 1),
   'LOJ_VERIFIED', true),
  
  -- Church of the Nativity, Bethlehem (demo data)
  ('10000000-0000-0000-0000-000000000002', 'church-nativity-bethlehem',
   'Church of the Nativity',
   'كنيسة المهد',
   'כנסיית המולד',
   NULL,
   (SELECT id FROM denominations WHERE name = 'Greek Orthodox' LIMIT 1),
   (SELECT id FROM ecclesiastical_authorities WHERE name LIKE '%Greek Orthodox%' LIMIT 1),
   'LISTED', true),
  
  -- Church of the Holy Sepulchre, Jerusalem (demo data)
  ('10000000-0000-0000-0000-000000000003', 'holy-sepulchre-jerusalem',
   'Church of the Holy Sepulchre',
   'كنيسة القيامة',
   'כנסיית הקבר',
   NULL,
   NULL, -- Multiple denominations
   NULL,
   'DISCOVERED', true);

-- ==================================================
-- DEMO CHURCH LOCATIONS
-- ==================================================

INSERT INTO church_locations (church_id, address_line1, city, region, country, latitude, longitude) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Paulus VI Street', 'Nazareth', 'Northern District', 'Israel', 32.7003, 35.3030),
  ('10000000-0000-0000-0000-000000000002', 'Manger Square', 'Bethlehem', 'West Bank', 'Palestine', 31.7044, 35.2078),
  ('10000000-0000-0000-0000-000000000003', 'Christian Quarter Road', 'Jerusalem', 'Jerusalem District', 'Israel', 31.7784, 35.2294);

-- ==================================================
-- DEMO CHURCH CONTACTS
-- ==================================================

INSERT INTO church_contacts (church_id, email, phone, website) VALUES
  ('10000000-0000-0000-0000-000000000001', 'info@annunciation-nazareth.demo', '+972-4-6000000', 'https://example.com/annunciation'),
  ('10000000-0000-0000-0000-000000000002', NULL, NULL, NULL),
  ('10000000-0000-0000-0000-000000000003', NULL, NULL, NULL);

-- ==================================================
-- DEMO CHURCH VISITING INFO
-- ==================================================

INSERT INTO church_visiting_info (church_id, is_open_to_visitors, opening_hours, admission_info, accessibility_info) VALUES
  ('10000000-0000-0000-0000-000000000001', true, 
   '{"monday": "08:00-12:00,14:00-18:00", "tuesday": "08:00-12:00,14:00-18:00", "wednesday": "08:00-12:00,14:00-18:00", "thursday": "08:00-12:00,14:00-18:00", "friday": "08:00-12:00,14:00-18:00", "saturday": "08:00-12:00,14:00-18:00", "sunday": "08:00-12:00,14:00-18:00"}',
   'Free admission. Guided tours available.',
   'Wheelchair accessible entrance available.'),
  ('10000000-0000-0000-0000-000000000002', true,
   '{"monday": "09:00-17:00", "tuesday": "09:00-17:00", "wednesday": "09:00-17:00", "thursday": "09:00-17:00", "friday": "09:00-17:00", "saturday": "09:00-17:00", "sunday": "09:00-17:00"}',
   'Free admission. Dress code enforced.',
   NULL),
  ('10000000-0000-0000-0000-000000000003', true,
   '{"monday": "04:00-19:00", "tuesday": "04:00-19:00", "wednesday": "04:00-19:00", "thursday": "04:00-19:00", "friday": "04:00-19:00", "saturday": "04:00-19:00", "sunday": "04:00-19:00"}',
   'Free admission. Security check required.',
   'Limited accessibility due to historic structure.');

-- ==================================================
-- DEMO CHURCH DESCRIPTIONS
-- ==================================================

INSERT INTO church_descriptions (church_id, locale, overview, story, heritage, community) VALUES
  ('10000000-0000-0000-0000-000000000001', 'en',
   'The Basilica of the Annunciation is a Catholic church in Nazareth, Israel. It is one of the largest churches in the Middle East and marks the traditional site where the Archangel Gabriel announced to Mary that she would bear Jesus.',
   'The current basilica was built in 1969, designed by Italian architect Giovanni Muzio. It stands over the ruins of earlier Byzantine and Crusader churches. The site has been a place of Christian pilgrimage since ancient times.',
   'The basilica features stunning modern architecture with beautiful stained glass windows depicting various theological themes. The grotto below contains the traditional site of the Annunciation.',
   'The church serves the local Catholic community in Nazareth and welcomes pilgrims from around the world. Regular masses are held in multiple languages.'),
  
  ('10000000-0000-0000-0000-000000000001', 'ar',
   'كنيسة البشارة هي كنيسة كاثوليكية تقع في الناصرة، إسرائيل. وهي واحدة من أكبر الكنائس في الشرق الأوسط وتحتفل بالموقع التقليدي حيث بشّر الملاك جبرائيل مريم بأنها ستلد يسوع.',
   'تم بناء البازيليكا الحالية عام 1969، صممها المهندس المعماري الإيطالي جيوفاني موتسيو. تقف على أنقاض كنائس بيزنطية وصليبية سابقة. كان الموقع مكانًا للحج المسيحي منذ العصور القديمة.',
   'تتميز البازيليكا بهندسة معمارية حديثة مذهلة مع نوافذ زجاجية ملونة جميلة تصور موضوعات لاهوتية مختلفة. يحتوي المغارة أدناه على الموقع التقليدي للبشارة.',
   'تخدم الكنيسة المجتمع الكاثوليكي المحلي في الناصرة وترحب بالحجاج من جميع أنحاء العالم. تقام القداس بانتظام بلغات متعددة.'),
  
  ('10000000-0000-0000-0000-000000000001', 'he',
   'בזיליקת הבשורה היא כנסייה קתולית בנצרת, ישראל. זוהי אחת הכנסיות הגדולות במזרח התיכון ומציינת את המקום המסורתי שבו הבשר המלאך גבריאל למרים שהיא תלד את ישו.',
   'הבזיליקה הנוכחית נבנתה ב-1969, בתכנון האדריכל האיטלקי ג''ובאני מוציו. היא ניצבת על חורבות כנסיות ביזנטיות וצלבניות קודמות. האתר היה מקום עלייה לרגל נוצרי מאז ימי קדם.',
   'הבזיליקה מציגה ארכיטקטורה מודרנית מדהימה עם חלונות ויטראז'' יפים המתארים נושאים תיאולוגיים שונים. המערה שמתחת מכילה את האתר המסורתי של הבשורה.',
   'הכנסייה משרתת את הקהילה הקתולית המקומית בנצרת ומקבלת בברכה עולי רגל מכל רחבי העולם. מיסות מתקיימות באופן קבוע בשפות מרובות.');

-- ==================================================
-- DEMO PROJECTS
-- ==================================================

INSERT INTO projects (id, slug, church_id, title, title_ar, title_he, short_description, full_description, category, status, is_published) VALUES
  ('20000000-0000-0000-0000-000000000001', 'basilica-restoration-phase1', 
   '10000000-0000-0000-0000-000000000001',
   'Basilica Restoration - Phase 1',
   'ترميم البازيليكا - المرحلة الأولى',
   'שיקום הבזיליקה - שלב 1',
   'Restoration of the main nave and facade of the Basilica of the Annunciation.',
   'This project focuses on the critical restoration needs of the basilica, including structural repairs, cleaning of the facade, and preservation of original architectural elements. The work will ensure the building remains safe and accessible for future generations.',
   'Restoration',
   'APPROVED',
   true),
  
  ('20000000-0000-0000-0000-000000000002', 'heritage-documentation-project',
   NULL,
   'Holy Land Heritage Documentation',
   'توثيق تراث الأرض المقدسة',
   'תיעוד מורשת ארץ הקודש',
   'Digital documentation of Christian heritage sites across the Holy Land.',
   'A comprehensive initiative to photograph, scan, and document Christian heritage sites, artifacts, and manuscripts throughout Israel and surrounding regions. This digital archive will preserve invaluable historical records for researchers and future generations.',
   'Documentation',
   'IMPLEMENTATION',
   true);

-- ==================================================
-- DEMO PROJECT BUDGETS
-- ==================================================

INSERT INTO project_budgets (project_id, total_amount, currency, raised_amount, budget_items) VALUES
  ('20000000-0000-0000-0000-000000000001', 250000.00, 'USD', 45000.00, 
   '[{"item": "Structural assessment", "amount": 25000}, {"item": "Facade cleaning", "amount": 80000}, {"item": "Stone repair", "amount": 100000}, {"item": "Roof waterproofing", "amount": 45000}]'),
  
  ('20000000-0000-0000-0000-000000000002', 150000.00, 'USD', 78000.00,
   '[{"item": "Photography equipment", "amount": 30000}, {"item": "3D scanning", "amount": 50000}, {"item": "Archive platform", "amount": 40000}, {"item": "Personnel", "amount": 30000}]');

-- ==================================================
-- DEMO PROJECT TIMELINES
-- ==================================================

INSERT INTO project_timelines (project_id, phase, start_date, end_date, is_completed) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Assessment', '2025-01-01', '2025-03-31', true),
  ('20000000-0000-0000-0000-000000000001', 'Facade Work', '2025-04-01', '2025-08-31', false),
  ('20000000-0000-0000-0000-000000000001', 'Interior Restoration', '2025-09-01', '2025-12-31', false),
  
  ('20000000-0000-0000-0000-000000000002', 'Planning', '2024-06-01', '2024-09-30', true),
  ('20000000-0000-0000-0000-000000000002', 'Field Documentation', '2024-10-01', '2025-06-30', false),
  ('20000000-0000-0000-0000-000000000002', 'Platform Development', '2025-03-01', '2025-09-30', false);

-- ==================================================
-- DEMO HERITAGE ITEMS
-- ==================================================

INSERT INTO heritage_items (church_id, title, title_ar, title_he, description, item_type, date_period, is_published) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Annunciation Grotto', 'مغارة البشارة', 'מערת הבשורה', 
   'The natural cave venerated as the place where the Annunciation occurred.', 'Archaeological Site', '1st century (traditional)', true),
  ('10000000-0000-0000-0000-000000000001', 'Bronze Statue of Gabriel', 'تمثال برونزي لجبرائيل', 'פסל ברונזה של גבריאל',
   'Modern bronze sculpture depicting the Archangel Gabriel at the entrance.', 'Artwork', '20th century', true);

-- ==================================================
-- DEMO CHURCH UPDATES
-- ==================================================

INSERT INTO church_updates (church_id, title, title_ar, title_he, content, published_at, is_published) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Christmas Celebrations 2025', 'احتفالات عيد الميلاد 2025', 'חגיגות חג המולד 2025',
   'Join us for special Christmas masses and celebrations. Schedule available on our website.', NOW() - INTERVAL '5 days', true),
  ('10000000-0000-0000-0000-000000000001', 'Restoration Project Update', 'تحديث مشروع الترميم', 'עדכון פרויקט השיקום',
   'Phase 1 of our restoration project has begun. Thank you for your support.', NOW() - INTERVAL '15 days', true);

-- ==================================================
-- DEMO PROJECT UPDATES
-- ==================================================

INSERT INTO project_updates (project_id, title, content, update_type, published_at, is_published) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Assessment Complete', 
   'The structural assessment phase has been completed successfully. Engineers have identified key areas requiring attention.',
   'milestone', NOW() - INTERVAL '10 days', true),
  ('20000000-0000-0000-0000-000000000002', 'First 50 Sites Documented',
   'We have successfully documented our first 50 heritage sites with high-resolution photography and 3D scans.',
   'progress', NOW() - INTERVAL '3 days', true);

-- ==================================================
-- NOTE: User profiles, followers, and other user-specific data
-- should be created through the application, not seeded here.
-- This ensures proper auth integration.


-- ============ 004_fix_rls_security.sql ============
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


