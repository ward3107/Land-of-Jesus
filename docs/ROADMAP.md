# Roadmap

Built in controlled phases. **Phase A is complete and validated** (this PR).

## Phase A — Foundation ✅

Monorepo · Supabase schema · Auth foundation · RLS tenant model · i18n/RTL
architecture · core domain logic · app shells · tests · CI. See
[the Phase A report in the PR description] and `docs/DECISIONS.md`.

## Phase B — Web admin

- Auth (sign-in/up) + session middleware.
- Organization onboarding flow (§12): name, logo, description, category,
  country, default language, invite admins, first channel, join link/QR, publish.
- Channels CRUD; subscribers list + filters + tags; public org profile.
- Generate committed DB TypeScript types; wire overview metrics.

## Phase C — Mobile app

- Onboarding (§13): language → notifications → discover.
- Organization discovery/search, QR scan, follow/unfollow.
- Notification preferences; deep-link routing to `messages/[id]`.
- Device + push-token registration against the backend.

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
