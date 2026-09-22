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

## GDPR-style export & deletion

Architected from day one:

- **Deletion** — deleting `auth.users` cascades to `profiles` and all
  tenant-scoped personal rows (`on delete cascade`). A user-facing "delete my
  account" flow lands in Phase F.
- **Export** — all personal rows are reachable by `profile_id`; an export RPC
  (Phase F) assembles them into a portable JSON bundle.

## Data retention

Delivery attempts and join events are operational telemetry; retention windows
and anonymization jobs are defined in Phase F.
