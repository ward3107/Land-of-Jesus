# Deploying Land of Jesus

The app is a standard Next.js 16 App Router project. It deploys to Vercel with no
extra config. Deploy **from the `land-of-jesus/` directory** (that is the project
root; the surrounding folder is not part of the app).

## Environment variables (set these on the host)

Both are client-safe (`NEXT_PUBLIC_*`): the Supabase publishable/anon key is
meant to be public and is gated by RLS.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xhosgdiwrwfdjrccequw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_7ZSr2r0DGJH3aW8us-CeRA_cHBApixy` |

The map uses **MapLibre GL + OpenFreeMap** — free, open-source, **no API key or
account required**, so there is nothing to configure for it.

The public site runs **without** the database (bundled demo data). Accounts
require Supabase. For a new database, run the SQL migrations in this order:
`001`, `002`, `003`, `004`, `005`, **`007`, then `006`**, then `008`. Run each
file once in the Supabase SQL editor. `APPLY_ALL.sql` contains only `001`–`004`,
so if using it, continue with `005`, `007`, `006`, `008`. `006` needs the churches
created by `007`; numeric filename order fails on a fresh database. Translated
content is generated from `supabase/content-i18n/*.json` using
`corepack pnpm@12.5.1 content:sql`; `006` can be rerun to upsert translations.
Do **not** rerun `007` after creating church memberships or other live records:
it deletes and recreates churches 004–017, cascading to their related rows.

For email sign-in, enable Supabase Auth's email OTP/magic-link provider and add
the production origin plus each locale callback (for example,
`https://example.com/en/account`) to **Authentication → URL Configuration →
Redirect URLs**. Add preview/local origins there if needed. Users receive a
profile automatically on first sign-in. Church staff are *not* appointed by
signing in: a trusted database operator must verify the person and insert an
`ACTIVE` row into `public.church_members` for the exact church and auth user.
Keep the `service_role` key off the browser. The current account page shows
memberships only; self-service invitations, staff management and sponsor
payments are not yet implemented.

## Option A — Vercel CLI (no GitHub needed)

From inside `land-of-jesus/`:

```bash
vercel login            # one-time, interactive
vercel link             # create/link a project (accept defaults)
# add the env vars (production):
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod           # build + deploy, prints the public URL
```

## Option B — GitHub + Vercel dashboard

1. Push the repo to GitHub.
2. In Vercel: **New Project → import the repo**.
3. Set **Root Directory = `land-of-jesus`**.
4. Add the two environment variables above (Production + Preview).
5. Deploy. Framework preset is auto-detected (Next.js).

## Notes

- **Framework is pinned** by `vercel.json` (`"framework": "nextjs"`). Without it,
  importing the repo (whose root has no Next.js app) makes Vercel pick
  "Other", which serves only `public/` — images load but every page 404s.
- **Deployment Protection** must be off (Settings → Deployment Protection →
  Vercel Authentication: Disabled) for the site to be public; otherwise every
  URL redirects to a Vercel SSO login.
- `land-of-jesus.vercel.app` belongs to a different project. This project's
  production URL is `land-of-jesus-wassems-projects-ab3ab6ba.vercel.app` (or add
  a custom domain under Settings → Domains).
- Node 20+ (Vercel default is fine).
- The `middleware` → `proxy` deprecation warning from Next 16 is non-blocking.
- After deploy, if the map or data is missing, check the env vars are set on the
  host and that the SQL migrations have been applied and RLS allows public read
  of `is_published` rows.
