#!/bin/sh
set -e

echo "[rideprofit] Syncing database schema at ${DATABASE_URL#file:}..."
# `db push` is idempotent and safe to run on every start: it only applies
# schema changes, it never touches existing row data for additive changes.
# If a future schema change would genuinely drop/alter data, this will fail
# loudly instead of silently discarding it — see DEPLOY.md for how to
# resolve that case.
npx prisma db push --skip-generate

echo "[rideprofit] Starting server..."
exec "$@"
