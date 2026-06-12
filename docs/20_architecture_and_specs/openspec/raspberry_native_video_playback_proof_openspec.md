# Raspberry native video playback proof OpenSpec

Version introduced: v0.8.42  
Status: OpenSpec + target-gated proof runner  
Runtime behavior changed by this document: adds a proof runner only; normal launchers remain disabled-by-default for native playback

## Purpose

This OpenSpec defines the second Raspberry native playback proof: deterministic video playback through a project-owned proof boundary.

The proof is intentionally narrow. It proves only that a Raspberry-like display target can use the project-owned launcher dry-run boundary, record deterministic video fixture metadata with `ffprobe`, and then start a bounded `mpv` native video playback process for a deterministic generated video fixture.

## Command

```bash
npm run proof:raspberry-native-video-playback
```

## Required target conditions

The proof must return `BLOCKED` unless all of these are true:

- The current machine is detected as a Raspberry-like Linux/ARM target.
- Target detection did not depend on an explicit override such as `PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET=true`.
- A display session is visible through `DISPLAY` or `WAYLAND_DISPLAY`.
- Display detection did not depend on `PF_RASPBERRY_NATIVE_VIDEO_ASSUME_DISPLAY=true`.
- `mpv --version` is available.
- `ffprobe -version` is available.
- The deterministic video fixture exists and is non-empty:
  - `generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4`

## Metadata command contract

Before native playback is attempted, the proof records media metadata using a bounded `ffprobe` command shaped like:

```bash
ffprobe -v error -show_entries format=duration:stream=index,codec_type,codec_name,width,height -of json generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4
```

The proof artifact stores a sanitized metadata summary: duration, stream codec type/name, and dimensions. It must not include raw private paths, provider output, secrets, cookies, or credentials.

## Playback command contract

The proof builds a bounded native playback command shaped like:

```bash
mpv --no-config --force-window=yes --fs --really-quiet --keep-open=no generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4
```

The command is run by the proof runner as a proof-owned process. It must not kill arbitrary `mpv`, `vlc`, `node`, or system processes by name.

## Launcher boundary

Before the metadata or native video command is attempted, the proof must run:

```bash
./start_raspberry_full.sh --dry-run
```

The resulting launch plan under ignored `runtime_data/raspberry_launcher/` is recorded in the proof evidence. This proves the proof used the project-owned Raspberry launcher boundary without starting scheduler, systemd, cron, recovery automation, or normal-launcher native playback.

## Status rules

| Status | Meaning |
|---|---|
| `PASSED` | Non-override Raspberry-like display target, `mpv` and `ffprobe` available, deterministic video fixture exists, launcher dry-run succeeds, metadata is recorded, and bounded native video process exits 0 or is stopped by the proof timeout boundary. |
| `BLOCKED` | Off-target run, explicit override run, missing display session, missing `mpv`, missing `ffprobe`, or missing deterministic video fixture. |
| `FAILED` | Target/tool/display gates pass, but launcher dry-run, video metadata command, or native video process fails. |

## Evidence contract

The proof artifact uses proof kind `raspberry_native_video_playback` and records:

- baseline version and Git commit
- target detection and whether overrides were used
- display-session detection
- selected deterministic video fixture path, size, and media type
- `mpv` and `ffprobe` tool-check results
- launcher dry-run command result and latest launch-plan summary
- media metadata command result and parsed duration/stream metadata
- native player command shape
- native process result
- stop-boundary evidence
- non-claims

## Non-claims

This proof does not prove:

- Raspberry project-owned scheduler behavior or scheduler loop.
- Raspberry boot autostart.
- Raspberry manual reboot recovery.
- Raspberry power-loss recovery.
- Monitor-pixel or display-camera observation.
- Native address overlay equivalence.
- Production iCloud continuation.

It also does not configure systemd, cron, or boot autostart, and does not install or vendor `mpv`, `ffmpeg`, or `ffprobe`.
