#!/usr/bin/env bash
#
# db-verify.sh — apply all migrations to a throwaway PostgreSQL cluster and run
# the RLS tenant-isolation tests. Self-contained: needs only PostgreSQL 16
# binaries. Used locally and in CI (see .github/workflows/ci.yml).
#
# Postgres refuses to run as root, so run this as a non-root user.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"
TESTS_DIR="$ROOT_DIR/supabase/tests"

PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/cd-pg.XXXXXX")"
DATADIR="$WORKDIR/data"
SOCKDIR="$WORKDIR/sock"
DBNAME="communitydirect_test"

export PGHOST="$SOCKDIR"
export PGPORT="${PGPORT:-55432}"

cleanup() {
  "$PGBIN/pg_ctl" -D "$DATADIR" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

mkdir -p "$DATADIR" "$SOCKDIR"

echo "==> initdb"
"$PGBIN/initdb" -D "$DATADIR" -U postgres --auth=trust >/dev/null

echo "==> starting postgres on port $PGPORT"
"$PGBIN/pg_ctl" -D "$DATADIR" \
  -o "-c listen_addresses='' -c unix_socket_directories='$SOCKDIR' -p $PGPORT" \
  -w start >/dev/null

psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "create database $DBNAME;"

run() { psql -U postgres -d "$DBNAME" -v ON_ERROR_STOP=1 -q "$@"; }

echo "==> applying local auth shim"
run -f "$TESTS_DIR/00_auth_shim.local.sql" >/dev/null

echo "==> applying migrations"
for f in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  echo "    - $(basename "$f")"
  run -f "$f" >/dev/null
done

echo "==> running RLS tenant-isolation tests"
run -f "$TESTS_DIR/rls_tenant_isolation.test.sql"

echo "==> OK: migrations applied cleanly and RLS tests passed"
