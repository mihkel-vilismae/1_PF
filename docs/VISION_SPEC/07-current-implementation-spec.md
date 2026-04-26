# Current Implementation Specification

Status: Slice 2 current implementation spec.
Created: 2026-04-26 19:59 EEST.
Scope: current repository reality only, not the full target architecture.

## Status vocabulary

| Status | Meaning |
|---|---|
| IMPLEMENTED | Runnable code exists in the current repo and is wired to a visible or callable surface. |
| PARTIAL | Some runnable code exists, but scope, provider realism, persistence, platform behavior, or UI integration is incomplete. |
| DOCUMENTED_INTENT | Documentation describes the behavior, but current implementation is incomplete or not verified. |
| PLANNED | The concept is visible as a placeholder, preview, or roadmap item. |
| DEPRECATED | Should not be treated as current behavior. |
| UNKNOWN | Evidence was insufficient in Slice 2. |
| NEEDS_VERIFICATION | Code or docs suggest behavior, but it needs targeted verification. |
| NEEDS_USER_DECISION | The correct spec depends on user preference. |

## Repository implementation overview

| Area | Current status | Evidence summary |
|---|---|---|
| Frontend dashboard shell | IMPLEMENTED | `dashboard/` contains views, services, inspect metadata, shared renderers, and runtime-truth state helpers. |
| Backend HTTP server | IMPLEMENTED | `server/index.js` defines a route table for init, auth, database viewer, runtime stages, orchestration, and runtime truth. |
| SQLite schema baseline | IMPLEMENTED | `schema.sql` exists and is used as the canonical schema baseline. |
| Database helper/service layer | IMPLEMENTED / PARTIAL | `server/database/` and `server/scripts/sqlite_admin.py` support DB inspection and stage operations; full autonomous lifecycle is not complete. |
| Runtime truth JSON | IMPLEMENTED / PARTIAL | `/api/runtime-truth` reads/writes `conf/runtime-truth.json`, but this is not the final worker/runtime source-of-truth model. |
| Project logging | IMPLEMENTED / PARTIAL | `server/logging/projectLogger.js` and `logs/` exist; logs are evidence/history, not active worker lock truth. |
| Auth API | PARTIAL | `/api/auth/*` routes exist and avoid fake success; real provider validation and interactive 2FA remain constrained. |
| Scheduler API | PARTIAL | `/api/init/cron/*` routes exist through a platform-aware capability model. Full cross-platform scheduler/runtime behavior remains target spec work. |
| View C recovery | PLANNED | The view explicitly says it is mock/frontend-only. |
| View D live runtime monitor | PLANNED | The view explicitly says it is frontend-only simulated runtime preview. |

## Backend route groups

| Route group | Status | Notes |
|---|---|---|
| `/api/init/*` | IMPLEMENTED / PARTIAL | Environment, database, and scheduler endpoints exist. Scheduler support depends on platform capability. |
| `/api/auth/*` | PARTIAL | Status, verification, run, 2FA submit, test download, reset, logout, and resume routes are present. Do not treat them as fully production-proven. |
| `/api/database-viewer/*` | IMPLEMENTED / PARTIAL | Verify/connect/table/row/logging endpoints exist for dashboard DB inspection. |
| `/api/runtime/download/run` | PARTIAL | Copies from generated or configured mock source into a download directory. It is a real backend route but not real iCloud download. |
| `/api/runtime/index/run` | IMPLEMENTED / PARTIAL | Calls Stage 2 indexing/register logic. |
| `/api/runtime/gps/run` | IMPLEMENTED / PARTIAL | Processes GPS queue through backend/database service. Real extractor limitations need continuing verification. |
| `/api/runtime/geocode/run` | PARTIAL | Uses deterministic placeholder geocoder, not production provider geocoding. |
| `/api/runtime/queue/prepare` | IMPLEMENTED / PARTIAL | Prepares slideshow queue and reports inserted/skipped items. |
| `/api/runtime/playback/select-current` | IMPLEMENTED / PARTIAL | Selects current playback item from ready queue candidates and handles no-ready cases. |
| `/api/runtime/orchestration/*` | PARTIAL / NEEDS_VERIFICATION | Sequential orchestration endpoints exist and persist current/last state in `runtime_state`, but dashboard integration and full worker semantics need follow-up. |
| `/api/runtime-truth` | IMPLEMENTED / PARTIAL | Reads/writes safe runtime-truth payloads, including safe auth projection. |

## Pipeline implementation reality

| Stage | Current status | Current behavior |
|---|---|---|
| Stage 1 download | PARTIAL | Backend route performs mock/generated-data copy into the configured download directory. Real iCloud download is not the normal route behavior described by this slice. |
| Stage 2 index | IMPLEMENTED / PARTIAL | Backend route scans/registers supported media files through the database service. |
| Stage 3 parse GPS | IMPLEMENTED / PARTIAL | Backend route processes queued GPS work. Real-world EXIF coverage and failure handling need more targeted verification. |
| Stage 4 geocode | PARTIAL | Backend route processes geocode queue but uses a deterministic placeholder geocoder, not a production provider. |
| Stage 5 prepare queue | IMPLEMENTED / PARTIAL | Backend route prepares `slideshow_queue` with inserted/skipped reporting. |
| Stage 6 playback select-current | IMPLEMENTED / PARTIAL | Backend route selects a ready playback item and persists current selection state. Full playback worker loop is not implemented as a live worker. |
| Run-all orchestration | PARTIAL / NEEDS_VERIFICATION | Backend orchestration route executes stages in sequence and persists current/last orchestration state, but current dashboard semantics and worker replacement role require Slice 3 clarification. |

## Authentication implementation reality

| Area | Status | Notes |
|---|---|---|
| Auth card location | IMPLEMENTED | Auth preflight controls are in View A as `1A-AUTH`; View B login preflight was removed. |
| Backend-owned status | IMPLEMENTED / PARTIAL | `/api/auth/status` exposes safe public state. |
| Provider readiness | IMPLEMENTED / PARTIAL | `POST /api/auth/verify-icloudpd` checks executable/config readiness without claiming logged-in state. |
| Login run boundary | PARTIAL | `POST /api/auth/run` reaches the provider boundary and should not fake success. Real provider behavior must be manually validated. |
| 2FA | PARTIAL / NEEDS_USER_DECISION | 2FA submit endpoint exists, but exact interactive flow and supported provider states need further specification. |
| Secret safety | IMPLEMENTED / NEEDS_VERIFICATION | Auth docs and route design aim to avoid returning raw secrets; continue verifying as auth evolves. |

## Current database and state reality

| State store | Status | Current role |
|---|---|---|
| `schema.sql` | IMPLEMENTED | Canonical schema baseline. |
| SQLite DB path from `.env` | IMPLEMENTED / PARTIAL | Backend services rely on configured DB path. |
| `runtime_state` table | IMPLEMENTED / PARTIAL | Used by orchestration and playback state, but not yet the only runtime source. |
| `conf/runtime-truth.json` | IMPLEMENTED / PARTIAL | Current frontend/backend runtime-truth bridge, not final worker truth model. |
| `logs/` | IMPLEMENTED / PARTIAL | Debug/evidence logs exist; Slice 3 must specify how logs relate to locks and DB state. |
| lock files | DOCUMENTED_INTENT | Lock-file truth for active worker instances is an intended runtime model, not fully specified here. |

## Tests and verification reality

| Verification area | Status | Notes |
|---|---|---|
| Node test suite | IMPLEMENTED | `tests/` contains auth, init, inspect, runtime, and wave tests. |
| Auth tests | EXCLUDED IN THIS RUN | User explicitly instructed not to run auth tests. |
| Version/changelog guard | IMPLEMENTED | `node scripts/version_guard.mjs repo` validates version/changelog/package consistency. |
| Task-docs TOC check | IMPLEMENTED | `npm run task-docs:check` validates generated task docs TOC consistency. |

## Current major gaps

1. View C is not a real recovery view yet.
2. View D is not a real live worker monitor yet.
3. Stage 1 download is not real provider download in the runtime route covered by Slice 2.
4. Geocoding is placeholder-backed.
5. Auth is safely bounded but still needs real provider/2FA flow decisions.
6. Worker, lock, cron, scheduler, and recovery behavior need Slice 3 target specification.
7. Documentation authority is improving, but old docs have not yet been moved or finally classified.
