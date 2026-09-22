# CommunityDirect

> **Own your audience. Communicate directly.**
> An independent, opt-in push channel from an organization to its community —
> so a communication channel never disappears because a third-party messaging
> platform blocks a number.

_"CommunityDirect" is a working name and is isolated to config/i18n so it can be
renamed easily._

CommunityDirect is a multi-tenant SaaS. Organizations (religious leaders,
churches, mosques, synagogues, schools, nonprofits, clubs, municipalities,
creators, businesses) write a message once and reach their followers through the
platform's own mobile app — immediately, scheduled, segmented by language /
channel / location, in Arabic, Hebrew or English.

## Status — Phase A ✅ · Phase B (web admin) ✅ · Phase C (mobile) ✅

A clean, validated foundation plus a working admin:

- **Monorepo** (pnpm workspaces + Turborepo).
- **Supabase schema** — 24 tables, enums, triggers, RPCs across 13 migrations.
- **Multi-tenant RLS** — tenant isolation enforced in the database and
  **tested** (7 RLS assertions + an end-to-end RPC-flow integration test).
- **Auth & session** — `@supabase/ssr` middleware, sign-in/up, route protection.
- **Admin** — organization onboarding, channels, subscribers, public profile,
  join link + QR, live overview metrics; typed Supabase clients.
- **i18n + RTL** — Arabic / Hebrew / English, full RTL, key-parity enforced.
- **Domain core** — roles, tenancy, segments, message lifecycle, scheduler
  (UTC/DST-correct), push idempotency, slugs, vendor-neutral push provider.
- **Mobile** — Expo (Expo Router) subscriber app: onboarding, discovery,
  follow/unfollow, device-first auth, push registration; bundles via Metro.
- **CI** — install · lint · typecheck · test · build + migrations/RLS job +
  Playwright E2E.

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for what's next (Phase C onward).

## Repository layout

```
apps/
  admin/      Next.js App Router web admin (TypeScript, Tailwind, RTL)
  mobile/     Expo (React Native) subscriber app (expo-router, deep links)
packages/
  core/       Roles, tenancy, segments, messages, scheduler, push idempotency, locales
  i18n/       ar/he/en dictionaries, translation + RTL helpers
  push/       NotificationProvider abstraction + ExpoPushProvider
  eslint-config/  Shared flat ESLint config
supabase/
  migrations/ Ordered SQL (schema + RLS + RPCs)
  tests/      Local auth shim + RLS tenant-isolation tests
docs/         ARCHITECTURE, DATABASE, PUSH-NOTIFICATIONS, MULTITENANCY,
              SECURITY, I18N, PRIVACY, ROADMAP, DECISIONS
scripts/      db-verify.sh (apply migrations + run RLS tests)
```

## Getting started

```bash
# Prerequisites: Node >= 20, pnpm 10, (optional) PostgreSQL 16 for DB tests.
pnpm install

pnpm run typecheck    # all packages + apps
pnpm run test         # unit + integration (Vitest)
pnpm run lint
pnpm run build        # builds packages + admin

# Database: apply migrations to a throwaway cluster and run RLS tests
bash scripts/db-verify.sh
```

### Run an app

```bash
pnpm --filter @communitydirect/admin dev     # http://localhost:3000
pnpm --filter @communitydirect/mobile start  # Expo dev server
```

Copy `.env.example` and fill in Supabase values before connecting to a project.
Never commit real secrets (see [`docs/SECURITY.md`](./docs/SECURITY.md)).

## Principles

- **Not a WhatsApp bypass.** The platform's own app push is the primary channel;
  email / Telegram / WhatsApp Channel / SMS are *future, optional* distribution.
- **Explicit opt-in, easy unsubscribe, privacy-first.** No phone numbers, no
  behavioral profiling.
- **RLS is authoritative.** Tenant isolation is a database invariant, tested in CI.

## License

See [`LICENSE`](./LICENSE).
