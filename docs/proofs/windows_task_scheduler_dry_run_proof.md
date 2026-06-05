# Windows Task Scheduler dry-run proof

This proof defines the first safe Windows Task Scheduler contract for PF_login without installing persistent scheduled tasks.

## Command

```powershell
npm run proof:windows-task-scheduler-dry-run
```

## What it proves

- Three proof-owned scheduled-task definitions can be built for the regular, playback, and screen on/off workers.
- The dry-run definitions point at the existing worker entrypoints under `tools/CronEmulator/entrypoints/`.
- Cleanup command previews are present and scoped to the proof-owned task folder.
- `tools/mpv/` and `tools/ffmpeg/` are not referenced by scheduled-task definitions and remain local-only ignored tooling.
- The generated artifact records explicit non-claims before any real Task Scheduler install/run work.

## What it does not prove

- It does not call `schtasks.exe`.
- It does not install or delete real Windows Task Scheduler tasks.
- It does not prove real Windows Task Scheduler runtime execution.
- It does not prove Windows reboot recovery.
- It does not prove Raspberry cron, reboot, or power-loss recovery.

## Evidence

The proof writes sanitized JSON under `runtime_data/proofs/windows_task_scheduler_dry_run_<timestamp>.json`.

The proof status may be `PASSED` when the contract is structurally valid. This is not a runtime Task Scheduler pass.
