# Raspberry native image playback proof

Version introduced: v0.8.40

## Command

```bash
npm run proof:raspberry-native-image-playback
```

## Purpose

Runs the first target-gated Raspberry native playback proof. The proof selects the deterministic image fixture `generated_test_data/gps_valid/gps_valid_01.jpg`, records the project-owned Raspberry launcher dry-run boundary, and starts a bounded `mpv` fullscreen image playback command only when Raspberry target/display/tool prerequisites are satisfied.

## Status rules

- `PASSED`: non-override Raspberry-like display target, `mpv` is available, deterministic image fixture exists, `./start_raspberry_full.sh --dry-run` succeeds, and the bounded native image process exits 0 or is stopped by the proof timeout boundary.
- `BLOCKED`: not running on a Raspberry-like target, explicit override was used, no `DISPLAY`/`WAYLAND_DISPLAY` session is present, `mpv` is unavailable, or the deterministic image fixture is missing.
- `FAILED`: target/display/tool gates pass, but launcher dry-run or native image playback fails.

## Artifact

The runner writes sanitized JSON evidence under ignored `runtime_data/proofs/` using proof kind `raspberry_native_image_playback`.

The artifact records target detection, display detection, selected media, launcher dry-run evidence, native player command, process result, and stop boundary. Private paths and secrets are redacted by the shared proof utilities.

## Non-claims

This proof does not prove Raspberry native video playback, scheduler behavior, boot autostart, manual reboot recovery, power-loss recovery, monitor-pixel observation, native address overlay equivalence, or production iCloud continuation. It does not configure systemd or cron and does not install or vendor playback tools.
