# Raspberry generated fixture proof

Version introduced: v0.8.39

## Command

```bash
npm run proof:raspberry-generated-fixtures
```

## Purpose

Validates the committed `generated_test_data/` media fixtures on a Raspberry-like target using `python3` and `ffprobe`.

## Status rules

- `PASSED`: Raspberry-like target detected, `python3` and `ffprobe` are available, and `tools/verify_generated_test_data.py` exits 0.
- `BLOCKED`: not running on a Raspberry-like target, or one or more prerequisites are missing.
- `FAILED`: the target/prerequisite gate passes, but fixture validation fails or times out.

## Artifact

The runner writes sanitized JSON evidence under ignored `runtime_data/proofs/` using proof kind `raspberry_generated_fixture_validation`.

## Non-claims

This proof does not prove Raspberry native playback, display focus, scheduler behavior, reboot recovery, power-loss recovery, or production iCloud continuation.
