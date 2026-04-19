# Pipeline Stages

## Purpose

This document defines the real five-stage pipeline shown in view D and simulated in view B.

## Ordered Stages

1. `download`
2. `index`
3. `parse_gps`
4. `geocode`
5. `enqueue_playback`

This order is fixed.

## Execution Contract

- Only one stage is active at a time.
- A stage begins only after the previous stage has reached a terminal state.
- The pipeline worker owns stage transitions for the real runtime.
- After `enqueue_playback` completes, the next eligible stage is `download` again.

## Stage Boundary Rules

At each stage boundary the system must:
1. append a `stage_start` or `stage_complete`/`stage_fail` event
2. update `runtime_state.pipeline_stage`
3. update `runtime_state.pipeline_stage_state`
4. optionally write a checkpoint when crossing to a new operationally meaningful boundary

## Per-Stage Intent

### `download`
Collect new source files for later processing.

### `index`
Register downloaded files into the media index or import catalog.

### `parse_gps`
Extract or infer GPS metadata from indexed media.

### `geocode`
Convert coordinates into richer location information.

### `enqueue_playback`
Create queue items for playback consumption.

## Failure Handling

- A failed stage writes `stage_fail` and marks the current stage failed.
- Automatic retry policy is defined in `09_CRON_AND_WATCHDOG.md`.
- A stage retry must increment `attempt_no` in `stage_run`.
- No downstream stage may execute until the failed stage is resolved or administratively skipped.

## Test vs Real Runtime

- In view B, `B3.1` is mock-only and may source test media from `/generated_test_data`.
- In the real runtime, there is no mock stage; the real worker uses actual download logic.
- Simulation results must not overwrite canonical real runtime state.

## Evidence Basis

Derived from the user's definition of the five stages, their required order, the continuous loop back to download, and the distinction between the mock test stage and the real runtime stages.
