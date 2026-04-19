#!/bin/sh
set -e

echo "Running CRM database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Syncing WhatsApp database schema..."
node node_modules/prisma/build/index.js db push --schema prisma/whatsapp.prisma --skip-generate

echo "Starting Sirius CRM..."
exec node server.js
