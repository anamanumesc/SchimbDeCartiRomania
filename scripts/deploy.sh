#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
require docker curl flock
: "${BACKEND_IMAGE:?Set BACKEND_IMAGE to an immutable release tag}"
: "${PROXY_IMAGE:?Set PROXY_IMAGE to an immutable release tag}"
export BACKEND_IMAGE PROXY_IMAGE
exec 9>"${DEPLOY_LOCK:-/tmp/bookexchange-deploy.lock}"
flock -n 9 || { echo 'Deployment already running' >&2; exit 1; }
compose config --quiet
previous_backend=$(docker inspect --format '{{.Config.Image}}' "$(compose ps -q backend)" 2>/dev/null || true)
previous_proxy=$(docker inspect --format '{{.Config.Image}}' "$(compose ps -q nginx)" 2>/dev/null || true)
# Pull everything before disturbing the currently running release.
compose pull backend nginx
health_url="${HEALTH_URL:-http://127.0.0.1:8080/health}"
healthy() {
  for attempt in $(seq 1 20); do
    if curl --fail --silent --show-error --max-time 4 "$health_url" > /dev/null; then return 0; fi
    sleep 3
  done
  return 1
}
rollback() {
  trap - ERR
  echo 'Release failed. Collecting diagnostics and attempting application rollback.' >&2
  compose ps || true
  compose logs --tail 50 backend nginx || true
  if [[ -n "$previous_backend" && -n "$previous_proxy" ]]; then
    export BACKEND_IMAGE="$previous_backend" PROXY_IMAGE="$previous_proxy"
    compose up -d --no-build --pull never backend nginx && healthy || echo 'ROLLBACK FAILED: operator intervention required' >&2
  fi
  exit 1
}
trap rollback ERR
compose up -d --no-build --wait --wait-timeout 180 backend nginx
healthy
# Tunnel starts only after origin readiness. Set one of demo or tunnel profiles.
compose up -d --no-build --wait --wait-timeout 120
trap - ERR
echo 'Release healthy. Schema rollback is separate; see DISASTER_RECOVERY.md.'
