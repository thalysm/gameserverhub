#!/bin/sh
set -e

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy

# Run seed
echo "Running seed..."
npx tsx prisma/seed.ts

# Start application
echo "Starting application..."
exec node server.js
