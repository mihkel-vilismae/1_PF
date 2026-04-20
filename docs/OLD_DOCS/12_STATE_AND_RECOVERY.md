# State and Recovery

## Purpose

This document defines exact restart behavior after interruption.

## Canonical Backend Contract Alignment

This document remains the older high-level recovery design.

For the implementation-ready recovery contract, also read:

- [`18_CANONICAL_BACKEND_CONTRACT_SET.md`](18_CANONICAL_BACKEND_CONTRACT_SET.md)
- [`21_EXECUTION_AND_RECOVERY_CONTRACT.md`](21_EXECUTION_AND_RECOVERY_CONTRACT.md)
- [`20_STATE_AND_TRUTH_CONTRACT.md`](20_STATE_AND_TRUTH_CONTRACT.md)
- [`22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md`](22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md)

Use the newer canonical docs for restart-safe current-item truth, reclaim behavior, resume boundaries, and the validation scenarios that must prove recovery correctness.

## Current Implementation Note

The recovery algorithm below is target-state design only.
This repository snapshot does not yet implement durable runtime-state persistence, checkpoint persistence, worker leases, or a recovery engine.

## Recovery Entry Conditions

Recovery begins when the backend starts and detects any of the following:
- `runtime_state.system_mode` indicates a real run was active before shutdown
- a worker lease is stale but the run did not terminate cleanly
- the last `run_session` has no clean terminal event

## Recovery Algorithm

1. Acquire `recovery` lease.
2. Load `runtime_state`, latest `run_session`, latest valid `checkpoint`, and recent `event_log` tail.
3. Reconcile stale leases by expiring any owner whose lease has elapsed.
4. Set `system_mode = recovering`.
5. Decide component restoration in this order:
   - screen state
   - playback state
   - pipeline stage context
6. Write `recovery_started` event.
7. Restore workers and runtime state.
8. Write `recovery_completed` or `recovery_failed`.
9. Release `recovery` lease.

## Playback Recovery Rules

### Images
- Recover to the same queue item if it had not been completed.
- Re-display the current image from the start of that image's display cycle.
- Mark the event payload as resumed-from-checkpoint.

### Videos
- Recover to the same queue item and seek to the last committed `playback_offset_ms`.
- If exact seek is unsupported, seek to the nearest lower supported offset and record the degraded precision in the event payload.

## Screen Recovery Rules

- If the most recent checkpoint was written because of inactivity screen-off, restore `screen_state = off_inactivity` and `playback_state = suspended_inactivity` until new activity resumes runtime.
- If the system shut down while the screen was on, restore screen policy and allow playback worker to continue from the playback checkpoint.

## Pipeline Recovery Rules

- If a stage was marked `running` but has no terminal event, mark the prior `stage_run` as `abandoned` during recovery.
- Resume from the same stage if the stage is defined as idempotent.
- If the stage is not idempotent, restart from the documented safe predecessor stage.
- For the current documented system, all five stages must be implemented to support safe retry from their own stage boundary.

## Determinism Rule

Recovery may only use committed checkpoint data and durable history. It must not infer unseen progress from wall-clock gaps or guesswork.

## Evidence Basis

Derived from the user's requirement that when inactivity or power loss interrupts the system, there must be a clear persisted marker showing where playback and stage processing left off so the system can resume from the last known state.
