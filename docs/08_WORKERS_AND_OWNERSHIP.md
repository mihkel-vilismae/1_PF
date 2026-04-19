# Workers and Ownership

## Purpose

This document assigns execution responsibilities and write authority.

## Worker Set

### 1. Pipeline Worker

Responsibilities:
- hold the `pipeline` lease
- execute one stage at a time in the five-stage loop
- write pipeline state fields
- emit stage-related events
- create queue items during `enqueue_playback`

Owned fields:
- `runtime_state.pipeline_stage`
- `runtime_state.pipeline_stage_state`
- `run_session.last_known_stage`

### 2. Playback Worker

Responsibilities:
- hold the `playback` lease
- consume `playback_queue`
- display images/videos in the real runtime
- persist playback progress and checkpoints
- emit playback events

Owned fields:
- `runtime_state.playback_state`
- `runtime_state.playback_item_id`
- `runtime_state.playback_offset_ms`
- `run_session.last_known_media_id`

### 3. Screen Worker

Responsibilities:
- hold the `screen` lease
- evaluate PIR / mouse / keyboard activity inputs in real runtime
- determine screen on/off transitions
- request playback suspension or continuation according to policy
- emit screen and activity events

Owned fields:
- `runtime_state.screen_state`
- `runtime_state.screen_last_activity_source`
- `runtime_state.screen_inactivity_timeout_ms`

### 4. Recovery Worker / Recovery Service

Responsibilities:
- hold the `recovery` lease during recovery only
- restore runtime state from the last valid checkpoint
- reconcile worker leases and clear stale ownership
- emit recovery events

## Interaction Rules

- Pipeline worker does not directly own screen state.
- Screen worker does not directly mutate queue contents.
- Playback worker does not advance pipeline stages.
- Cross-component requests must flow through service commands and documented state transitions.

## Heartbeat Requirement

Each active lease holder must refresh its heartbeat before lease expiry. Missing heartbeat beyond the expiry window makes the lease recoverable by another owner.

## Evidence Basis

Derived from the user's requirement that the first group of five stages be exclusive, while playback and screen each have exactly one live process and require their own ongoing supervision.
