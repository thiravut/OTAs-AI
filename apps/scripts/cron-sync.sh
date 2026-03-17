#!/bin/bash
# RateGenie OTA Sync Cron Script
# Runs via cron: */5 * * * * /apps/scripts/cron-sync.sh
# Calls the sync API endpoint every 5 minutes

APP_URL="${APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-}"

echo "[$(date)] Starting OTA sync..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/sync")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "[$(date)] Sync completed: $BODY"
else
    echo "[$(date)] ERROR: Sync failed with HTTP $HTTP_CODE: $BODY" >&2
fi
