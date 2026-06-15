#!/usr/bin/env bash
set +e

# ==============================
# PhotoFrame Raspberry proof runner
# Version-gated + colored + verbose logs
# Run from PF_login repo root
# ==============================

REPO_ROOT="$(pwd)"
PROOF_BASE="/home/mihkel/Download_chrome/Photoframe_proofing/proof_logs"
DATETIME="$(date +%Y%m%d_%H%M%S)"

# Basic terminal colors
if [ -t 1 ]; then
  C_RESET="$(printf '\033[0m')"
  C_BOLD="$(printf '\033[1m')"
  C_RED="$(printf '\033[31m')"
  C_GREEN="$(printf '\033[32m')"
  C_YELLOW="$(printf '\033[33m')"
  C_BLUE="$(printf '\033[34m')"
  C_MAGENTA="$(printf '\033[35m')"
  C_CYAN="$(printf '\033[36m')"
else
  C_RESET=""
  C_BOLD=""
  C_RED=""
  C_GREEN=""
  C_YELLOW=""
  C_BLUE=""
  C_MAGENTA=""
  C_CYAN=""
fi

say() {
  echo "${C_CYAN}$*${C_RESET}"
}

ok() {
  echo "${C_GREEN}$*${C_RESET}"
}

warn() {
  echo "${C_YELLOW}$*${C_RESET}"
}

bad() {
  echo "${C_RED}$*${C_RESET}"
}

section() {
  echo ""
  echo "${C_BOLD}${C_BLUE}===== $* =====${C_RESET}"
}

zip_dir() {
  local SRC_DIR="$1"
  local ZIP_FILE="$2"

  python3 - "$SRC_DIR" "$ZIP_FILE" <<'PY'
import sys
import zipfile
from pathlib import Path

src_dir = Path(sys.argv[1]).resolve()
zip_file = Path(sys.argv[2]).resolve()
zip_file.parent.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(zip_file, "w", zipfile.ZIP_DEFLATED) as z:
    for path in src_dir.rglob("*"):
        if path.is_file():
            z.write(path, path.relative_to(src_dir.parent))

print(zip_file)
PY
}

normalize_version() {
  echo "$1" | tr -d ' \n\r\t' | sed 's/^v//'
}

extract_folder_version() {
  python3 - "$1" <<'PY'
import re
import sys

folder_name = sys.argv[1]
matches = re.findall(r"v?(\d+(?:\.\d+)+)", folder_name)
if not matches:
    sys.exit(1)
print(matches[0])
PY
}

extract_package_version() {
  python3 - <<'PY'
import json
import sys
from pathlib import Path

path = Path("package.json")
if not path.exists():
    sys.exit(1)

try:
    data = json.loads(path.read_text(encoding="utf-8"))
except Exception:
    sys.exit(1)

version = str(data.get("version", "")).strip()
if not version:
    sys.exit(1)

print(version)
PY
}

create_failure_archive_and_exit() {
  local REASON="$1"
  local FAIL_DIR="${PROOF_BASE}/VERSION_CHECK_FAILED_${DATETIME}"
  local FAIL_ZIP="${PROOF_BASE}/VERSION_CHECK_FAILED_${DATETIME}.zip"
  local FAIL_LOG="${FAIL_DIR}/runtime_verbose.log"

  mkdir -p "$FAIL_DIR"

  {
    echo "PhotoFrame Raspberry proof runner"
    echo "status=VERSION_CHECK_FAILED"
    echo "time=$(date -Iseconds)"
    echo "repo=$REPO_ROOT"
    echo "folder=$(basename "$REPO_ROOT")"
    echo "reason=$REASON"
    echo ""
    echo "version_file_raw=${VERSION_FILE_RAW:-MISSING}"
    echo "version_file_normalized=${VERSION_FILE_VERSION:-MISSING}"
    echo "package_json_version=${PACKAGE_JSON_VERSION:-MISSING}"
    echo "folder_version=${FOLDER_VERSION:-MISSING}"
    echo ""
    echo "pwd=$(pwd)"
    echo "uname=$(uname -a 2>/dev/null || true)"
    echo "node=$(node --version 2>/dev/null || echo MISSING)"
    echo "npm=$(npm --version 2>/dev/null || echo MISSING)"
    echo "python3=$(python3 --version 2>/dev/null || echo MISSING)"
  } | tee "$FAIL_LOG"

  zip_dir "$FAIL_DIR" "$FAIL_ZIP" >/dev/null

  bad "ERROR: $REASON"
  warn "No proofs were run because version identity is unsafe."
  say "Failure log folder: $FAIL_DIR"
  say "Failure ZIP:        $FAIL_ZIP"

  if command -v pcmanfm >/dev/null 2>&1; then
    pcmanfm "$PROOF_BASE" >/dev/null 2>&1 &
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$PROOF_BASE" >/dev/null 2>&1 &
  fi

  exit 2
}

section "PhotoFrame Raspberry proof runner"

if [ ! -f package.json ]; then
  create_failure_archive_and_exit "package.json missing; run this from the PF_login repo root"
fi

if [ ! -f VERSION ]; then
  create_failure_archive_and_exit "VERSION file missing"
fi

VERSION_FILE_RAW="$(cat VERSION 2>/dev/null)"
VERSION_FILE_VERSION="$(normalize_version "$VERSION_FILE_RAW")"

if [ -z "$VERSION_FILE_VERSION" ]; then
  create_failure_archive_and_exit "VERSION file is empty or unreadable"
fi

PACKAGE_JSON_VERSION="$(extract_package_version 2>/dev/null)"
PACKAGE_JSON_VERSION="$(normalize_version "$PACKAGE_JSON_VERSION")"

if [ -z "$PACKAGE_JSON_VERSION" ]; then
  create_failure_archive_and_exit "package.json version missing or unreadable"
fi

FOLDER_NAME="$(basename "$REPO_ROOT")"
FOLDER_VERSION="$(extract_folder_version "$FOLDER_NAME" 2>/dev/null)"
FOLDER_VERSION="$(normalize_version "$FOLDER_VERSION")"

if [ -z "$FOLDER_VERSION" ]; then
  create_failure_archive_and_exit "repo folder name does not contain a version like v0.8.85"
fi

say "Version sources:"
echo "  VERSION file:  ${VERSION_FILE_VERSION}"
echo "  package.json:  ${PACKAGE_JSON_VERSION}"
echo "  folder name:   ${FOLDER_VERSION}"
echo "  folder:        ${FOLDER_NAME}"

if [ "$VERSION_FILE_VERSION" != "$PACKAGE_JSON_VERSION" ] || [ "$VERSION_FILE_VERSION" != "$FOLDER_VERSION" ]; then
  create_failure_archive_and_exit "version mismatch: VERSION=${VERSION_FILE_VERSION}, package.json=${PACKAGE_JSON_VERSION}, folder=${FOLDER_VERSION}"
fi

VERSION="v${VERSION_FILE_VERSION}"
RUN_DIR="${PROOF_BASE}/${VERSION}_${DATETIME}"
ZIP_PATH="${PROOF_BASE}/${VERSION}_${DATETIME}.zip"
SUMMARY_FILE="${RUN_DIR}/summary.txt"
RUNTIME_LOG="${RUN_DIR}/runtime_verbose.log"

mkdir -p "$RUN_DIR"

# From this point onward, all terminal output is also written to runtime_verbose.log.
exec > >(tee -a "$RUNTIME_LOG") 2>&1

section "Runtime identity"

echo "status=STARTED"
echo "started_at=$(date -Iseconds)"
echo "repo=$REPO_ROOT"
echo "version=$VERSION"
echo "folder=$FOLDER_NAME"
echo "run_dir=$RUN_DIR"
echo "zip_path=$ZIP_PATH"
echo "user=$(whoami 2>/dev/null || true)"
echo "hostname=$(hostname 2>/dev/null || true)"
echo "pwd=$(pwd)"
echo "shell=$SHELL"
echo "uname=$(uname -a 2>/dev/null || true)"
echo "node=$(node --version 2>/dev/null || echo MISSING)"
echo "npm=$(npm --version 2>/dev/null || echo MISSING)"
echo "python3=$(python3 --version 2>/dev/null || echo MISSING)"
echo "git=$(git --version 2>/dev/null || echo MISSING)"
echo ""

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "git_head=$(git rev-parse --short HEAD 2>/dev/null || true)"
  echo "git_status_short_begin"
  git status --short 2>/dev/null || true
  echo "git_status_short_end"
else
  warn "Git repo not detected or git unavailable."
fi

echo "repo_root_listing_begin"
ls -la
echo "repo_root_listing_end"

echo "repo=$REPO_ROOT" > "$SUMMARY_FILE"
echo "version=$VERSION" >> "$SUMMARY_FILE"
echo "started_at=$(date -Iseconds)" >> "$SUMMARY_FILE"
echo "version_file=$VERSION_FILE_VERSION" >> "$SUMMARY_FILE"
echo "package_json=$PACKAGE_JSON_VERSION" >> "$SUMMARY_FILE"
echo "folder_version=$FOLDER_VERSION" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

FAIL_COUNT=0
PASS_COUNT=0

run_step() {
  STEP_NAME="$1"
  shift

  LOG_FILE="${RUN_DIR}/${STEP_NAME}.log"

  section "RUNNING ${STEP_NAME}"
  echo "command=$*"
  echo "log_file=$LOG_FILE"
  echo "started_at=$(date -Iseconds)" | tee "$LOG_FILE"
  echo "command=$*" | tee -a "$LOG_FILE"

  START_TS="$(date +%s)"

  "$@" 2>&1 | tee -a "$LOG_FILE"
  CODE="${PIPESTATUS[0]}"

  END_TS="$(date +%s)"
  DURATION=$((END_TS - START_TS))

  echo "finished_at=$(date -Iseconds)" | tee -a "$LOG_FILE"
  echo "exit_code=$CODE" | tee -a "$LOG_FILE"
  echo "duration_seconds=$DURATION" | tee -a "$LOG_FILE"

  if [ "$CODE" -eq 0 ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    ok "PASS ${STEP_NAME} exit=${CODE} duration=${DURATION}s"
    echo "PASS ${STEP_NAME} exit=${CODE} duration_seconds=${DURATION}" >> "$SUMMARY_FILE"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    bad "FAIL ${STEP_NAME} exit=${CODE} duration=${DURATION}s"
    echo "FAIL ${STEP_NAME} exit=${CODE} duration_seconds=${DURATION}" >> "$SUMMARY_FILE"
  fi

  return 0
}

section "Proof commands"

run_step "00_npm_install" npm install
run_step "01_build" npm run build
run_step "02_typecheck" npm run typecheck
run_step "03_tests" npm test

run_step "10_raspberry_executable_permissions_repair" npm run proof:raspberry-executable-permissions -- --repair
run_step "11_raspberry_env_preflight_create" npm run proof:raspberry-env-preflight -- --create
run_step "12_raspberry_tool_checker" npm run proof:raspberry-tool-checker
run_step "13_raspberry_icloudpd_preflight" npm run proof:raspberry-icloudpd-preflight

run_step "20_raspberry_generated_fixtures" npm run proof:raspberry-generated-fixtures
run_step "21_raspberry_cron_preflight" npm run proof:raspberry-cron-preflight
run_step "22_raspberry_worker_startup_smoke" npm run proof:raspberry-worker-startup-smoke
run_step "23_raspberry_cron_worker_runtime" npm run proof:raspberry-cron-worker-runtime

run_step "30_raspberry_app_running_status" npm run proof:raspberry-app-running-status
run_step "31_raspberry_app_running_chain" npm run proof:raspberry-app-running-chain
run_step "32_raspberry_app_running_pass" npm run proof:raspberry-app-running-pass
run_step "33_raspberry_app_running_target_pack" npm run proof:raspberry-app-running-target-pack

run_step "40_raspberry_regular_stage_worker_product_pipeline" npm run proof:raspberry-regular-stage-worker-product-pipeline
run_step "41_raspberry_native_image_playback" npm run proof:raspberry-native-image-playback
run_step "42_raspberry_native_video_playback" npm run proof:raspberry-native-video-playback
run_step "43_raspberry_address_overlay_device_display" npm run proof:raspberry-address-overlay-device-display

run_step "50_raspberry_v1_readiness" npm run proof:raspberry-v1-readiness

section "Collecting proof artifacts"

mkdir -p "${RUN_DIR}/repo_proof_artifacts"

for CANDIDATE in \
  "_proof" \
  "proof" \
  "proofs" \
  "artifacts" \
  "test-results" \
  "playwright-report" \
  "coverage"
do
  if [ -e "$REPO_ROOT/$CANDIDATE" ]; then
    echo "copying artifact path: $CANDIDATE"
    cp -a "$REPO_ROOT/$CANDIDATE" "${RUN_DIR}/repo_proof_artifacts/" 2>/dev/null
  else
    echo "artifact path not present: $CANDIDATE"
  fi
done

echo "" >> "$SUMMARY_FILE"
echo "finished_at=$(date -Iseconds)" >> "$SUMMARY_FILE"
echo "pass_count=$PASS_COUNT" >> "$SUMMARY_FILE"
echo "fail_count=$FAIL_COUNT" >> "$SUMMARY_FILE"

section "Creating proof ZIP"

zip_dir "$RUN_DIR" "$ZIP_PATH"

section "Final summary"

if [ "$FAIL_COUNT" -eq 0 ]; then
  ok "OVERALL: PASS"
  OVERALL_EXIT=0
else
  bad "OVERALL: FAIL_COUNT=${FAIL_COUNT}"
  OVERALL_EXIT=1
fi

echo ""
echo "Proof folder:"
echo "$RUN_DIR"
echo ""
echo "Proof ZIP:"
echo "$ZIP_PATH"
echo ""
echo "Summary:"
cat "$SUMMARY_FILE"

if command -v pcmanfm >/dev/null 2>&1; then
  pcmanfm "$PROOF_BASE" >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$PROOF_BASE" >/dev/null 2>&1 &
fi

exit "$OVERALL_EXIT"
