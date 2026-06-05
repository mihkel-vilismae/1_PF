# Live Windows native video playback proof

This proof extends the Windows native playback evidence by requiring a real video item to be the current or next playback item before launching `mpv`.

## Command

```powershell
$env:PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF="1"
$env:PF_LIVE_WINDOWS_NATIVE_VIDEO_PLAYBACK_PROOF="1"
$env:PF_API_BASE_URL="http://127.0.0.1:4301"
npm run proof:live-windows-native-video-playback
```

## Safety boundary

- The proof is Windows-only and opt-in.
- It does not run during normal tests.
- It uses the existing native start-current and owned stop routes.
- It does not claim monitor-pixel correctness.
- If no video item is current/next, the proof returns `BLOCKED` instead of faking video evidence.

## Evidence

The proof writes sanitized JSON under `runtime_data/proofs/live_windows_native_video_playback_<timestamp>.json`.

### v0.8.13 note — target proof-owned launchers

Dedicated Windows wrappers now exist for the v0.8.10–v0.8.12 target proof tracks:

```powershell
.\start_live_windows_native_video_playback_proof.cmd
.\start_live_windows_native_recovery_proof.cmd
.\start_live_windows_scheduler_proof.cmd
```

The video and recovery wrappers start a proof-owned API with a proof-only env file before running the proof command, then export an evidence ZIP and stop only the owned API process. The scheduler wrapper exports scheduler proof evidence without claiming Raspberry cron, Windows reboot, or arbitrary Task Scheduler success. Normal `start_win_full.cmd` remains unchanged and does not enable native playback by default.

### v0.8.22 — proof-only native video seed/select path

The live Windows native video playback proof now seeds one deterministic `generated_test_data` video fixture into the Test Mode database before checking `/api/runtime/playback/current`. This is a proof-only route under `/api/testing/live-windows-native-video/seed`; it does not change normal production playback ordering and the proof still cannot pass unless native playback reports a running video item with `currentMediaType=video`. Local `tools/mpv/` and `tools/ffmpeg/` bundles remain ignored and must not be vendored into baseline ZIPs.
