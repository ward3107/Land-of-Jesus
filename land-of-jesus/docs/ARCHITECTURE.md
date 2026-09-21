# Land of Jesus - Architecture Documentation

## Overview

Land of Jesus is a Next.js application built with modern web technologies to connect people with Christian heritage sites in the Holy Land.

## Technology Stack

### Frontend
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **next-intl** for internationalization

### Backend Services
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Storage** for media assets

### Infrastructure
- **Vercel** for hosting
- **Mapbox** for maps (provider abstraction ready)
- **Sentry-ready** architecture for monitoring

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized routes
│   │   ├── page.tsx       # Homepage
│   │   ├── explore/       # Discovery page
│   │   ├── churches/      # Church profiles
│   │   └── projects/      # Project profiles
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # UI primitives
│   ├── churches/         # Church-specific components
│   ├── projects/         # Project-specific components
│   └── maps/             # Map components
├── lib/                   # Utilities and libraries
│   ├── supabase/         # Supabase clients
│   ├── i18n/             # Internationalization
│   ├── auth/             # Authentication helpers
│   └── validation/       # Zod schemas
└── types/                 # TypeScript types
```

## Key Architectural Decisions

### 1. Internationalization
- Locale-based routing: `/en`, `/ar`, `/he`
- RTL support for Arabic and Hebrew
- Translation status workflow for content

### 2. Database Design
- UUID primary keys for security
- Slug-based public URLs
- Separate organizations from churches
- Verification model with explicit states

### 3. Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Audit logging for sensitive actions

### 4. Payment Processing
- **DISABLED** in V1
- Prototype notices on all support actions
- Architecture prepared for future integration

## Routes

### Public Routes
- `/[locale]` - Homepage
- `/[locale]/explore` - Discovery with map/list
- `/[locale]/churches/[slug]` - Church profile
- `/[locale]/projects/[slug]` - Project profile

### Future Routes
- `/[locale]/stories`
- `/[locale]/heritage`
- `/[locale]/visit`
- `/[locale]/account`
- `/[locale]/church-portal`
- `/[locale]/admin`

## Data Flow

1. Public content is server-rendered for SEO
2. Dynamic data fetched from Supabase
3. RLS ensures proper access control
4. Translations loaded based on locale

## Performance Optimizations

- Next.js Image component for responsive images
- Lazy loading for maps and heavy components
- Server Components where possible
- Efficient caching strategies
