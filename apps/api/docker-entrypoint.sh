#!/bin/sh
set -e

# 1. Apply pending migrations (idempotent, safe on every start).
npx prisma migrate deploy

# 2. Seed reference data + admin user (idempotent).
node prisma/seed.js

# 3. Replace the shell so the app receives SIGTERM for graceful shutdown.
exec node dist/main.js
