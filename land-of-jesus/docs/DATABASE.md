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

### Accounts and church staff
- Supabase Auth is the identity provider; `profiles` is created automatically
  for each auth user and holds the trusted `platform_role`.
- `church_members` assigns an authenticated person to one specific church with
  a `CHURCH_MANAGER` or `CHURCH_EDITOR` role and invitation/active/suspended
  status. Only active assignments confer church access.
- Visitors cannot grant themselves a platform role or church membership. A
  trusted operator must assign the first manager. New workers can request
  access; an active manager can verify and approve them as editors.
- `trip_plans` stores each user's private trip plan across devices. `church_staff_requests`
  stores applications; `sponsor_interests` records non-payment funding enquiries.
  All three use RLS to isolate each visitor's data.

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

Migrations are located in `supabase/migrations/`. For a fresh database apply
`001`, `002`, `003`, `004`, `005`, `007`, `006`, `008`, `009`, `010` in that order. Migration
`006` references churches created by `007`. `APPLY_ALL.sql` contains `001`–`004`
only. Do not rerun `007` after live church data or memberships exist: it
deletes and recreates churches 004–017, with cascading deletes.

## Indexes

Key indexes for performance:
- `idx_churches_slug` - Fast URL lookups
- `idx_churches_is_published` - Filter published content
- `idx_church_locations_coordinates` - Geographic queries
- `idx_translations_entity` - Translation lookups
- `idx_audit_logs_created_at` - Audit trail queries
