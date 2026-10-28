#!/usr/bin/env bash
set -Eeuo pipefail
# Deliberately keep tagged release images for rollback. Never prune volumes.
docker image prune -f --filter 'until=168h'
docker builder prune -f --filter 'until=168h' --reserved-space 1GB
df -h /
docker system df
