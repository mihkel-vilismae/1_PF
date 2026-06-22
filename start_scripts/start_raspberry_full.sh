#!/usr/bin/env bash
# PF_login Raspberry project-owned launcher skeleton.
# Starts only explicitly requested project-owned processes and writes launch evidence.
# It does not install packages, configure cron/systemd/autostart, start native playback,
# or claim Raspberry playback/recovery proof.
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$REPO_ROOT/runtime_data/raspberry_launcher"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"
PLAN_ONLY="true"
RUN_TOOL_CHECK="false"
START_API="false"
RUN_APP_STATUS="false"
API_PORT="${PF_RASPBERRY_API_PORT:-4301}"
API_HOST="${PF_RASPBERRY_API_HOST:-127.0.0.1}"
API_PID_FILE="$PID_DIR/api.pid"
API_LOG_FILE="$LOG_DIR/api.log"
LAUNCHER_LOG_FILE="$LOG_DIR/launcher.log"

usage() {
  cat <<'USAGE'
PF_login Raspberry launcher skeleton

Usage:
  ./start_raspberry_full.sh [--dry-run] [--run-tool-check] [--app-status] [--start-api] [--api-port PORT]

Options:
  --dry-run          Write a launch plan only. This is the default skeleton mode.
  --run-tool-check   Run npm run proof:raspberry-tool-checker before writing launcher evidence.
  --app-status       Run npm run proof:raspberry-app-running-status and record its result.
  --start-api        Start the project-owned API process with npm run api and record its PID.
  --api-port PORT    Set PF_API_PORT/PF_RASPBERRY_API_PORT for the API process. Default: 4301.
  --help             Show this help.

Non-claims:
  This launcher does not start mpv/native playback, does not configure systemd/cron,
  does not install packages, and does not prove scheduler, reboot, or power-loss recovery.
USAGE
}

log() {
  mkdir -p "$LOG_DIR"
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LAUNCHER_LOG_FILE"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      PLAN_ONLY="true"
      ;;
    --run-tool-check)
      RUN_TOOL_CHECK="true"
      ;;
    --app-status)
      RUN_APP_STATUS="true"
      ;;
    --start-api)
      PLAN_ONLY="false"
      START_API="true"
      ;;
    --api-port)
      shift
      if [ "$#" -eq 0 ]; then
        echo "--api-port requires a value" >&2
        exit 2
      fi
      API_PORT="$1"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

mkdir -p "$RUNTIME_DIR" "$LOG_DIR" "$PID_DIR"

if [ ! -f "$REPO_ROOT/package.json" ] || [ ! -f "$REPO_ROOT/VERSION" ]; then
  echo "Launcher must be run from a PF_login repository checkout." >&2
  exit 1
fi

cd "$REPO_ROOT"
VERSION="$(tr -d '\r\n' < VERSION)"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || printf 'unknown')"
PLAN_PATH="$RUNTIME_DIR/launch_plan_$(date -u +%Y%m%dT%H%M%SZ).json"
TOOL_CHECK_STATUS="not_run"
APP_STATUS="not_run"
API_STATUS="not_started"
API_PID="null"

log "PF_login Raspberry launcher skeleton"
log "repo=$REPO_ROOT version=$VERSION git=$GIT_COMMIT"
log "plan_only=$PLAN_ONLY run_tool_check=$RUN_TOOL_CHECK app_status=$RUN_APP_STATUS start_api=$START_API"

if [ "$RUN_TOOL_CHECK" = "true" ]; then
  log "running Raspberry tool-checker preflight"
  set +e
  npm run proof:raspberry-tool-checker >> "$LAUNCHER_LOG_FILE" 2>&1
  TOOL_CHECK_EXIT="$?"
  set -e
  TOOL_CHECK_STATUS="exit_$TOOL_CHECK_EXIT"
  log "tool-checker completed with $TOOL_CHECK_STATUS"
fi

if [ "$RUN_APP_STATUS" = "true" ]; then
  log "running Raspberry app-running status proof"
  set +e
  npm run proof:raspberry-app-running-status >> "$LAUNCHER_LOG_FILE" 2>&1
  APP_STATUS_EXIT="$?"
  set -e
  APP_STATUS="exit_$APP_STATUS_EXIT"
  log "app-running status completed with $APP_STATUS"
fi

is_pid_alive() {
  pid="$1"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

if [ "$START_API" = "true" ]; then
  if [ -f "$API_PID_FILE" ] && is_pid_alive "$(cat "$API_PID_FILE")"; then
    log "existing project-owned API PID is still alive: $(cat "$API_PID_FILE")"
    API_STATUS="already_running"
    API_PID="$(cat "$API_PID_FILE")"
  else
    log "starting project-owned API process"
    PF_API_PORT="$API_PORT" PF_API_HOST="$API_HOST" PF_RASPBERRY_PROJECT_OWNED_LAUNCHER="1" \
      npm run api > "$API_LOG_FILE" 2>&1 &
    API_PID="$!"
    printf '%s\n' "$API_PID" > "$API_PID_FILE"
    API_STATUS="started"
    log "started API pid=$API_PID log=$API_LOG_FILE"
  fi
fi

cat > "$PLAN_PATH" <<JSON
{
  "launcher_kind": "raspberry_project_owned_launcher",
  "baseline_version": "$VERSION",
  "git_commit": "$GIT_COMMIT",
  "timestamp_utc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "repo_root": "$REPO_ROOT",
  "mode": "$([ "$PLAN_ONLY" = "true" ] && printf 'dry_run' || printf 'project_owned_process_start')",
  "tool_checker_status": "$TOOL_CHECK_STATUS",
  "app_running_status": "$APP_STATUS",
  "api": {
    "requested": $START_API,
    "status": "$API_STATUS",
    "host": "$API_HOST",
    "port": "$API_PORT",
    "pid_file": "$API_PID_FILE",
    "pid": $API_PID,
    "log_file": "$API_LOG_FILE"
  },
  "non_claims": [
    "does not start native playback/mpv",
    "does not configure systemd, cron, or boot autostart",
    "does not prove Raspberry generated fixture validation",
    "does not prove Raspberry scheduler behavior unless app-running status evidence passes",
    "does not prove reboot or power-loss recovery"
  ]
}
JSON

log "wrote launch plan: $PLAN_PATH"
log "done"
printf 'Raspberry launcher evidence: %s\n' "$PLAN_PATH"
