#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PERSISTENCE_MODE="${PERSISTENCE_MODE:-memory}"
export JWT_SECRET="${JWT_SECRET:-dev-secret}"
export API_PORT="${API_PORT:-3000}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:3000}"
export LIVEKIT_URL="${LIVEKIT_URL:-ws://localhost:7880}"
export LIVEKIT_PUBLIC_URL="${LIVEKIT_PUBLIC_URL:-ws://localhost:7880}"
export LIVEKIT_API_KEY="${LIVEKIT_API_KEY:-devkey}"
export LIVEKIT_API_SECRET="${LIVEKIT_API_SECRET:-secret}"

if [[ ! -f apps/api/dist/main.js ]]; then
  npm run build -w api
fi

if command -v docker >/dev/null 2>&1; then
  docker compose up -d livekit >/dev/null
fi

echo "API → http://localhost:${API_PORT} (PERSISTENCE_MODE=${PERSISTENCE_MODE})"
echo "Web → http://localhost:5173"
echo "LiveKit → ${LIVEKIT_PUBLIC_URL}"
echo "Login: enfermeiro@bencorp.local / Senha@123"
echo

npm run start:prod -w api &
API_PID=$!
(cd "$ROOT/apps/web" && npx vite --host 0.0.0.0 --port 5173) &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
