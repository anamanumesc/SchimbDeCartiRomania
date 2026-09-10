#!/usr/bin/env bash
set -eo pipefail

echo "=== Pulling latest changes from Git ==="
git pull origin main

echo "=== Building updated backend container ==="
docker compose build backend

echo "=== Applying container updates ==="
docker compose up -d

echo "=== Deployment finished successfully ==="
docker compose ps
