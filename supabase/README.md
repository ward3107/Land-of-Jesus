# Supabase — schema, RLS & migrations

This folder holds the database as code.

- `migrations/` — ordered SQL migrations. They assume the Supabase `auth` schema
  exists (it does on hosted Supabase). Apply with the Supabase CLI
  (`supabase db push`) or any migration runner.
- `tests/` — the local `auth` shim (`00_auth_shim.local.sql`) and the RLS
  tenant-isolation test (`rls_tenant_isolation.test.sql`).
- `config.toml` — Supabase CLI configuration for local development.

## Verify migrations + RLS locally (no Supabase CLI needed)

```bash
# Requires PostgreSQL 16 binaries; run as a non-root user.
bash scripts/db-verify.sh
```

This spins up a throwaway cluster, applies the shim + all migrations in order,
and runs the RLS tests. It is exactly what CI runs.

## Apply to a real Supabase project

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Do **not** apply `tests/00_auth_shim.local.sql` to a hosted project — Supabase
already provides the `auth` schema.
