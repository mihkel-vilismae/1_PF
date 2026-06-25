#!/usr/bin/env bash
# PF_login / PhotoFrame RaspberryOS start launcher.
# Run from the repository root. It prepares a local SQLite DB when needed,
# then starts the backend API and Vite frontend in the background.

set -euo pipefail
REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$REPO_ROOT"
API_URL="http://127.0.0.1:4301"
FRONTEND_URL="http://localhost:5173"
RUNTIME_ROOT="$REPO_ROOT/runtime_data/start_launcher"
LOG_ROOT="$RUNTIME_ROOT/logs"
PID_ROOT="$RUNTIME_ROOT/pids"

log() { printf '[START] %s\n' "$*"; }
fail() { printf '[ERROR] %s\n' "$*" >&2; exit 1; }
need_cmd() { command -v "$1" >/dev/null 2>&1 || fail "$1 was not found on PATH. $2"; }

dotenv_value() {
  key="$1"
  [ -f .env ] || return 0
  awk -F= -v k="$key" '$1 == k { sub(/^[^=]*=/, ""); gsub(/^\"|\"$/, ""); gsub(/^'"'"'|'"'"'$/, ""); print; exit }' .env
}

init_env() {
  if [ -f .env ]; then
    log ".env already exists in repo root."
    return
  fi
  if [ -f ../.env ]; then
    log "Copying parent ../.env into repo root."
    cp ../.env .env
    chmod 600 .env || true
    return
  fi
  if [ -f example.env ]; then
    log "No .env found. Creating local .env from example.env. Review it before real iCloud/provider use."
    cp example.env .env
    chmod 600 .env || true
    return
  fi
  fail "No .env, parent .env, or example.env found. Cannot prepare runtime config."
}

resolve_path() {
  value="$1"
  case "$value" in
    /*) printf '%s\n' "$value" ;;
    *) printf '%s\n' "$REPO_ROOT/$value" ;;
  esac
}

init_dirs() {
  mkdir -p "$RUNTIME_ROOT" "$LOG_ROOT" "$PID_ROOT"
  for key in DOWNLOAD_DIR LOG_DIR ICLOUDPD_COOKIE_DIR; do
    value="$(dotenv_value "$key" || true)"
    [ -n "$value" ] && mkdir -p "$(resolve_path "$value")"
  done
}

init_db() {
  db_value="$(dotenv_value DB_PATH || true)"
  [ -n "$db_value" ] || fail "DB_PATH is missing from .env. Cannot initialize SQLite DB."
  db_path="$(resolve_path "$db_value")"
  mkdir -p "$(dirname "$db_path")"
  if [ -f "$db_path" ]; then
    log "SQLite DB already exists: $db_path"
    return
  fi
  need_cmd python3 "Install Python 3 so the SQLite DB can be initialized."
  log "Creating SQLite DB: $db_path"
  python3 server/scripts/sqlite_admin.py recreate "$db_path" database/schema.sql
}

run_step() {
  label="$1"; shift
  log "$label"
  "$@"
}

start_process() {
  title="$1"
  script="$2"
  log_file="$3"
  pid_file="$4"
  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    log "$title already running with pid $(cat "$pid_file")"
    return
  fi
  log "Starting $title. Log: $log_file"
  nohup bash -lc "cd '$REPO_ROOT' && npm run $script" > "$log_file" 2>&1 &
  printf '%s\n' "$!" > "$pid_file"
}

log "PF_login RaspberryOS start launcher"
log "Repo: $REPO_ROOT"
need_cmd node "Install Node.js, reopen the terminal, and rerun START_RASPBERRYOS.SH."
need_cmd npm "Install npm, reopen the terminal, and rerun START_RASPBERRYOS.SH."
init_env
init_dirs
run_step "Install dependencies" npm install
run_step "Build frontend" npm run build
init_db
start_process "PF_login backend API" api "$LOG_ROOT/backend_api.log" "$PID_ROOT/backend_api.pid"
start_process "PF_login frontend" dev "$LOG_ROOT/frontend_vite.log" "$PID_ROOT/frontend_vite.pid"
log "Backend: $API_URL"
log "Frontend: $FRONTEND_URL"
log "PIDs: $PID_ROOT"
log "Done. Frontend, backend, and SQLite DB startup sequence launched."
