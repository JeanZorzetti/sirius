#!/bin/sh
set -e

# Bake env vars into crontab (cron doesn't inherit environment)
cat > /etc/crontabs/root <<CRON
*/10 * * * * curl -sf -H 'Authorization: Bearer ${CRON_SECRET}' '${SIRIUS_URL}/api/cron/sync-whatsapp' >> /proc/1/fd/1 2>&1
CRON

echo "[cron-sync] Started — sync-whatsapp every 10 min -> ${SIRIUS_URL}"
crond -f -l 2
