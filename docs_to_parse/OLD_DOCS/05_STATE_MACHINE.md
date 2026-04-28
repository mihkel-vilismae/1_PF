# State Machine

## Purpose

This document defines the allowed states and transitions for the real runtime. Illegal states are rejected by design.

## Canonical Backend Contract Alignment

This document is the older high-level target-state state-machine description.

For the implementation-ready backend transition contract, also read:

- [`18_CANONICAL_BACKEND_CONTRACT_SET.md`](18_CANONICAL_BACKEND_CONTRACT_SET.md)
- [`19_BACKEND_RUNTIME_CONTRACT.md`](19_BACKEND_RUNTIME_CONTRACT.md)
- [`20_STATE_AND_TRUTH_CONTRACT.md`](20_STATE_AND_TRUTH_CONTRACT.md)
- [`22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md`](22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md)

Use the newer canonical docs for stage-specific vocabulary, ownership boundaries, queue transitions, and invalid-state rules.

## Top-Level System States

- `idle` — no real run active
- `starting` — prerequisites satisfied; run startup in progress
- `running_real` — real pipeline/playback/screen execution active
- `paused_inactivity` — playback intentionally suppressed due to screen inactivity logic
- `recovering` — restoring from checkpoint after crash or restart
- `failed` — runtime stopped because a non-recoverable error requires intervention
- `stopping` — orderly shutdown in progress

## Allowed Top-Level Transitions

- `idle -> starting`
- `starting -> running_real`
- `starting -> failed`
- `running_real -> paused_inactivity`
- `paused_inactivity -> running_real`
- `running_real -> recovering`
- `paused_inactivity -> recovering`
- `recovering -> running_real`
- `recovering -> failed`
- `running_real -> stopping`
- `paused_inactivity -> stopping`
- `stopping -> idle`
- `failed -> recovering`
- `failed -> idle` (manual reset only)

Any transition not listed above is invalid.

## Pipeline Stage States

For the current stage only:
- `not_started`
- `queued`
- `running`
- `completed`
- `failed`
- `skipped` (manual administrative action only; not normal runtime)

## Playback States

- `empty`
- `ready`
- `displaying_image`
- `playing_video`
- `waiting_for_queue`
- `suspended_inactivity`
- `error`

## Screen States

- `on`
- `off_inactivity`
- `off_manual`
- `error`

## Transition Guards

- Entering `running_real` requires an active `run_session` and valid worker leases.
- Entering `paused_inactivity` requires `screen_state = off_inactivity` and a checkpoint write.
- Entering `recovering` requires a known checkpoint or a deliberate reset strategy.
- A pipeline stage may not move from `running` to a different `running` stage without first completing or failing.

## Illegal State Examples

- `system_mode = idle` with a valid playback worker lease
- `pipeline_stage_state = running` while `current_run_id` is null
- `screen_state = off_inactivity` while `playback_state = playing_video` and playback is not marked suspended

## Evidence Basis

Derived from the user's need to distinguish inactive, active, interrupted, resumed, and failed conditions for both live runtime and last-run inspection.
