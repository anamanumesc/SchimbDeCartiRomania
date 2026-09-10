#!/usr/bin/env bash
set -eo pipefail

if [ -z "$1" ]; then
    echo "usage: $0 <path-to-backup.sql.gz>"
    exit 1
fi

backup_file="$1"
container_name="bookexchange_db"
db_user="bookuser"
db_name="bookexchange_db"

if [ ! -f "$backup_file" ]; then
    echo "error: file $backup_file not found"
    exit 1
fi

echo "restoring database from $backup_file..."

# decomprimam si trimitem direct in container
gunzip -c "$backup_file" | docker exec -i "$container_name" psql -U "$db_user" -d "$db_name"

echo "restore finished"
