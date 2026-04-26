# Target Architecture Specification

Status: Slice 3 target architecture specification.
Created: 2026-04-26 20:08 EEST.
Scope: target architecture for the photo-frame dashboard/runtime system, separated from current implementation reality.

## Status vocabulary

| Status | Meaning |
|---|---|
| IMPLEMENTED | Current repository code supports this behavior. |
| PARTIAL | Current repository code supports part of this behavior, but the target is not complete. |
| DOCUMENTED_INTENT | Existing docs or workflow rules describe this as intended behavior. |
| PLANNED | This is target behavior that still requires implementation. |
| NEEDS_VERIFICATION | Evidence exists, but targeted verification is still needed. |
| NEEDS_USER_DECISION | The final behavior depends on user preference. |

## Architecture purpose

The target system is a photo-frame runtime and dashboard-control application. It should ingest media, index assets, parse GPS metadata, resolve addresses, queue slideshow candidates, select playback items, expose runtime health, and recover safely after restart or power loss.

The dashboard is not the source of truth. It is an operator surface over backend-owned state, worker state, database state, lock files, and logs.

## Target layer model

| Layer | Target responsibility | Current status |
|---|---|---|
| Dashboard UI | Display controls, status, explanations, inspect overlays, and operator actions. | PARTIAL |
| Frontend service boundary | Call explicit backend endpoints and render returned state without inventing truth. | PARTIAL |
| Backend API | Validate requests, expose safe state projections, run stage actions, and mediate provider boundaries. | PARTIAL |
| Stage services | Implement one deterministic media pipeline operation at a time. | PARTIAL |
| Worker processes | Run autonomous loops with single-instance locks and resumable behavior. | PLANNED / DOCUMENTED_INTENT |
| Scheduler / cron | Start or trigger workers according to platform-specific rules. | PARTIAL |
| Database | Store durable pipeline state, asset metadata, queues, and selected playback state. | PARTIAL |
| Lock files | Represent active worker instance truth. | DOCUMENTED_INTENT |
| Logs | Preserve evidence, history, diagnostics, and recovery context. | PARTIAL |
| Provider adapters | Encapsulate external tools such as `icloudpd` and avoid leaking provider details into UI logic. | PARTIAL |

## Boundary rules

1. The dashboard must not infer that a runtime operation succeeded just because a button was clicked.
2. The dashboard must not claim a worker is running unless backend/lock evidence supports that claim.
3. Backend routes must return safe public projections, not secrets or raw provider session data.
4. Stage services should be idempotent where possible so cron, retries, and manual dashboard actions do not corrupt state.
5. Worker processes should use one active lock per worker type to prevent duplicate runtime instances.
6. Logs should explain what happened, but lock files should answer whether a worker is currently active.
7. Database state should remain durable and queryable after reboot.
8. Old documentation should not be treated as current architecture truth unless reconciled into the `docs/vision_and_implementation/` set.

## Target runtime components

| Component | Target role | Notes |
|---|---|---|
| Regular stage worker | Progresses the media pipeline in order. | Should run one pipeline stage at a time and avoid overlapping instances. |
| Playback worker | Keeps a current media item selected and displayed. | Should keep running or be frequently restarted by scheduler/watchdog. |
| Screen on/off worker | Responds to PIR/keyboard/mouse/screen state. | Should be independent from media pipeline progress. |
| Dashboard API server | Exposes status, controls, diagnostics, and safe public projections. | May start actions directly during development/test, but should not replace worker truth long-term. |
| SQLite database | Durable asset, queue, state, and historical runtime state store. | Should remain the stable data backbone. |
| Runtime truth bridge | Current `conf/runtime-truth.json` style bridge for dashboard state. | NEEDS_USER_DECISION whether it remains long-term or becomes a development-only bridge. |

## Target deployment profile

| Platform | Target use |
|---|---|
| Windows 11 | Primary development and dashboard testing environment. May use a cron emulator for local runtime experiments. |
| Fedora | Near-term scheduler/cron development and validation target. |
| Raspberry Pi OS | Long-term autonomous photo-frame deployment target. |

## Target architectural direction

The safest long-term direction is:

1. Keep stage logic backend-owned and testable.
2. Promote durable state into SQLite where it describes assets, queues, stage outcomes, and playback selection.
3. Use lock files for active worker instance truth.
4. Use logs for diagnostic history and post-failure explanation.
5. Keep dashboard views as observers/controllers that call backend contracts and display backend truth.
6. Keep provider-specific operations, especially authentication and downloads, behind explicit provider adapters.

## Non-goals for this spec

This document does not claim that all target architecture exists today. Current reality remains documented in `CURRENT_IMPLEMENTATION_SPEC.md`. Implementation work must proceed in commit-sized, regression-safe slices after the remaining user decisions are answered.
