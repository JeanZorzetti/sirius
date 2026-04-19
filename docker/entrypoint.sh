#!/bin/sh
set -e

echo "Running CRM database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Skipping WhatsApp DB push (schema managed by whatsmeow Go service)..."

echo "Starting Sirius CRM..."
exec node server.js
