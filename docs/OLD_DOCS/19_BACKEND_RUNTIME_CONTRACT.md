# Backend Runtime Contract

## Purpose

This document is the canonical backend contract for the seven runtime stages of the Photo Frame pipeline.

It defines:

- stage purpose
- owned truth surfaces
- allowed stage handoffs
- stage-local success and failure outcomes
- re-entry expectations

## Sources Absorbed

- `docs/contracts/RUNTIME_CONTRACTS.md`
- `docs/archive/analysis/PIPELINE_STAGE_MAP_3103.md`

## Shared Pipeline Rules

1. The runtime pipeline has seven stages:
   `stage1_auth_download`, `stage2_index_register`, `stage3_extract_gps`, `stage4_geocode`, `stage5_prepare_queue`, `stage6_run_playback`, `stage7_render_overlay`.
2. Canonical truth, workflow truth, and runtime truth are separate surfaces and must not be collapsed into one another.
3. A downstream handoff is valid only after the upstream committed truth for that handoff is durable.
4. Stage 2 is the point where filesystem discoveries become durable DB truth.
5. Stage 6 selection is non-destructive; a successfully shown item remains a `READY` slideshow candidate with updated history fields.
6. Stage 7 is read-only over persisted current-item truth and canonical address truth.

## Runtime Process Model

- `app.py` is an operator-facing control and monitoring surface.
- `scripts/playback_runtime.py` is the primary repeated playback entrypoint.
- Shared playback-cycle behavior belongs in `backend/playback_runtime_core.py`.
- Platform mode may affect rendering mode, but it must not change queue semantics, pointer semantics, or Stage 6 and Stage 7 failure rules.

## Stage Summary

| Stage | Purpose | Owns | Success handoff |
|---|---|---|---|
| Stage 1 | authenticate, resolve 2FA, download files | auth/download action state and Stage 1 runtime proof keys | filesystem download tree |
| Stage 2 | scan files, register variants, create canonical rows | variant rows, canonical rows, initial GPS queue rows | `parse_files_for_gps_queue.status = 'PENDING'` |
| Stage 3 | extract GPS and write canonical GPS truth | GPS queue lifecycle, canonical GPS truth, geocode enqueue on success | `geocode_queue.status = 'PENDING'` plus stored coordinates |
| Stage 4 | geocode coordinates into address truth | geocode queue lifecycle, canonical address truth, cache writes | canonical `GEOCODE_FOUND` plus non-empty `address_text` |
| Stage 5 | create slideshow eligibility rows | initial slideshow `READY` rows | `slideshow_queue.status = 'READY'` |
| Stage 6 | select next playable item and persist current item | playback history updates, invalid candidate failure, runtime current-item pointer | `runtime_state.current_media_asset_id` |
| Stage 7 | derive render-ready overlay data | no persistent truth writes; reads persisted current item and canonical address | terminal stage |

## Stage 1: `stage1_auth_download`

### Reads

- environment configuration
- installed `icloudpd`
- cookie/session directories
- download directory
- pending 2FA challenge state, if re-entering

### Writes And Ownership

- `action_runs` for Stage 1 lifecycle
- Stage 1 `system_logs`
- Stage 1 `runtime_state` keys for auth state, pending 2FA, last counts, and completion proof

### Success

- files are downloaded to the configured directory
- Stage 1 writes explicit durable success proof
- Stage 2 may consume the resulting filesystem state

### Failure And Re-entry

- `WAITING_FOR_2FA` is a non-terminal pause, not a queue state
- `FAILED` is terminal for the current Stage 1 run
- rerun after failure is operator-driven
- Stage 1 does not enqueue Stage 2 directly

## Stage 2: `stage2_index_register`

### Reads

- files from the download directory
- supported media extensions

### Writes And Ownership

- `media_asset_variants`
- `canonical_media_assets`
- `parse_files_for_gps_queue`
- Stage 2 action/log surfaces

### Success

- each newly discovered asset gets a canonical row
- each new canonical asset gets one Stage 3 queue row in `PENDING`
- reruns are idempotent for previously indexed assets

### Failure And Re-entry

- no automatic retry queue exists
- failure is action-level only
- Stage 2 may run from already-present files even if the last Stage 1 run was not historically successful
- Stage 2 must not overlap an active Stage 1 download mutation

## Stage 3: `stage3_extract_gps`

### Reads

- `parse_files_for_gps_queue`
- canonical file path
- parser path order

### Writes And Ownership

- Stage 3 queue claims and outcomes
- canonical GPS coordinates
- canonical `gps_status`
- `geocode_queue` insertion after GPS success

### Success

- canonical GPS truth is written
- Stage 3 queue row reaches `COMPLETED`
- one geocode queue row is inserted in `PENDING`

### Failure And Re-entry

- retryable failures use `RETRY` plus `next_attempt_at`
- terminal no-GPS uses queue `NO_GPS_FOUND` and canonical `GPS_NOT_FOUND`
- retry exhaustion uses queue `RETRY_EXHAUSTED` and canonical `GPS_FAILED`
- stale `PROCESSING` rows may be reclaimed into `RETRY`
- admin requeue may reopen terminal GPS outcomes

## Stage 4: `stage4_geocode`

### Reads

- `geocode_queue`
- canonical GPS coordinates
- `address_cache`

### Writes And Ownership

- Stage 4 queue claims and outcomes
- canonical `address_text`
- canonical `geocode_status`
- cache writes on provider success

### Success

- canonical address truth is written
- Stage 4 queue row reaches `COMPLETED`
- the asset becomes eligible for Stage 5 scanning

### Failure And Re-entry

- cache-first geocoding is mandatory
- retryable failures use `RETRY` plus `next_attempt_at`
- missing coordinates at geocode time is terminal failure in the current contract
- stale `PROCESSING` rows may be reclaimed into `RETRY`
- admin requeue may reopen terminal geocode outcomes

## Stage 5: `stage5_prepare_queue`

### Reads

- canonical geocode status
- canonical address text
- existing `slideshow_queue` rows

### Writes And Ownership

- initial `slideshow_queue.status = 'READY'` rows
- Stage 5 action/log surfaces

### Success

- every newly eligible addressed asset gets one persistent slideshow row
- insertion is idempotent by unique asset identity

### Failure And Re-entry

- no automatic retry state exists
- zero eligible assets is a successful no-op
- normal Stage 5 flow does not reset `FAILED` slideshow rows
- admin requeue may return eligible `FAILED` rows to `READY`

## Stage 6: `stage6_run_playback`

### Reads

- `slideshow_queue`
- canonical path and address for candidate assets
- runtime playback ownership keys

### Writes And Ownership

- invalid `READY` candidates may be marked `FAILED`
- selected row `view_count`
- selected row `last_shown_datetime`
- `runtime_state.current_media_asset_id`
- Stage 6 action/log surfaces

### Success

- one valid candidate is chosen
- playback history and current-item pointer are committed together
- selected row remains `READY`

### Failure And Re-entry

- no automatic retry queue exists
- failure is action-level: lease conflict, no ready row, or no playable ready row
- failed slideshow rows stay terminal until deliberate reset
- restart logic must resume from committed truth, not memory-only candidate state

## Stage 7: `stage7_render_overlay`

### Reads

- `runtime_state.current_media_asset_id`
- canonical path and canonical `address_text`

### Writes And Ownership

- action/log surfaces only
- no canonical, queue, or runtime truth mutation on the normal path

### Success

- render-ready overlay output is derived from the persisted current-item pointer and canonical address truth

### Failure And Re-entry

- no automatic retry queue exists
- blank overlay during transition is acceptable
- stale old overlay on a newly selected item is forbidden
- rerun occurs only after a valid current pointer or address/file state exists

## Non-Negotiable Rules

1. Stage ownership boundaries must stay explicit.
2. Stage 3 success is the only automatic source of new geocode work.
3. Stage 5 is the only normal source of new slideshow `READY` rows.
4. Stage 6 does not consume or delete successful `READY` rows.
5. Stage 7 never invents current-item truth from memory.

