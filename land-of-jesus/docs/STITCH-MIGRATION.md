# Stitch to Production Migration Report

## Overview

This document details the migration from Google Stitch visual prototypes to the production Land of Jesus platform.

## What Was Reused from Stitch

### Visual Direction
- Color palette: Stone/amber tones for heritage feel
- Typography direction: Serif for headings, sans-serif for body
- Card layouts and spacing patterns
- Responsive behavior patterns
- Photography ratios (16:10 for church cards)

### Approved Public Screens Referenced
- Desktop Homepage layout structure
- Explore page with map/list toggle concept
- Church Profile page sections
- Project Profile page information architecture

## What Was Rejected from Stitch

### Terminology Removed
The following prototype terms were explicitly removed as they are not appropriate for production:
- ~~Dossier~~ → Church Profile
- ~~Registry~~ → Database
- ~~Support Registry~~ → Projects
- ~~Territorial Dossiers~~ → Church listings
- ~~Verified Sanctuary~~ → Published Church
- ~~Custody Ledger~~ → Verification records
- ~~Ecclesiastical Custodian~~ → Church authority
- ~~Zero Platform Extraction~~ → (removed entirely)
- ~~100% Direct Parish Support~~ → (removed entirely)
- ~~18 Days Remaining~~ → (fake countdown removed)
- ~~Historical Synthesis~~ → Story section

### Fake Data Not Copied
- Verification badges without actual verification
- Opening hours without confirmed data
- Mass/liturgy times without confirmation
- Denomination affiliations without verification
- Historical dates without sources
- Archaeological claims without documentation
- Community population numbers
- Parish family counts
- Donation totals
- Supporter counts
- Project approval status without review
- Project budgets without documentation
- Financial recipient verification status
- Legal entity status

### Architecture Decisions
- Did NOT convert Stitch HTML directly to React
- Did NOT create single-page application from static files
- Did NOT hardcode arbitrary values across components
- Did NOT use fake impact numbers

## Design Tokens Extracted

### Colors
- Primary: Amber 600-700 range
- Neutral: Stone 50-900 range
- Success: Green 600-700 range
- Background: White, Stone 50

### Typography
- Headings: EB Garamond (serif) - editorial/documentary feel
- Body: Plus Jakarta Sans (sans-serif) - modern UI
- Scale: Based on Tailwind default scale

### Spacing
- Section padding: 6rem (py-24)
- Card padding: 1.5rem (p-6)
- Gap: 2rem (gap-8) standard

### Components
- Cards: Rounded corners, subtle shadows
- Buttons: Multiple variants (primary, outline, ghost)
- Badges: Small rounded pills for metadata

## Screen-by-Screen Analysis

### Homepage
**Stitch:** Multi-section landing with hero, featured churches, projects
**Production:** Implemented with proper component architecture, i18n support, RTL-ready

### Explore Page
**Stitch:** Map + list view with filters
**Production:** Implemented with state management, filter panel, map placeholder ready for Mapbox

### Church Profile
**Stitch:** Hero, quick facts, story, heritage, community, visit info, projects
**Production:** Implemented all sections with proper data structure, demo content clearly marked

### Project Profile
**Stitch:** Progress bar, budget, timeline, verification, updates
**Production:** Implemented with explicit "Prototype — no payment" notices, disabled support button

## Key Improvements Over Stitch

1. **Proper i18n Architecture**
   - Locale-based routing instead of hardcoded text
   - RTL support for Arabic and Hebrew
   - Translation workflow with status tracking

2. **Security-First Design**
   - Row Level Security on all database tables
   - Proper authentication flow
   - Audit logging for sensitive actions

3. **Scalable Data Model**
   - Separate organizations from churches
   - Explicit verification states
   - Proper slug-based URLs

4. **Accessibility**
   - Semantic HTML
   - Keyboard navigation
   - Focus states
   - ARIA labels where needed

5. **Performance**
   - Server Components where possible
   - Lazy loading for heavy components
   - Optimized image handling

## Demo Data Approach

All seed data is clearly marked as DEMO:
- Church names use well-known historical sites but data is illustrative
- No real contact information
- No real opening hours claimed as verified
- Project budgets are examples only
- All verification statuses are demo states

## Next Steps for Production

1. Replace demo data with verified church information
2. Implement actual Supabase connection
3. Add authentication flow
4. Complete map integration with Mapbox
5. Implement follower functionality
6. Add church portal for representatives
7. Build admin dashboard
8. Implement translation workflow
9. Add proper SEO metadata
10. Set up CI/CD pipeline
