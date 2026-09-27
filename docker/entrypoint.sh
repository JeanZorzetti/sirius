#!/bin/sh
set -e

echo "Running CRM database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Running WhatsApp DB migrations..."
# The WA database was created by the old Go gateway with no migration history, so
# the first deploy answers P3005. Mark the 0_init baseline as applied and deploy
# again. On any later failure the resolve answers P3008 and set -e stops the boot.
node node_modules/prisma/build/index.js migrate deploy --schema prisma/wa/schema.prisma || {
  node node_modules/prisma/build/index.js migrate resolve --applied 0_init --schema prisma/wa/schema.prisma
  node node_modules/prisma/build/index.js migrate deploy --schema prisma/wa/schema.prisma
}

echo "Starting Sirius CRM..."
exec node server.js
