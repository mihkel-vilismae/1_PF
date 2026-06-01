#!/usr/bin/env bash
# Raspberry power-loss recovery proof helper.
# Prints non-secret device/runtime facts for manual proof collection.
# Does not upload data, mutate services, or claim proof by itself.
# Pair its output with tools/collect-raspberry-recovery-proof.mjs.
# Review all output before sharing it outside the device.
set -euo pipefail
printf 'PF Raspberry recovery check\n'
printf 'timestamp=%s\n' "$(date -Iseconds)"
printf 'hostname=%s\n' "$(hostname)"
printf 'kernel=%s\n' "$(uname -a)"
printf 'uptime=%s\n' "$(uptime -p || true)"
printf '\nProcesses matching PF_login/photo-frame/node/python:\n'
ps -eo pid,comm,args | grep -Ei 'PF_login|photo-frame|node|python|tsx' | grep -v grep || true
printf '\nCron entries for current user:\n'
crontab -l 2>/dev/null || printf 'no user crontab or crontab unavailable\n'
printf '\nSystemd services mentioning PF_login/photo-frame if systemctl exists:\n'
if command -v systemctl >/dev/null 2>&1; then systemctl list-units --type=service --all | grep -Ei 'PF_login|photo-frame' || true; else printf 'systemctl unavailable\n'; fi
