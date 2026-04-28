# Database Schema

> Note: See `docs/CANONICAL_SCHEMA_PROPOSAL.md` for the newer proposed canonical baseline that reconciles this older schema draft with the stronger truth-surface contracts. This document remains valuable as historical schema context and is not replaced here.

## Purpose

This document proposes the durable schema needed to implement the documented behavior.

## Storage Principles

- Prefer transactional relational storage for canonical state and leases.
- Use JSON columns only for flexible event payloads, not for core identity or lock guarantees.
- All timestamps should be stored in UTC.

## Core Tables

### 1. `runtime_state`

Exactly one row per installation.

Key columns:
- `installation_id` PK
- `current_run_id` nullable FK -> `run_session.run_id`
- `system_mode`
- `pipeline_stage`
- `pipeline_stage_state`
- `playback_state`
- `playback_item_id` nullable FK -> `playback_queue.queue_item_id`
- `playback_offset_ms`
- `screen_state`
- `screen_last_activity_source`
- `screen_inactivity_timeout_ms`
- `last_checkpoint_id` nullable FK -> `checkpoint.checkpoint_id`
- `last_event_id` nullable FK -> `event_log.event_id`
- `version_counter`
- `updated_at`

### 2. `run_session`

One row per real runtime session.

Key columns:
- `run_id` PK
- `status` (`starting`, `running`, `stopping`, `completed`, `failed`, `recovered`)
- `started_at`
- `ended_at` nullable
- `start_reason`
- `end_reason` nullable
- `recovered_from_checkpoint_id` nullable
- `last_known_stage`
- `last_known_media_id` nullable

### 3. `worker_lease`

Exclusive ownership by worker role.

Key columns:
- `worker_name` PK (`pipeline`, `playback`, `screen`, `recovery`)
- `owner_id`
- `fencing_token`
- `lease_acquired_at`
- `lease_expires_at`
- `last_heartbeat_at`
- `status` (`held`, `expired`, `released`)

### 4. `stage_run`

History and diagnostics for each stage attempt.

Key columns:
- `stage_run_id` PK
- `run_id` FK
- `stage_name`
- `attempt_no`
- `status` (`running`, `completed`, `failed`, `abandoned`)
- `started_at`
- `ended_at` nullable
- `input_summary` JSON
- `output_summary` JSON
- `error_code` nullable
- `error_message` nullable

### 5. `playback_queue`

Queue of playback items.

Key columns:
- `queue_item_id` PK
- `run_id` FK
- `media_id`
- `media_type` (`image`, `video`)
- `status` (`queued`, `displaying`, `completed`, `failed`, `discarded`)
- `position_index`
- `display_duration_ms` nullable
- `video_duration_ms` nullable
- `last_checkpoint_offset_ms`
- `created_at`
- `updated_at`

### 6. `checkpoint`

Durable resume snapshots.

Key columns:
- `checkpoint_id` PK
- `run_id` FK
- `checkpoint_kind` (`screen_off`, `periodic_playback`, `stage_boundary`, `shutdown`, `manual`)
- `pipeline_stage`
- `playback_item_id` nullable
- `playback_offset_ms`
- `screen_state`
- `payload_json`
- `created_at`

### 7. `event_log`

Append-only operational history.

Key columns:
- `event_id` PK
- `run_id` nullable FK
- `occurred_at`
- `component` (`pipeline`, `playback`, `screen`, `system`, `api`, `cron`)
- `event_type`
- `severity`
- `worker_name` nullable
- `correlation_id` nullable
- `causation_id` nullable
- `payload_json`

## Index Guidance

- unique index on `worker_lease.worker_name`
- index on `event_log(run_id, occurred_at)`
- index on `stage_run(run_id, stage_name, started_at)`
- index on `playback_queue(run_id, position_index)`

## Evidence Basis

Derived from the user's requirements for last-run state, currently running state, queueing for playback, explicit history, and prevention of concurrent duplicate workers.
