# Windows CronEmulator proof

## Purpose

This proof verifies the local Windows CronEmulator tool as an emulator layer only. It checks that the emulator has the expected worker entrypoints, a sample crontab, duplicate-run protection, a bounded command execution boundary, and passing Python unit tests.

This proof is intentionally separate from Raspberry hardware power-loss recovery. A passed Windows CronEmulator proof does not prove Raspberry boot, Raspberry power-loss behavior, HDMI playback, or systemd/cron startup on real hardware.

## Command

```bash
npm run proof:windows-cronemulator
```

The runner writes a sanitized JSON artifact under `runtime_data/proofs/` and does not commit generated output.

## What it verifies

- Required CronEmulator files are present.
- The example crontab references the expected worker entrypoints:
  - `regular_stage_worker.ps1`
  - `playback_worker.ps1`
  - `screen_on_off_worker.ps1`
- The scheduler source contains duplicate-run protection using active job IDs and same-minute run keys.
- The executor source contains the single bounded command execution boundary and timeout handling.
- CronEmulator Python unit tests pass through `python -m pytest tools/CronEmulator/tests`.
- The proof artifact explicitly records that Windows CronEmulator evidence is not Raspberry hardware proof.

## What it does not prove

- Real Raspberry power-loss recovery.
- Real startup after unplug/replug or OS reboot.
- Real iCloudPD download behavior.
- Real display/HDMI playback behavior.
- Windows Task Scheduler or system service installation.

## Expected result

A deterministic local run should produce:

```text
proof_status: PASSED
runtime_mode: windows_emulator
```

If Python/pytest is unavailable or the CronEmulator tests fail, the proof should fail or time out honestly rather than claiming recovery behavior.
