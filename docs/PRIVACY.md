# Privacy

Privacy-first, data-minimizing. We collect the least we need to deliver a
message a user explicitly asked to receive.

## Principles

- **Explicit opt-in only.** Following an organization is always a deliberate
  action (`organization_followers`, `follow_organization` RPC). We never
  auto-subscribe anyone.
- **One-tap unsubscribe.** Unfollowing and per-org / per-channel muting are
  always available (`notification_preferences`, `unfollow_organization`).
- **No phone numbers.** Account methods are email and (planned) Apple/Google
  sign-in. A device-first, low-friction follow flow is on the roadmap. We do not
  require a phone number for any MVP feature.
- **Minimal, low-sensitivity segmentation.** Only voluntarily-provided
  attributes: language, channel opt-ins, coarse location, tags, signup source.
  **No behavioral profiling.**
- **Device data stays private.** `devices` / `push_tokens` are visible only to
  their owner via RLS — organizations never see device-level information.
- **We do not sell user data.**

## Chosen account model (MVP)

Email-based Supabase Auth, with Apple/Google sign-in prepared in
`config.toml` (disabled until configured per environment). A profile mirrors
`auth.users` via the `handle_new_user` trigger and stores only a display name
and preferred locale.

## GDPR-style export & deletion (Phase F)

Self-service, from the mobile Profile screen:

- **Export** — `export_my_data()` assembles the caller's profile, follows,
  channel subscriptions, devices and notification preferences into a portable
  JSON bundle.
- **Deletion** — `delete_my_account()` de-attributes any authored content
  (`created_by → null`) and deletes the `profiles` row, which cascades follows,
  subscriptions, devices, tokens and preferences (`on delete cascade`).
  (Deleting the `auth.users` record itself is done via the GoTrue admin API.)

Both are SECURITY DEFINER RPCs scoped to `auth.uid()`, tested in
`supabase/tests/hardening.test.sql`.

## Data retention (Phase F)

Delivery attempts and join events are operational telemetry. `purge_expired_data`
(worker-only) deletes attempts older than a configurable window (default 90 days)
and join events older than 180 days; run it on a schedule (see
[RUNBOOKS.md](./RUNBOOKS.md)).
