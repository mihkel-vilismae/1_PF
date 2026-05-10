# Code-Verified Dashboard Implementation Status

Audit date: 2026-05-04

Update note: 2026-05-10 17:38 EEST — docs reconciled after B4 playback worker/rendering closure and v0.5.1 CronEmulator vendoring.

This document is a code-verified dashboard implementation status audit. It does not replace the documentation-derived status files in this folder; it records what was checked against the current worktree, code paths, tests, and selected live endpoint responses.

## Executive Summary

- The dashboard is a hybrid implementation: Views A and E are mostly backend-wired, View B mixes backend runtime endpoints with mock-backed/test-only semantics, and Views C and D remain explicit frontend mock/demo surfaces.
- Backend route registration is centralized in `server/index.ts:327-368`; the Vite frontend proxies `/api` to `127.0.0.1:4301` via `vite.config.ts`.
- View A init and DB controls have frontend handlers, backend routes, confirmation guards for destructive DB actions, and tests.
- View A scheduler controls are real route calls, but the scheduler host advertises placeholder-service mode and the live status response says business services remain future work.
- Auth surfaces are backend-wired. Legacy auth remains environment/provider dependent. NEW AUTH Slices 1–10 are closed: the new endpoint family now requires provider proof or stronger test-download proof before projecting `authenticated`.
- View B runtime buttons call backend endpoints for download, index, GPS, geocode, B3.5 queue preparation/building, B4 playback selection, pipeline orchestration, screen simulation, and stale-lock maintenance, but Stage 1 is mock/generated-data copy and geocode is explicitly deterministic placeholder behavior.
- View E database viewer is backend-wired for verify/connect/table/row/logging actions, but DB logging is process-local and not a full SQL/activity audit.
- `npm test` passed 122 tests; `npm run build` and `npm run task-docs:check` passed.
- `npm run typecheck` failed with pre-existing TypeScript errors, and `npm run validate:view-e` failed because this workspace already has a DB where the validator expected none.
- Live API checks on port `4311` reached the server, but attempted shell environment isolation did not override the repo `.env` DB path, so destructive live checks were intentionally not executed.

## Architecture / Surface Map

| Surface | Code Evidence | Notes |
|---|---|---|
| Frontend entrypoint | `dashboard/index.html`, `dashboard/app.ts:60-69`, `vite.config.ts` | Vite root is `dashboard`; `/api` proxy points to `127.0.0.1:4301`. |
| Shared action dispatch | `dashboard/app.ts:262-323`, `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts:122-174` | `data-action` buttons dispatch into runtime-truth action handlers. |
| Backend route table | `server/index.ts:327-368`, `server/index.ts:370-417` | Single HTTP server maps auth/init/database-viewer/runtime/runtime-truth routes. |
| Runtime truth bridge | `dashboard/services/runtimeTruthPersistenceService.ts:12-27`, `server/index.ts:895-907`, `server/index.ts:1284-1297` | Frontend loads/saves `conf/runtime-truth.json` through `/api/runtime-truth`. |
| Docs authority | `README.md:5`, `README.md:31`, `docs/categorized/current_implementation_status_docs/main_readme.md:5-12` | Existing status docs explicitly warn they are documentation-derived unless a document says code was checked. |
| Tests | `tests/viewA.*buttonWorkflow.test.js`, `tests/viewB.buttonWorkflow.test.js`, `tests/initApi.step1.test.js`, `tests/wave*.test.js` | Button, API, runtime, auth, inspect, and pipeline tests are present. |

## Implementation Status Table

| Area | Feature / Control / Endpoint | Current Status | Evidence | Missing / Risk | Source Files | Verification Command |
|---|---|---|---|---|---|---|
| Baseline | Audit worktree baseline | Partial | `git status --short --branch` showed existing modified auth/runtime-truth/docs/env/test files and untracked new-auth/runtimeTruth tests before this audit. | Dirty baseline means the audit reflects current local state, not clean `origin/master`. | `HOW_TO_RUN.md`; `dashboard/services/renderers.ts`; `dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts`; `dashboard/services/runtimeTruth/runtimeTruthState.ts`; `server/auth/newAuthService.ts`; `tests/*newAuth*`; `tests/runtimeTruth*.test.js` | `git status --short --branch` |
| Shared dashboard shell | A-E navigation, action dispatch, inspect toggles, transit terminal | Implemented | View switching and action binding are centralized; non-runtime controls are explicitly handled before `runAction`. API transport records outbound/inbound transit records. | `typecheck` currently fails, so static TS health is not clean. | `dashboard/app.ts:60-69`; `dashboard/app.ts:262-323`; `dashboard/services/apiClient.ts`; `tests/transitGateway.test.js`; `tests/inspectModeSummary.test.js` | `npm test` passed; `npm run typecheck` failed |
| View A Init | `verify-env` / `POST /api/init/verify-env` | Implemented | UI renders `verify-env`; runtime behavior maps it to `INIT_ENDPOINTS.verifyEnv`; backend handler validates env schema and `TEST_*` overlap; live check returned 200 `status=ok`. | Live check used repo `.env` values; no separate config file isolation was proven. | `dashboard/views/initView.ts:53`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts:123`; `dashboard/services/initService.ts:26-38`; `server/index.ts:419-495`; `tests/viewA.verifyEnv.buttonWorkflow.test.js`; `tests/initApi.step1.test.js` | `npm test`; live `POST http://127.0.0.1:4311/api/init/verify-env` |
| View A Database | `check-db`, `inspect-db`, `delete-db`, `recreate-db` / `/api/init/database/*` | Implemented | UI renders all four controls; runtime behavior maps them to backend endpoints; backend has status/inspect/delete/recreate handlers and confirmation guard; tests cover recreate/status/inspect/delete flow. | Destructive live checks were not executed because live DB isolation was not proven; live status reported repo `.env` DB path. | `dashboard/views/initView.ts:62-65`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts:124-127`; `dashboard/services/initService.ts:28-60`; `server/index.ts:497-631`; `server/index.ts:1764-1770`; `tests/viewA.2A.databaseButtons.buttonWorkflow.test.js`; `tests/initApi.step1.test.js` | `npm test`; live `GET /api/init/database/status` only |
| View A Scheduler | `install-cron`, `check-cron`, `print-cron` / `/api/init/cron/*` | Partial | UI renders scheduler controls and maps them to backend routes; live status/print returned 200 warning with `supportLevel=supported`. Backend reports Windows scheduler capability. | Scheduler host is `placeholder-services`; live response says no host heartbeat and business services for pipeline/playback/screen/recovery remain future work. Install endpoint was not live-executed. | `dashboard/views/initView.ts:77-79`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts:128-130`; `dashboard/services/initService.ts:20-34`; `server/index.ts:633-643`; `server/index.ts:1776-1787`; `server/index.ts:1997`; `server/scheduler_host.ts:9`; `tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js` | `npm test`; live `GET /api/init/cron/status`; live `GET /api/init/cron/print` |
| View A Auth | Legacy `1A-AUTH` auth/preflight controls and `/api/auth/*` | Partial | UI renders backend-auth controls; runtime behavior maps to `/api/auth/status`, verify, resume, run, 2FA, reset, logout, and single-file test endpoints; backend route handlers and tests exist. | Real provider authentication remains environment/provider dependent; 2FA and session proof are honest boundary states, not guaranteed success. | `dashboard/views/initView.ts:12-22`; `dashboard/views/initView.ts:176`; `dashboard/services/authPreflightService.ts:10-58`; `dashboard/services/runtimeTruth/runtimeTruthAuthActions.ts:27-116`; `server/index.ts:328-335`; `server/auth/authRoutes.ts:58-165`; `tests/authApi.step1.test.js`; `tests/viewB.buttonWorkflow.test.js` | `npm test`; live `GET /api/auth/status` |
| View A New Auth | `new-auth-*` controls and `/api/auth/new/*` | Implemented with provider-dependent runtime proof | UI renders new-auth controls; frontend service targets only `/api/auth/new/*`; backend route family covers status, verify iCloudPD, session-files, login, submit-2FA, logout, and test-download proof. | Runtime success still depends on local iCloudPD, Apple account state, and real provider response. Local session files alone are not authenticated. | `dashboard/views/initView.ts`; `dashboard/services/newAuthService.ts`; `dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts`; `server/index.ts`; `server/auth/newAuthRoutes.ts`; `server/auth/newAuthService.ts`; `tests/newAuth*.test.js`; `tests/newAuthSlice*.mjs` | Targeted NEW AUTH tests; build; docs reconciliation |
| View B Runtime Test | B2 download action / `POST /api/runtime/download/run` | Partial | UI action maps to backend runtime download endpoint; backend route copies files from configured mock/generated test data; tests cover success and missing-source error. | This is a real endpoint but explicitly mock/generated-data copy, not production provider download semantics. | `dashboard/views/testView.ts:29`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts:153`; `dashboard/services/runtimeExecutionService.ts:12-22`; `server/index.ts:909-995`; `server/index.ts:912-913`; `tests/viewB.buttonWorkflow.test.js`; `tests/waveB.step3.test.js` | `npm test`; live runtime run not executed |
| View B Runtime Pipeline | B3.1-B3.5 staged actions and B3 auto | Partial | UI renders individual and auto stage controls; frontend calls backend download/index/GPS/geocode/queue endpoints; `run-b3-auto` calls backend orchestration; backend stage handlers and Wave B-D/E tests exist. | Stage 1 is mock-backed and geocode response explicitly says deterministic placeholder/not production. | `dashboard/views/testView.ts`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts`; `server/index.ts`; `tests/viewB.buttonWorkflow.test.js`; `tests/waveB.step3.test.js`; `tests/waveC.step4.test.js`; `tests/waveD.e2e.test.js`; `tests/waveE.step5.test.js` | `npm test`; browser check; live maintenance detect only |
| View B Pipeline Maintenance | `detect-pipeline-issues`, `clear-stale-pipeline-locks` / `/api/runtime/pipeline/*` | Implemented for stale locks | UI renders maintenance controls between the B3 toolbar and stage cards; frontend calls backend endpoints; backend detects stale persisted pipeline locks and clears only stale locks. | Detection currently covers stale pipeline locks only; it does not inspect live worker processes or database runtime state. | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts`; `server/runtimePipelineLocks.ts`; `server/index.ts`; `tests/runtimePipelineLocks.test.js`; `tests/viewB.buttonWorkflow.test.js`; `tests/inspectMetadataDriftGuard.test.js` | `npm test`; browser check; live `POST /api/runtime/pipeline/issues/detect` |
| Runtime Orchestration API | `/api/runtime/orchestration/run`, `/current`, `/last` | Backend-wired, partially consumed | Backend registers orchestration routes and tests cover success/failure/inspection paths. View B auto-run consumes `/run`; View C consumes `/last`; `/current` remains backend-only. | Restore/resume is still not wired to a backend recovery endpoint. | `server/index.ts`; `dashboard/services/runtimeExecutionService.ts`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts`; `tests/waveE.step5.test.js`; `tests/viewB.buttonWorkflow.test.js`; `tests/viewC.orchestrationWiringGuard.test.js` | `npm test`; live orchestration run not executed |
| View B Playback | B4 playback selection / `POST /api/runtime/playback/select-current` / `--scheduler playback-worker` | Partial | UI maps `run-b4` to the backend playback select endpoint; backend selection logic is shared with `playback_worker`; `playback_worker` has lock/status evidence and selects the current playable item as the final worker-stage action after B3.5 queue preparation/building. | This is playback selection only, not real preview/fullscreen media rendering, Raspberry display control, or screen hardware control. B3.5 owns queue preparation/building. Windows CronEmulator wiring is partial because it depends on the expected `tools/CronEmulator` launch context. | `dashboard/views/testView.ts`; `dashboard/services/playbackRenderer.ts`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts`; `server/index.ts`; `server/playback/playbackSelectionService.ts`; `server/workers/playbackWorker.ts`; `shared/schedulerWorkerCommands.ts`; `tests/playbackWorker.test.js`; `tests/playbackRenderer.test.js`; `tests/schedulerPlaybackWorkerCommand.test.js`; `tests/b4PlaybackFlowStatusDoc.test.js` | `npm test -- --test-reporter=spec tests/playbackRenderer.test.js tests/playbackWorker.test.js tests/schedulerPlaybackWorkerCommand.test.js tests/b4PlaybackFlowStatusDoc.test.js` |
| View B Screen Simulation | B5 screen simulation toggles and timeout inputs | Partial | B5 configuration is backend-wired simulation only; returned state updates dashboard preview and runtime-truth projection. | It does not control or report real screen hardware. | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts`; `server/index.ts`; `tests/viewB.buttonWorkflow.test.js`; `tests/screenSimulationApi.test.js` | `npm test` |
| View C Last Run | `resume-last-run` | Mock-only | UI copy says no real restore endpoint is wired; runtime behavior maps to `genericAction`, which uses local timeout/log/history only. | Backend has orchestration `current/last` endpoints, but View C does not consume them and no restore action is wired. | `dashboard/views/lastRunView.ts:15`; `dashboard/views/lastRunView.ts:34`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts:161`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts:104-110`; `server/index.ts:363-365`; `tests/viewSourceBadges.test.js` | `npm test` |
| View D Running Process | `start-real-run` | Mock-only | UI copy marks worker data as simulated; runtime behavior calls `startRealRun`, which mutates local truth/status/worker rows. | No live runtime monitor start/stop/refresh endpoint is wired to the view. | `dashboard/views/runningProcessView.ts:11`; `dashboard/views/runningProcessView.ts:16`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts:162`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts:419-428`; `tests/viewSourceBadges.test.js` | `npm test` |
| View E Database Viewer | Verify/connect/tables/rows | Implemented | UI renders verify/connect/show table/table row controls; behavior maps to database viewer service endpoints; backend handlers inspect DB and load rows through the Python SQLite bridge; live verify/connect returned 200 against the repo `.env` DB. | Live isolated DB path was not proven; `validate:view-e` failed because DB existed when the validator expected missing DB. | `dashboard/views/databaseViewerView.ts:34-76`; `dashboard/views/databaseViewerView.ts:150-192`; `dashboard/services/databaseViewerService.ts:21-67`; `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.ts:229-333`; `server/index.ts:645-805`; `server/database/databaseService.ts:204`; `server/database/databaseService.ts:526-546` | `npm test`; `npm run validate:view-e` failed; live `POST /api/database-viewer/verify`; live `POST /api/database-viewer/connect` |
| View E DB Logging | Start/stop DB logging | Partial | UI renders start/stop logging buttons and backend has start/stop handlers. | Backend logging session is process-local memory and the coverage text does not claim every SQL statement or external process. | `dashboard/views/databaseViewerView.ts:73-76`; `dashboard/services/databaseViewerService.ts:26-57`; `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.ts:344-361`; `server/index.ts:806-893`; `server/index.ts:290`; `server/index.ts:1518-1532` | `npm test`; live logging not executed |
| Inspect / Backend Status Metadata | Inspect controls, reality/source badges, backend status copy | Implemented | Inspect metadata tests cover control copy, current truth source, real/mock classification, and backend status metadata for Verify .env and runtime actions. | Metadata can drift from code if not kept in tests for new controls. | `dashboard/inspect/*`; `dashboard/inspect/backendStatusMetadata.ts`; `tests/inspectMetadata.test.js`; `tests/inspectModeSummary.test.js`; `tests/viewSourceBadges.test.js` | `npm test` |
| Runtime Truth Persistence | `/api/runtime-truth` GET/POST | Implemented | Frontend persistence service targets GET/POST `/api/runtime-truth`; backend reads/writes `conf/runtime-truth.json`; live GET returned 200. | POST writes repo-tracked/runtime truth file state and was not live-executed during this audit. | `dashboard/services/runtimeTruthPersistenceService.ts:12-27`; `server/index.ts:895-907`; `server/index.ts:1284-1297`; `server/index.ts:1570-1611`; `tests/runtimeTruthHelpers.test.js` | `npm test`; live `GET /api/runtime-truth` |

## Doc vs Code Conflicts

| Claim | Claimed In | Actual Evidence | Recommended Status |
|---|---|---|---|
| Current-status docs are current implementation truth. | Existing category wording could be misread, but the docs explicitly say they are documentation-derived: `docs/categorized/current_implementation_status_docs/main_readme.md:5-12`; `button_and_view_verification_status.md:5-6`. | Code/tests were checked in this audit; this new file is the code-verified dashboard snapshot. | Keep documentation-derived files, add this file as separate code-verified evidence. |
| View B controls documented as mostly `Works`. | `docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md:45-54`. | Code now has real backend endpoints for many B controls, but Stage 1 is mock/generated-data copy and geocode is deterministic placeholder/not production. | Downgrade broad B runtime status to `Partial`; keep B5 `Mock-only`. |
| View C status was undocumented in button-verification corpus. | `docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md:62`. | Code shows `resume-last-run` maps to `genericAction` with no backend call. | `Mock-only`. |
| View D status was undocumented in button-verification corpus. | `docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md:63`. | Code shows `start-real-run` mutates local simulated worker state only. | `Mock-only`. |
| Placeholder implementation notes imply broad View B frontend-fabricated behavior. | Historical sections in `placeholder_implementations.md`. | Current code wires B2/B3/B4 to backend runtime endpoints; B3.5 owns queue preparation/building; `playback_worker` owns final current-playable-item selection only. Some backend behaviors remain mock/placeholder. | Keep docs split between backend-wired partials, selection-only worker behavior, and mock/simulation-only surfaces. |
| Scheduler implementation is completed. | `placeholder_implementations.md:123`, `placeholder_implementations.md:362-371`. | Routes and Windows scheduler bootstrap exist, but host mode is `placeholder-services` and live status says business services remain future work. | `Partial`. |
| View C says no real `/api/runtime/*` endpoint is wired. | `dashboard/views/lastRunView.ts:15`. | Backend exposes `/api/runtime/orchestration/current` and `/api/runtime/orchestration/last`, but View C does not consume them and no restore endpoint is wired. | Keep View C `Mock-only`; clarify wording later to avoid hiding backend-only orchestration endpoints. |
| New auth local session files | Earlier Slice 2/Slice 3 wording could imply session files alone were enough. | Post-Slice 10 status requires provider proof or stronger test-download proof before `authenticated`. | Resolved; keep provider-runtime dependency explicit. |

## Verification Log

| Command | What It Verifies | Result |
|---|---|---|
| `git status --short --branch` | Baseline branch and pre-existing dirty files. | Passed; branch `master...origin/master`; existing modified/untracked files recorded as baseline. |
| `Get-Content` / `Select-String` inspection commands | File discovery, route/action mapping, docs authority, test inventory. | Passed. `rg` was avoided after local access denial in this app environment. |
| `npm run typecheck` | TypeScript static checking. | Failed. First errors include `dashboard/app.ts(404,39)` / `(422,56)` unknown `.toUpperCase`, inspect guide-copy type errors, runtime-truth state record typing, provider registry status typing, route handler typing, and many `unknown` payload property errors in `server/index.ts`. |
| `npm run build` | Production dashboard bundle. | Passed; Vite built 43 modules into `dist/`. |
| `npm test` | Existing Node test suite. | Passed; 173 tests passed. |
| `npm run validate:view-e` | View E validator. | Failed with `Verify should fail before DB exists.` This workspace has an existing DB state, so the validator precondition did not hold. |
| `npm run task-docs:check` | Task docs TOC consistency. | Passed; `task_docs\\_TABLE_OF_CONTENTS.md` is up to date. |
| Live API on `PORT=4311` with attempted isolated shell env | Reachability and selected low-risk endpoint behavior. | API started and stopped. GET/POST checks returned 200 for auth status, new-auth status, verify-env, DB status, scheduler status/print, runtime-truth, DB viewer verify/connect. DB endpoints reported `runtime_data\\photo_frame.sqlite`, so shell env isolation did not override repo `.env`. |
| Destructive live DB checks | Delete/recreate against isolated DB only. | Not executed because effective DB path isolation was not proven. Existing tests cover destructive confirmation-gated flow with temporary paths. |
| Live runtime stage/orchestration runs | Runtime side-effect endpoints with isolated paths. | Not executed because live isolation was not proven and these endpoints write DB/download/runtime state. Existing tests cover runtime stages and orchestration with temporary paths. |

## Regression-Safe Next Steps

### Docs-only fixes

- Update stale `.js` references in `placeholder_implementations.md` to current `.ts` paths only if that file remains an active audit aid.
- Reconcile View B docs so backend-wired partial runtime stages are not described as pure frontend placeholders, while preserving Stage 1 mock and geocode placeholder warnings.
- Clarify View C wording so it does not imply no runtime backend endpoints exist at all; the dashboard simply does not consume orchestration current/last or restore endpoints.

### Test additions

- Add a small check that live/audit env isolation can override `.env` before any future destructive live endpoint smoke test.
- Add focused tests that View C remains unwired from orchestration endpoints until intentionally connected.
- Keep metadata drift coverage in place when new dashboard actions are added so inspect/reality/backend-status labels cannot fall back to generic copy.

### Wiring fixes

- Wire View C to a deliberate backend contract only after deciding whether `/api/runtime/orchestration/last` is the intended source or a separate restore endpoint is required.
- Expand View B pipeline issue detection beyond stale persisted locks only after a backend-owned worker/runtime health contract exists.
- Define a real backend contract for B5 screen simulation before replacing frontend-only state mutation.

### Real behavior changes

- Replace scheduler host `placeholder-services` mode with real pipeline/playback/screen/recovery service execution before upgrading scheduler status beyond `Partial`.
- Replace mock/generated Stage 1 download semantics with real provider-backed download behavior if production download is required from View B.
- Replace deterministic placeholder geocoding with a production geocoder before upgrading geocode status beyond `Partial`.


## 2026-05-06 NEW AUTH closure update

NEW AUTH Slices 1–10 are closed in the current working snapshot. The new auth card/control family must use only `/api/auth/new/*` endpoints:

- `GET /api/auth/new/status`
- `POST /api/auth/new/verify-icloudpd`
- `GET /api/auth/new/session-files`
- `POST /api/auth/new/login`
- `POST /api/auth/new/submit-2fa`
- `POST /api/auth/new/logout`
- `POST /api/auth/new/test-download`

Current truth rules:

1. Local iCloudPD session files are evidence only. They are not authenticated by themselves.
2. `authenticated` requires provider proof or stronger test-download proof.
3. `requires_2fa` / `pending_2fa` is not success.
4. 2FA output that indicates an interactive challenge must surface visible prompts such as `ENTER 6-DIGIT CODE` and `ENTER DEVICE INDEX (A)`.
5. Passwords, 2FA codes, cookies, tokens, and session contents must not appear in frontend state, event history, logs, tests, or docs.
6. Provider execution and filesystem inspection remain backend-owned; the frontend consumes API responses only.

Remaining project work after NEW AUTH closure is outside the new-auth track: production provider download, production geocoding, real scheduler worker services, View C restore contract, View D live runtime monitor, and safer live environment-isolation checks before destructive smoke tests.
