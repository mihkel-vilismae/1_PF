#!/usr/bin/env bash
set -u -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DURATION_SECONDS="${PF_V2_CRON_PROOF_SECONDS:-45}"
INTERVAL_SECONDS="${PF_V2_CRON_PROOF_INTERVAL_SECONDS:-5}"
SOURCE="${PF_V2_CRON_PROOF_SOURCE:-cron-proof-loop}"
RUN_ID="${PF_V2_PROOF_RUN_ID:-cron-proof-loop-$(date -u +%Y%m%dT%H%M%SZ)-$$}"
LOG_DIR="$REPO_ROOT/runtime_data/proofs/cron_proof_loop_logs"
LOG_FILE="$LOG_DIR/${RUN_ID}.log"

mkdir -p "$LOG_DIR"

log() {
  printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$*" | tee -a "$LOG_FILE"
}

run_worker() {
  local worker="$1"
  local script="proof:v2-run-${worker}-once"
  log "START $script source=$SOURCE runId=$RUN_ID"
  set +e
  npm run "$script" -- --source "$SOURCE" --proof-run-id "$RUN_ID" 2>&1 | tee -a "$LOG_FILE"
  local code="${PIPESTATUS[0]}"
  set -e
  log "FINISH $script exit=$code"
  return "$code"
}

log "=== PhotoFrame V2 cron proof loop ==="
log "repoRoot=$REPO_ROOT"
log "durationSeconds=$DURATION_SECONDS"
log "intervalSeconds=$INTERVAL_SECONDS"
log "source=$SOURCE"
log "proofRunId=$RUN_ID"
log "node=$(node --version 2>/dev/null || true)"
log "npm=$(npm --version 2>/dev/null || true)"
log "npmPath=$(command -v npm 2>/dev/null || true)"

cd "$REPO_ROOT" || {
  log "ERROR: could not cd to repo root"
  exit 2
}

START_EPOCH="$(date +%s)"
DEADLINE=$((START_EPOCH + DURATION_SECONDS))
ITERATION=1
LAST_CODE=0

while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  log "LOOP iteration=$ITERATION"
  run_worker regular-worker || LAST_CODE="$?"
  sleep "$INTERVAL_SECONDS"
  run_worker playback-worker || LAST_CODE="$?"
  sleep "$INTERVAL_SECONDS"
  run_worker screen-worker || LAST_CODE="$?"
  sleep "$INTERVAL_SECONDS"
  ITERATION=$((ITERATION + 1))
done

log "Cron proof loop complete exit=$LAST_CODE"
exit "$LAST_CODE"
