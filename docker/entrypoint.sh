#!/bin/sh
set -e

echo "Running Prisma migrations..."
node_modules/.bin/prisma migrate deploy

echo "Starting Sirius CRM..."
exec node server.js
