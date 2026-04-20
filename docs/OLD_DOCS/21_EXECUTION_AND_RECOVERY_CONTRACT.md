# Execution And Recovery Contract

## Purpose

This document is the canonical contract for runtime entry, retry and backoff, locking, reclaim, atomicity, concurrency, interlocks, and restart/resume behavior.

## Sources Absorbed

- `docs/contracts/RUNTIME_AND_RETRY.md`
- `docs/contracts/runtime/ATOMICITY_MODEL.md`
- `docs/contracts/runtime/CONCURRENCY_MODEL.md`
- `docs/contracts/runtime/LOCKING_AND_RECLAIM.md`
- `docs/contracts/runtime/QUEUE_RECLAIM_MODEL.md`
- `docs/contracts/runtime/RESTART_RESUME_MODEL.md`
- `docs/contracts/runtime/STAGE_INTERLOCKS.md`
- `docs/archive/analysis/RETRY_AND_LOCK_POLICY.md`

## Retry Model

### Core Rules

- one processing pass on one queue row counts as one attempt
- retry is row-based, not whole-pipeline-based
- `attempt_count` increments on completed claim outcomes, not on reclaim alone
- `next_attempt_at` gates retry eligibility
- default queue retry budget is `max_attempts = 3`

### Stage Scope

- automatic retry applies only to Stage 3 and Stage 4 queue rows
- Stage 1, Stage 2, Stage 5, Stage 6, and Stage 7 use rerun or admin/manual re-entry rather than queue retry

### Geocode Path

- geocoding is cache-first
- cache hit completes the row without provider fallback
- provider work on cache miss is not durable truth until the DB outcome commits

## Locking Layers

| Layer | Surface | Used by |
|---|---|---|
| stage-entry exclusion | external stage lock | all stages |
| shared mutable resource lock | external shared-resource lock | Stage 1 and Stage 2 |
| queue ownership | `locked_by`, `locked_at` on queue rows | Stage 3 and Stage 4 |
| playback ownership | `runtime_state` lease keys, optionally paired with external playback lock | Stage 6 |

## Acquisition Order

1. shared-resource lock, if required
2. stage lock
3. DB ownership surface
   - queue claim for Stage 3 or Stage 4
   - playback lease for Stage 6

Release order is the reverse.

No stage may mutate owned truth without holding every required ownership surface for that stage.

## Conflict Handling

- cron and manual triggers follow the same ownership rules
- later contenders fail fast with visible conflict outcomes
- conflict handling is non-destructive
- lock-layer mismatch is treated as a conflict, not permission to proceed

## Interlocks

### Disallowed Overlap

- Stage 1 with Stage 2
- Stage 3 with another Stage 3 runner
- Stage 4 with another Stage 4 runner
- Stage 6 with another Stage 6 runner
- Stage 7 with another Stage 7 publish cycle

### Allowed Overlap

- Stage 2 with Stage 3
- Stage 3 with Stage 4
- Stage 4 with Stage 5
- Stage 5 with Stage 6
- Stage 6 with Stage 7, but only with a publish guard that validates the observed current-item pointer token

## Atomic Outcome Units

### Stage 2

One atomic registration unit includes:

- variant insert
- canonical insert
- initial GPS queue insert

### Stage 3

There are two atomic units:

- claim unit: queue `PENDING/RETRY -> PROCESSING` plus lock metadata
- outcome unit: canonical GPS truth, queue outcome, and geocode enqueue on success

Forbidden mixed visibility includes:

- canonical GPS success without queue completion
- queue completion without canonical GPS success
- geocode enqueue without canonical GPS success

### Stage 4

There are two atomic units:

- claim unit: queue `PENDING/RETRY -> PROCESSING` plus lock metadata
- outcome unit: cache write when needed, canonical geocode truth, and queue outcome

Forbidden mixed visibility includes:

- canonical geocode success without queue completion
- queue completion with blank canonical `address_text`

### Stage 5

One atomic unit:

- insert-or-ignore of `slideshow_queue.status = 'READY'`

### Stage 6

There are two atomic concerns:

- ownership unit: acquire playback ownership before selection
- playback-commit unit: invalid candidate failure, chosen-row history update, and current-item pointer update

Forbidden mixed visibility includes:

- updated pointer without matching history update
- updated history without matching pointer update
- blocked run mutating slideshow state

### Stage 7

Stage 7 is read-only over DB truth.

Its atomicity rule is snapshot consistency:

- read current pointer and canonical address from one committed state
- tag derived output with the pointer token it observed
- publish only if that token is still current

## Reclaim Contract

### Queue Reclaim

A Stage 3 or Stage 4 row is reclaimable only when all of these are true:

1. `status = 'PROCESSING'`
2. `locked_by` and `locked_at` are present
3. lock timeout is exceeded
4. the owner is verified dead or cannot be matched safely

Automatic reclaim transition:

`PROCESSING -> RETRY`

Automatic reclaim must:

- clear `locked_by`
- clear `locked_at`
- clear `next_attempt_at`
- keep `attempt_count` unchanged
- set a visible reclaim error or note
- leave canonical GPS or geocode truth unchanged

### External Lock Reclaim

External locks are reclaimable only after:

- timeout is exceeded
- owner verification fails
- previous metadata is preserved
- reclaim is explicitly logged

### Playback Reclaim

Stage 6 may proceed only when:

- no active playback ownership remains, or
- the old ownership is proven stale and safely reclaimed

Lease expiry alone is not a license to ignore contradictory live-owner evidence.

## Restart And Resume

### Durable Facts

Persisted restart-safe truth includes:

- canonical asset identity, path, GPS status, geocode status, and address
- slideshow eligibility and playback history
- `runtime_state.current_media_asset_id`
- playback ownership keys

Memory-only state is never authoritative after restart.

### Restart Classification

State A: valid committed current item, no active playback ownership

- Stage 7 may render from the committed pointer
- no history field is updated on restart alone

State B: valid committed current item, unexpired playback ownership

- no second Stage 6 runner may start
- Stage 7 may continue to render from committed truth if the display is recovering

State C: no valid committed current item

- Stage 7 renders nothing or a no-current-item state
- next Stage 6 run must acquire ownership and select a new valid item

### Restart Rules

- restart never reconstructs state from memory-only candidate lists or overlay buffers
- restart never increments `view_count`
- restart never refreshes `last_shown_datetime`
- if a prior selection committed, that committed pointer remains authoritative
- if a prior selection did not commit, the prior committed pointer remains authoritative

## High-Risk Scenarios That Must Behave Deterministically

| Scenario | Required behavior |
|---|---|
| overlapping Stage 3 or Stage 4 runners | only one runner owns stage entry; queue rows require per-row ownership before processing |
| crash after claim but before outcome commit | row stays in `PROCESSING` until safe reclaim |
| reclaim of stale Stage 3 or Stage 4 work | visible `PROCESSING -> RETRY` reset, no canonical rewrite, no hidden replay |
| second Stage 6 runner starts while ownership is active | fail fast, no playback commit |
| restart after Stage 6 commit | committed pointer and history remain authoritative; no double count |
| Stage 6 pointer changes while Stage 7 prepares overlay | stale Stage 7 publish is discarded or suppressed |

## Observability Requirements

At minimum, execution and recovery must emit evidence for:

- stage lock acquire attempt, success, conflict, and reclaim
- queue claim acquire and reclaim
- playback ownership acquire and conflict
- retry scheduling
- reclaim decisions
- restart classification
- overlay publish guard discard events

## Non-Negotiable Rules

1. No stage may treat `action_runs.status = 'PROCESSING'` as a lock.
2. No stage may mutate queue or canonical truth without owning the required lock surface.
3. Queue/canonical paired outcomes must share one commit boundary.
4. Automatic reclaim never rewrites canonical truth.
5. Reruns and restart logic derive behavior from committed DB truth, never from memory.
6. Blank overlay during transition is acceptable; stale overlay is not.

