# Raspberry generated fixture proof OpenSpec

Version introduced: v0.8.39  
Status: OpenSpec + proof runner  
Runtime behavior changed by this document: adds a target-gated proof runner only

## Purpose

This OpenSpec defines the Raspberry target proof for validating the committed `generated_test_data/` fixture set on the Raspberry machine. It reuses the existing generated fixture validator but wraps it in Raspberry target/tool gating so non-target runs remain honest `BLOCKED` evidence.

This proof validates fixture integrity and video metadata on the Raspberry target. It does not start native playback and does not prove display, scheduler, reboot, or power-loss behavior.

## Command

```bash
npm run proof:raspberry-generated-fixtures
```

## Prerequisites

| Requirement | Why |
|---|---|
| Raspberry-like target detection | Prevents Windows/Linux desktop runs from being misreported as Raspberry proof. |
| `python3` | Runs `tools/verify_generated_test_data.py`. |
| `ffprobe` | Validates generated video streams, codecs, containers, duration, and GPS/no-GPS semantics. |
| `generated_test_data/` present | Fixture dataset under proof. |

## Pass/block/fail contract

| Status | Meaning |
|---|---|
| `PASSED` | Raspberry-like target detected, `python3` and `ffprobe` available, and the generated fixture validator exits 0. |
| `BLOCKED` | Current machine is not Raspberry-like, or target prerequisites are missing. |
| `FAILED` | Raspberry-like target and tools are available, but fixture validation exits non-zero or times out. |

The proof runner exits successfully for `PASSED` and `BLOCKED` so automation can collect the evidence artifact. It exits non-zero for `FAILED`.

## Evidence contract

The generated artifact must include:

- `proof_kind: raspberry_generated_fixture_validation`
- `proof_status`
- `baseline_version`
- `git_commit`
- sanitized environment metadata
- Raspberry target-detection fields
- required tool results for `python3` and `ffprobe`
- validator execution summary when executed
- block reasons when status is `BLOCKED`
- known limitations and non-claims

## Non-claims

This OpenSpec and proof runner do not prove:

- Raspberry native image playback.
- Raspberry native video playback.
- Raspberry display focus or monitor pixels.
- Raspberry project-owned scheduler loop.
- Raspberry boot autostart, reboot recovery, or power-loss recovery.
- Production iCloud continuation.
