# Raspberry project-owned launcher runbook

Version introduced: v0.8.38

## Purpose

Use this runbook on a Raspberry target after extracting the PF_login repository. The launcher is intentionally conservative: dry-run evidence is the default, and the API is started only when `--start-api` is passed.

## Commands

From the repository root:

```bash
chmod +x ./start_raspberry_full.sh ./start_scripts/start_raspberry_full.sh
./start_raspberry_full.sh --dry-run
./start_raspberry_full.sh --run-tool-check
./start_raspberry_full.sh --start-api
```

## Evidence paths

The launcher writes ignored local evidence under:

```text
runtime_data/raspberry_launcher/
runtime_data/raspberry_launcher/logs/
runtime_data/raspberry_launcher/pids/
```

Upload the generated `launch_plan_*.json` and logs when asking for proof review. Do not commit these runtime artifacts.

## Boundaries

The launcher does not install packages, does not vendor binaries, does not configure `systemd` or `cron`, and does not start `mpv`/native playback. Later proof slices must implement and prove those behaviors separately.
