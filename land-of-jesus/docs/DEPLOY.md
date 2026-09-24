# Deploying Land of Jesus

The app is a standard Next.js 16 App Router project. It deploys to Vercel with no
extra config. Deploy **from the `land-of-jesus/` directory** (that is the project
root; the surrounding folder is not part of the app).

## Environment variables (set these on the host)

All three are client-safe (`NEXT_PUBLIC_*`): the Supabase publishable/anon key is
meant to be public and is gated by RLS; the Mapbox token is a public token.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xhosgdiwrwfdjrccequw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_7ZSr2r0DGJH3aW8us-CeRA_cHBApixy` |

The map uses **MapLibre GL + OpenFreeMap** — free, open-source, **no API key or
account required**, so there is nothing to configure for it.

The site deploys and runs **without** the database too (it falls back to bundled
demo data). Real data appears once `supabase/APPLY_ALL.sql` (and
`005_public_read_fix.sql`) have been run in the Supabase project.

## Option A — Vercel CLI (no GitHub needed)

From inside `land-of-jesus/`:

```bash
vercel login            # one-time, interactive
vercel link             # create/link a project (accept defaults)
# add the env vars (production):
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN production   # optional
vercel --prod           # build + deploy, prints the public URL
```

## Option B — GitHub + Vercel dashboard

1. Push the repo to GitHub.
2. In Vercel: **New Project → import the repo**.
3. Set **Root Directory = `land-of-jesus`**.
4. Add the three environment variables above (Production + Preview).
5. Deploy. Framework preset is auto-detected (Next.js).

## Notes

- Node 20+ (Vercel default is fine).
- The `middleware` → `proxy` deprecation warning from Next 16 is non-blocking.
- After deploy, if the map or data is missing, check the env vars are set on the
  host and (for data) that `APPLY_ALL.sql` has been applied and RLS allows public
  read of `is_published` rows.
