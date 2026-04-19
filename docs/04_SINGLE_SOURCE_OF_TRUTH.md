# Single Source of Truth

## Purpose

This document defines the authoritative state holder for both **what is running now** and **what last happened**.

## Canonical Decision

The single source of truth is a **durable database-backed state model**, not a frontend memory object and not a loose JSON file.

A JSON export may exist later as a derived debug artifact, but it must never become the authority.

## Canonical Records

### `runtime_state` (exactly one authoritative row per installation)

Holds the latest real runtime truth, including:
- `installation_id`
- `current_run_id`
- `system_mode` (`idle`, `running_real`, `recovering`, `failed`, `maintenance`)
- `pipeline_stage`
- `pipeline_stage_state`
- `playback_state`
- `playback_item_id`
- `playback_offset_ms`
- `screen_state`
- `screen_last_activity_source`
- `screen_inactivity_timeout_ms`
- `last_checkpoint_id`
- `last_event_id`
- `last_updated_at`
- `version_counter`

### `run_session`

Tracks each real run lifecycle:
- `run_id`
- `started_at`
- `ended_at`
- `status`
- `start_reason`
- `end_reason`
- `recovered_from_checkpoint_id`
- `last_known_media_id`
- `last_known_stage`

### `checkpoint`

Stores resumable snapshots referenced by `runtime_state.last_checkpoint_id`.

## Ownership

### Write authority

- `PipelineService` writes pipeline fields
- `PlaybackService` writes playback fields
- `ScreenService` writes screen fields
- `RecoveryService` may write cross-component fields during controlled recovery only

### Read authority

- Backend API may expose read models
- Frontend may read via API
- Frontend may never write canonical state directly

## Update Rule

A runtime mutation is valid only if all of the following happen atomically in one database transaction where supported:
1. the relevant authoritative fields are updated
2. an event entry is appended
3. the optimistic `version_counter` is incremented

If the storage engine cannot guarantee this in one transaction, the system must use an outbox or equivalent durable transaction pattern.

## Conflict Resolution

- Ownership is role-based, not request-based.
- If two services attempt to update overlapping fields, the service without ownership must fail fast.
- RecoveryService may temporarily own broader fields only while `system_mode = recovering` and a recovery lease is held.

## Why not JSON as the authority

A file alone does not give reliable concurrency, atomic updates, or safe multi-process lease control. It may be used as a human-readable export only.

## Evidence Basis

Derived from the user's requirement for a single source of truth that knows the last run and what is running now, plus the need for crash-safe persistence and coordination among multiple workers.
