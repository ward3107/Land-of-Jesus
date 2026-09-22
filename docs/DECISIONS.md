# Decisions (ADR log)

Short records of the choices that shape the product.

## 1. Supabase as the backend (no bespoke API server for MVP)
Postgres + Auth + Storage + RLS covers tenancy, auth and files with far less
code. RLS makes the database the authorization source of truth. Privileged,
cross-boundary operations are `SECURITY DEFINER` RPCs. Revisit if we outgrow
PostgREST.

## 2. RLS is authoritative; the app layer only mirrors it
`@communitydirect/core` gates UX and pre-checks on the server, but a bypass of
the app still cannot cross a tenant boundary. Isolation is tested in CI.

## 3. Framework-free domain packages
Roles, tenancy, segments, message lifecycle, scheduler and push idempotency live
in pure TypeScript so the admin, mobile app, worker and tests share one
implementation. No drift between "preview" and "delivery".

## 4. Vendor-neutral push
Business logic depends on `NotificationProvider`, never on Expo directly. The
MVP ships `ExpoPushProvider` with an injectable transport (testable offline).
FCM/APNs/OneSignal/Web Push are additive later.

## 5. Asynchronous delivery with schema-level idempotency
Never fan out pushes from a request. A request enqueues a job; a worker resolves
the audience and sends in ≤100-token batches. `UNIQUE` idempotency keys on jobs
and attempts make retries exactly-once.

## 6. UTC storage, DST-correct scheduling
All instants are UTC. Recurring schedules are a wall-clock time in an IANA zone;
the next fire is computed with the platform Intl DB (full ICU on Node), verified
across DST boundaries in tests. No timezone library needed for the MVP.

## 7. Content freeze after send
Editing a message mid-send is unsafe (partial audiences see different content),
so content freezes at `QUEUED` via a DB trigger. Cloning is how you "resend
changed".

## 8. Privacy-first data model
No phone numbers; minimal, voluntary segmentation attributes; device data
owner-only. Deletion cascades; export is reachable by `profile_id`. No
behavioral profiling.

## 9. Analytics we can actually measure
We only surface provider-measurable signals (accepted/delivered, invalidations,
scheduled counts). We do not fabricate open/tap rates the transport can't report.

## 10. Neutral, premium SaaS design
Deliberately not religion-specific: the product serves churches, mosques,
synagogues, schools, nonprofits, municipalities, clubs and businesses. Neutral
indigo/slate palette; calm, fast mobile; professional, non-technical admin.

## 11. pnpm workspaces + Turborepo
Single install, cached task graph, workspace protocol for internal packages.
Node ≥ 20; pnpm pinned via `packageManager`.

## 12. "CommunityDirect" is a working name
The name is isolated to i18n strings and config so a rename later is a small,
localized change.
