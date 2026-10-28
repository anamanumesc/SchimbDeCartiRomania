#!/usr/bin/env bash
# Encrypted database + optional media backup; only completed ciphertext is retained.
source "$(dirname "$0")/common.sh"
require docker age tar sha256sum flock rclone
: "${AGE_RECIPIENT:?Set AGE_RECIPIENT to your age public key}"
: "${BACKUP_REMOTE:?Set BACKUP_REMOTE, e.g. gdrive:bookexchange-backups}"
mkdir -p "$BACKUP_DIR"
exec 9>"$BACKUP_DIR/.operation.lock"
flock -n 9 || { echo 'Another backup or restore is running' >&2; exit 1; }
work_dir=$(mktemp -d "$BACKUP_DIR/.backup.XXXXXX")
trap 'rm -rf -- "$work_dir"' EXIT
started=$(date +%s)
archive="backup_$(date -u +%Y%m%dT%H%M%SZ)_${RANDOM}.tar.age"
compose exec -T db pg_dump -U bookuser -d bookexchange_db --format=custom --no-owner --no-acl > "$work_dir/database.dump"
# pg_restore --list catches truncated or invalid archives before publication.
compose exec -T db pg_restore --list < "$work_dir/database.dump" > /dev/null
mkdir "$work_dir/media"
if [[ -n "${MEDIA_DIR:-}" ]]; then
  [[ -d "$MEDIA_DIR" ]] || { echo 'Configured MEDIA_DIR does not exist' >&2; exit 1; }
  cp -a -- "$MEDIA_DIR/." "$work_dir/media/"
fi
printf 'format=1\ncreated_utc=%s\ncommit=%s\nmedia=%s\n' "$(date -u +%FT%TZ)" "$(git -C "$PROJECT_DIR" rev-parse HEAD)" "${MEDIA_DIR:+included}" > "$work_dir/manifest.txt"
(cd "$work_dir" && sha256sum database.dump > SHA256SUMS)
tar -C "$work_dir" -cf - database.dump media manifest.txt SHA256SUMS | age -r "$AGE_RECIPIENT" -o "$work_dir/$archive"
mv -- "$work_dir/$archive" "$BACKUP_DIR/$archive"
rclone copyto --s3-no-check-bucket --s3-no-system-metadata "$BACKUP_DIR/$archive" "${BACKUP_REMOTE%/}/$archive" --retries 3
# Compare downloaded ciphertext checksum; works even on remotes without hashes.
local_hash=$(sha256sum "$BACKUP_DIR/$archive" | cut -d ' ' -f 1)
remote_hash=$(rclone cat "${BACKUP_REMOTE%/}/$archive" | sha256sum | cut -d ' ' -f 1)
[[ "$local_hash" == "$remote_hash" ]] || { echo 'Off-site verification failed' >&2; exit 1; }
printf '%s\n' "$(date -u +%FT%TZ)" > "$BACKUP_DIR/last-success"
# Retention runs only after verified off-site delivery. Off-site deletion is manual.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'backup_*.tar.age' -mtime +"${LOCAL_RETENTION_DAYS:-7}" -delete
printf 'Verified backup: %s (%ss)\n' "$archive" "$(( $(date +%s) - started ))"
