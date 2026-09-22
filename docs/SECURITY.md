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

## Rate limiting & abuse

See [ROADMAP.md](./ROADMAP.md) and the abuse-prevention notes: explicit opt-in,
one-tap unsubscribe, org suspension (`organizations.is_suspended`), platform
moderation, abuse reports, verification. Rate limits on sensitive actions
(sends, invites, join events) land in Phase D at the RPC/worker layer.

## Reporting

Security issues: see `SECURITY.md` policy at the repo root (Phase F) — for now,
open a private security advisory on the repository.
