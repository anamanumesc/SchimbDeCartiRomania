#!/usr/bin/env bash
set -eo pipefail

backup_dir="${BACKUP_DIR:-./backups}"
timestamp=$(date +"%Y%m%d_%H%M%S")
container_name="bookexchange_db"
db_user="bookuser"
db_name="bookexchange_db"
backup_file="${backup_dir}/db_backup_${timestamp}.sql.gz"

mkdir -p "$backup_dir"

echo "starting postgres dump to ${backup_file}..."

# facem dump prin docker exec si comprimam pe loc
docker exec -t "$container_name" pg_dump -U "$db_user" "$db_name" | gzip > "$backup_file"

echo "backup completed successfully: $(ls -lh "$backup_file" | awk "{print \$5}")"

# retentie: stergem backup-urile mai vechi de 7 zile
find "$backup_dir" -type f -name "db_backup_*.sql.gz" -mtime +7 -exec rm {} \;
