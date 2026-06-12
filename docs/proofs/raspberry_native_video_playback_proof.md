# Raspberry native video playback proof

Version introduced: v0.8.42

## Command

```bash
npm run proof:raspberry-native-video-playback
```

## Purpose

Runs the target-gated Raspberry native video playback proof. The proof selects the deterministic video fixture `generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4`, records the project-owned Raspberry launcher dry-run boundary, records duration/media metadata with `ffprobe`, and starts a bounded `mpv` fullscreen video playback command only when Raspberry target/display/tool prerequisites are satisfied.

## Status rules

- `PASSED`: non-override Raspberry-like display target, `mpv` and `ffprobe` are available, deterministic video fixture exists, `./start_raspberry_full.sh --dry-run` succeeds, metadata is recorded, and the bounded native video process exits 0 or is stopped by the proof timeout boundary.
- `BLOCKED`: not running on a Raspberry-like target, explicit override was used, no `DISPLAY`/`WAYLAND_DISPLAY` session is present, `mpv` or `ffprobe` is unavailable, or the deterministic video fixture is missing.
- `FAILED`: target/display/tool gates pass, but launcher dry-run, video metadata, or native video playback fails.

## Artifact

The runner writes sanitized JSON evidence under ignored `runtime_data/proofs/` using proof kind `raspberry_native_video_playback`.

The artifact records target detection, display detection, selected media, launcher dry-run evidence, media metadata, native player command, process result, and stop boundary. Private paths and secrets are redacted by the shared proof utilities.

## Non-claims

This proof does not prove Raspberry scheduler behavior, boot autostart, manual reboot recovery, power-loss recovery, monitor-pixel observation, native address overlay equivalence, or production iCloud continuation. It does not configure systemd or cron and does not install or vendor playback tools.
