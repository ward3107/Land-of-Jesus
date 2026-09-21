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
