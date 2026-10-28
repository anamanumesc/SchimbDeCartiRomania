#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
PROJECT_DIR="${PROJECT_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
if [[ -n "${OPS_ENV_FILE:-}" ]]; then
  # Administrator-owned shell assignments, never user-submitted content.
  source "$OPS_ENV_FILE"
fi
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
COMPOSE_ENV_FILE="${COMPOSE_ENV_FILE:-$PROJECT_DIR/.env}"
COMPOSE_FILE_PATH="${COMPOSE_FILE_PATH:-$PROJECT_DIR/docker-compose.yml}"
compose() { docker compose --project-directory "$PROJECT_DIR" --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE_PATH" "$@"; }
require() { for executable in "$@"; do command -v "$executable" >/dev/null || { echo "Missing dependency: $executable" >&2; exit 1; }; done; }
