#!/bin/bash
# RateGenie Database Backup Script
# Runs via cron: 0 3 * * * /apps/scripts/backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_USER="${POSTGRES_USER:-rategenie}"
DB_NAME="${POSTGRES_DB:-rategenie}"
DB_HOST="${DB_HOST:-db}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/rategenie_${TIMESTAMP}.sql.gz"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup created: rategenie_${TIMESTAMP}.sql.gz"
else
    echo "[$(date)] ERROR: Backup failed!" >&2
    exit 1
fi

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "[$(date)] Cleaned up backups older than 30 days"
