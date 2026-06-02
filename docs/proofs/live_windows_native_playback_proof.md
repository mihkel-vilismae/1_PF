# Live Windows Native Playback Proof

## Purpose

`proof:live-windows-native-playback` is the opt-in proof for real Windows OS-native playback. It exists because the deterministic `proof:native-fullscreen-playback` proves safe boundaries only and does not launch `mpv` or `vlc`.

This proof is intended to verify that the browser playback contract and Windows native playback target the same selected/current media item, and that the native player can be started and stopped through the owned backend native playback boundary.

## Command

Safe dry run / blocked artifact:

```powershell
npm run proof:live-windows-native-playback
```

Live Windows run, against an already-running backend with native playback enabled:

```powershell
$env:PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF="1"
$env:PF_API_BASE_URL="http://127.0.0.1:8787"
$env:PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE="test"
$env:NATIVE_PLAYBACK_ENABLED="true"
$env:NATIVE_PLAYBACK_FULLSCREEN="true"
$env:NATIVE_PLAYBACK_PLAYER="mpv"
npm run proof:live-windows-native-playback
```

Optional playback-worker auto-start check:

```powershell
$env:PF_LIVE_WINDOWS_NATIVE_PLAYBACK_WORKER_AUTOSTART="1"
$env:NATIVE_PLAYBACK_AUTO_START_ON_WORKER="true"
npm run proof:live-windows-native-playback
```

## What it proves when enabled and passed

1. The browser playback contract exposes a current or next selected item.
2. Native playback detection succeeds for the configured Windows player.
3. Native playback starts through the existing native route using the same media asset id as the browser playback contract.
4. Native playback reports a running owned process id.
5. Native playback is stopped through the owned process boundary.
6. If `PF_LIVE_WINDOWS_NATIVE_PLAYBACK_WORKER_AUTOSTART=1`, the playback worker CLI path is also exercised with native auto-start enabled.

## Image and video coverage

The proof reports image/video coverage from the playback queue. By default it expects both `image` and `video` media types to exist in the browser playback contract and records missing types in the proof artifact. The live native player launch still proves the currently selected item only; separate runs with an image selected and a video selected are required to prove both real playback types.


## mpv availability

The live Windows proof needs a real native player. `start_win_full.cmd` now automatically delegates mpv verification/installation through `scripts/install_mpv_windows.ps1` before the app starts. The preferred repo-local target is:

```text
tools/mpv/windows/mpv.exe
```

The installer uses the documented shinchiro Windows builds referenced from mpv installation guidance, writes sanitized install evidence under `runtime_data/proofs`, and never launches fullscreen playback. If setup is blocked by network or extraction availability, the proof should remain `BLOCKED` rather than silently claiming native playback.

## Safety boundaries

- The proof is Windows-only.
- It returns `BLOCKED` unless `PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF=1` is set.
- It does not run in the normal test suite.
- It uses existing native playback routes and the owned native stop boundary.
- It must not kill arbitrary `mpv`, `vlc`, Node, Python, SQLite, or dashboard processes.
- It does not claim Raspberry HDMI, Raspberry cron, monitor pixel inspection, or real reboot recovery proof.

## Runtime artifact

Proof JSON is written under ignored `runtime_data/proofs/` with proof kind:

```text
live_windows_native_playback
```

## Dedicated Windows proof launcher

For operator runs, prefer the dedicated proof launcher instead of manually starting `start_win_full.cmd` and then setting environment variables in another terminal:

```powershell
clear
cd S:\PF_login
.\start_live_windows_native_playback_proof.cmd
```

The normal `start_win_full.cmd` does not enable native playback by default. That is intentional. Environment values for native playback are loaded by the backend from its configured env file, so setting `NATIVE_PLAYBACK_ENABLED=true` in a second terminal after the API is already running does not change the running API process.

The dedicated launcher creates a proof-only env file under `runtime_data/live_windows_native_playback_proof.env`, starts an owned API process on the actual proof API port, runs `proof:live-windows-native-playback`, writes sanitized proof JSON under `runtime_data/proofs`, stops only the API process it started, and packs logs/proofs/artifacts into a Downloads ZIP.

Use worker auto-start coverage with:

```powershell
.\start_live_windows_native_playback_proof.cmd -WorkerAutostart
```

This still does not claim Raspberry HDMI playback, real reboot recovery, or monitor-pixel/focus proof.


### Windows mpv installer path note

The Windows mpv installer redacts repo-local absolute paths with escaped regex patterns, so paths such as `S:\PF_login` are safe during installer verification. Normal `start_win_full.cmd` still does not enable native playback by default; use `start_live_windows_native_playback_proof.cmd` for the opt-in live proof.


### v0.8.5 note — mpv version verification

The Windows mpv installer verifies `tools/mpv/windows/mpv.exe` with `mpv.exe --version` using redirected stdout/stderr. Normal multiline mpv version output is recorded as sanitized evidence and must not be treated as a failed install.

### v0.8.6 note — worker-autostart native playback proof

Worker-autostart live native playback proof now validates the item selected by `playback_worker` against native playback status directly after the worker run. In `-WorkerAutostart` mode the proof does not call the direct `/api/native-playback/start-current` route after the worker, because doing so can advance to a different next item and invalidate the worker identity proof. Missing video queue coverage is recorded as a limitation unless a video-specific proof run is explicitly required.

