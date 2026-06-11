# Raspberry local tool checker OpenSpec

Version introduced: v0.8.37  
Status: OpenSpec + preflight implementation  
Runtime behavior changed by this document: adds a local preflight/proof runner only

## Purpose

This OpenSpec implements the first Raspberry OS readiness slice from the broader Raspberry missing-feature contract. It verifies whether a target machine is ready for later Raspberry native playback and generated fixture proofs by checking local availability of `mpv`, `ffmpeg`, and `ffprobe`.

This is a tool-readiness preflight only. It does not prove native playback, scheduler behavior, reboot recovery, display focus, monitor pixels, or power-loss recovery.

## Command

```bash
npm run proof:raspberry-tool-checker
```

## Required tools

| Tool | Purpose | Version command |
|---|---|---|
| `mpv` | Candidate native fullscreen image/video playback process | `mpv --version` |
| `ffmpeg` | Media tooling compatibility and future fixture/media workflows | `ffmpeg -version` |
| `ffprobe` | Generated video fixture metadata validation | `ffprobe -version` |

## Pass/block/fail contract

| Status | Meaning |
|---|---|
| `PASSED` | Current machine is Raspberry-like and all required tools are available. |
| `BLOCKED` | Current machine is not Raspberry-like, or one or more required tools are missing/unavailable. |
| `FAILED` | Reserved for unexpected proof-runner errors outside normal prerequisite absence. |

The checker intentionally returns `BLOCKED`, not `FAILED`, for missing target tools because missing packages are an operator/setup prerequisite. The CLI exits successfully for `PASSED` and `BLOCKED` so automation can collect an honest proof artifact.

## Target detection

The runner treats the machine as Raspberry-like when it detects Linux ARM/Raspberry hints from:

- `process.platform` / `process.arch`
- `/etc/os-release`
- `/proc/cpuinfo`
- `/proc/device-tree/model`

For deterministic non-hardware tests only, `PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET=true` may force Raspberry-like target detection. This override must be recorded in proof evidence and must not be used to claim real Raspberry target proof.

## Evidence contract

The generated artifact must include:

- `proof_kind: raspberry_tool_checker`
- `proof_status`
- `baseline_version`
- `git_commit`
- sanitized environment metadata
- target detection fields
- required tool names and purposes
- each tool command, exit code, timeout state, availability, and bounded version-output excerpt
- block reasons when status is `BLOCKED`
- install policy stating that the runner does not install packages or vendor binaries
- known limitations

## Install and repository boundary

- The proof runner does not install `mpv`, `ffmpeg`, or `ffprobe`.
- Operators should install tools through the Raspberry OS package manager or another documented local operator path.
- Do not vendor Raspberry binaries into Git.
- Preserve ignored local-only tool directories such as `tools/mpv/` and `tools/ffmpeg/`.
- Do not re-track generated runtime proof artifacts under `runtime_data/proofs/`.

## Non-claims

This OpenSpec and runner do not prove:

- Raspberry native image playback.
- Raspberry native video playback.
- Raspberry generated fixture validation on target hardware.
- Raspberry project-owned scheduler loop.
- Raspberry boot autostart, reboot recovery, or power-loss recovery.
- Native display focus or monitor-pixel behavior.
- Production iCloud continuation.
