# Dirty-shutdown testing proof

Estonian timestamp: 2026-05-31 18:22 EEST

## Purpose

This proof validates the first safe View C `TESTING` panel and the guarded dirty-shutdown testing backend scaffold.

The proof is deterministic and local. It verifies that the testing panel is visible only in Test Mode, that the backend simulation path is blocked by default, and that process targeting is based only on app-owned process records.

## What it proves

- View C renders `TESTING` only in Test Mode.
- Real Mode and unknown mode do not render the dirty-shutdown controls.
- `POST /api/testing/dirty-shutdown/plan` is non-destructive.
- `POST /api/testing/dirty-shutdown/simulate` is blocked unless `PF_ENABLE_DIRTY_SHUTDOWN_TESTING=true` and the request is in Test Mode.
- Generic process names such as `node.exe`, `python.exe`, `powershell.exe`, `icloudpd`, and browser names are rejected as targeting evidence.
- Backend self-kill is blocked in this first safe version.
- No OS process termination is attempted by the deterministic proof.

## What it does not prove

- It does not prove real Raspberry hardware power loss.
- It does not kill the backend process.
- It does not kill worker processes.
- It does not prove startup recovery execution.
- It does not prove download partial-file cleanup.

## Run command

```bash
npm run proof:dirty-shutdown-testing
```

The generated proof JSON is written under ignored `runtime_data/proofs/`.
