#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require rclone
: "${BACKUP_REMOTE:?Set BACKUP_REMOTE}"
archive="${1:?Usage: restore_from_cloud.sh backup_TIMESTAMP.tar.age [--replace]}"
[[ "$archive" =~ ^backup_[A-Za-z0-9_]+\.tar\.age$ ]] || { echo 'Invalid archive name' >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
rclone copyto --s3-no-check-bucket --s3-no-system-metadata "${BACKUP_REMOTE%/}/$archive" "$BACKUP_DIR/$archive.partial"
mv "$BACKUP_DIR/$archive.partial" "$BACKUP_DIR/$archive"
exec "$PROJECT_DIR/scripts/restore_db.sh" "$BACKUP_DIR/$archive" "${2:---drill}"
