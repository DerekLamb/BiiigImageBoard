#!/usr/bin/env bash
# Stop the local dev stack started by up.sh.
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HARNESS_DIR/../.." && pwd)"
RUN_DIR="$HARNESS_DIR/.run"
COMPOSE_FILE="$REPO_ROOT/dev/docker-compose.yml"

log() { printf '[harness] %s\n' "$*"; }

PID_FILE="$RUN_DIR/vite.pid"
if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    log "Stopping dev server pid $PID"
    kill "$PID" 2>/dev/null || true
    sleep 1
    kill -9 "$PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
else
  log "No dev server pid file"
fi

log "Stopping MongoDB compose stack"
docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
log "Done"
