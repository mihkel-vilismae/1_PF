#!/usr/bin/env bash
# PF_login Raspberry project-owned launcher wrapper.
# Thin root entrypoint: delegates complex launcher behavior to start_scripts/start_raspberry_full.sh.
set -euo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec "$SCRIPT_DIR/start_scripts/start_raspberry_full.sh" "$@"
