# Raspberry native image playback proof OpenSpec

Version introduced: v0.8.40  
Status: OpenSpec + target-gated proof runner  
Runtime behavior changed by this document: adds a proof runner only; normal launchers remain disabled-by-default for native playback

## Purpose

This OpenSpec defines the first Raspberry native playback proof: deterministic image playback through a project-owned proof boundary.

The proof is intentionally narrow. It proves only that a Raspberry-like display target can use the project-owned launcher dry-run boundary through the Raspberry launcher and then start a bounded `mpv` native image playback process for a deterministic generated image fixture.

## Command

```bash
npm run proof:raspberry-native-image-playback
```

## Required target conditions

The proof must return `BLOCKED` unless all of these are true:

- The current machine is detected as a Raspberry-like Linux/ARM target.
- Target detection did not depend on an explicit override such as `PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET=true`.
- A display session is visible through `DISPLAY` or `WAYLAND_DISPLAY`.
- Display detection did not depend on `PF_RASPBERRY_NATIVE_IMAGE_ASSUME_DISPLAY=true`.
- `mpv --version` is available.
- The deterministic image fixture exists and is non-empty:
  - `generated_test_data/gps_valid/gps_valid_01.jpg`

## Playback command contract

The proof builds a bounded native playback command shaped like:

```bash
mpv --no-config --force-window=yes --fs --image-display-duration=2 --really-quiet generated_test_data/gps_valid/gps_valid_01.jpg
```

The command is run by the proof runner as a proof-owned process. It must not kill arbitrary `mpv`, `vlc`, `node`, or system processes by name.

## Launcher boundary

Before the native image command is attempted, the proof must run:

```bash
./start_raspberry_full.sh --dry-run
```

The resulting launch plan under ignored `runtime_data/raspberry_launcher/` is recorded in the proof evidence. This proves the proof used the project-owned Raspberry launcher boundary without starting API, scheduler, systemd, cron, or native playback from the normal launcher.

## Status rules

| Status | Meaning |
|---|---|
| `PASSED` | Non-override Raspberry-like display target, `mpv` available, deterministic image fixture exists, launcher dry-run succeeds, and bounded native image process exits 0 or is stopped by the proof timeout boundary. |
| `BLOCKED` | Off-target run, explicit override run, missing display session, missing `mpv`, or missing deterministic image fixture. |
| `FAILED` | Target/tool/display gates pass, but launcher dry-run or native image process fails. |

## Evidence contract

The proof artifact uses proof kind `raspberry_native_image_playback` and records:

- baseline version and Git commit
- target detection and whether overrides were used
- display-session detection
- selected deterministic image fixture path, size, and media type
- `mpv` tool-check result
- launcher dry-run command result and latest launch-plan summary
- native player command shape
- native process result
- stop-boundary evidence
- non-claims

## Non-claims

This proof does not prove:

- Raspberry native video playback.
- Raspberry project-owned scheduler loop.
- Raspberry boot autostart.
- Raspberry manual reboot recovery.
- Raspberry power-loss recovery.
- Monitor-pixel or display-camera observation.
- Production iCloud continuation.
- Native address overlay equivalence.

It also does not configure systemd, cron, or boot autostart, and does not install or vendor `mpv`, `ffmpeg`, or `ffprobe`.
