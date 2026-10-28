#!/usr/bin/env bash
# A real encrypted dump, round-trip copy and scratch restore with no live data.
source "$(dirname "$0")/common.sh"
require docker age age-keygen rclone python3
export COMPOSE_FILE_PATH="$PROJECT_DIR/ops/compose.dr-test.yml"
work_dir=$(mktemp -d /tmp/bookexchange-recovery-test.XXXXXX)
export COMPOSE_ENV_FILE="$work_dir/test.env"
touch "$COMPOSE_ENV_FILE"
export BACKUP_DIR="$work_dir/backups"
export BACKUP_REMOTE="$work_dir/remote-copy"
export AGE_IDENTITY="$work_dir/recovery.agekey"
export MEDIA_DIR="$work_dir/media"
mkdir "$MEDIA_DIR"
printf 'media recovery test\n' > "$MEDIA_DIR/cover.txt"
age-keygen -o "$AGE_IDENTITY" 2>/dev/null
AGE_RECIPIENT=$(age-keygen -y "$AGE_IDENTITY")
export AGE_RECIPIENT
app_container=""
proxy_container=""
cleanup() {
  [[ -z "$proxy_container" ]] || docker rm -f "$proxy_container"
  [[ -z "$app_container" ]] || docker rm -f "$app_container"
  compose down --volumes
  rm -rf -- "$work_dir"
}
trap cleanup EXIT
compose up -d --wait --wait-timeout 90
docker run --rm --network bookexchange-dr-validation_default \
  -e DATABASE_URL=postgresql://bookuser:recovery-validation-only@db:5432/bookexchange_db \
  -v "$PROJECT_DIR/backend/app:/app/app:ro" \
  "${TEST_BACKEND_IMAGE:-bookexchange-backend:validation}" python -c '
from app.migrations import initialize_database
from app.database import SessionLocal
from app.models import User, Book
initialize_database()
with SessionLocal() as db:
    user = User(username="recovery_reader", email="recovery@example.com", hashed_password="test-only")
    db.add(user)
    db.flush()
    db.add(Book(title="Recovery test", author="Test", owner_id=user.id))
    db.commit()
'
if [[ -n "${TEST_PROXY_IMAGE:-}" ]]; then
  app_container=$(docker run -d --network bookexchange-dr-validation_default --network-alias backend \
    --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \
    -e DATABASE_URL=postgresql://bookuser:recovery-validation-only@db:5432/bookexchange_db \
    -e JWT_SECRET_KEY=recovery-validation-only-secret-at-least-32-characters \
    -v "$PROJECT_DIR/backend/tests:/tests:ro" \
    "${TEST_BACKEND_IMAGE:-bookexchange-backend:validation}")
  proxy_container=$(docker run -d --network bookexchange-dr-validation_default --network-alias proxy "$TEST_PROXY_IMAGE")
  docker exec "$app_container" python -c '
import time, urllib.request
for attempt in range(30):
    try:
        urllib.request.urlopen("http://proxy/health", timeout=2)
        break
    except OSError:
        time.sleep(2)
else:
    raise SystemExit("Proxy did not become ready")
'
  docker exec "$app_container" python /tests/proxy_smoke.py
fi
"$PROJECT_DIR/scripts/backup_db.sh"
archive=$(find "$BACKUP_DIR" -maxdepth 1 -name 'backup_*.tar.age' -print -quit)
[[ -f "$BACKUP_DIR/last-success" ]]
"$PROJECT_DIR/scripts/restore_db.sh" "$archive"
# Re-download from our local test remote and rehearse the cloud restore entrypoint.
"$PROJECT_DIR/scripts/restore_from_cloud.sh" "$(basename "$archive")"
# Verify archived media content as well as database restore.
age -d -i "$AGE_IDENTITY" "$archive" | tar -xOf - media/cover.txt | python3 -c 'import sys; assert sys.stdin.read() == "media recovery test\n"'
# Tampering must fail authentication before PostgreSQL is touched.
printf 'not a valid age archive' > "$work_dir/corrupt.tar.age"
if "$PROJECT_DIR/scripts/restore_db.sh" "$work_dir/corrupt.tar.age"; then
  echo 'ERROR: corrupted backup was accepted' >&2
  exit 1
fi
echo 'Encrypted recovery round trip and corruption rejection passed'
