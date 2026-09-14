#!/usr/bin/env bash
# Report whether the dev stack is up and show recent server log lines.
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HARNESS_DIR/../.." && pwd)"
RUN_DIR="$HARNESS_DIR/.run"
COMPOSE_FILE="$REPO_ROOT/dev/docker-compose.yml"

echo "== ports =="
for p in 27017 5173; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then
    exec 3>&- || true
    echo "  :$p UP"
  else
    echo "  :$p down"
  fi
done

echo "== http =="
if curl -sk --max-time 3 -o /dev/null -w "  https://localhost:5173 -> %{http_code}\n" https://localhost:5173 2>/dev/null; then
  :
else
  echo "  https://localhost:5173 -> unreachable"
fi

echo "== docker =="
docker compose -f "$COMPOSE_FILE" ps 2>/dev/null || true

echo "== vite log (tail) =="
[ -f "$RUN_DIR/vite.log" ] && tail -15 "$RUN_DIR/vite.log" || echo "  (no log yet)"
