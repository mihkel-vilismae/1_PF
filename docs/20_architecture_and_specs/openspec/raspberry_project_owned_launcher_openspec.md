# Raspberry project-owned launcher OpenSpec

Version introduced: v0.8.38  
Status: OpenSpec + launcher skeleton  
Runtime behavior changed by this document: adds a Raspberry launcher skeleton only

## Purpose

This OpenSpec defines the first project-owned Raspberry launcher boundary. The launcher is a repository-owned shell entrypoint that can write launch evidence and, when explicitly requested, start the PF_login API as a project-owned process with a PID file and log path.

This is still a skeleton. It does not implement Raspberry native playback, generated fixture proof, scheduler loop, boot autostart, reboot recovery, or power-loss recovery.

## Commands

```bash
./start_raspberry_full.sh --dry-run
./start_raspberry_full.sh --run-tool-check
./start_raspberry_full.sh --start-api
```

The root `start_raspberry_full.sh` wrapper delegates to `start_scripts/start_raspberry_full.sh` so the root entrypoint stays thin.

## Ownership boundary

| Component | Launcher behavior |
|---|---|
| API process | May be started only when `--start-api` is passed. PID recorded under ignored `runtime_data/raspberry_launcher/pids/`. |
| Frontend dev server | Not started by this skeleton. |
| `mpv` / native playback | Not started. Later slices must add separate proof-owned playback launchers. |
| Scheduler loop | Not started. Later slices must prove project-owned scheduler behavior separately. |
| systemd / cron / boot autostart | Not configured. |
| Tool installation | Not performed. Operators run the tool checker and install packages outside Git. |

## Evidence contract

The launcher writes a JSON launch plan under ignored `runtime_data/raspberry_launcher/` with:

- `launcher_kind: raspberry_project_owned_launcher`
- `baseline_version`
- `git_commit`
- UTC timestamp
- repository root
- mode: `dry_run` or `project_owned_process_start`
- tool-checker status when requested
- API request/status/host/port/PID/log path
- non-claims

## Pass/block/fail vocabulary

The launcher itself is not a proof runner. It emits evidence for later operator upload and tests guard the launcher contract. Proof status remains owned by dedicated proof runners such as `npm run proof:raspberry-tool-checker` and future Raspberry playback/fixture proofs.

## Non-claims

This OpenSpec and skeleton do not prove:

- Raspberry native image playback.
- Raspberry native video playback.
- Raspberry generated fixture validation on target hardware.
- Raspberry project-owned scheduler loop.
- Raspberry boot autostart, reboot recovery, or power-loss recovery.
- Native display focus or monitor-pixel behavior.
- Production iCloud continuation.
