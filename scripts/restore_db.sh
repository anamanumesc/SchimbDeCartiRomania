#!/usr/bin/env bash
# Default: rehearse in a temporary database. --replace is explicitly destructive.
source "$(dirname "$0")/common.sh"
require docker age python3 sha256sum flock
backup_file="${1:?Usage: restore_db.sh ARCHIVE.tar.age [--replace]}"
mode="${2:---drill}"
[[ "$mode" == --drill || "$mode" == --replace ]] || { echo 'Unknown restore mode' >&2; exit 1; }
: "${AGE_IDENTITY:?Set AGE_IDENTITY to the age private key file}"
mkdir -p "$BACKUP_DIR"
exec 9>"$BACKUP_DIR/.operation.lock"
flock -n 9 || { echo 'Another backup or restore is running' >&2; exit 1; }
work_dir=$(mktemp -d "$BACKUP_DIR/.restore.XXXXXX")
drill_db="restore_drill_$(date +%s)_${RANDOM}"
stopped=0
restart_services=()
cleanup() {
  result=$?
  trap - EXIT
  if [[ -n "$drill_db" ]]; then compose exec -T db dropdb -U bookuser --if-exists "$drill_db" >/dev/null || true; fi
  if [[ "$stopped" == 1 && ${#restart_services[@]} -gt 0 ]]; then
    if ! compose --profile email up -d --wait --wait-timeout 180 "${restart_services[@]}"; then result=1; fi
  fi
  rm -rf -- "$work_dir"
  exit "$result"
}
trap cleanup EXIT
started=$(date +%s)
age -d -i "$AGE_IDENTITY" -o "$work_dir/payload.tar" "$backup_file"
# Reject traversal, links and device files before extracting decrypted data.
python3 - "$work_dir" <<'PY'
import pathlib, sys, tarfile
root = pathlib.Path(sys.argv[1])
with tarfile.open(root / 'payload.tar') as archive:
    for member in archive.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()):
            raise SystemExit('Unsafe archive entry')
        if path.parts[0] not in {'database.dump', 'media', 'manifest.txt', 'SHA256SUMS'}:
            raise SystemExit('Unexpected archive entry')
    archive.extractall(root, filter='data')
PY
(cd "$work_dir" && sha256sum -c SHA256SUMS)
compose exec -T db createdb -U bookuser "$drill_db"
compose exec -T db pg_restore -U bookuser -d "$drill_db" --exit-on-error --single-transaction --no-owner --no-acl < "$work_dir/database.dump"
compose exec -T db psql -U bookuser -d "$drill_db" -v ON_ERROR_STOP=1 -c 'SELECT count(*) AS users FROM users; SELECT count(*) AS books FROM books; SELECT count(*) AS exchanges FROM exchanges;'
if [[ "$mode" == --replace ]]; then
  if [[ -n "${MEDIA_DIR:-}" ]]; then
    echo 'Media replacement must be performed from the verified archive during maintenance; see DISASTER_RECOVERY.md' >&2
    exit 1
  fi
  for service in backend nginx; do
    if [[ -n "$(compose ps --status running -q "$service")" ]]; then restart_services+=("$service"); fi
  done
  if [[ -n "$(compose --profile email ps --status running -q mail-worker)" ]]; then
    restart_services+=(mail-worker)
    compose --profile email stop mail-worker
  fi
  stopped=1
  compose stop nginx backend
  compose exec -T db pg_restore -U bookuser -d bookexchange_db --clean --if-exists --exit-on-error --single-transaction --no-owner --no-acl < "$work_dir/database.dump"
fi
# The rehearsal database is always disposable, including replacement mode.
compose exec -T db dropdb -U bookuser "$drill_db"
drill_db=""
printf 'Restore %s verified in %ss\n' "$mode" "$(( $(date +%s) - started ))"
