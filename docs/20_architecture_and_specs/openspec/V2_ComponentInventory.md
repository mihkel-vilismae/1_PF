# V2 Component Inventory

Estonian timestamp: 2026-06-26 13:15 EEST

## Status

Documentation/evidence inventory only. This pass did not implement UI, runtime, backend, scheduler, worker, auth, playback, recovery, or hardware behavior.

Live baseline inspected: `VERSION` `0.10.32`, package version `0.10.32`, `master` at `176f72d9`. The requested `v2-component-inventory-gate` skill and this inventory scaffold were not present in the live repository, so this file was created at the requested canonical path and filled from current source/tests/proof docs.

## Inspection Footprint

Fully opened/read:

- `.ai-context-ignore`
- `docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`
- `docs/table_of_contents.md`
- `docs/DOC_INDEX.md`
- `docs/DOC_FRESHNESS_MATRIX.md`
- `docs/DOC_REORGANIZATION_PLAN.md`
- `docs/DOC_LINK_AUDIT.md`
- `docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md`
- `docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md`
- `docs/20_architecture_and_specs/openspec/V2_GoalSummary.md`
- `docs/20_architecture_and_specs/openspec/v2_operator_menu_backend_contract_openspec.md`
- `dashboard/views/initView.ts`
- `dashboard/views/testView.ts`
- `dashboard/views/osPlaybackView.ts`
- `dashboard/views/v2OperatorMenuView.ts`
- `dashboard/data/v2OperatorSidebar.ts`
- `dashboard/data/v2OperatorCenterPanel.ts`
- `dashboard/services/initService.ts`
- `dashboard/services/runtimeExecutionService.ts`
- `dashboard/services/v2OperatorMenuBackendContract.ts`
- `server/runtimePipelineLocks.ts`
- focused tests/proof docs named in the inventory rows below

Searched/partially referenced:

- `server/index.ts`
- `server/routes/*.ts`
- `server/workers/*.ts`
- `dashboard/services/runtimeTruth/**`
- `dashboard/inspect/**`
- `tests/**`
- `docs/proofs/**`

On-demand excluded context: no generated proof/runtime artifact payloads were loaded from `runtime_data/**` or `generated_test_data/**`.

## Current V2 Baseline Finding

The current V2 UI now has the nine-page V2 operator route shell. The requested real controls are still not migrated/wired:

| Evidence | Finding |
| --- | --- |
| `dashboard/data/v2OperatorSidebar.ts` | Defines exactly `01` through `06`: setup, authentication, startup, workers, troubleshooting, recovery. |
| `dashboard/data/v2OperatorCenterPanel.ts` | Defines typed visual center-panel blocks; many actions are `visualOnly`, `guardedAction`, or `disabledPlaceholder`. |
| `dashboard/views/v2StartupOperatorMenuView.ts` and `dashboard/views/v2OperatorMenuView.ts` | Render V2 visual-only surfaces. |
| `tests/v2OperatorSidebarImplementation.test.js` | Asserts exactly nine routes, shared wrapper/Event history inheritance, and visual-only/guarded behavior. |
| `tests/v2OperatorMenuBackendContract.test.js` | Maps existing backend endpoints to older V2 menu rows, but does not prove the requested nine-page placement. |

Therefore every requested nine-page placement below still needs V2 placement tests before any item can be marked green/done for V2.

## Inventory Table

| V2 target | Current source path | Existing form/component status | Endpoint/handler | Existing tests/proofs | Reuse vs extraction decision | Missing V2 placement tests | Implementation status | Unresolved risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `01 SETUP / Verify .env` | `dashboard/views/initView.ts`; `dashboard/services/initService.ts`; `server/index.ts`; `server/routes/inspectionRoutes.ts` | Existing View A page-local card via `renderCard("1A", "Verify .env", ...)`; not a reusable V2 component. | `POST /api/init/verify-env`; frontend action `verify-env`. | `tests/viewA.verifyEnv.buttonWorkflow.test.js`; `tests/runtimeTruthHelpers.test.js`; endpoint appears in `docs/20_architecture_and_specs/openspec/v2_operator_menu_backend_contract_openspec.md`. | Extract/reuse a small card renderer or wrapper around existing `renderResultSurface` and log surface. Do not duplicate View A markup. | V2 `01 SETUP` render test; click/action mapping test; result/error handling test; status-overlay metadata test. | Existing behavior wired in View A; V2 placement not implemented. | The requested V2 file scaffold was absent; V2 status JSON source is still not chosen. |
| `01 SETUP / Database controls` | `dashboard/views/initView.ts`; `dashboard/services/initService.ts`; `server/index.ts`; `server/database/databaseService.ts` | Existing View A page-local card with Check/Inspect/Delete/Recreate buttons. | `GET /api/init/database/status`; `POST /api/init/database/inspect`; `POST /api/init/database/delete`; `POST /api/init/database/recreate-empty`. | `tests/viewA.2A.databaseButtons.buttonWorkflow.test.js`; `tests/v2OperatorMenuBackendContract.test.js`. | Extract shared DB controls with guarded destructive callbacks and existing result/log surfaces. | V2 render test; four action mapping tests; destructive confirmation preservation test; result/error handling test. | Existing View A behavior wired; V2 placement not implemented. | Delete/recreate remain destructive and must keep current confirmation/body contract. |
| `02 AUTHENTICATION / NEW AUTH` | `dashboard/views/initView.ts`; `dashboard/services/newAuthService.ts`; `dashboard/data/authButtonStatusCopy.ts`; `server/auth/newAuthRoutes.ts`; `server/auth/newAuthService.ts` | Existing View A `1A-STASH-OFF` NEW AUTH card; rows are reusable candidates but currently page-local. | `POST /api/auth/new/verify-icloudpd`; `GET /api/auth/new/status`; `POST /api/auth/new/login`; `POST /api/auth/new/submit-2fa`; `POST /api/auth/new/logout`; `GET /api/auth/new/session-files`; `POST /api/auth/new/artifacts/generate`; `GET /api/auth/new/artifacts`. | `tests/newAuthSlice1.test.js`; `tests/runtimeTruthNewAuthActions.test.js`; `tests/authOperatorTwoFactorCheckpoint.test.js`; `docs/proofs/auth_operator_2fa_checkpoint_proof.md`. | Extract/reuse NEW AUTH action-row renderer and status-copy data; preserve redaction and Test Mode disable behavior. | V2 auth render test; per-button endpoint mapping test; secret-redaction/history test in V2 context; status-overlay metadata test. | Existing View A behavior wired; V2 placement not implemented. | Browser auth may still require operator/runtime evidence; CLI fallback is documented only. |
| `03 STARTUP / Raspberry scheduler controls` | `dashboard/views/initView.ts`; `dashboard/services/initService.ts`; `server/routes/schedulerRoutes.ts`; `shared/schedulerPlatformCapabilities.ts` | Existing View A scheduler card includes Windows CronEmulator target and Raspberry real-crontab target. | Real-path candidates: `POST /api/init/cron/install`; `GET /api/init/cron/status`; `GET /api/init/cron/print`; target routes `GET/POST /api/init/cron/target`. Windows emulator routes also exist but are excluded from real V2 path. | `tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js`; `tests/schedulerRoutesCompatibility.test.js`; `docs/proofs/raspberry_cron_preflight_proof.md`. | Extract Raspberry-safe scheduler panel only; do not reuse Windows CronEmulator controls for V2 real path except as disabled/history context if explicitly labeled. | V2 render test; target selection test; real crontab action tests; test proving no Windows emulator dependency for real scheduler controls. | Existing View A scheduler behavior wired; V2 real scheduler placement not implemented. | Current tests include Windows CronEmulator coverage; Raspberry target proof still depends on target platform/operator evidence. |
| `03/04/05 shared / RPI-STAGES row` | `dashboard/views/osPlaybackView.ts`; `dashboard/services/osPlaybackViewModel.ts`; `server/index.ts` runtime projection helpers | Existing OS playback view has stage-row rendering; V2 shared row not implemented. | Read-only/status source likely `GET /api/runtime/projection/live` and OS playback model data. | `tests/osPlaybackViews.test.js`; `tests/runtimeStatusProjection.test.js`; `tests/runtimeProjectionContracts.test.js`. | Extract shared status-row renderer from OS playback model or build a narrow V2 status-row component fed by runtime projection. | V2 row render test on Startup/Workers/Troubleshooting; projection fallback/unknown-state test; status metadata test. | Existing status row elsewhere; V2 placement not implemented. | Must avoid static Idle labels becoming fake status if projection is unavailable. |
| `03/04/05/07/08 shared / RPI-WORKERS row` | `dashboard/views/osPlaybackView.ts`; `dashboard/services/osPlaybackViewModel.ts`; `server/index.ts` worker projection helpers | Existing OS playback view has worker status cards; V2 shared row not implemented. | Read-only/status source likely `GET /api/runtime/projection/live`; worker status files under scheduler runtime evidence. | `tests/osPlaybackViews.test.js`; `tests/runtimeStatusProjection.test.js`; `tests/runtimeStatusRoutesCompatibility.test.js`. | Extract/reuse OS playback worker-card renderer or shared worker view model. | V2 placement tests on all requested pages; unavailable/unknown state test. | Existing row elsewhere; V2 placement not implemented. | Screen/on-off worker currently has instrumentation and simulation boundaries, not hardware proof. |
| `04 WORKERS / B3.1 Download` | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `server/index.ts`; `server/workers/regularStageWorker.ts` | Existing View B stage card; backend endpoint and regular worker stage exist. | `POST /api/runtime/download/run`; real iCloud route is separate `POST /api/runtime/download/real-run`. | `tests/viewB.buttonWorkflow.test.js`; `tests/runtimeExecutionService.test.js`; `tests/regularStageWorkerB3StateMachine.test.ts`; `docs/proofs/regular_worker_b3_state_machine.md`; `docs/proofs/real_icloudpd_pipeline_proof.md`. | Extract reusable worker stage card; keep mock/generated download and real iCloud download boundary explicit. | V2 worker card render/click/result test; status/log row test; real-vs-mock label test. | Existing View B and worker behavior wired; V2 placement not implemented. | V2 `Download` wording must not imply real iCloud download unless wired to the authenticated real-run path. |
| `04 WORKERS / B3.2 Index` | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `server/index.ts`; `server/workers/regularStageWorker.ts` | Existing View B stage card. | `POST /api/runtime/index/run`. | `tests/viewB.buttonWorkflow.test.js`; `tests/runtimeExecutionService.test.js`; `tests/regularStageWorkerB3StateMachine.test.ts`. | Extract shared worker stage card. | V2 render/click/result test; backend error handling test. | Existing behavior wired; V2 placement not implemented. | Depends on valid prior media/download state. |
| `04 WORKERS / B3.3 Parse GPS` | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `server/index.ts`; GPS provider docs/tests | Existing View B stage card. | `POST /api/runtime/gps/run`. | `tests/viewB.buttonWorkflow.test.js`; `tests/mediaPipelineProviderContracts.test.js`; `tests/geocodeProviderProof.test.js`; `docs/proofs/gps_fallback_proof.md`. | Extract shared worker stage card and keep missing-GPS as non-fatal. | V2 render/click/result test; missing-GPS display test. | Existing behavior wired; V2 placement not implemented. | Must preserve missing-GPS playback eligibility rule. |
| `04 WORKERS / B3.4 Geocode` | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `server/index.ts`; geocode provider tools/docs | Existing View B stage card says deterministic placeholder geocoder is not production. | `POST /api/runtime/geocode/run`. | `tests/viewB.buttonWorkflow.test.js`; `tests/geocodeProviderSelection.test.js`; `tests/realGeocodeProviderChainProof.test.js`; `docs/proofs/geocode_provider_proof.md`. | Extract shared worker stage card; label provider reality honestly. | V2 render/click/result test; provider-status/missing-address display test. | Existing behavior wired; V2 placement not implemented. | Placeholder geocode must not be marked production success. |
| `04 WORKERS / B3.5 Enqueue playback` | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `server/index.ts`; `server/workers/regularStageWorker.ts` | Existing View B stage card. | `POST /api/runtime/queue/prepare`. | `tests/viewB.buttonWorkflow.test.js`; `tests/regularStageWorkerB3StateMachine.test.ts`; `docs/proofs/regular_worker_b3_state_machine.md`. | Extract shared worker stage card. | V2 render/click/result test; queue summary/status test. | Existing behavior wired; V2 placement not implemented. | Queue eligibility must continue accepting playable media without address/GPS when otherwise valid. |
| `05 TROUBLESHOOTING / Detect issues in pipeline` | `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts`; `server/routes/runtimeTruthRoutes.ts`; `server/runtimePipelineLocks.ts` | Existing View B pipeline maintenance button. | `POST /api/runtime/pipeline/issues/detect`; helper `detectStalePipelineLockIssues`. | `tests/runtimePipelineLocks.test.js`; `tests/runtimeExecutionService.test.js`; View B workflow coverage via `tests/viewB.buttonWorkflow.test.js`. | Extract small pipeline-maintenance component or action row; preserve diagnostic-only behavior. | V2 render/click/result test; stale-only semantics proof at HTTP/UI layer. | Existing backend helper covered; V2 placement not implemented. | Current focused stale-lock tests are helper-level; V2 needs placement and route-response evidence. |
| `05 TROUBLESHOOTING / Clear stale locks` | Same as above | Existing View B button; guarded/destructive-adjacent maintenance behavior. | `POST /api/runtime/pipeline/stale-locks/clear`; helper `clearStalePipelineLocks`. | `tests/runtimePipelineLocks.test.js`; `tests/runtimeExecutionService.test.js`. | Extract/reuse with guard copy and result surface. | V2 render/click/result test; stale-only clear test through route; fresh-lock preservation test in V2 action context. | Existing helper behavior covered; V2 placement not implemented. | Must not clear fresh active locks or unrelated runtime state. |
| `06 RECOVERY / SAVE STATE, LOAD STATE, EMULATE POWER OFF` | Existing V2 center panel has visual snapshot actions in `dashboard/data/v2OperatorCenterPanel.ts`; playback resume checkpoint code in `server/index.ts` exists separately. | Requested exact alert-only buttons do not exist. Current V2 recovery blocks are visual-only snapshot placeholders, not the requested alert controls. | Initial requested behavior is visual/browser alert only. Related existing endpoints: playback resume checkpoint `GET/POST /api/runtime/playback/resume-checkpoint`; no full recovery worker endpoint. | `tests/v2OperatorSidebarImplementation.test.js`; `tests/controlledRestoreContract.test.js`; `tests/runtimeStateDurableCheckpoint.test.js`; `docs/proofs/raspberry_power_loss_recovery_v2_proof.md`. | New minimal component later for exact alert placeholders; later separate recovery-state schema. | Alert-text tests for all three buttons; V2 render test; later save/load/autosave/restart proof. | Requested placeholder controls not implemented. | Real recovery remains future/operator-target proof work; avoid claiming current checkpoint code is full recovery. |
| `07 PIR / B5 visible subset` | `dashboard/views/testView.ts`; `dashboard/services/viewBActivityDetection.ts`; `server/routes/screenSimulationRoutes.ts`; `dashboard/views/osPlaybackView.ts` activity panel | Existing View B B5 simulation and activity detection source UI; not isolated V2 PIR page. | Existing simulation: `GET /api/runtime/screen-simulation/state`; `POST /api/runtime/screen-simulation/configure`; activity detection is frontend/test-mode model. | `tests/viewBActivityDetectionUi.test.js`; `tests/viewBActivityDetectionModel.test.js`; `tests/viewBActivityResults.test.js`; `tests/screenSimulationApi.test.js`; `tests/osPlaybackActivityUi.test.js`. | Extract visible B5 subset only; add separate PIR-emulation button before real hardware. | V2 PIR page render test; mouse/keyboard activity test; PIR emulator click/status test; hardware non-claim test. | Existing simulation UI covered elsewhere; V2 PIR placement not implemented. | Real PIR hardware input is unproven and must stay non-green. |
| `08 PLAYBACK / B4 rendering target/mode subsection` | `dashboard/views/testView.ts`; `dashboard/services/playbackRenderer.ts`; `dashboard/views/osPlaybackView.ts`; `server/index.ts` playback routes | Existing View B B4 rendering controls and OS playback surfaces; not isolated V2 Playback page. | `POST /api/runtime/playback/select-current`; media read route via backend-served playback URL; native playback routes exist separately. | `tests/playbackRenderer.test.js`; `tests/viewB.buttonWorkflow.test.js`; `tests/playbackRenderer.test.js`; `tests/nativeFullscreenPlaybackProof.test.js`; `docs/proofs/native_fullscreen_playback_proof.md`. | Extract visible B4 rendering subsection; keep Raspberry OS disabled until proven. | V2 render test for exact visible subset; rendering mode click/status tests; result/error handling test. | Existing View B behavior wired; V2 placement not implemented. | Browser preview/fullscreen proof does not prove OS/Raspberry fullscreen stability. |
| `08 PLAYBACK / Drag-drop queue table` | No matching source found in inspected dashboard files. Related playback queue display exists in `dashboard/views/osPlaybackView.ts` and backend playback contract routes. | New component likely required. | Initial local UI likely visual/browser-owned; real pipeline remains DB/backend-owned. Existing selection endpoint is `POST /api/runtime/playback/select-current`. | No direct drag/drop queue test found. Related tests: `tests/playbackApiContract.test.js`; `tests/playbackRenderer.test.js`; `tests/osPlaybackViews.test.js`. | New reusable queue/drop component later; do not mix it with real DB pipeline until contract is designed. | File drop tests; image/video/other classification tests; video duration metadata test; GPS/address unknown handling test; not-playable selection test. | Not implemented. | Non-media must not pollute real DB/pipeline; missing address must be represented honestly. |
| `09 REAL PLAYBACK / explanation first` | No current nine-page V2 route; current V2 sidebar ends at `06 recovery`. | Not implemented. | Visual-only initially. Later composition must use proven pieces only. | No V2 `09` test found. Final proof docs include `docs/proofs/real_icloudpd_pipeline_proof.md`, `docs/proofs/native_fullscreen_playback_proof.md`, and Raspberry recovery proof docs, but they do not prove a `09` page. | New page composition later; explanation-only first. | Sidebar route test for `09`; explanation render test; later disabled-test-control and composition tests. | Not implemented. | Must not become a dump of every test button; final autonomous playback/recovery proof remains unresolved. |
| Shared Event Log / history | `dashboard/services/renderers.ts`; View A/B log surfaces; OS playback terminal panels; event history services | Several page-local log surfaces exist; no single V2 event-log component found. | Mostly frontend/local state; backend logs/proofs are separate. | `tests/eventHistoryExport.test.js`; `tests/eventHistoryModalTransport.test.js`; existing View A/B workflow tests assert history/log entries. | Extract shared V2 Event Log renderer using existing log row/render/export helpers. | V2 every-page render test; copy/clear local behavior test; no-secret event-history test. | Existing local logs present; shared V2 event log not implemented. | Clear actions must remain UI-local unless a destructive backend log-delete endpoint is separately reviewed. |
| Latest backend result / payload viewer / badges | `dashboard/services/renderers.ts`; `dashboard/views/initView.ts`; `dashboard/views/testView.ts` | Existing shared renderer functions are already reused in View A/B. | Visual/result-only frontend rendering of endpoint metadata/payloads. | Many View A/B action tests assert stored result metadata; `tests/scrollPreservation.test.js` covers payload scroll behavior. | Reuse directly, with thin V2 wrappers for status/help metadata. | V2 result-surface render/error test; payload scroll preservation if altered. | Existing reusable renderer present; V2 placement not implemented. | Avoid logging/storing request/response bodies that contain secrets. |

## Summary Decisions

| Area | Decision |
| --- | --- |
| Existing View A/B controls | Reuse/extract; do not copy large HTML blocks. |
| Existing V2 nine-route shell | Treat as visual-only route/page shell, not proof that requested controls are wired. |
| Runtime endpoints | Keep centralized; V2 must call the same existing service constants/handlers unless a later reviewed contract changes them. |
| Scheduler | Use Raspberry/real-crontab path for V2 real goal; Windows CronEmulator remains excluded from the real path. |
| Recovery | Start with exact placeholder alerts only when UI work begins; full recovery remains future proof work. |
| PIR | Start with emulator/simulation; real hardware remains later. |
| Playback drag/drop | New component likely required; keep separate from real DB pipeline until safety contract exists. |

## Required Next Tests Before UI Placement

- Nine-page V2 sidebar/schema test for `01` through `09`.
- Per-page render tests for requested sections and shared Event Log.
- Per-control click/action tests for reused setup/auth/scheduler/worker/troubleshooting controls.
- Status-overlay JSON/docs sync tests once the structured JSON path is chosen.
- Secret/redaction regression tests for auth/event-history payloads.
- Missing-GPS/missing-address playback eligibility tests where V2 touches queue/playback behavior.

## Regression Boundary

This inventory does not authorize behavior changes. Existing Test Mode, Real Mode, View A, View B, Debug, backend endpoints, worker commands, scheduler routes, proof runners, and runtime artifacts should continue unchanged until a separately scoped implementation slice edits source code and adds focused tests.


## v0.10.34 B2 shared infrastructure findings

| V2 target | Current source path | Existing form | Endpoint/handler | Existing tests/proofs | Reuse decision | Missing V2 proof/test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Shared V2 page wrapper | `dashboard/views/v2OperatorPageWrapper.ts` | reusable wrapper | none | `tests/v2OperatorSidebarImplementation.test.js` | reuse for all future V2 page shells | extend when `07`-`09` are added | visual/tested |
| V2 Event history panel | `dashboard/views/v2OperatorPageWrapper.ts`, `dashboard/services/renderers.ts` | reused renderer + wrapper panel | existing local `copy-history` / `clear-history` actions in `dashboard/app.ts` | `tests/v2OperatorSidebarImplementation.test.js`, `tests/eventHistoryExport.test.js` | reuse; do not duplicate event log HTML per page | placement test for future `07`-`09` pages | visual/tested |
| V2 implementation-status metadata | `dashboard/data/v2ImplementationStatus.json`, `dashboard/data/v2ImplementationStatus.ts` | structured JSON + TS accessor | none | `tests/v2OperatorSidebarImplementation.test.js` | reuse as B3 overlay data source | B3 overlay toggle/highlight tests | foundation/tested |
| V2 block status attributes | `dashboard/views/v2StartupOperatorMenuView.ts` | render-time data attributes | none | `tests/v2OperatorSidebarImplementation.test.js` | keep metadata-driven; no inline optimistic claims | B3 tooltip/overlay tests | foundation/tested |

B2 deliberately does not move requested Setup/Auth/Startup/Workers/Troubleshooting/PIR/Playback cards. Those remain later reuse/extraction batches.


## v0.10.35 B1 route-shell findings

| V2 target | Current source path | Existing form | Endpoint/handler | Existing tests/proofs | Reuse decision | Missing V2 proof/test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `07 PIR / route shell` | `dashboard/data/v2OperatorSidebar.ts`; `dashboard/data/v2OperatorCenterPanel.ts` | visual shell blocks | none | `tests/v2OperatorSidebarImplementation.test.js`; `tests/v2OperatorMenuView.test.js`; `tests/rootReadmeStructure.test.js` | reuse shared V2 wrapper; add B7 controls later | B7 visible B5 subset + PIR emulator tests | visual/tested shell |
| `08 PLAYBACK / route shell` | `dashboard/data/v2OperatorSidebar.ts`; `dashboard/data/v2OperatorCenterPanel.ts` | visual shell blocks | none | same as above | reuse shared V2 wrapper; add B8 controls later | B8 B4 subset + drag/drop queue tests | visual/tested shell |
| `09 REAL PLAYBACK / explanation shell` | `dashboard/data/v2OperatorSidebar.ts`; `dashboard/data/v2OperatorCenterPanel.ts` | explanation-only shell blocks | none | same as above | keep explanation-only until proven pieces exist | B10 composition tests + final proof | visual/tested shell |


## v0.10.39 B3 implementation-status overlay

- Added the V2-only topbar controls: `Explain controls`, `Explain values`, and `Implementation status`.
- Wired the Implementation status view to `dashboard/data/v2ImplementationStatus.json` through rendered `data-v2-status-id`, `data-v2-implementation-status`, `data-v2-status-label`, and `data-v2-status-help` attributes.
- Added per-section `?` buttons that open a JSON-backed status/help modal without adding backend/runtime behavior.
- Added `tests/v2ImplementationStatusSync.test.js` to ensure every rendered V2 status target for all nine routes has a JSON registry element.

## v0.10.40 B4.1 Setup Verify .env placement

| V2 target | Current source path | Existing form | Endpoint/handler | Existing tests/proofs | Reuse decision | Missing V2 proof/test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `01 SETUP → 1A Verify .env` | `dashboard/data/v2OperatorCenterPanel.ts`, `dashboard/views/v2StartupOperatorMenuView.ts`, `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts` | V2 backend action card plus shared result/log renderers | `verify-env` action → `POST /api/init/verify-env` | `tests/initApi.step1.test.js`; V2 status sync tests | Reuse existing runtime-truth action and shared `renderResultSurface` / `renderLogEntries`; do not duplicate View A card markup. | Add focused V2 render/action mapping coverage in the B4 sync/test slice. | wired/needs verification |

## v0.10.41 B4.2 Setup Database controls placement

| V2 target | Current source path | Existing form | Endpoint/handler | Existing tests/proofs | Reuse decision | Missing V2 proof/test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `01 SETUP → 2A Database controls` | `dashboard/data/v2OperatorCenterPanel.ts`, `dashboard/views/v2StartupOperatorMenuView.ts`, `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts` | V2 backend action card plus shared result/log renderers | `check-db`, `inspect-db`, `delete-db`, `recreate-db` actions → `/api/init/database/*` | `tests/initApi.step1.test.js`; V2 placement test | Reuse existing runtime-truth actions and confirmation guards; do not duplicate View A card markup. | Add frontend click/error tests if action handlers change. | wired/needs verification |

## v0.10.42 B4.3 Authentication NEW AUTH placement

| V2 target | Current source path | Existing form | Endpoint/handler | Existing tests/proofs | Reuse decision | Missing V2 proof/test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `02 AUTHENTICATION → 1A-STASH-OFF - NEW AUTH` | `dashboard/views/newAuthActionRows.ts`, `dashboard/views/v2StartupOperatorMenuView.ts`, `dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts` | V2 NEW AUTH card plus shared action rows/result/log renderers | `new-auth-*` action IDs → `/api/auth/new/*` endpoints | `tests/newAuth*.test.js`; `tests/v2SetupAuthPlacement.test.js` | Extract shared NEW AUTH action-row renderer and reuse existing runtime-truth actions; do not use old login-card action IDs. | Add endpoint/result/error proof in later B9 proof expansion. | wired/needs verification |


## v0.10.46 B5 Startup/Workers placement

| V2 target | Current source path | Existing form | Endpoint/handler | Existing tests/proofs | Reuse decision | Missing V2 proof/test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `03 STARTUP → Raspberry scheduler controls` | `dashboard/views/schedulerActionRows.ts`; `dashboard/views/v2StartupOperatorMenuView.ts`; `dashboard/services/runtimeTruth/runtimeTruthSchedulerActions.ts`; `dashboard/app.ts` | Shared scheduler action-row renderer with V2 Raspberry target attributes | Existing scheduler action IDs with target payload `raspberry-real-crontab`; no new backend routes | `tests/v2StartupWorkersPlacement.test.js`; View A scheduler tests remain existing coverage | Reuse existing scheduler buttons/handlers while forcing V2 button payloads to Raspberry real crontab. | Live Raspberry crontab proof and hardware/environment proof. | wired/needs verification |
| `RPI-STAGES` shared row | `dashboard/data/v2OperatorCenterPanel.ts`; `dashboard/views/v2StartupOperatorMenuView.ts` | Shared visual row on Startup, Workers, Troubleshooting | none; visual status row only | `tests/v2StartupWorkersPlacement.test.js` | One reusable row renderer; do not duplicate per-page HTML. | Runtime stage health projection/proof. | visual/tested row |
| `RPI-WORKERS` shared row | `dashboard/data/v2OperatorCenterPanel.ts`; `dashboard/views/v2StartupOperatorMenuView.ts` | Shared visual row on Startup, Workers, Troubleshooting, PIR, Playback | none; visual worker-call row only | `tests/v2StartupWorkersPlacement.test.js` | One reusable row renderer; do not duplicate per-page HTML. | Runtime worker-call projection/proof. | visual/tested row |
| `04 WORKERS → B3.1-B3.5 worker cards` | `dashboard/data/v2OperatorCenterPanel.ts`; `dashboard/views/v2StartupOperatorMenuView.ts`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts` | Five V2 backend action cards using existing Run action IDs | `run-b3-1` → `POST /api/runtime/download/run`; `run-b3-2` → `POST /api/runtime/index/run`; `run-b3-3` → `POST /api/runtime/gps/run`; `run-b3-4` → `POST /api/runtime/geocode/run`; `run-b3-5` → `POST /api/runtime/queue/prepare` | `tests/v2StartupWorkersPlacement.test.js`; `tests/runtimeExecutionService.test.js` | Reuse existing runtime action IDs and shared V2 backend-card renderer. | Live V2 click/backend result proof and full pipeline proof. | wired/needs verification |

## v0.10.47 docs reconciliation note

Root README files, V2 status docs, and the next-plan document were refreshed after B5. Treat this inventory as the component/reuse record through B5; new B6/B7/B8/B9/B10 work must append focused findings instead of rewriting history.
