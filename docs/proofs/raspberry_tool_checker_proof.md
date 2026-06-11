# Raspberry tool checker proof

Version introduced: v0.8.37

## Command

```bash
npm run proof:raspberry-tool-checker
```

## Purpose

Checks whether the current target is Raspberry-like and whether `mpv`, `ffmpeg`, and `ffprobe` are available for later Raspberry native playback and generated-fixture proof slices.

## Status rules

- `PASSED`: Raspberry-like target detected and all three tools respond to version commands.
- `BLOCKED`: not running on a Raspberry-like target, or one or more tools are missing.
- `FAILED`: unexpected proof runner error.

`BLOCKED` is an honest setup state and does not mean PF_login runtime behavior regressed.

## Artifact

The runner writes sanitized JSON evidence under ignored `runtime_data/proofs/` using proof kind `raspberry_tool_checker`.

## Non-claims

This proof does not prove Raspberry playback, scheduler behavior, reboot recovery, power-loss recovery, display focus, monitor pixels, or production iCloud continuation.
