#!/bin/sh
set -e
MODE="${PERSISTENCE_MODE:-postgres}"
if [ "$MODE" = "memory" ]; then
  echo "Starting API in memory mode (no Prisma migrate/seed)"
  exec node dist/main.js
fi
npx prisma migrate deploy
npx prisma db seed
exec node dist/main.js
