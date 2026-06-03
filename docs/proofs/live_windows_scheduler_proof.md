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
