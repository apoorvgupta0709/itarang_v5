#!/usr/bin/env bash
set -euo pipefail

APP_URL="http://localhost:3000"
SECRET="${INTELLICAR_PULL_SECRET:-}"

while true; do
  curl -sS -X POST "${APP_URL}/api/intellicar/runner" \
    -H "Content-Type: application/json" \
    -H "x-pull-secret: ${SECRET}" \
    -d '{}' \
    >/dev/null || true

  sleep 30
done