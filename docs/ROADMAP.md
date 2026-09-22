# Roadmap

Built in controlled phases. **Phase A is complete and validated** (this PR).

## Phase A — Foundation ✅

Monorepo · Supabase schema · Auth foundation · RLS tenant model · i18n/RTL
architecture · core domain logic · app shells · tests · CI. See
[the Phase A report in the PR description] and `docs/DECISIONS.md`.

## Phase B — Web admin ✅ (this PR)

Delivered:

- **Auth & session** — `@supabase/ssr` middleware (session refresh + route
  protection), email/password sign-in / sign-up / sign-out server actions.
- **Organization onboarding** (§12) — form (name, handle, description, category,
  country, default language) → `create_organization` RPC → owner + default
  channel; live handle preview.
- **Channels** — list / create / archive.
- **Subscribers** — RLS-scoped list with search + language filter (no
  device-level PII).
- **Public org profile** (`/o/[slug]`) + **join link & QR** in settings.
- **Typed DB layer** — `Database` types + typed Supabase clients (admin + mobile).
- **Overview metrics** — real, measured counts (followers, sent, scheduled).
- **Tests** — RPC-flow integration test (onboarding → follow → subscribe →
  enqueue, idempotent) against real RLS; Playwright E2E smoke (public pages +
  auth-redirect); slug unit tests. Fixed `enqueue_message` idempotency
  (migration `0013`).

Deferred within B (fast-follow): admin invite UI (team roles), logo upload to
Storage, multi-org switcher.

## Phase C — Mobile app ✅ (this PR)

Delivered:

- **Onboarding** (§13) — welcome → choose language → allow notifications →
  discover, with a locale context (RTL applied on change).
- **Discovery** — search + shared ranking (`searchOrganizations`), verified-first.
- **Follow / unfollow** — explicit opt-in via the `follow_organization` /
  `unfollow_organization` RPCs; Following tab with unfollow.
- **Device-first auth** — anonymous session (`ensureSession`) so users follow
  without an email (spec §27).
- **Device + push-token registration** — `registerForPushNotificationsAsync` +
  `registerDevice` (upsert deduped on provider/token).
- **Notification-preference logic** — `shouldNotify` (channel → org → master,
  quiet hours incl. midnight wrap), unit-tested; Profile language + notification
  settings.
- **Typed data layer** — `devices`, `push_tokens`, `notification_preferences`
  added to `Database` types; mobile Supabase queries typed.

Deferred within C (fast-follow): QR scanner, message-detail data fetch + inbox
list, notification-preference persistence UI, deep-link cold-start routing.

## Phase D — Composer, segments, scheduler, delivery

- Full message composer (§17) with mobile preview + send test.
- Segment builder on the shared rule model; audience preview (reach estimate).
- Scheduler (send now / at / recurring) with UTC storage + DST correctness.
- Delivery worker: audience resolution → batches → provider → attempts, with
  retry, rate control, invalid-token cleanup, idempotency.

## Phase E — Device push, analytics, growth

- Real device push tests (Expo).
- Analytics from measured signals (delivered/accepted; scheduled; recent activity).
- Join QR / deep links end-to-end; signup-source attribution.

## Phase F — Hardening

- Rate limiting on sensitive actions; abuse reports; org suspension UX;
  verification workflow UI.
- GDPR export/delete flows; retention jobs.
- Accessibility pass (WCAG 2.2 AA web; RN a11y labels, touch targets, dynamic
  type, reduced motion).
- Staging environment; runbooks.

## Explicitly deferred (not in MVP)

WhatsApp automation/unofficial libraries · real SMS · payment billing · AI
translation · social feed/comments · video hosting · livestreaming · complex
CRM · white-label apps · marketplace. Multi-channel (email/Telegram/WhatsApp
Channel/Web Push/SMS) and billing plans are *architected for* but not
*implemented*.
