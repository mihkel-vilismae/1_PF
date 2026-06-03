# Live Windows native recovery proof

This proof track is for controlled Windows native playback recovery. It starts with API-process restart/recovery and does not claim full OS reboot or Raspberry power recovery.

## Command

```powershell
$env:PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF="1"
$env:PF_LIVE_WINDOWS_NATIVE_RECOVERY_PROOF="1"
$env:PF_API_BASE_URL="http://127.0.0.1:4301"
npm run proof:live-windows-native-recovery
```

## Boundary

- Controlled API restart is not the same as Windows reboot.
- Raspberry power recovery remains a separate target proof.
- Native playback remains disabled by default outside explicit proof launchers.
- Only proof-owned API/native playback processes may be stopped.

## Evidence

The proof writes sanitized JSON under `runtime_data/proofs/live_windows_native_recovery_<timestamp>.json`.

### v0.8.13 note — target proof-owned launchers

Dedicated Windows wrappers now exist for the v0.8.10–v0.8.12 target proof tracks:

```powershell
.\start_live_windows_native_video_playback_proof.cmd
.\start_live_windows_native_recovery_proof.cmd
.\start_live_windows_scheduler_proof.cmd
```

The video and recovery wrappers start a proof-owned API with a proof-only env file before running the proof command, then export an evidence ZIP and stop only the owned API process. The scheduler wrapper exports scheduler proof evidence without claiming Raspberry cron, Windows reboot, or arbitrary Task Scheduler success. Normal `start_win_full.cmd` remains unchanged and does not enable native playback by default.
