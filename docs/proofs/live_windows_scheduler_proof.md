# Live Windows scheduler proof

This proof track is for live Windows scheduled worker execution. It keeps deterministic CronEmulator evidence separate from real scheduled invocation evidence.

## Command

```powershell
$env:PF_LIVE_WINDOWS_SCHEDULER_PROOF="1"
npm run proof:live-windows-scheduler
```

## Boundary

- CronEmulator contract proof is useful preflight, but it is not Raspberry cron proof.
- This proof does not claim Windows reboot behavior unless a launcher explicitly records a reboot.
- It must show regular, playback, and screen-on-off worker calls with timestamps/counts.
- It must show duplicate worker lock protection.

## Evidence

The proof writes sanitized JSON under `runtime_data/proofs/live_windows_scheduler_<timestamp>.json`.

### v0.8.13 note — target proof-owned launchers

Dedicated Windows wrappers now exist for the v0.8.10–v0.8.12 target proof tracks:

```powershell
.\start_live_windows_native_video_playback_proof.cmd
.\start_live_windows_native_recovery_proof.cmd
.\start_live_windows_scheduler_proof.cmd
```

The video and recovery wrappers start a proof-owned API with a proof-only env file before running the proof command, then export an evidence ZIP and stop only the owned API process. The scheduler wrapper exports scheduler proof evidence without claiming Raspberry cron, Windows reboot, or arbitrary Task Scheduler success. Normal `start_win_full.cmd` remains unchanged and does not enable native playback by default.
