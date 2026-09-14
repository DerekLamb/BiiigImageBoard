#!/usr/bin/env bash
# Start the local dev stack (Mongo + Vite dev server) for the harness.
# Idempotent: safe to run repeatedly. Writes logs/PIDs under dev/harness/.run/.
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HARNESS_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/app"
RUN_DIR="$HARNESS_DIR/.run"
mkdir -p "$RUN_DIR"

MONGO_PORT=27017
DEV_URL="https://localhost:5173"
COMPOSE_FILE="$REPO_ROOT/dev/docker-compose.yml"

log() { printf '[harness] %s\n' "$*"; }

# --- MongoDB -----------------------------------------------------------------
if (exec 3<>"/dev/tcp/127.0.0.1/$MONGO_PORT") 2>/dev/null; then
  exec 3>&- || true
  log "MongoDB already listening on :$MONGO_PORT"
else
  log "Starting MongoDB via docker compose..."
  docker compose -f "$COMPOSE_FILE" up -d >/dev/null
  for i in $(seq 1 30); do
    if (exec 3<>"/dev/tcp/127.0.0.1/$MONGO_PORT") 2>/dev/null; then
      exec 3>&- || true
      log "MongoDB is up on :$MONGO_PORT"
      break
    fi
    sleep 1
    if [ "$i" -eq 30 ]; then
      log "ERROR: MongoDB did not become ready on :$MONGO_PORT"
      docker compose -f "$COMPOSE_FILE" logs --tail=40 || true
      exit 1
    fi
  done
fi

# --- Vite dev server ---------------------------------------------------------
if curl -sk --max-time 3 "$DEV_URL" -o /dev/null 2>/dev/null; then
  log "Dev server already responding at $DEV_URL"
else
  log "Starting Vite dev server..."
  PID_FILE="$RUN_DIR/vite.pid"
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    log "Killing stale dev server pid $(cat "$PID_FILE")"
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    sleep 1
  fi
  ( cd "$APP_DIR" && nohup npm run dev >"$RUN_DIR/vite.log" 2>&1 & echo $! >"$PID_FILE" )
  for i in $(seq 1 60); do
    if curl -sk --max-time 3 "$DEV_URL" -o /dev/null 2>/dev/null; then
      log "Dev server is up at $DEV_URL"
      break
    fi
    sleep 1
    if [ "$i" -eq 60 ]; then
      log "ERROR: dev server did not become ready. Last log lines:"
      tail -40 "$RUN_DIR/vite.log" || true
      exit 1
    fi
  done
fi

log "Stack ready. Logs: $RUN_DIR/vite.log"
