# Architecture

CommunityDirect is a multi-tenant SaaS that gives an organization its own
reliable, **opt-in** push channel to its community — independent of any
third-party messaging platform.

## System shape

```
                    ┌──────────────────────────┐
   Admin (web)  ───▶│  Next.js App Router       │──┐
                    └──────────────────────────┘  │
                                                   ▼
   Mobile (Expo)───▶┌──────────────────────────┐  Supabase (Postgres + Auth +
   Subscribers      │  PostgREST / Supabase API │  Storage + RLS)
                    └──────────────────────────┘  ▲
                                                   │
   Delivery worker ─────────────────────────────┘  (service role; reads jobs,
   (Node, service role)   ──▶  NotificationProvider ──▶ Expo Push / FCM / APNs
```

- **Web admin** (`apps/admin`) — Next.js App Router, TypeScript, Tailwind. The
  dashboard where organizations onboard, compose, segment, schedule and send.
- **Mobile app** (`apps/mobile`) — one Expo (React Native) app for all
  subscribers. Follow one or many organizations; receive push; read messages.
- **Backend** — Supabase: PostgreSQL (schema + RLS), Auth, Storage. There is no
  bespoke API server for the MVP; the browser/app talk to PostgREST with the
  anon key and are gated entirely by RLS. Privileged, cross-boundary operations
  are `SECURITY DEFINER` RPCs (`create_organization`, `enqueue_message`, …).
- **Delivery worker** — a server-side process using the service role to resolve
  audiences and drive the push pipeline. Never runs in the browser.

## Shared packages (`packages/*`)

| Package | Responsibility |
| --- | --- |
| `@communitydirect/core` | Roles/permissions, tenant-isolation helpers, segment resolution, message lifecycle + validation, scheduler (UTC/DST), push idempotency, locale primitives. Pure, fully unit-tested. |
| `@communitydirect/i18n` | UI dictionaries (ar/he/en), translation lookup, RTL helpers. |
| `@communitydirect/push` | Vendor-neutral `NotificationProvider` interface + `ExpoPushProvider`. |
| `@communitydirect/eslint-config` | Shared flat ESLint config. |

Keeping domain logic in framework-free packages means the same rules run in the
admin, the mobile app, the worker, and tests — no drift.

## Message lifecycle

```
DRAFT ──▶ SCHEDULED ──▶ QUEUED ──▶ PROCESSING ──▶ SENT
  │            │            │                    ├─▶ PARTIALLY_FAILED
  └── CANCELLED┘            └─▶ CANCELLED         └─▶ FAILED
```

Content is **frozen** the moment a message leaves `DRAFT`/`SCHEDULED` (enforced
by a DB trigger, `app.enforce_message_freeze`). Cloning/duplication is how you
"edit" a sent message.

## Delivery pipeline (asynchronous by design)

```
Admin ─▶ Message ─▶ (enqueue_message RPC) ─▶ Delivery Job
      ─▶ Audience Resolution (worker, segment rules → subscribers → devices)
      ─▶ Delivery Batches (≤100 tokens)  ─▶ NotificationProvider
      ─▶ Delivery Attempts (one per device, idempotency_key = exactly-once)
      ─▶ Results + invalid-token cleanup
```

We never fan out thousands of pushes from a browser request. See
[PUSH-NOTIFICATIONS.md](./PUSH-NOTIFICATIONS.md).

## Scale posture

MVP target: 5,000 subscribers/org; architecture comfortably reaches
100 orgs × 10,000 users via batching + a queue-driven worker. No microservices
yet — one Postgres, one worker, clean seams (`NotificationProvider`, RPC
boundary) so pieces can be split out later.
