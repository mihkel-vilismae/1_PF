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
