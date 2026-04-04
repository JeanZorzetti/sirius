#!/bin/sh
set -e

echo "Running CRM database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Running WhatsApp database migrations..."
node node_modules/prisma/build/index.js migrate deploy --schema prisma/whatsapp.prisma

echo "Starting Sirius CRM..."
exec node server.js
