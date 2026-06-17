# Windows reboot/restart recovery preflight proof

This document defines the PF_login project-owned Windows reboot/restart recovery proof contract. It is a preflight only: it does not reboot Windows and it does not prove reboot recovery.

## Command

```powershell
npm run proof:windows-reboot-recovery-preflight
```

The command writes a sanitized proof artifact under `runtime_data/proofs/windows_reboot_recovery_preflight_<timestamp>.json`.

## Scope

The preflight verifies that the repository has the project-owned building blocks required for a future manual target-machine proof:

- generated fixture validation command
- native image playback proof launcher
- native video playback proof launcher
- controlled native recovery proof launcher
- proof-owned scheduler-loop proof launcher
- ignored local-only `tools/mpv/` and `tools/ffmpeg/` boundaries
- expected runtime evidence directories and cleanup rules

## Manual target-machine proof shape

A later proof may follow this sequence:

1. Verify clean repo state and active version.
2. Run generated fixture validation and current Windows native proofs.
3. Write a pre-restart marker under ignored runtime proof data.
4. Operator manually restarts Windows.
5. Operator runs a resume proof command after login/startup.
6. Resume proof validates marker continuity, selected-item state, native playback launch, scheduler-loop readiness, and sanitized evidence export.
7. Cleanup removes only proof-owned runtime markers and artifacts.

## Non-claims

This preflight preserves these non-claims:

- It does not reboot Windows.
- It does not prove full Windows reboot recovery.
- Windows Task Scheduler is not part of PF_login project scope.
- It does not use `schtasks.exe`.
- It does not prove Raspberry cron, Raspberry reboot, or Raspberry power-loss recovery.
- It does not prove monitor-pixel focus.
- It does not prove production iCloud continuation.
- It does not vendor `tools/mpv/` or `tools/ffmpeg/` into Git.

## Cleanup boundary

The future manual proof may clean only proof-owned paths:

- `runtime_data/proofs/`
- `runtime_data/artifacts/`
- `runtime_data/reports/`
- `logs/`

It must not delete user media, `tools/mpv/`, `tools/ffmpeg/`, or arbitrary system/application processes.

Tracked `tools/mpv/windows/.gitkeep` and `tools/mpv/windows/README.md` are allowed documentation/placeholders for the Windows mpv directory contract; runtime mpv binaries remain ignored and must not be vendored.
