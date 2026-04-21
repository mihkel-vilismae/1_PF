# Canonical Schema Proposal

> Status: Proposed canonical schema (not yet enforced in runtime)

## Purpose

This document introduces a single canonical database-schema proposal for the Photo Frame system so later implementation work can target one coherent model instead of mixing multiple older draft schemas.

It solves three practical problems:

1. the current repository contains several documentation layers that discuss durable truth from different angles;
2. the runtime SQLite file in this snapshot is not authoritative because it is empty and the runtime schema is not yet implemented;
3. future migration and implementation work needs one stable baseline for table names, ownership boundaries, queue flow, runtime truth, and audit/logging surfaces.

This document is intentionally documentation-only. It does **not** claim the schema is already implemented, migrated, or enforced in the current runtime.

## Source Basis

### Primary sources

The following documents were treated as the strongest authority because they describe the newer truth-surface split and stage ownership model more clearly than the older schema draft:

- `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
- `docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md`
- `docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md`
- `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`

### Secondary sources

The following documents were used as supporting references or older schema context, but not as the top-level schema authority:

- `docs/OLD_DOCS/06_DATABASE_SCHEMA.md`
- `docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md`
- `docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md`

### Snapshot reality note

The current SQLite file in the repository snapshot is not treated as schema authority for this proposal because the runtime schema is not yet implemented and the inspected DB file is empty in this snapshot.

## Table Overview

### Canonical truth

- `canonical_media_assets`
- `media_asset_variants`
- `address_cache`

### Workflow / queue truth

- `parse_files_for_gps_queue`
- `geocode_queue`
- `slideshow_queue`

### Runtime state truth

- `runtime_state`

### Audit / logging truth

- `action_runs`
- `system_logs`

## Table Definitions (High-Level)

### `canonical_media_assets`

The durable identity table for logical media assets.

Responsibilities:
- stores the canonical per-asset row created after indexing;
- owns high-value truth such as canonical file identity, media type, GPS status, geocode status, and the current resolved `address_text`;
- provides the stable asset identity referenced by later queues and runtime pointers.

### `media_asset_variants`

The per-asset physical-file or derived-file table.

Responsibilities:
- stores originals and later derived representations without changing canonical asset identity;
- allows Stage 2 to register multiple files tied to the same logical asset;
- supports future resizing, transcoding, thumbnails, or alternate playback assets.

### `address_cache`

The canonical coordinate-to-address cache.

Responsibilities:
- prevents repeated geocoding for the same normalized coordinate pair;
- stores resolved address text and provider metadata;
- gives Stage 4 a durable cache-first lookup surface.

### `parse_files_for_gps_queue`

The Stage 3 work queue.

Responsibilities:
- tracks GPS extraction lifecycle per asset;
- records processing state, retries, terminal no-GPS outcomes, and failure details;
- records the successful parser method when GPS extraction succeeds.

### `geocode_queue`

The Stage 4 work queue.

Responsibilities:
- tracks address-resolution lifecycle per asset after GPS success;
- records retries, completion, and failure metadata;
- supports cache-first geocoding and idempotent re-entry.

### `slideshow_queue`

The durable slideshow eligibility and playback history table.

Responsibilities:
- stores items eligible for display;
- tracks `view_count` and `last_shown_datetime` without consuming the row;
- keeps Stage 5 insertion and Stage 6 playback history responsibilities separate from canonical asset truth.

### `runtime_state`

The authoritative runtime truth surface.

Responsibilities:
- stores current runtime truth in a key/value form;
- holds cross-worker state such as current media pointer, playback ownership keys, screen state, and pipeline stage state;
- acts as the authoritative read model for runtime status instead of a memory-only object.

### `action_runs`

The operator-visible action lifecycle table.

Responsibilities:
- records the lifecycle of stage actions and manual actions;
- supports statuses such as processing, waiting for 2FA, completed, and failed;
- provides durable high-level action history for the dashboard.

### `system_logs`

The append-only operational log table.

Responsibilities:
- records timestamped operational events;
- supports structured payloads for debugging and evidence;
- gives the system a durable log surface distinct from canonical truth and queue truth.

## Relationship Model

The core relationship chain is:

- `canonical_media_assets` 1 → many `media_asset_variants`
- `canonical_media_assets` 1 → 1 `parse_files_for_gps_queue`
- `canonical_media_assets` 1 → 1 `geocode_queue`
- `canonical_media_assets` 1 → 1 `slideshow_queue`

The runtime pointer relationship is:

- `runtime_state.current_media_asset_id` → `canonical_media_assets.media_asset_id`

The address reuse relationship is:

- `canonical_media_assets.address_cache_key` → `address_cache.address_cache_key`

This keeps:
- canonical identity,
- workflow progression,
- runtime truth,
- and audit/log surfaces

separate instead of collapsing them into one table family.

## Runtime State Model

This proposal uses a **key/value `runtime_state` design** instead of the older “exactly one wide runtime row” draft.

Reasoning:
- it fits the newer contract language better;
- it aligns better with worker-owned truth keys;
- it scales more safely as new runtime keys are added;
- it avoids forcing unrelated worker-owned fields into one constantly rewritten wide row.

### Required runtime keys

At minimum, the canonical proposal expects these keys to exist:

- `current_media_asset_id`
- `playback_runner_owner`
- `playback_runner_lease_until`
- `playback_runner_last_heartbeat`
- `screen_power_state`
- `screen_state_updated_at`
- `screen_state_source`
- `screen_worker_heartbeat_at`
- `pipeline_stage`
- `pipeline_stage_state`

Additional keys may be added later, but these are the minimum baseline keys for runtime truth that recur across the current contract documents.

## Design Decisions

### Why this schema was chosen

This schema was chosen because it best matches the stronger current-truth contract set in the repository:

- `20_STATE_AND_TRUTH_CONTRACT.md` emphasizes separate truth surfaces rather than one monolithic schema model;
- `04_SINGLE_SOURCE_OF_TRUTH.md` requires durable DB-backed runtime truth, but does not require a wide single-row runtime design;
- `19_BACKEND_RUNTIME_CONTRACT.md` describes stage ownership in terms of canonical rows, queue rows, runtime state, and log surfaces;
- `15_CURRENT_IMPLEMENTATION_STATUS.md` explicitly says the durable schema is not implemented yet, so the proposal must remain honest and forward-looking.

### Why the proposal prefers this table family

This proposal intentionally centers the schema around:
- one canonical asset table,
- supporting variant rows,
- separate queue tables per workflow stage,
- key/value runtime truth,
- durable action and system-log surfaces.

That shape matches the repository’s current contract vocabulary more closely than the older schema draft centered around:
- `run_session`
- `worker_lease`
- `stage_run`
- `checkpoint`
- `event_log`
- `playback_queue`

## Non-Goals / Deferred Schema

The following tables are intentionally **not** part of the proposed baseline canonical schema for this phase:

- `run_session`
- `worker_lease`
- `stage_run`
- `checkpoint`
- `event_log`
- `playback_queue`

These are not rejected forever. They are deferred as future-phase candidates because:
- they appear mainly in older schema/design drafts;
- they do not align as cleanly with the newer truth-surface split;
- forcing them into the baseline now would create avoidable contract drift.

## Migration Path (Conceptual)

A safe future migration path would be:

1. create the canonical tables without disturbing current frontend-only/mock flows;
2. add backend-owned writes for Stage 2 through Stage 6 using these tables;
3. introduce `runtime_state` keys first as read/write durable runtime truth;
4. add queue processing and idempotent worker ownership rules on top of the tables;
5. only after that, wire dashboard surfaces to read from durable truth rather than mock state;
6. keep any additional older-draft tables deferred until a real need is proven.

A safe first migration order would be:

1. `canonical_media_assets`
2. `media_asset_variants`
3. `address_cache`
4. `parse_files_for_gps_queue`
5. `geocode_queue`
6. `slideshow_queue`
7. `runtime_state`
8. `action_runs`
9. `system_logs`

## Evidence Basis

The proposal in this document was derived from these exact repository files:

- `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
- `docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md`
- `docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md`
- `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
- `docs/OLD_DOCS/06_DATABASE_SCHEMA.md`
- `server/index.js`
- `server/scripts/sqlite_admin.py`

## Consistency Note

This document is a **proposed canonical schema** only.

It does **not** claim:
- that the schema is already migrated;
- that the runtime already persists these tables;
- that the current SQLite file is authoritative for this structure;
- or that older schema docs have been deleted or replaced.

It exists to give future schema.sql generation and migration work one stable, contract-aware starting point.
