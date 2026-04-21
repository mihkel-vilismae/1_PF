# State And Truth Contract

## Purpose

This document is the canonical contract for backend truth surfaces, schema ownership, status vocabulary, transition rules, and invalid state detection.

## Sources Absorbed

- `docs/contracts/STATE_AND_OWNERSHIP.md`
- `docs/contracts/STATE_TRANSITION_MATRIX.md`
- `docs/contracts/runtime/TRUTH_MODEL.md`
- `docs/archive/analysis/DATABASE_SCHEMA_EXTRACT_3103.md`

## Truth Surfaces

| Truth surface | Tables / keys | Owns |
|---|---|---|
| canonical truth | `canonical_media_assets`, `media_asset_variants`, `address_cache` | durable per-asset facts and reusable address facts |
| workflow truth | `parse_files_for_gps_queue`, `geocode_queue`, `slideshow_queue` | queue lifecycle, retry bookkeeping, playback eligibility, and playback history |
| runtime truth | `runtime_state.current_media_asset_id`, `runtime_state.playback_runner_owner`, `runtime_state.playback_runner_lease_until`, `runtime_state.playback_runner_last_heartbeat` | persisted current-item and playback ownership state |
| audit truth | `action_runs`, `system_logs` | operator-visible history and evidence |
| derived truth | overlay output, dashboards, summaries | presentation only; never authoritative |

## Truth Precedence

When surfaces disagree, precedence is:

1. committed canonical truth
2. committed runtime truth
3. committed workflow truth
4. derived truth
5. memory-only state

Special case:

- the only authoritative current-item pointer is `runtime_state.current_media_asset_id`

## Ownership Map

| Stage | Owned truth |
|---|---|
| Stage 1 | auth/download action state, pending 2FA state, Stage 1 runtime proof keys |
| Stage 2 | first canonical asset creation, variant linkage, first GPS queue insertion |
| Stage 3 | GPS queue lifecycle, canonical GPS truth, geocode enqueue on success |
| Stage 4 | geocode queue lifecycle, canonical address truth, cache writes |
| Stage 5 | slideshow eligibility membership |
| Stage 6 | playback history fields on slideshow rows and runtime current-item truth |
| Stage 7 | no durable truth writes; reads persisted current-item and canonical address truth |

Cross-stage mutation of another stage's truth is allowed only through documented reclaim or admin reset flows.

Current repo note:
- Init readiness endpoints (`POST /api/init/verify-env` and `/api/init/database/*`) do not write
  `action_runs`, `system_logs`, or `runtime_state`.
- They should be treated as administrative checks/operations, not as Stage 1 truth-surface writers.
- Wave A runtime endpoints in `server/index.js` now write workflow/runtime truth for Stage 5/6:
  - `POST /api/runtime/queue/prepare` writes idempotent `slideshow_queue` `READY` rows.
  - `POST /api/runtime/playback/select-current` updates playback history fields and
    `runtime_state.current_media_asset_id`.
- Playback worker lease keys and broader playback ownership semantics are still not implemented.

## Status Vocabulary

### Queue Surfaces

| Surface | Active values | Terminal values |
|---|---|---|
| `parse_files_for_gps_queue.status` | `PENDING`, `PROCESSING`, `RETRY`, `RETRY_EXHAUSTED`, `COMPLETED`, `NO_GPS_FOUND` | `COMPLETED`, `NO_GPS_FOUND`, `RETRY_EXHAUSTED` |
| `geocode_queue.status` | `PENDING`, `PROCESSING`, `RETRY`, `RETRY_EXHAUSTED`, `COMPLETED` | `COMPLETED`, `RETRY_EXHAUSTED` |
| `slideshow_queue.status` | `READY`, `FAILED` | `FAILED` |

### Canonical Surfaces

| Surface | Active values |
|---|---|
| `canonical_media_assets.gps_status` | `GPS_PENDING`, `GPS_FOUND`, `GPS_NOT_FOUND`, `GPS_FAILED` |
| `canonical_media_assets.geocode_status` | `GEOCODE_PENDING`, `GEOCODE_FOUND`, `GEOCODE_FAILED` |

### Action Surfaces

| Surface | Active values |
|---|---|
| `action_runs.status` | `PROCESSING`, `WAITING_FOR_2FA`, `COMPLETED`, `FAILED` |

## Transition Rules

### Stage 1

- `PROCESSING -> WAITING_FOR_2FA` is a valid non-terminal pause
- `WAITING_FOR_2FA -> COMPLETED` and `WAITING_FOR_2FA -> FAILED` are valid re-entry outcomes
- `WAITING_FOR_2FA` must never appear on a queue surface

### Stage 2

- no canonical row -> canonical row with pending GPS and geocode statuses
- no GPS queue row -> GPS queue `PENDING`
- rerun over an existing `asset_key` is idempotent

### Stage 3

| From | To | Meaning |
|---|---|---|
| `PENDING` or eligible `RETRY` | `PROCESSING` | transactional claim |
| `PROCESSING` | `COMPLETED` | canonical GPS success committed |
| `PROCESSING` | `NO_GPS_FOUND` | terminal no-GPS outcome |
| `PROCESSING` | `RETRY` | retryable failure with attempts remaining |
| `PROCESSING` | `RETRY_EXHAUSTED` | retry budget exhausted |
| stale `PROCESSING` | `RETRY` | reclaim |

Canonical partners:

- `GPS_PENDING -> GPS_FOUND` on success
- `GPS_PENDING -> GPS_NOT_FOUND` on no-GPS
- `GPS_PENDING -> GPS_FAILED` on retry exhaustion

### Stage 4

| From | To | Meaning |
|---|---|---|
| `PENDING` or eligible `RETRY` | `PROCESSING` | transactional claim |
| `PROCESSING` | `COMPLETED` | canonical geocode success committed |
| `PROCESSING` | `RETRY` | retryable failure with attempts remaining |
| `PROCESSING` | `RETRY_EXHAUSTED` | retry budget exhausted or invalid missing-coordinate input |
| stale `PROCESSING` | `RETRY` | reclaim |

Canonical partners:

- `GEOCODE_PENDING -> GEOCODE_FOUND` on success
- `GEOCODE_PENDING -> GEOCODE_FAILED` on terminal failure

### Stage 5

- no slideshow row -> `READY` when the asset is geocoded and addressed
- `READY -> READY` on rerun
- `FAILED -> READY` only through admin/manual reset

### Stage 6

- valid playback selection keeps the chosen row `READY`
- invalid candidates may transition `READY -> FAILED`
- current-item pointer updates only on committed selection

### Stage 7

- Stage 7 is read-only over persistent truth
- success and failure live only on action/log surfaces

## Current-Item And Overlay Truth Rules

For a current item to be valid, all of these must agree:

1. `runtime_state.current_media_asset_id`
2. a matching `slideshow_queue` row still in `READY`
3. a canonical asset row with an existing file and non-empty `address_text`

Overlay text is:

`canonical_media_assets.address_text` for `runtime_state.current_media_asset_id`

Allowed transition-time visible states:

- old item with old overlay
- new item with new overlay
- new item with blank overlay

Forbidden:

- new item with stale overlay text from another pointer

## Invalid States

The following states are contract violations:

- queue `COMPLETED` without matching canonical success
- canonical `GPS_FOUND` without stored coordinates
- canonical `GEOCODE_FOUND` with blank `address_text`
- a geocode row for an asset whose canonical GPS outcome is `GPS_NOT_FOUND`
- Stage 4 directly creating slideshow eligibility rows
- Stage 6 deleting or consuming a valid selected `READY` row
- overlay success while current item, file, or address truth is missing
- a current-item pointer that does not resolve to a valid playable asset

## Diagnosis Rules

- current pointer present but playback history inconsistent: treat as Stage 6 commit-consistency defect
- shown slideshow row but missing pointer: treat as runtime pointer loss or partial commit defect
- overlay text mismatched to canonical address for the current pointer: treat as stale-binding defect
- queue and canonical mismatch: trust evidence-bearing canonical truth for diagnosis, but record a contract violation

## Non-Negotiable Rules

1. Canonical truth owns durable asset facts.
2. Queue truth owns work state and playback eligibility/history.
3. Runtime truth owns the persisted current-item pointer.
4. Derived truth never overrides committed DB truth.
5. A wrong old overlay is worse than a blank overlay during transition.

