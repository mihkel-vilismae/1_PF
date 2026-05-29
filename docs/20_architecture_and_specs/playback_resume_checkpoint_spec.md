# Playback Resume Checkpoint Spec

Created: 29.05.2026, 17:05:00 EEST

## Purpose

This document defines the power-outage recovery contract for the Windows and Raspberry OS playback views. The goal is to persist enough playback state for the dashboard to resume from the last known item after a restart while preserving the existing playback queue, Test Mode / Real Mode separation, and worker-stage behavior.

## Non-goals for the first implementation

- Do not replace the existing playback selection worker.
- Do not change Download, Index, GPS parser, Geocode, or Queue behavior.
- Do not make browser local storage the source of truth.
- Do not assume browsers can re-enter fullscreen automatically after restart.
- Do not make video timestamp resume a hard guarantee; it is best effort.

## Checkpoint ownership

The frontend reports what it is currently displaying. The backend validates and persists that report in SQLite. On startup, the frontend reads the latest backend checkpoint for the selected platform and decides whether to resume the same item or fall back safely.

## Required checkpoint fields

| Field | Required | Purpose |
|---|---:|---|
| `platform` | Yes | `windows` or `raspberry`. |
| `view_id` | Yes | `WIN` or `RPI`. |
| `media_asset_id` | Yes | Last displayed media asset id. |
| `display_url` | No | Last safe backend media URL. |
| `display_name` | No | Operator-facing item label. |
| `media_type` | No | `image`, `video`, or another known media type. |
| `resolved_address` | No | Last shown address/location label. |
| `active_index` | No | Browser-side queue index. |
| `rotation_paused` | Yes | Whether browser-side rotation was paused. |
| `fullscreen_requested` | Yes | Whether the operator had requested fullscreen. |
| `fullscreen_active` | No | Whether browser fullscreen was active when reported. |
| `rotation_duration_ms` | No | Configured rotation interval. |
| `remaining_rotation_ms` | No | Approximate remaining image display time. |
| `video_position_ms` | No | Best-effort video resume timestamp. |
| `last_heartbeat_at` | Yes | Last frontend report timestamp. |
| `restore_policy` | Yes | `resume_same_item`, `continue_next`, or `safe_default`. |
| `schema_version` | Yes | Checkpoint payload version. |

## Freshness and stale behavior

A checkpoint is fresh when `last_heartbeat_at` is recent enough for the selected restore policy. The initial stale threshold is ten minutes. A stale checkpoint is still useful as evidence, but the UI must not blindly restore timers or video positions from it.

## Restore policies

| Policy | Behavior |
|---|---|
| `resume_same_item` | Restore the same media item when it is still valid and present in the playback contract. |
| `continue_next` | Treat the checkpoint as evidence of the previous item and continue with the next available item. |
| `safe_default` | Do not force a checkpoint restore; use the current playback contract fallback. |

The default policy is `resume_same_item` with safe fallback.

## Image restore behavior

Images can resume to the same item with an approximate remaining timer. If the remaining timer is missing, negative, or stale, the frontend should show the same item and restart the normal rotation interval.

## Video restore behavior

Videos can resume to the same item and attempt to seek to `video_position_ms`. Browser support, codec behavior, and media loading can make exact timestamp restore unreliable. If seeking fails, the same video may start from the beginning and the UI should report that timestamp restore was best effort.

## Fullscreen limitation

Browsers normally require a user gesture before entering fullscreen. After a restart, the app may remember that fullscreen was requested, but it should show a user-triggered action such as `Restore fullscreen playback` rather than pretending fullscreen can always resume automatically.

## Safe fallback rules

Fallback to the normal playback contract when:

- The checkpoint is missing.
- The checkpoint is stale and the policy is not safe to apply.
- The checkpoint references a missing media asset.
- The current playback contract does not include the checkpoint item.
- The backend marks the checkpoint invalid.
- The media URL is missing or not playable.

## Test Mode / Real Mode boundary

Checkpointing is independent of the regular worker stages. It must work in both Test Mode and Real Mode without changing the five regular worker stages or the deterministic placeholder Geocode provider.

## Expected endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/runtime/playback/resume-checkpoint?platform=windows` | Read the latest checkpoint for a platform. |
| `POST /api/runtime/playback/resume-checkpoint` | Save or update a checkpoint. |
| `POST /api/runtime/playback/resume-checkpoint/clear` | Clear a checkpoint for a platform. |

## Regression boundaries

Existing playback queue/current APIs remain read-only for playback display. The checkpoint API persists UI resume evidence only; it must not select a new queue item or mutate Download, Index, GPS parser, Geocode, Queue, or playback worker behavior.

## Implementation status — 29.05.2026

| Area | Status |
|---|---|
| Backend save/read/clear checkpoint API | Implemented. |
| Durable checkpoint persistence | Implemented through SQLite `runtime_state` keys scoped by platform. |
| Backend checkpoint validation | Implemented against the current playback contract and freshness window. |
| Frontend heartbeat reporting | Implemented with throttled Windows/Raspberry checkpoint writes. |
| Startup same-item restore | Implemented when checkpoint is fresh, valid, and present in the current playback contract. |
| Fullscreen restore | Implemented as user-triggered `Restore fullscreen playback`; automatic fullscreen is intentionally not assumed. |
| Video timestamp restore | Captured as best-effort checkpoint data; exact seek reliability still needs manual runtime assessment. |
| Power-outage runbook | Implemented in `docs/10_runbooks/POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md`. |
