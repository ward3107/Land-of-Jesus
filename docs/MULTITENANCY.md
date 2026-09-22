# Multi-tenancy & isolation

**Invariant:** Organization A can never read or write Organization B's
subscribers, messages, analytics, media, segments, admins or settings.

Isolation is enforced in the database with Row Level Security. The application
layer (`@communitydirect/core`) mirrors the rules for fast UX gating, but the
database is authoritative — a bug or a malicious client that bypasses the UI
still cannot cross a tenant boundary.

## How it works

1. Every tenant row has `organization_id`.
2. RLS is enabled on **every** table (`0011_rls_policies.sql`). No policy match
   = deny.
3. Policies call `SECURITY DEFINER` helpers in the `app` schema:
   - `app.is_org_member(org)` — membership (or platform admin).
   - `app.has_org_role(org, roles[])` — role gate.
   - `app.can_send_messages(org)`, `app.can_edit_content(org)`,
     `app.can_manage_org(org)` — permission wrappers.
   - `app.is_platform_admin()` — cross-tenant override.

### Why `SECURITY DEFINER` (and why it's safe)

A naïve policy on `organization_members` that itself queries
`organization_members` recurses infinitely. Our helpers run as the (table-owning)
definer, so they **bypass RLS internally** and break the recursion. Each helper
pins `search_path = public, pg_temp` to prevent search-path hijacking, and they
only ever read membership — never mutate.

## Roles

Organization-scoped roles (`app.membership_role`): `ORGANIZATION_OWNER`,
`ORGANIZATION_ADMIN`, `CONTENT_EDITOR`, `ANALYST`. `PLATFORM_SUPER_ADMIN` is a
cross-tenant capability represented by `profiles.is_platform_admin` (guarded so
users cannot self-escalate). `SUBSCRIBER` is simply an authenticated user with
no membership.

The permission matrix lives in `packages/core/src/roles.ts` and is unit-tested.

## Bootstrapping (the chicken-and-egg)

Creating an org needs a first owner, but the owner-only member policy can't
insert a member before an owner exists. `public.create_organization` is a
`SECURITY DEFINER` RPC that inserts the org, the owner membership, a default
channel and an audit entry atomically.

## Testing

`supabase/tests/rls_tenant_isolation.test.sql` proves the invariant against real
RLS by impersonating four identities (two owners, a subscriber, a platform
admin) with JWT claims. It asserts:

- owners see only their own org's data;
- cross-tenant writes are rejected (`WITH CHECK`);
- a subscriber sees only public data + their own records;
- a platform admin sees across tenants;
- message content freezes after send;
- a subscriber cannot escalate to platform admin.

Run it with `bash scripts/db-verify.sh` (also run in CI).
