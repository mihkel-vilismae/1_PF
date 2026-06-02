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
