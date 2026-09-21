# Land of Jesus - Database Documentation

## Schema Overview

The database uses PostgreSQL with Supabase, featuring:
- UUID primary keys for security
- Row Level Security (RLS) on all tables
- Comprehensive audit logging
- Scalable translation architecture

## Core Tables

### Organizations
Legal entities separate from churches.
- `id` (UUID)
- `name`, `legal_name`
- `country`, `registration_number`, `tax_id`

### Churches
Physical church locations and communities.
- `id` (UUID), `slug` (unique)
- `name`, `name_ar`, `name_he`
- `organization_id` (FK)
- `denomination_id` (FK)
- `status` (church_status enum)
- `is_published`

### Church Status Enum
```sql
DISCOVERED → LISTED → CLAIM_REQUESTED → REPRESENTATIVE_VERIFIED → AUTHORITY_VERIFIED → LOJ_VERIFIED → SUSPENDED/ARCHIVED
```

### Projects
Preservation and heritage projects.
- `id` (UUID), `slug` (unique)
- `church_id` (FK, nullable)
- `title`, `title_ar`, `title_he`
- `status` (project_status enum)
- `is_published`

### Project Status Enum
```sql
DRAFT → SUBMITTED → INITIAL_REVIEW → DOCUMENTS_REQUIRED → DUE_DILIGENCE → APPROVED → PUBLISHED → FUNDING → FUNDED → IMPLEMENTATION → EVIDENCE_REVIEW → COMPLETED
```

### Verifications
Explicit verification records for churches and projects.
- `id` (UUID)
- `entity_type`, `entity_id`
- `verification_type` (enum)
- `status` (verification_status enum)
- `evidence_reference`
- `reviewed_by`, `reviewed_at`, `expires_at`

### Translations
Centralized translation system.
- `id` (UUID)
- `entity_type`, `entity_id`, `field`
- `locale`, `content`
- `status` (translation_status enum)
- `source_locale`, `reviewed_by`, `published_at`

### Translation Status Enum
```sql
SOURCE → DRAFT → AI_ASSISTED → HUMAN_REVIEWED → CHURCH_REVIEWED → PUBLISHED
```

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies for:
- Public read access to published content only
- Authenticated user access to personal data
- Church member access to assigned churches
- Admin-only access to sensitive data

### Audit Logging
Important actions are logged in `audit_logs`:
- Church claims and profile changes
- Role changes
- Verification status changes
- Project approvals
- Suspensions

## Migrations

Migrations are located in `supabase/migrations/`:
1. `001_core_schema.sql` - Table definitions and indexes
2. `002_rls_policies.sql` - Security policies
3. `003_seed_data.sql` - Demo data for development

## Indexes

Key indexes for performance:
- `idx_churches_slug` - Fast URL lookups
- `idx_churches_is_published` - Filter published content
- `idx_church_locations_coordinates` - Geographic queries
- `idx_translations_entity` - Translation lookups
- `idx_audit_logs_created_at` - Audit trail queries
