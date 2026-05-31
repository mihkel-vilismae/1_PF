# Placeholder Implementation Audit

## Authority Note

For top-level behavioral intent and requirement authority, use:

- `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md`

This file is an implementation audit/tracking document and does not override that high-level authoritative behavior spec. Always reconcile this audit against current code/tests before treating any row as active work.

## Latest Update (Slice 5 backlog and placeholder reconciliation)

- Reconciled this audit against the current GPS/geocode provider state and View C runtime-orchestration read path.
- GPS parsing now has an EXIF-first provider chain plus JSON sidecar, XMP sidecar, text sidecar, filename-token, and path-token fallback providers. The remaining GPS gap is runtime/fixture proof across real media libraries, not provider-boundary absence.
- Reverse geocoding now has a cache-first provider registry with disabled-by-default network providers and deterministic placeholder fallback. The remaining geocode gap is safe activation/runtime proof for a real provider, not adapter absence.
- View C now has a read-only backend load path through `/api/runtime/orchestration/last`; the missing behavior is controlled restore/resume semantics.
- `conf/runtime-truth.json` remains an uncommitted local runtime file in this ZIP lineage and is not committed product truth.

## Latest Update (View A 3A scheduler target split)

- Added explicit 3A scheduler target selection between `WINDOWS (crontab emulator)` and `RASPBERRY (real crontab)`.
- Windows target now uses `tools/CronEmulator` as an external cron runner without modifying the nested CronEmulator project.
- Raspberry target now models real user crontab behavior and manages only a marked project-owned block on Linux/Raspberry hosts.
- Legacy `/api/init/cron/*` route compatibility remains in place, with backend gating so inactive target operations return deferred payloads instead of executing.
- Added focused frontend/backend tests for tab disabling, selected-target persistence, route compatibility, and inactive-target gating.

## Previous Update (Step 2 Wave A queue-backed current-item selection)

- Added minimal Wave A backend endpoints in `server/index.ts`:
  - `POST /api/runtime/queue/prepare` for Stage 5 idempotent `slideshow_queue` enqueue.
  - `POST /api/runtime/playback/select-current` for Stage 6 current-item selection and pointer/history commit.
- Extended `server/scripts/sqlite_admin.py` with Stage 5/6 operations used by these endpoints.
- Added isolated Wave A API tests in `tests/waveA.step2.test.js` covering queue idempotency, invalid READY candidate
  failure behavior, and durable `runtime_state.current_media_asset_id` updates.
- Refactored `dashboard/services/runtimeTruth.ts` into `dashboard/services/runtimeTruth/*` modules to keep touched files
  below the local 500-line cap while preserving existing behavior and inspect-mode copy.
- Added inspect metadata stability tests that explicitly pin the topbar guide controls:
  `Explain controls`, `Explain values`, `Show real vs mock`, and `Show backend status`.
- Scope remains intentionally partial: there is still no full background playback worker loop, no Stage 7 render pipeline, and no
  proven always-on Stage 1-4 worker service orchestration. Individual Stage 1-4 routes and provider-backed components exist and should be checked in current code before reopening old missing-work claims.

## Previous Update (Step 1 verification hardening for View A init endpoints)

- Added isolated backend API tests for `POST /api/init/verify-env` and `/api/init/database/*` in `tests/initApi.step1.test.js`.
- Added optional `INIT_ENV_FILE` support in `server/index.ts` so tests can target a temporary env file without mutating the repo `.env`.
- Kept existing init endpoint route contracts and destructive confirmation payload requirements unchanged.

## Previous Update (View E Database Viewer + Platform Capability Layer for View A 3A)

- Added repo-local `/api/database-viewer/*` endpoints for database verification, logical connect gating, table listing, paginated row inspection, and start/stop logging sessions.
- View E logging wording is intentionally narrow: it captures database-viewer requests and repo-local backend DB actions observed through this server while active, not global SQL tracing.
- Added an explicit required-table source reference from `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md` for the current View E verification flow.
- Added a shared scheduler platform/capability model used by both `server/index.ts` and `dashboard` View A state/rendering.
- Split dashboard inspect tooltip authorship and classifier logic into `dashboard/inspect/*` modules plus JSON-backed copy so `dashboard/app.ts` stays below the local 500-line cap without changing Explain values, Show real vs mock, or Show backend status behavior.
- Legacy `/api/init/cron/*` route compatibility remains unchanged.
- Windows 11 profile stays `supported` through the selected `windows-cron-emulator` target.
- Raspberry Pi OS profile is represented by the selected `raspberry-real-crontab` target; real crontab execution is only performed on Linux/Raspberry hosts.
- The selected scheduler runner still does **not** imply real pipeline/playback/screen/recovery service implementation.
- Documentation references in this checkout should be read from `docs/OLD_DOCS/*` for current-truth alignment.

## Summary Table

| Area | Main Files | Purpose | Status | Placeholder Evidence | Real Code Needed | Priority | Blockers |
|------|------------|---------|--------|----------------------|------------------|----------|----------|
| A Init | `dashboard/views/initView.ts`, `dashboard/app.ts`, `dashboard/services/runtimeTruth.ts`, `dashboard/services/runtimeTruth/*`, `dashboard/services/initService.ts`, `dashboard/services/apiClient.ts`, `server/index.ts`, `server/scheduler_host.ts`, `server/scripts/sqlite_admin.py`, `server/scripts/windows_task_scheduler.ps1`, `docs/OLD_DOCS/VIEW_A_INIT.md`, `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` | Prepare configuration, database, and scheduler readiness before tests or real runs. | Partial | A now has real env verification, real SQLite status/inspect/delete/recreate-empty endpoints, destructive-action confirmation, and a selected scheduler target model behind legacy cron routes. Windows uses the vendored `tools/CronEmulator` as the external runner context; Raspberry uses a real crontab block on Linux/Raspberry hosts. The remaining gap is not the playback-worker command row itself, but live local runtime proof for the expected scheduler/emulator launch context and the still-planned render/screen-hardware stages. | Wire real runtime services into the scheduler jobs, decide whether A should preload status on entry, and refine the env/config schema assumptions if product requirements differ from the checked-in `.env`. | High | Scheduler runner selection is implemented. The playback-worker command reaches current-playable-item selection from the expected context, but other target worker commands still need real pipeline/render/screen/recovery services, and the env verification rules are currently derived from the checked-in `.env` rather than a separately approved config spec. |
| B Test | `dashboard/views/testView.ts`, `dashboard/app.ts`, `dashboard/services/runtimeTruth.ts`, `dashboard/services/runtimeTruth/*`, `dashboard/services/runtimeExecutionService.ts`, `server/index.ts`, `server/runtimePipelineLocks.ts` | Exercise test-only flows for login, staged pipeline runs, playback emulation, screen simulation, and persisted pipeline-lock maintenance without touching real runtime state. | Partial | Current code has real backend calls for B2, individual B3.1-B3.5 stages, B4, B3 auto-run via `/api/runtime/orchestration/run`, B3 pipeline stale-lock detection/cleanup via `/api/runtime/pipeline/*`, and B5 backend-owned `/api/runtime/screen-simulation/*` state/configuration endpoints. B3.5 owns queue preparation/building; `playback_worker` is the final worker-stage action that selects the current playable item from prepared playback state. The remaining limits are important: pipeline issue detection currently covers stale persisted locks only, Stage 1 download still uses mock/generated-data semantics, B3.4 geocode defaults safely through cache-first/provider-registry behavior with deterministic placeholder fallback, B4 preview/fullscreen are not real media rendering, Raspberry OS rendering is disabled/planned, and B5 is simulation-only, not real screen hardware. | Replace mock/generated Stage 1 download only after real iCloudPD runtime proof; activate real geocoding only through the disabled-by-default provider registry and cache-first verification; expand pipeline issue detection only after a backend-owned worker/runtime health contract exists; add real hardware/screen support only through a separate approved contract. | Medium | The area mixes backend-wired partial runtime stages with simulation-only surfaces, and several contracts depend on backend services or provider choices that are not settled yet. |
| C Last Run info | `dashboard/views/lastRunView.ts`, `dashboard/app.ts`, `dashboard/services/runtimeTruth.ts`, `dashboard/services/runtimeTruth/*`, `dashboard/services/runtimeExecutionService.ts` | Show the last durable runtime snapshot and offer a controlled restore entry point. | Partial | View C now reads `/api/runtime/orchestration/last` for read-only last-run data and distinguishes backend-loaded, no-run, and failed-load states. `resume-last-run` remains a labeled placeholder action and does not call a restore endpoint. | Define and implement a real administrative restore contract before making the resume button operational. | High | Durable restore/checkpoint behavior is only partially represented by runtime/orchestration state today, and the dashboard restore path is not implemented. |
| D Running process | `dashboard/views/runningProcessView.ts`, `dashboard/app.ts`, `dashboard/services/runtimeTruth.ts`, `dashboard/services/runtimeTruth/*`, `docs/OLD_DOCS/VIEW_D_RUNNING_PROCESS.md`, `docs/OLD_DOCS/07_PIPELINE_STAGES.md`, `docs/OLD_DOCS/09_CRON_AND_WATCHDOG.md`, `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` | Preview the intended runtime pipeline and watchdog monitor without mixing it with simulation controls. | Partial | `startRealRun()` still fabricates worker state in memory, there is no polling, and D2/D3 summaries are generated locally rather than read from worker heartbeats. The trigger is now a local `Start simulated runtime preview` button instead of a global topbar action. | Replace local fake runtime state with `/api/runtime/*` projections, add polling/refresh behavior, and expose real worker health plus runtime control paths. | High | There is no runtime monitor backend wired to this view, and the UI only exposes a frontend-only preview start path even though the contract includes `start` and `stop` endpoints. |
| E Database Viewer | `dashboard/app.ts`, `dashboard/services/databaseViewerService.ts`, `dashboard/services/runtimeTruth.ts`, `dashboard/services/runtimeTruth/*`, `dashboard/views/databaseViewerView.ts`, `server/index.ts`, `server/scripts/sqlite_admin.py`, `docs/OLD_DOCS/VIEW_E_DATABASE_VIEWER.md`, `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`, `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md` | Verify DB readiness, gate logical connect, browse tables, inspect paginated rows, and review session-bounded backend DB activity. | Implemented | View E now uses real frontend/backend flows for verify/connect/tables/rows/logging, backend-owned row ordering/pagination, and an explicit required-table source. The remaining limits are honest scope limits, not placeholder behavior: logging only covers backend-observed activity while active, and required-table authority still comes from the target-state truth-surface contract. | None for the current bounded feature scope. Only extend the implementation if product requirements later demand broader DB audit coverage or a different required-table authority source. | Low | The configured DB file may not exist yet, required-table truth still comes from the target-state truth-surface contract, and the current logging model is process-local rather than global. |

## Detailed Analysis

## A Init

### 1. Purpose
This area is meant to validate installation readiness before any test or real runtime starts. It now includes a repo-local backend slice for env verification and SQLite file operations, frontend confirmation for destructive DB actions, and a selected scheduler target path: Windows uses the vendored `tools/CronEmulator` as an external runner context, while Raspberry uses a real user crontab block on Linux/Raspberry hosts. The remaining incomplete part is not scheduler target selection anymore; it is live runtime proof for the expected CronEmulator launch context plus the absence of real render/screen-hardware services behind the scheduled jobs.

### 2. Evidence

| File | Lines or Location | Evidence | Notes |
|------|-------------------|----------|-------|
| `dashboard/views/initView.ts` | lines 3-47 | Renders 1A, 2A, and 3A cards with action buttons and log surfaces. | UI structure is present and separated by init concern. |
| `dashboard/views/initView.ts` | lines 3-67 | The view imports `renderResultSurface()`, labels A as backend-contract wired, and renders a latest-backend-result panel inside each card. | A now exposes real endpoint results instead of placeholder-only status text. |
| `dashboard/app.ts` | lines 109-125 | All `data-action` buttons dispatch through `runAction(action)`. | Event binding exists centrally. |
| `dashboard/services/apiClient.ts` | full file | Adds shared request/error handling for JSON and text responses. | This is the frontend transport layer for A. |
| `dashboard/services/initService.ts` | full file | Encodes the documented `/api/init/*` endpoints as dedicated service calls. | This is the new init service layer. |
| `dashboard/services/runtimeTruth.ts` and `dashboard/services/runtimeTruth/*` | init logs plus `runInitAction()` | A actions now call `runInitAction()` with endpoint metadata, store structured results, and record success/error outcomes honestly. | Placeholder success timers were removed for A. |
| `dashboard/services/renderers.ts` | `renderResultSurface()` | Adds a reusable result renderer for backend payloads and failures. | Enables UI-side evidence of real responses. |
| `server/index.ts` | full file | Implements `/api/init/*` endpoints for env verification, DB status/inspect/delete/recreate-empty, and Windows-first scheduler install/status/print behavior behind the legacy cron routes. | This is the repo-local A backend implementation. |
| `server/scheduler_host.ts` | full file | Starts one long-running scheduler host that preserves the documented 5-second and 15-second timing model and writes heartbeat/tick state to `runtime_data/`. | This resolves the Windows timing contradiction without pretending that Task Scheduler itself can run every 5 seconds. |
| `server/scripts/windows_task_scheduler.ps1` | full file | Registers, inspects, and exports the Windows Task Scheduler task used by 3A. | This makes install/check/print semantics real on the current platform. |
| `server/scripts/sqlite_admin.py` | full file | Performs SQLite inspection and empty-file recreation via Python's standard library. | Keeps SQLite work real without adding npm dependencies. |
| `docs/VIEW_A_INIT.md` | updated sections | Docs now describe backend-contract calls in the frontend and the missing backend dependency separately. | Docs match the new current code reality. |
| `docs/13_FRONTEND_BACKEND_CONTRACT.md` | lines 24-39 | Defines concrete endpoints for env verification, database status/inspect/delete/recreate, and cron install/status/print. | These are the documented real integration targets. |
| `README.md` | updated run and summary sections | README now describes the minimal A backend slice and the remaining backend/runtime gaps accurately. | Confirms the current repo truth. |

### 3. Current State

| Item | Status | Evidence | Why |
|------|--------|----------|-----|
| UI structure | Implemented | `dashboard/views/initView.ts` lines 3-47 | The three cards, buttons, badges, and log areas already exist in the correct view structure. |
| Data loading | Partial | `dashboard/services/initService.ts`; `dashboard/services/runtimeTruth.ts`; `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.ts`; `server/index.ts` | A performs real request/response loading on demand, but it still does not preload init state when the view opens. |
| Event handling | Implemented | `dashboard/app.ts`; `dashboard/services/runtimeTruth.ts`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts` `runAction()` | Buttons are wired to concrete request handlers, and destructive DB actions now require explicit confirmation before dispatch. |
| Business logic | Partial | `server/index.ts`; `server/scheduler_host.ts`; `server/scripts/sqlite_admin.py`; `server/scripts/windows_task_scheduler.ps1` | Env verification, DB file operations, and Windows scheduler install/status/print semantics are real, but the scheduler host still lacks the runtime services it is meant to drive later. |
| Error handling | Implemented | `dashboard/services/apiClient.ts`; `dashboard/services/runtimeTruth.ts`; `dashboard/services/runtimeTruth/*`; `server/index.ts` | Transport failures, HTTP errors, missing DB files, missing confirmation payloads, deferred/unsupported scheduler capability states, and stale scheduler-host states are surfaced honestly. |
| Backend integration | Partial | `server/index.ts`; `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` | Repo-local backend integration now exists for all operator-facing A actions, but the installed scheduler host is still only a timing/heartbeat shell. |

### 4. Placeholder Logic To Replace

| Placeholder or Mock Behavior | Evidence | Why It Is Placeholder | Required Real Behavior |
|------------------------------|----------|-----------------------|------------------------|
| The selected scheduler runner does not yet call real pipeline, playback, screen, or recovery services. | `server/index.ts`; `docs/OLD_DOCS/09_CRON_AND_WATCHDOG.md` | The platform target contradiction is resolved, but 3A still cannot prove end-to-end runtime behavior until worker services exist. | Wire scheduled commands to real worker services once those services exist. |
| A does not yet preload current env/DB/cron status when the view opens. | `dashboard/services/runtimeTruth.ts`; no init preload path in `dashboard/app.ts` | Operators only see results after manual actions, not a current readiness snapshot. | Add initial read endpoints or a refresh action if always-on status visibility is required. |
| `.env` verification rules are based on the currently checked-in config sample rather than a separately approved specification. | `server/index.ts` env schema; `.env` | The implementation works, but future config changes may drift unless the schema is formally owned. | Promote the current verification schema into an explicit product/config contract. |

### 5. Real Integration Requirements

| Requirement Type | Needed For This Area | Evidence | Notes |
|------------------|----------------------|----------|-------|
| Backend endpoint | `POST /api/init/verify-env`, `GET /api/init/database/status`, `POST /api/init/database/inspect`, `POST /api/init/database/delete`, `POST /api/init/database/recreate-empty`, `POST /api/init/cron/install`, `GET /api/init/cron/status`, `GET /api/init/cron/print` | `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` lines 24-39; `dashboard/services/initService.ts`; `server/index.ts` | All A endpoints now exist in the repo, including operator-facing scheduler install/status/print behavior on Windows. |
| Data source | OS environment, DB file/schema state, scheduled task state, and scheduler-host heartbeat/tick state | `docs/OLD_DOCS/VIEW_A_INIT.md` lines 33-36; `.env` lines 3-5; `server/scheduler_host.ts` | Inputs live outside the frontend and need backend access. |
| State model | Per-card request state plus structured response payloads for checks and action results | `dashboard/views/initView.ts` lines 19-46; `dashboard/services/runtimeTruth.ts` | Current status/log model can stay, but payload shape must become real. |
| Polling or refresh logic | Still not found | `dashboard/app.ts` lines 100-174 | The backend now exists, but A is still request-based only and does not preload readiness state. |
| Validation | Partially implemented | `server/index.ts`; `dashboard/app.ts`; `server/scripts/windows_task_scheduler.ps1` | Env values are validated structurally, destructive DB actions require explicit confirmation, and the Windows scheduler target is validated honestly, but auth and non-Windows scheduler policy remain unresolved. |
| Error reporting | Required | `dashboard/views/initView.ts` lines 51-64; `dashboard/services/runtimeTruth/*` | Existing log surfaces can display backend errors once wired. |
| Loading state | Already needed and partially present | `dashboard/services/runtimeTruth/*` | Current `running` status badge behavior can be reused with real requests. |
| Empty state | Not found | `dashboard/views/initView.ts` lines 18-46 | This area is action-oriented, so empty-state handling is less important than result/error rendering. |

### 6. Implementation Plan

| Step | Action | Files Likely Affected | Dependency | Risk |
|------|--------|-----------------------|------------|------|
| 1 | Add an `apiClient` plus a dedicated `initService` that encodes the documented `/api/init/*` contract. | `dashboard/services/apiClient.ts`, `dashboard/services/initService.ts`, `dashboard/services/runtimeTruth.ts` | Backend contract in `docs/13_FRONTEND_BACKEND_CONTRACT.md` | Completed |
| 2 | Replace A's generic placeholder actions with dedicated async request flows that store structured results and failures. | `dashboard/services/runtimeTruth.ts` | Service layer from step 1 | Completed |
| 3 | Extend init state and rendering so each A card shows the latest backend result payload or error. | `dashboard/services/runtimeTruth.ts`, `dashboard/views/initView.ts`, `dashboard/services/renderers.ts`, `dashboard/styles.css` | Service layer from step 1 | Completed |
| 4 | Add confirmation and failure handling for delete/recreate DB actions. | `dashboard/views/initView.ts`, `dashboard/app.ts`, `dashboard/services/runtimeTruth.ts`, `server/index.ts` | Backend safety semantics | Completed |
| 5 | Implement repo-local backend endpoints for env verification and SQLite file operations, and formalize A response schemas. | `server/index.ts`, `server/scripts/sqlite_admin.py`, `docs/13_FRONTEND_BACKEND_CONTRACT.md`, `README.md` | Local Node and Python runtimes | Completed |
| 6 | Resolve 3A scheduling semantics instead of faking cron support. | `server/index.ts`, `docs/09_CRON_AND_WATCHDOG.md`, `docs/13_FRONTEND_BACKEND_CONTRACT.md` | Product/platform decision | Completed |
| 7 | Implement the Windows Task Scheduler bootstrap path plus a repo-local scheduler host that preserves the documented timing model. | `server/index.ts`, `server/scheduler_host.ts`, `server/scripts/windows_task_scheduler.ps1`, `docs/09_CRON_AND_WATCHDOG.md`, `docs/13_FRONTEND_BACKEND_CONTRACT.md` | Windows Task Scheduler availability | Completed |
| 8 | Introduce an initial-read or refresh path if A should show readiness state before a button click. | `dashboard/app.ts`, `dashboard/services/runtimeTruth.ts`, possible backend additions | Product decision and endpoint support | Open |

### 7. Unknowns and Blockers

| Issue | Evidence | Why It Matters | What Is Needed To Resolve It |
|-------|----------|----------------|------------------------------|
| The current scheduler implementation is target-specific. | `server/index.ts`; `shared/schedulerWorkerCommands.ts`; `tools/CronEmulator`; system `crontab` on Linux/Raspberry | Windows and Raspberry targets are separated and inactive target calls are gated. Windows playback-worker command wiring is partial because it reaches `npm run api -- --scheduler playback-worker` only from the expected `tools/CronEmulator` launch context; each target still depends on local platform tools being available. | Validate CronEmulator availability/launch context on Windows and crontab availability on Raspberry during deployment. |
| The scheduler runner does not yet invoke real runtime services. | `server/index.ts`; `docs/09_CRON_AND_WATCHDOG.md` | Install/check/print semantics are target-aware now, but A still cannot prove end-to-end runtime execution. | Implement the underlying pipeline, playback, screen, and recovery services and wire them into scheduled commands. |
| `.env` verification rules are based on the current checked-in config, not a separately approved schema. | `server/index.ts` env schema | The endpoint works today, but future config changes need a formally owned contract. | Promote the current env schema into an explicit config spec or reference doc. |
| A still lacks preload/refresh behavior. | `dashboard/app.ts`; `dashboard/services/runtimeTruth.ts` | Operators must click actions to discover readiness state. | Decide whether A should preload status automatically or expose a dedicated refresh action. |

## B Test

### 1. Purpose
This area is the test and simulation workspace that should let an operator exercise login, staged processing, playback preview behavior, and screen logic without contaminating the real runtime. The current code now routes several actions through repo-local backend endpoints, while still preserving explicit mock/generated-data and simulation-only limits.

### 2. Evidence

| File | Lines or Location | Evidence | Notes |
|------|-------------------|----------|-------|
| `dashboard/views/testView.ts` | lines 3-127 | Renders B1-B5 sections, toggles, preview frame, stage stack, and logs. | View structure is comprehensive. |
| `dashboard/views/testView.ts` | lines 11-16, 47-69 | Explicitly labels the view as simulation only and says B3.1 is the only mock stage, while B3.2-B3.5 are intended for future real-code wiring. | The code itself distinguishes mock vs intended-real stages. |
| `dashboard/app.ts` | lines 128-172 | Binds execution mode, input mode, B5 toggles, timeout input, and last-run buttons. | Interactions are wired locally. |
| `dashboard/services/runtimeTruth.ts` | lines 172-218 | `seedDemoState()` fabricates media, checkpoint, and pipeline status. | Demo data powers B4 and related state. |
| `dashboard/services/runtimeTruth.ts` and `dashboard/services/runtimeTruth/*` | runtime action handlers | B2, individual B3 stages, B3 auto-run, B3 stale-lock maintenance, B4, and B5 screen simulation use backend request helpers where routes exist; remaining local state keeps the dashboard preview responsive. | Backend wiring is partial and still test/simulation scoped. |
| `docs/VIEW_B_TEST.md` | lines 20-77 | Docs describe B3.1 as mock-only, the other stages as future wired stages, and B4/B5 as test-only controls. | This mostly matches code intent. |
| `docs/13_FRONTEND_BACKEND_CONTRACT.md` | lines 41-63 | Defines `/api/test/*` endpoints for all B actions. | These are the documented real wiring targets. |
| `docs/07_PIPELINE_STAGES.md` | lines 56-60 | Says B3.1 is mock-only and the real runtime should not use mock stage results as canonical state. | Important for test/runtime isolation. |
| `docs/11_LOGGING_AND_EVENT_MODEL.md` | lines 14-49 | Defines durable event categories that current B logs only simulate. | Useful for separating UI history from real event persistence. |

### 3. Current State

| Item | Status | Evidence | Why |
|------|--------|----------|-----|
| UI structure | Implemented | `dashboard/views/testView.ts` lines 19-127 | The cards, selectors, preview surface, toggles, and log areas are fully rendered. |
| Data loading | Placeholder | `dashboard/services/runtimeTruth.ts` lines 172-218, 468-483 | Queue state, current media, playback status, and B3 outputs are all generated locally rather than loaded from test endpoints. |
| Event handling | Implemented | `dashboard/app.ts` lines 109-172 | Buttons, radios, checkboxes, and timeout input all update state through bound handlers. |
| Business logic | Partial | `dashboard/services/runtimeTruth.ts`, `dashboard/services/runtimeTruth/*`, `server/runtimePipelineLocks.ts` | The area has real frontend coordination logic such as duplicate guards, pipeline locks, backend pipeline stage calls, B5-to-B4 coupling, and stale persisted pipeline-lock maintenance; Stage 1 download and geocode still have explicit mock/placeholder semantics. |
| Error handling | Partial | `dashboard/services/runtimeTruth.ts` lines 297-301, 445-449, 512-515 | Duplicate starts and empty-queue playback are handled, but there is no server, storage, or transport failure handling. |
| Backend integration | Missing | `README.md` lines 14, 85-94; `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 41-63 | No `/api/test/*` client or backend implementation exists in this repo. |

### 4. Placeholder Logic To Replace

| Placeholder or Mock Behavior | Evidence | Why It Is Placeholder | Required Real Behavior |
|------------------------------|----------|-----------------------|------------------------|
| B1 login is a timer-driven step animation. | `dashboard/services/runtimeTruth.ts` lines 406-441 | The flow always progresses on fixed delays and ends with `2FA completed in placeholder mode.` | Call `POST /api/test/login/run`, stream or poll step status, and render actual auth/test preparation results. |
| B2 five-file download always succeeds with a canned message. | `dashboard/services/runtimeTruth.ts` line 258 | No file transfer or backend request occurs. | Trigger `POST /api/test/download-five/run` and display real batch result metadata or errors. |
| Historical B3.2-B3.5 frontend-memory notes are stale for the current repo. | `docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md`; `docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md` | Current code wires B3.1-B3.5 and B4 to backend runtime paths, with B3.5 owning queue preparation/building and `playback_worker` consuming prepared state only for current-item selection. | Preserve this as historical evidence only; use current code-verified status docs for active implementation truth. |
| B4 playback emulation uses hard-coded media and local checkpoint strings. | `dashboard/services/runtimeTruth.ts` lines 468-483, 511-533 | The preview is enabled by local queue mutation and never reads a playback state endpoint. | Read playback state from `GET /api/test/playback/state` and invoke `POST /api/test/playback/run` for emulation control. |
| B5 screen simulation remains simulation-only and does not control real hardware. | `dashboard/services/runtimeTruth.ts`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts`; `server/index.ts`; `dashboard/views/testView.ts` | State changes now call backend-owned simulation endpoints, but the returned state is still a simulation projection. | Add real screen hardware support only through a separate contract; do not treat B5 simulation as hardware telemetry. |

### 5. Real Integration Requirements

| Requirement Type | Needed For This Area | Evidence | Notes |
|------------------|----------------------|----------|-------|
| Backend endpoint | `POST /api/test/login/run`, `POST /api/test/download-five/run`, `POST /api/test/pipeline/mock-download/run`, `POST /api/test/pipeline/index/run`, `POST /api/test/pipeline/parse-gps/run`, `POST /api/test/pipeline/geocode/run`, `POST /api/test/pipeline/enqueue-playback/run`, `POST /api/test/pipeline/run-all`, `POST /api/test/playback/run`, `GET /api/test/playback/state`, `POST /api/test/screen/configure`, `GET /api/test/screen/state` | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 41-63 | The contract is explicit enough to start a test-service layer. |
| Data source | Test auth flow, test download source, generated test data for B3.1, simulated queue/playback/screen state projections | `docs/VIEW_B_TEST.md` lines 28-29, 72-77; `docs/07_PIPELINE_STAGES.md` lines 56-60 | B3.1 may keep using `generated_test_data`, but B3.2-B5 need backend-backed test state. |
| State model | Separate test simulation state from real runtime state and preserve current lock/history semantics | `dashboard/services/runtimeTruth.ts` lines 35-117, 303-385; `docs/07_PIPELINE_STAGES.md` lines 56-60 | The current model is useful, but it must stop pretending test state is canonical runtime truth. |
| Polling or refresh logic | Needed for playback and screen state after simulation requests | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 57-63 | B4 and B5 likely need follow-up reads after mutations. |
| Validation | Needed for timeout bounds, mode selection, and stage-trigger eligibility | `dashboard/views/testView.ts` lines 50-63, 111-117; `dashboard/services/runtimeTruth.ts` lines 445-449, 512-515 | Some UI validation exists, but backend validation must become authoritative. |
| Error reporting | Required | `dashboard/views/testView.ts` lines 27-29, 37-39, 95-96, 124; `docs/11_LOGGING_AND_EVENT_MODEL.md` lines 14-49 | Current logs can surface real backend or test runner failures. |
| Loading state | Already needed and present | `dashboard/services/runtimeTruth.ts` lines 451-465, 507-509, 518-529 | Running badges and staged transitions should be kept when switching to async service calls. |
| Empty state | Required for B4 queue-empty and B5 no-data fallback | `dashboard/views/testView.ts` lines 83-87, 95; `dashboard/services/runtimeTruth.ts` lines 512-515 | Queue-empty behavior already exists and should map to real test queue state. |

### 6. Implementation Plan

| Step | Action | Files Likely Affected | Dependency | Risk |
|------|--------|-----------------------|------------|------|
| 1 | Create `testService`, `screenService`, and shared `apiClient` modules so B actions stop calling mock handlers directly. | `dashboard/services/apiClient.ts`, `dashboard/services/testService.ts`, `dashboard/services/screenService.ts`, `dashboard/services/runtimeTruth.ts` | `/api/test/*` contract | Medium |
| 2 | Replace B1 and B2 timer-based handlers with async request flows that store structured result payloads and failures. | `dashboard/services/runtimeTruth.ts`, `dashboard/views/testView.ts` | Service modules from step 1 | Medium |
| 3 | Replace `runPipelineStage()` and `runAutoPipeline()` with stage-specific service calls while keeping the existing single-stage lock behavior in the frontend. | `dashboard/services/runtimeTruth.ts`, `dashboard/shared/constants.ts` | Stable stage payload schema | Medium |
| 4 | Rework B4 to consume playback state from backend instead of enabling preview via hard-coded media injection. | `dashboard/services/runtimeTruth.ts`, `dashboard/views/testView.ts` | Playback state endpoint | High |
| 5 | Preserve B5 as backend-owned simulation and keep it clearly separated from real screen hardware behavior. | `dashboard/views/testView.ts`, `dashboard/app.ts`, `dashboard/services/runtimeTruth.ts`, `server/index.ts` | Future hardware contract decision | Medium |
| 6 | Add explicit frontend separation between test-only state and real runtime state so B actions cannot mutate D or C projections accidentally. | `dashboard/services/runtimeTruth.ts`, `dashboard/app.ts` | Service and state design | High |
| 7 | Update history/log rendering to distinguish local UI events from backend-reported test events. | `dashboard/services/renderers.ts`, `dashboard/services/runtimeTruth.ts` | Event payload shape | Medium |

### 7. Unknowns and Blockers

| Issue | Evidence | Why It Matters | What Is Needed To Resolve It |
|-------|----------|----------------|------------------------------|
| B5 currently applies changes immediately through toggles and the timeout input, but the future backend control model is still unclear. | `dashboard/views/testView.ts` lines 105-124; `dashboard/app.ts` lines 128-152 | The final request timing model still affects event flow and backend contract design. | Decide whether B5 should keep immediate apply semantics or move to explicit submit actions before wiring the backend. |
| The exact payload shape for stage, playback, and screen test responses is not documented. | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 49-63 | The frontend cannot replace placeholder log strings cleanly without real response schemas. | Add response contracts for stage results, playback state, and screen state. |
| Test-state isolation from real runtime is documented conceptually but not implemented technically. | `docs/07_PIPELINE_STAGES.md` lines 56-60; `dashboard/services/runtimeTruth.ts` lines 35-117 | Shared frontend truth state (now persisted to `conf/runtime-truth.json`) still makes it easy for B flows to bleed into C/D-style projections. | Define separate frontend stores or namespaced service projections for test vs runtime state. |

## C Last Run info

### 1. Purpose
This area is intended to show the last durable runtime snapshot so an operator can inspect what happened and decide whether to restore. The current implementation now reads the backend orchestration last-run summary for display states, while the restore action remains a placeholder.

### 2. Evidence

| File | Lines or Location | Evidence | Notes |
|------|-------------------|----------|-------|
| `dashboard/views/lastRunView.ts` | lines 3-43 | Renders no-run, error, and ready states; shows C1-C5 cards; disables resume when details are unavailable. | The recovery-oriented UI shell exists. |
| `dashboard/app.ts` | lines 154-173 | `data-last-run-mode` buttons set `none`, `error`, or `ready`, and `ready` calls `seedDemoState()`. | State transitions are manual demo controls. |
| `dashboard/services/runtimeTruth.ts` | lines 82-88 | Initializes `lastRunMode` to `none` and `lastRunData` to empty objects. | No durable load occurs at startup. |
| `dashboard/services/runtimeTruth.ts` | lines 172-218 | `seedDemoState()` fabricates media, playback, stage, and screen details for last-run view. | This is the main ready-state placeholder path. |
| `dashboard/services/runtimeTruth.ts` | line 266 | `resume-last-run` uses `genericAction()` with a placeholder message and no backend request. | Restore is not implemented. |
| `docs/VIEW_C_LAST_RUN_INFO.md` | lines 6-36 | Docs require no-run, error, and existing-run states plus a restore placeholder button. | Docs and UI shape align. |
| `docs/12_STATE_AND_RECOVERY.md` | lines 7-55 | Defines recovery inputs, checkpoint rules, and deterministic recovery behavior. | This is the real data model C should surface. |
| `docs/13_FRONTEND_BACKEND_CONTRACT.md` | lines 65-72 | Defines `GET /api/runtime/last-run` and `POST /api/runtime/restore-last-known-state`. | These are the documented real integration points. |

### 3. Current State

| Item | Status | Evidence | Why |
|------|--------|----------|-----|
| UI structure | Implemented | `dashboard/views/lastRunView.ts` lines 9-43 | The cards, notices, explicit demo-state buttons, and disabled resume path are all present. |
| Data loading | Placeholder | `dashboard/app.ts` lines 154-173; `dashboard/services/runtimeTruth.ts` lines 82-88, 172-218 | No real snapshot is read; the view either stays empty or uses seeded demo data. |
| Event handling | Partial | `dashboard/app.ts` lines 154-173; `dashboard/services/runtimeTruth.ts` line 266 | Mode switches and the resume button are wired, but only to local state mutations. |
| Business logic | Placeholder | `dashboard/services/runtimeTruth.ts` lines 172-218, 266, 387-404 | Last-run details and resume behavior are simulated instead of derived from durable runtime state. |
| Error handling | Partial | `dashboard/views/lastRunView.ts` lines 24-25 | The UI can display an explicit error state, but no backend error is actually caught or rendered. |
| Backend integration | Missing | `README.md` lines 14, 85-94; `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 65-72 | The required runtime snapshot and restore endpoints are not implemented here. |

### 4. Placeholder Logic To Replace

| Placeholder or Mock Behavior | Evidence | Why It Is Placeholder | Required Real Behavior |
|------------------------------|----------|-----------------------|------------------------|
| The view state is chosen by explicit demo buttons instead of backend snapshot results. | `dashboard/views/lastRunView.ts` lines 17-21; `dashboard/app.ts` lines 154-173 | `none`, `error`, and `ready` are manually forced rather than inferred from `GET /api/runtime/last-run`. | Load last-run status from backend on view entry or refresh and derive UI mode from the response. |
| Ready-state content comes from `seedDemoState()`. | `dashboard/services/runtimeTruth.ts` lines 172-218 | Media, playback, stage, and screen details are hard-coded demo values. | Render last known checkpoint, playback item, stage context, and interruption details from durable state. |
| Resume uses a generic placeholder action. | `dashboard/services/runtimeTruth.ts` line 266 | The button only writes a local placeholder success message and does not call any backend restore path. | Call `POST /api/runtime/restore-last-known-state`, surface progress or result, and gate the action appropriately. |
| The error state is purely manual. | `dashboard/app.ts` lines 161-165 | There is no failed transport or parse path producing this state. | Set error mode from real backend read failures and show actionable recovery messaging. |

### 5. Real Integration Requirements

| Requirement Type | Needed For This Area | Evidence | Notes |
|------------------|----------------------|----------|-------|
| Backend endpoint | `GET /api/runtime/last-run`, `POST /api/runtime/restore-last-known-state` | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 65-72 | These endpoints are the minimum contract for C. |
| Data source | Durable `runtime_state`, `run_session`, `checkpoint`, and `event_log` projections | `docs/12_STATE_AND_RECOVERY.md` lines 14-27; `docs/06_DATABASE_SCHEMA.md` lines 15-33, 36-50, 98-127 | C depends on persistent state, not just current memory. |
| State model | Response shape for `no run yet`, `last run snapshot`, and `error` plus detailed recovery evidence fields | `docs/VIEW_C_LAST_RUN_INFO.md` lines 6-36; `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 67-72 | The existing three-mode UI can remain if it maps to real backend projections. |
| Polling or refresh logic | Likely manual refresh only | `dashboard/views/lastRunView.ts` lines 17-21 | C reads a snapshot, so continuous polling is less important than explicit reload after restore or recovery events. |
| Validation | Required for restore authorization and eligibility | `docs/12_STATE_AND_RECOVERY.md` lines 7-27 | Restore should only run when last-run data is valid and the operator is allowed to trigger it. |
| Error reporting | Required | `dashboard/views/lastRunView.ts` lines 24-25, 34-40 | Existing notice and log areas can show snapshot-load or restore errors. |
| Loading state | Needed but not implemented | `dashboard/views/lastRunView.ts` lines 9-43 | There is no loading mode between empty and ready/error. |
| Empty state | Already modeled | `dashboard/views/lastRunView.ts` lines 24-27 | The no-run state exists and can map directly to backend `no run yet` responses. |

### 6. Implementation Plan

| Step | Action | Files Likely Affected | Dependency | Risk |
|------|--------|-----------------------|------------|------|
| 1 | Create a `runtimeService` that reads last-run data and issues restore requests instead of using demo mode buttons. | `dashboard/services/runtimeService.ts`, `dashboard/services/apiClient.ts`, `dashboard/services/runtimeTruth.ts` | `/api/runtime/last-run` and restore contract | Medium |
| 2 | Replace `data-last-run-mode` demo controls with a real load or refresh action, or keep them only behind a dev flag. | `dashboard/views/lastRunView.ts`, `dashboard/app.ts` | Product decision on whether demo controls should survive | Low |
| 3 | Expand last-run state to include explicit load status, backend error payload, and restore request progress. | `dashboard/services/runtimeTruth.ts`, `dashboard/views/lastRunView.ts` | Runtime snapshot schema | Medium |
| 4 | Render real interruption and checkpoint evidence from backend snapshot fields instead of demo text. | `dashboard/views/lastRunView.ts`, `dashboard/services/renderers.ts` | Durable recovery projection | Medium |
| 5 | Wire the resume button to the restore endpoint and display success, failure, or blocked-state feedback in the existing log area. | `dashboard/services/runtimeTruth.ts`, `dashboard/views/lastRunView.ts` | Restore endpoint semantics and auth rules | High |
| 6 | Update docs to describe the real C flow once snapshot loading and restore are implemented. | `docs/VIEW_C_LAST_RUN_INFO.md`, `docs/DASHBOARD_OVERVIEW.md` | Completed runtime integration | Low |

### 7. Unknowns and Blockers

| Issue | Evidence | Why It Matters | What Is Needed To Resolve It |
|-------|----------|----------------|------------------------------|
| The exact JSON shape for `GET /api/runtime/last-run` is not defined. | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 67-72 | The frontend cannot replace seeded demo cards without knowing field names and nesting. | Define a concrete snapshot schema for media, playback, stage, screen, and error details. |
| Restore authorization and operator safeguards are unspecified. | `docs/13_FRONTEND_BACKEND_CONTRACT.md` line 72 | Restore is operationally sensitive and should not be a blind POST from the UI. | Document auth, confirmation, and idempotency rules for restore requests. |
| Durable recovery storage is only documented, not implemented. | `docs/12_STATE_AND_RECOVERY.md` lines 14-55; `docs/06_DATABASE_SCHEMA.md` lines 15-127 | C cannot become real until state and checkpoints persist outside frontend memory. | Implement the runtime storage and projection layer first or alongside C integration. |

## D Running process

### 1. Purpose
This area is meant to monitor the real runtime pipeline and watchdog workers using authoritative runtime projections. The frontend structure is already separated correctly from the simulation view, but the current repo still presents it as a frontend-only runtime preview and the data comes entirely from a local placeholder start action.

### 2. Evidence

| File | Lines or Location | Evidence | Notes |
|------|-------------------|----------|-------|
| `dashboard/views/runningProcessView.ts` | lines 3-73 | Renders D1 pipeline worker, D2 playback worker, D3 screen worker, and D4 runtime log. | Monitoring layout is present. |
| `dashboard/views/runningProcessView.ts` | lines 4-18 | Shows empty-state messaging when no simulated runtime preview is active. | Good separation from view B. |
| `dashboard/views/runningProcessView.ts` | lines 12-18 | The view now exposes a local `Start simulated runtime preview` button that dispatches `runAction('start-real-run')`. | The trigger is scoped to D instead of implying a repo-wide live runtime control. |
| `dashboard/services/runtimeTruth.ts` | lines 89-111 | Seeds pipeline worker, playback worker, and screen worker with local placeholder status. | Initial D state is synthetic. |
| `dashboard/services/runtimeTruth.ts` | lines 535-572 | `startRealRun()` flips `realRunActive`, fabricates worker statuses, and writes placeholder summaries and heartbeats. | This is the main D placeholder path. |
| `docs/VIEW_D_RUNNING_PROCESS.md` | lines 12-55 | Docs describe D1-D3 blocks, one-stage-at-a-time pipeline behavior, and heartbeat-driven workers. | This matches the intended monitoring surface. |
| `docs/07_PIPELINE_STAGES.md` | lines 17-31 | Defines the real one-stage-at-a-time pipeline contract and loop behavior. | D1 should eventually surface this authoritative state. |
| `docs/09_CRON_AND_WATCHDOG.md` | lines 12-47 | Defines 5-second tick behavior, duplicate prevention, and restart policy. | D2/D3 should be backed by these watchdog realities. |
| `docs/13_FRONTEND_BACKEND_CONTRACT.md` | lines 74-83 | Defines `/api/runtime/current`, `/api/runtime/workers`, `/api/runtime/start`, and `/api/runtime/stop`. | This is the real D integration contract. |

### 3. Current State

| Item | Status | Evidence | Why |
|------|--------|----------|-----|
| UI structure | Implemented | `dashboard/views/runningProcessView.ts` lines 6-73 | The monitoring cards, worker list, badges, local preview-start control, and preview log area already exist. |
| Data loading | Missing | `dashboard/services/runtimeTruth.ts` lines 89-111, 535-572; no polling logic in `dashboard/app.ts` lines 100-174 | D never reads `/api/runtime/current` or `/api/runtime/workers`; it only mutates local state. |
| Event handling | Partial | `dashboard/app.ts` lines 87-90, 120-124 | The start action is wired, but there is no stop or refresh action even though the contract includes them. |
| Business logic | Placeholder | `dashboard/services/runtimeTruth.ts` lines 535-572 | Real-run state is invented by the frontend with canned summaries and local timestamps. |
| Error handling | Partial | `dashboard/services/runtimeTruth.ts` lines 536-539 | Duplicate start is ignored, but worker degradation, stale heartbeat, and backend failures are not handled. |
| Backend integration | Missing | `README.md` lines 14, 85-94; `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 74-83 | Runtime projections and control endpoints are only documented. |

### 4. Placeholder Logic To Replace

| Placeholder or Mock Behavior | Evidence | Why It Is Placeholder | Required Real Behavior |
|------------------------------|----------|-----------------------|------------------------|
| `Start simulated runtime preview` turns D on by mutating local state. | `dashboard/views/runningProcessView.ts`; `dashboard/services/runtimeTruth.ts` lines 535-572 | No backend start request or runtime query occurs. | Call `POST /api/runtime/start`, then read runtime projections from backend. |
| D1 stage status and summaries are fabricated with static copy. | `dashboard/services/runtimeTruth.ts` lines 549-554 | The frontend decides that download is running and others are waiting without reading worker state. | Render authoritative stage name, status, timestamps, and summaries from `/api/runtime/current` or `/api/runtime/workers`. |
| D2 and D3 heartbeat fields are local timestamps and canned summaries. | `dashboard/services/runtimeTruth.ts` lines 555-568 | Worker health is not read from real heartbeats or leases. | Consume real playback and screen worker projections, including status, heartbeat, and degraded-state details. |
| D4 preview log is only the frontend log stream. | `dashboard/services/runtimeTruth.ts` lines 70-71, 570-571 | There is no durable event or runtime log source behind it. | Feed D4 from structured runtime events or a backend log projection tied to the current run. |

### 5. Real Integration Requirements

| Requirement Type | Needed For This Area | Evidence | Notes |
|------------------|----------------------|----------|-------|
| Backend endpoint | `GET /api/runtime/current`, `GET /api/runtime/workers`, `POST /api/runtime/start`, `POST /api/runtime/stop` | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 74-79 | D needs both control and read endpoints. |
| Data source | `runtime_state`, worker leases/heartbeats, stage runs, playback queue, event log | `docs/06_DATABASE_SCHEMA.md` lines 15-35, 51-79, 81-127; `docs/07_PIPELINE_STAGES.md` lines 17-31 | D is projection-heavy and depends on real runtime storage. |
| State model | Runtime projection that joins canonical state with worker heartbeat and queue summary | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 81-83 | The frontend should read an already-joined view, not reconstruct operational truth itself. |
| Polling or refresh logic | Required | `docs/09_CRON_AND_WATCHDOG.md` lines 14-19, 23-47 | D is a live monitor and needs recurring reads or streamed updates. |
| Validation | Required for start/stop actions and duplicate protection | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 9-11, 74-79; `docs/09_CRON_AND_WATCHDOG.md` lines 45-47 | Backend must remain authoritative for duplicate prevention. |
| Error reporting | Required | `dashboard/views/runningProcessView.ts` lines 18, 67-70; `docs/09_CRON_AND_WATCHDOG.md` lines 39-47 | D should surface degraded workers, failed restarts, and duplicate-rejected events. |
| Loading state | Needed but not implemented | `dashboard/views/runningProcessView.ts` lines 6-73 | The UI has active vs inactive states, but no fetching/loading status. |
| Empty state | Already modeled | `dashboard/views/runningProcessView.ts` lines 18-20 | The empty state can remain for `no active run` responses. |

### 6. Implementation Plan

| Step | Action | Files Likely Affected | Dependency | Risk |
|------|--------|-----------------------|------------|------|
| 1 | Create a `runtimeService` that reads runtime projections and issues start/stop commands. | `dashboard/services/runtimeService.ts`, `dashboard/services/apiClient.ts`, `dashboard/services/runtimeTruth.ts` | `/api/runtime/*` contract | Medium |
| 2 | Replace `startRealRun()` with async start logic followed by a real projection fetch, preserving duplicate-start feedback. | `dashboard/services/runtimeTruth.ts`, `dashboard/app.ts` | Start endpoint and response schema | Medium |
| 3 | Add polling or interval-based refresh for D while a real run is active, using backend state rather than local timers as the source of truth. | `dashboard/services/runtimeTruth.ts`, `dashboard/app.ts` | Runtime current/workers endpoints | High |
| 4 | Extend D state to represent loading, degraded, failed, and stopped worker conditions. | `dashboard/services/runtimeTruth.ts`, `dashboard/views/runningProcessView.ts`, `dashboard/shared/constants.ts` | Worker projection schema | Medium |
| 5 | Add UI controls for stop and refresh if those remain part of the contract, or trim the contract if start-only is intentional. | `dashboard/app.ts`, `dashboard/views/runningProcessView.ts`, `docs/13_FRONTEND_BACKEND_CONTRACT.md`, `docs/VIEW_D_RUNNING_PROCESS.md` | Product decision on runtime controls | Medium |
| 6 | Feed D4 from backend event or log projections instead of the generic frontend history array. | `dashboard/services/runtimeTruth.ts`, `dashboard/views/runningProcessView.ts`, `dashboard/services/renderers.ts` | Event/log projection endpoint or schema | High |

### 7. Unknowns and Blockers

| Issue | Evidence | Why It Matters | What Is Needed To Resolve It |
|-------|----------|----------------|------------------------------|
| The UI exposes `Start simulated runtime preview`, but the documented contract also includes `POST /api/runtime/stop` and there is no corresponding stop control. | `dashboard/views/runningProcessView.ts`; `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 76-79 | The current UI is intentionally honest about being preview-only, but the eventual operator control surface is still incomplete. | Decide whether D should support stop from this UI and align contract and controls. |
| The current UI renders D2 and D3 summary fields plus a shared D4 log, but the final real-runtime observability layout is not fully settled. | `dashboard/views/runningProcessView.ts` lines 43-70; `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 76-83 | The eventual runtime monitor may need different per-worker or shared log surfaces once live telemetry exists. | Choose whether per-worker logs belong in D2/D3 or if D4 remains the single runtime log surface before final runtime wiring. |
| Runtime projection payloads are not defined in detail. | `docs/13_FRONTEND_BACKEND_CONTRACT.md` lines 76-83 | The frontend cannot replace local fake worker state without a stable schema. | Define response fields for stage rows, worker summaries, heartbeats, log entries, and run status. |

## Final Recommendation

| Rank | Area | Readiness | Recommended Next Action | Reason |
|------|------|-----------|-------------------------|--------|
| 1 | A Init | High | Wire real runtime services into the installed scheduler host and decide whether A should preload scheduler status on entry. | The Windows scheduler target and install/check/print semantics are now implemented, so the remaining A gap is service execution behind that host. |
| 2 | C Last Run info | High | Define and implement the restore contract before making `resume-last-run` operational. | C now has a read-only backend load path through `/api/runtime/orchestration/last`; restore remains missing. |
| 3 | D Running process | Medium | Define runtime projection schemas, then wire refresh/polling plus active worker health/control paths for D1-D4. | D's layout is ready, but it depends on backend-owned runtime and watchdog projections that are not wired to this view yet. |
| 4 | B Test | Lowest | Split out a dedicated test service layer and implement B incrementally after runtime contracts are stable. | B is the broadest area, mixes several subdomains, and has the most placeholder logic plus a small docs/UI mismatch in B5. |

## Implementation Notes

| Note | Evidence | Impact | Follow-up |
|------|----------|--------|-----------|
| A Init backend implementation is now present in the repo. | `server/index.ts`, `server/scheduler_host.ts`, `server/scripts/sqlite_admin.py`, `server/scripts/windows_task_scheduler.ps1`, `dashboard/app.ts` | The repo now includes real env verification, real SQLite status/inspect/delete/recreate-empty endpoints, confirmation-gated destructive actions, and a Windows Task Scheduler bootstrap path for 3A. | Use this slice as the pattern for future backend additions. |
| The scheduler contradiction is now resolved on Windows without overclaiming full runtime support. | `server/index.ts`; `server/scheduler_host.ts`; `docs/09_CRON_AND_WATCHDOG.md` | The API no longer pretends cron is blocked in all cases; it installs a real scheduler bootstrap task and reports host heartbeat honestly. | Add non-Windows support only if the product must be cross-platform. |
| A response schemas are now formalized in the contract doc. | `docs/13_FRONTEND_BACKEND_CONTRACT.md` | The frontend and backend now share a clearer payload contract for A. | Expand the same schema discipline to C and D next. |
| A dedicated reusable wiring skill and a new backend-oriented skill are available for future work. | `C:/Users/mihke/.codex/skills/photo-frame-dashboard-contract-wiring/SKILL.md`; `C:/Users/mihke/.codex/skills/photo-frame-init-backend-implementation/SKILL.md` | Future dashboard work can reuse the same contract-first workflow for frontend/backend slices. | Use them on the next A/B/C/D implementation pass. |
| Validation now includes a backend smoke test as well as the frontend build. | `npm run build`; direct smoke calls to `/api/init/*` | The repo now proves both compile-time and endpoint-level behavior for A. | Add repeatable automated API tests if you want this guarded in CI. |

## Extra Notes

- The new 3A implementation is target-aware: Windows uses CronEmulator, and Raspberry uses real crontab only on Linux/Raspberry hosts.
- The scheduler runner does not run the real pipeline, playback, screen, or recovery services because those services do not exist in this repository yet.
- I did not smoke-test the live Windows `install` endpoint against CronEmulator during this audit because it would launch a long-running local process. The status/print and inactive-gating code paths were covered by focused tests.
- A still lacks an automatic preload/refresh path, so operators only see env/DB/scheduler truth after pressing the relevant buttons.


## Slice 5 current-gap reconciliation table — 2026-05-30 21:35 EEST

| Area | Current implementation signal | Remaining gap | Do not reopen as |
|---|---|---|---|
| GPS parsing | `GpsProvider` chain includes EXIF, JSON/XMP/text sidecars, filename tokens, and path tokens. | Real-media fixture/runtime proof and future HEIC/video/tool-specific providers only when concrete unsupported metadata appears. | Missing GPS provider interface. |
| Reverse geocode | Cache-first `ReverseGeocodeProvider` registry exists with disabled network providers and deterministic placeholder fallback. | Safe activation/proof of one real provider, rate/error behavior, and address-quality assessment. | Missing geocode adapter architecture. |
| View C | View reads `/api/runtime/orchestration/last` as a backend-owned read-only last-run projection. | Controlled restore/resume contract, safeguards, and UI action wiring. | Missing last-run read endpoint. |
| View D | Layout and simulated preview exist. | Backend-owned runtime projection, polling/refresh, worker health, and start/stop control alignment. | Completed runtime monitor. |
| Scheduler/recovery | Scheduler target model and host context exist. | Concrete always-on worker services and Raspberry power-loss proof. | Generic missing scheduler host. |
