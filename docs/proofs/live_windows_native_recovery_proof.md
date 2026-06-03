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
