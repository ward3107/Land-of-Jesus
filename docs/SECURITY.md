# Security

Zero-trust by default. The client is never trusted; the database enforces
access.

## Controls

- **RLS everywhere.** Every table has RLS enabled; tenant isolation is a DB
  invariant, tested in CI (see [MULTITENANCY.md](./MULTITENANCY.md)).
- **No service-role key on the client.** Browser/app use the anon key only. The
  service role is used solely by the server-side delivery worker.
  `apps/admin/lib/env.ts#getServiceRoleKey` is server-only and throws if unset.
- **Server-side validation with Zod.** Message composition, segment rules, etc.
  are validated with shared Zod schemas (`@communitydirect/core`) — the same
  schema on the client (UX) and the server (trust boundary).
- **Least privilege.** `anon` may read public discovery data and insert funnel
  events; `authenticated` acts only within their org; `service_role` is the only
  writer of delivery tables.
- **Privilege-escalation guard.** A trigger prevents a non-platform-admin from
  setting `profiles.is_platform_admin`.
- **Content integrity.** Messages freeze once sending begins (DB trigger).
- **Audit & security logs.** `audit_logs` (per-tenant admin actions) and
  `security_events` (platform) capture sensitive operations.
- **Secrets hygiene.** `.env*` is git-ignored; only `.env.example` is committed.
  CI does not require secrets to build/test.
- **Safe uploads.** `media_assets` records `mime_type`/`byte_size`; Storage
  enforces a size limit; type/extension validation happens server-side before a
  signed upload (Phase B).

## Rate limiting & abuse (Phase F)

- **Rate limiting.** `check_rate_limit(action, subject, max, window)` (migration
  `0016`) is a fixed-window counter enforced inside sensitive SECURITY DEFINER
  RPCs — message sends (60/hour per org) and abuse reports (5/hour per reporter).
  The pure window math is mirrored in `@communitydirect/core` (`rate-limit.ts`).
- **Moderation-field protection.** A DB trigger (`trg_protect_org_moderation`)
  blocks an org admin from self-granting `VERIFIED`/`REJECTED` or toggling
  `is_suspended`; only a platform admin (or a null-uid trusted backend) may.
  Owners may only *request* verification (→ `PENDING`) via `request_verification`.
- **Suspension.** A suspended org (`organizations.is_suspended`) is rejected by
  `enqueue_message`, so it cannot send; the admin shows a suspension banner.
- **Abuse reports.** `report_organization` records an `abuse_reports` row
  (rate-limited); platform admins triage them (RLS restricts reads to them).
- **Explicit opt-in & one-tap unsubscribe** remain the baseline consent model.

## Reporting

Security issues: open a private security advisory on the repository.
