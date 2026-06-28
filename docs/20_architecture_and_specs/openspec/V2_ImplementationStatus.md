# V2 Implementation Status

Estonian timestamp: 2026-06-26 18:53 EEST

## Status

Authoritative implementation-status tracker for the V2 operator pages and the path through `09 REAL PLAYBACK`, recovery wiring, and the B12 proof gate.

This document is intentionally conservative. A UI element being visible is not enough to mark it working.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `planned` | Requirement documented; no implementation claim. |
| `visual` | UI exists or is intended to exist, but behavior is not wired/proven. |
| `placeholder` | Deliberately simple temporary behavior such as alert-only buttons. |
| `reused candidate` | Existing component/control likely reusable but not yet verified in V2. |
| `extraction needed` | Existing markup exists but should be factored before reuse. |
| `wired` | Calls a real handler/endpoint. |
| `needs verification` | Behavior may work but lacks current V2-placement evidence. |
| `needs solution` | Known/suspected gap must be solved. |
| `tested` | Automated test/proof confirms the stated behavior in the relevant placement. |
| `proven` | Code, tests, and generated/target evidence support readiness. |
| `future` | Intentional later milestone. |

## Sync rule

The top-right V2 `Implementation status` UI, each per-section `?` explanation, and the structured implementation-status JSON file must stay synchronized with this document.

The JSON file is the frontend-readable status source; this document is the human-readable tracker. During implementation, choose a JSON path that fits the dashboard architecture and keep JSON/docs/code in lockstep.

Do not show a green/done state in the UI unless the corresponding row here is `tested` or `proven` with evidence. Initial colors are green = done/proven, yellow = in progress, and red = not implemented.

## Current baseline summary

| Area | Current status | Notes |
| --- | --- | --- |
| V2 baseline | `wired/tested partial` | v0.10.64 has the nine-page V2 flow, shared Event history, B3 status/help overlay, B4/B5/B6/B7/B8 controls, B10 integrated `09 REAL PLAYBACK` layout/projection, B11 recovery endpoints/autosave/restart-check, and a B12 proof gate. Live target-machine proof remains required. |
| Goals doc | `documented` | `docs/20_architecture_and_specs/v2_goals/goals.md` defines victory conditions. |
| New docs package | `planned/documented` | This document and companion OpenSpec files define next implementation direction. |
| Runtime implementation | `partially reused/wired` | V2 controls are placed against existing frontend action contracts plus B11 recovery endpoints. Some proofs are mocked or focused; Raspberry/live auth/live playback/live abrupt-restart evidence remains outside this docs slice. |
| Shared V2 page wrapper | `visual/tested` | v0.10.34 adds `renderV2OperatorPageWrapper` as a reusable V2 shell wrapper; v0.10.35 extends the route shell to all nine V2 routes. |
| V2 Event history panel | `visual/tested` | v0.10.34 renders a reusable V2 event-history panel with existing `copy all log` and `Clear` actions. |
| V2 status/help metadata foundation | `visual/tested` | v0.10.39 keeps `dashboard/data/v2ImplementationStatus.json` synchronized with every rendered V2 status target and B3 status/help controls. |

| Recovery canonical state / strategy layer | `proven locally` | v0.10.87 completes the recovery OpenSpec correction: `recovery.snapshot.v1` is canonical project-owned state, `PF_V2_RECOVERY_ENGINE` selects strategy behavior, v1 remains file-backed/default, v2-stub is non-production but cross-engine state compatibility is proof-backed. Physical power-loss proof remains deferred. |

## Recovery architecture current status

| Layer | Current status | Proof/docs evidence | Numeric completeness |
|---|---|---|---:|
| Recovery service/subsystem | proven locally | `proof:v2-recovery-engine-contract`, `proof:v2-recovery-engine` | 10/10 |
| Canonical recovery state | proven locally | `proof:v2-recovery-canonical-state-contract`; `V2_RecoveryStateSchema.md` | 10/10 |
| Cross-engine strategy interchange | proven locally | `proof:v2-recovery-cross-engine-strategy-contract`; `V2_RecoveryEngineStrategyContract.md` | 10/10 |
| v1 file strategy | proven locally | v1 file-backed save/load/restart/resume proofs | 10/10 |
| v2-stub strategy | architecture proof only | understands canonical state, does not claim production recovery | 8/10 |
| Physical power-loss recovery | deferred | no physical unplug/reboot proof in this version | 0/10 |

## Page status matrix

| Page | Target role | Current intended state | Evidence needed before ready |
| --- | --- | --- | --- |
| `01 SETUP` | env/database readiness | `1A Verify .env` and `2A Database controls` reused/wired in V2 | Focused V2 placement/action tests exist; live environment/database proof still needed |
| `02 AUTHENTICATION` | NEW AUTH session readiness | `1A-STASH-OFF - NEW AUTH` reused/wired in V2 | Focused V2 placement/action tests exist; live auth/session proof still needed |
| `03 STARTUP` | Raspberry scheduler/startup | Raspberry scheduler controls plus RPI-STAGES/RPI-WORKERS are placed in V2 | Raspberry target crontab proof still needed |
| `04 WORKERS` | worker stage controls | B3.1-B3.5 worker cards plus shared status rows are placed in V2 | Live pipeline worker proof still needed |
| `05 TROUBLESHOOTING` | stale lock repair | `B6.1` Pipeline maintenance controls placed/wired to existing maintenance action IDs | stale-lock behavior proof + V2 placement test |
| `06 RECOVERY` | recovery state and restart flow | Manual save/load, autosave, restart-check, resume-target, canonical state, and strategy selection are wired through `recoveryService`; v1/default and v2-stub architecture proofs pass locally | Raspberry physical abrupt-stop/power-loss evidence still needed |
| `07 PIR` | activity/screen test | `B7.1` visible B5 subset and PIR emulator placed | route/render test now; deeper browser activity and hardware proof later |
| `08 PLAYBACK` | queue/rendering test | `B8.1` rendering target/mode subsection, `B8.2` browser-local drag/drop queue table, `B8.3` media-only backend queue-prepare bridge, and `B8.4` GPS/address metadata bridge placed | render/queue tests now; address overlay proof later |
| `09 REAL PLAYBACK` | final endpoint | Integrated layout/projection plus final autonomous bundle recovery-layer reporting for engine architecture, canonical state, cross-engine strategy, and deferred physical proof | Raspberry target autonomous/physical recovery evidence still needed |

## Shared component tracker

| Component | Intended pages | Status | Implementation notes | Evidence target |
| --- | --- | --- | --- | --- |
| Event Log / Event history | all current V2 pages | visual/tested | `renderV2OperatorPageWrapper` reuses `renderHistory` and existing copy/clear actions. v0.10.35 route shells inherit this wrapper. | V2 shell test confirms panel, copy action, clear action, renderer use, and route shells. |
| Latest backend result panel | Setup/Auth/Startup/Workers/Troubleshooting | reused candidate / partial V2 reuse | v0.10.40 reuses `renderResultSurface` for `01 SETUP → 1A Verify .env`. Existing `renderResultSurface` should be reused for the remaining backend cards. | Button/action tests confirm result surface updates in V2 context. |
| Response payload viewer | Setup/Auth/Startup/Workers | reused candidate | Existing JSON payload viewer should be reused. | Scroll/payload rendering test if changed. |
| Status/source badges | all pages | reused candidate | Existing badge renderers should be reused. | Snapshot/render assertions. |
| Per-section `?` icon | major sections/cards | visual/tested | v0.10.38 adds JSON-backed `?` buttons and a status/help modal; v0.10.39 adds sync coverage. | `tests/v2ImplementationStatusSync.test.js`. |
| `Explain controls` | top V2 shell | visual/tested | v0.10.36 adds the approved V2 toolbar button and reuses the existing frontend explain-control mode action. | `tests/v2ImplementationStatusSync.test.js`. |
| `Explain values` | top V2 shell | visual/tested | v0.10.36 adds the approved V2 toolbar button and reuses the existing frontend explain-value mode action. | `tests/v2ImplementationStatusSync.test.js`. |
| `Implementation status` | V2 shell only | visual/tested | v0.10.36 adds the toolbar button, v0.10.37 adds highlight classes, v0.10.38 adds `?` status/help modal, and v0.10.39 adds JSON/render/docs sync tests. | `tests/v2ImplementationStatusSync.test.js`. |
| `RPI-STAGES` row | Startup/Workers/Troubleshooting | visual row delivered / needs runtime proof | v0.10.44 shared media-stage status row. | `tests/v2StartupWorkersPlacement.test.js`; runtime projection proof later. |
| `RPI-WORKERS` row | Startup/Workers/Troubleshooting/PIR/Playback | visual row delivered / needs runtime proof | v0.10.45 shared worker-call status row. | `tests/v2StartupWorkersPlacement.test.js`; runtime projection proof later. |

## Page `01 SETUP` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `1A Verify .env` | wired/needs verification | v0.10.40 renders the control in V2 Setup using existing `verify-env` runtime action, shared latest backend result panel, response payload viewer, and local log entries. | Focused V2 render/action mapping test and backend endpoint regression test. |
| `2A Database controls` | wired/needs verification | v0.10.41 renders Check DB, Inspect DB, Delete DB, and Recreate DB in V2 Setup using existing runtime action IDs, shared result panel, response payload viewer, and local log entries. | Focused V2 render/action mapping test and DB endpoint regression test. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `02 AUTHENTICATION` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `1A-STASH-OFF NEW AUTH` | wired/needs verification | v0.10.42 renders NEW AUTH in V2 Authentication using existing `/api/auth/new/*` action IDs, shared action-row renderer, latest result surfaces, and sanitized local log entries. | Focused V2 render/action mapping test; secret/redaction regression test; new-auth endpoint proof. |
| Browser auth path | needs verification | Preferred path; may need runtime evidence. | New-auth proof/evidence pack. |
| CLI auth fallback | future/documented | Acceptable fallback if UI auth fails. | Runbook/proof once used. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `03 STARTUP` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| Raspberry scheduler controls | wired/needs verification | v0.10.43 renders the V2 Startup scheduler controls with Raspberry real-crontab target payloads while preserving existing scheduler action labels and backend contracts. | Raspberry hardware/crontab proof + V2 action tests. |
| Scheduler button concepts formerly tied to emulator | planned/needs verification | Keep the button concepts, but wire to real crontab/scheduler behavior, not Windows emulator. | Inspect crontab examples/configs; V2 action tests confirm no Windows emulator dependency. |
| WSL placeholder controls | future/placeholder | May exist only clearly marked WSL and disabled. | Render test confirms disabled state and labeling. |
| `RPI-STAGES` | visual row delivered / needs runtime proof | v0.10.44 adds the shared Download → Index → GPS parser → Geocode → Queue idle row to Startup, Workers, and Troubleshooting. | Runtime stage health projection and proof remain later. |
| `RPI-WORKERS` | visual row delivered / needs runtime proof | v0.10.45 adds Regular state worker, Playback worker, and On-off worker Waiting cards to Startup, Workers, Troubleshooting, PIR, and Playback. | Runtime worker-call projection and proof remain later. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages. | Future page-specific slices must keep using wrapper. |

## Page `04 WORKERS` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `B3.1 Download` | wired/needs verification | v0.10.46 adds a V2 Workers card with REAL `POST /api/runtime/download/run`, Run action `run-b3-1`, status badge, and local event log. | Live V2 button/backend proof and worker evidence remain later. |
| `B3.2 Index` | wired/needs verification | v0.10.46 adds a V2 Workers card with REAL `POST /api/runtime/index/run`, Run action `run-b3-2`, status badge, and local event log. | Live V2 button/backend proof and worker evidence remain later. |
| `B3.3 Parse GPS` | wired/needs verification | v0.10.46 adds a V2 Workers card with REAL `POST /api/runtime/gps/run`, Run action `run-b3-3`, status badge, and local event log. | Live V2 button/backend proof and worker evidence remain later. |
| `B3.4 Geocode` | wired/needs verification | v0.10.46 adds a V2 Workers card with REAL `POST /api/runtime/geocode/run`, Run action `run-b3-4`, status badge, and local event log. Geocoder is still the deterministic placeholder backend. | Live V2 button/backend proof and geocode evidence remain later. |
| `B3.5 Enqueue playback` | wired/needs verification | v0.10.46 adds a V2 Workers card with REAL `POST /api/runtime/queue/prepare`, Run action `run-b3-5`, status badge, and local event log. | Live V2 button/backend proof and queue evidence remain later. |
| `RPI-STAGES` | visual row delivered / needs runtime proof | v0.10.44 adds the shared Download → Index → GPS parser → Geocode → Queue idle row to Startup, Workers, and Troubleshooting. | Runtime stage health projection and proof remain later. |
| `RPI-WORKERS` | visual row delivered / needs runtime proof | v0.10.45 adds Regular state worker, Playback worker, and On-off worker Waiting cards to Startup, Workers, Troubleshooting, PIR, and Playback. | Runtime worker-call projection and proof remain later. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `05 TROUBLESHOOTING` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `Detect issues in pipeline` | wired/needs verification | v0.10.48 places the V2 Troubleshooting button on existing action ID `detect-pipeline-issues` and backend endpoint `POST /api/runtime/pipeline/issues/detect`. | Live stale-lock detection proof remains later. |
| `Clear stale locks` | wired/needs verification | v0.10.48 places the V2 Troubleshooting button on existing action ID `clear-stale-pipeline-locks` and backend endpoint `POST /api/runtime/pipeline/stale-locks/clear`. | Live stale-only clear proof remains later. |
| `RPI-STAGES` | visual row delivered / needs runtime proof | v0.10.44 adds the shared Download → Index → GPS parser → Geocode → Queue idle row to Startup, Workers, and Troubleshooting. | Runtime stage health projection and proof remain later. |
| `RPI-WORKERS` | visual row delivered / needs runtime proof | v0.10.45 adds Regular state worker, Playback worker, and On-off worker Waiting cards to Startup, Workers, Troubleshooting, PIR, and Playback. | Runtime worker-call projection and proof remain later. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `06 RECOVERY` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `SAVE STATE` button | placeholder/tested | v0.10.49 renders an alert-only button that alerts exactly `SAVE STATE`; no state is saved. | Later real save-state schema/proof. |
| `LOAD STATE` button | placeholder/tested | v0.10.49 renders an alert-only button that alerts exactly `LOAD STATE`; no state is loaded. | Later real load-state schema/proof. |
| `EMULATE POWER OFF` button | placeholder/tested | v0.10.49 renders an alert-only button that alerts exactly `EMULATE POWER OFF`; no process/power behavior is changed. | Later restart/recovery proof. |
| Lightweight saved state | future/needs design | At minimum must restore the same current media file/queue context; exact fields remain design-open. | State schema OpenSpec + unit tests. |
| Autosave | future/needs design | Likely state/stage-change based and/or resource-aware interval; decide after runtime inspection. | Durability/restart test. |
| Recovery worker | future | Cron-called worker detects restart and loads state. | Raspberry recovery proof. |

## Page `07 PIR` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| B5 visible subset | visual/tested | v0.10.50 renders the activity source checkboxes, Start Test, activity results, inactivity timeout, status rows, and screen controls-ready event row from the shared B5 activity state. | Deeper browser interaction proof later. |
| Mouse activity | needs verification | Can be tested directly. | Browser/UI activity test. |
| Keyboard activity | needs verification | Can be tested directly. | Browser/UI activity test. |
| PIR sensor | emulator/tested | v0.10.50 adds an `Emulate PIR signal` button that marks the B5 activity source as PIR without claiming hardware. | Later hardware proof. |
| Screen off/on behavior | needs verification | Tier-2 goal. | Inactivity timeout test. |
| `RPI-WORKERS` | visual row delivered / needs runtime proof | v0.10.45 adds Regular state worker, Playback worker, and On-off worker Waiting cards to Startup, Workers, Troubleshooting, PIR, and Playback. | Runtime worker-call projection and proof remain later. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `08 PLAYBACK` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| B4 rendering target/mode subsection | visual/tested | v0.10.51 renders Windows/Raspberry target tabs and playback rendering mode buttons from the shared playbackRenderer contract. Raspberry OS remains disabled. | Deeper playback/browser proof later. |
| Drag/drop queue | visual/tested | v0.10.57 keeps the drag/drop/file input queue browser-local while adding a media-only backend queue-prepare bridge and honest GPS/address metadata status fields. | Exact dropped-file upload/import and playback proof remain later; the bridge only requests backend queue preparation through the existing endpoint. |
| Type classification | visual/tested | v0.10.52 classifies dropped files as image/video/other by MIME type or extension and renders yes/no columns. | Deeper browser drop interaction test later. |
| Video duration | partial/browser-local | v0.10.52 starts browser metadata hydration for video duration when available, otherwise reports unavailable/pending. | Real-media browser metadata proof later. |
| GPS/address fields | contract/tested | v0.10.57 adds metadata presence flags for GPS/address, defaults browser-local files to explicit missing labels, and blocks fake address generation. | Real EXIF/pipeline metadata extraction and address overlay proof remain later; B9.4 now proves media/non-media behavior, queue request metadata preservation, and missing GPS/address handling. |
| Fullscreen playback | needs verification | Required for final victory. | Browser/native playback proof. |
| Address overlay | needs verification | Required when address exists; allow/require-address toggle is future design. | UI/proof evidence for visible address and graceful missing-address behavior. |
| `RPI-WORKERS` | visual row delivered / needs runtime proof | v0.10.45 adds Regular state worker, Playback worker, and On-off worker Waiting cards to Startup, Workers, Troubleshooting, PIR, and Playback. | Runtime worker-call projection and proof remain later. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `09 REAL PLAYBACK` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| Sidebar/page | visual/tested | v0.10.35 added the `09 REAL PLAYBACK` route/page shell. | Keep route/sidebar tests current. |
| Integrated layout | visual/tested | v0.10.59 B10.1 composes scheduler, RPI rows, B3.1-B3.5 worker cards, playback rendering controls, queue bridge, and metadata bridge from proven pieces only. | `tests/v2RealPlaybackComposition.test.js`. |
| Action flow/status projection | visual/tested | v0.10.60 B10.2 adds read-only scheduler/pipeline/queue/metadata/rendering/recovery-gate projection. | `tests/v2RealPlaybackProjection.test.js`. |
| Integrated real operation | future | Final autonomous runtime proof is not yet claimed. | Final autonomous playback proof. |
| Recovery schema | proven locally | v0.10.87 defines canonical `recovery.snapshot.v1` state with `metadata.createdByEngine` as provenance only; compatibility is schema-based. | `proof:v2-recovery-canonical-state-contract`; `V2_RecoveryStateSchema.md`. |
| Autonomous recovery strategy | proven locally / target proof pending | v1 file strategy and v2-stub cross-engine strategy contract are proof-backed; physical power-loss behavior is intentionally not claimed. | `proof:v2-recovery-cross-engine-strategy-contract`; future physical proof. |
| Screen on/off integration | future | Tier-2 goal. | Activity/recovery/playback integration proof. |

## Reporting requirement for future implementation

Every implementation handoff must include per-file diffstat:

| File | Added | Removed | Net | Purpose |
| --- | ---: | ---: | ---: | --- |

Also include:

- start timestamp;
- end timestamp;
- baseline HEAD;
- new HEAD;
- commit list;
- files inspected;
- approximate lines inspected;
- files changed;
- tests/proofs run;
- tests/proofs not run;
- preserved behavior;
- changed behavior;
- known risks/unresolved items.

## 3+2 ACR coverage expansion — status metadata and inventory requirements

Estonian timestamp: 2026-06-26 11:05 EEST

This section expands status coverage so future implementation can keep the V2 frontend overlay, structured JSON, and this Markdown tracker synchronized.

### Required status states

| Status value | Color | Meaning | Evidence required before use |
| --- | --- | --- | --- |
| `not_implemented` | red | Planned but not present or intentionally placeholder-only. | OpenSpec entry only. |
| `placeholder` | red or yellow | Visible UI exists but real behavior is not wired. | Render/alert test if visible. |
| `in_progress` | yellow | Implementation is underway or partially wired. | Work-in-progress commit and known gaps. |
| `needs_verification` | yellow | Believed to exist/work, but evidence is incomplete. | Inventory reference plus missing proof list. |
| `needs_solution` | red | Known or suspected problem. | Issue-register entry. |
| `wired` | yellow | UI calls intended endpoint/handler, but final proof is missing. | UI click test and backend endpoint mapping. |
| `done_proven` | green | Implemented, tested/proven, and documented. | Frontend test plus backend test/proof references. |
| `future` | red | Intentional later milestone. | OpenSpec boundary and issue/deferred note. |

The color names are operator-facing shorthand. Code may use semantic statuses, but the rendered overlay must map them to the agreed colors: green for done/proven, yellow for in-progress or needs verification, red for not implemented/needs solution/future.

### Required JSON fields per status item

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Stable unique ID, e.g. `v2.page04.downloadWorker`. |
| `page` | yes | One of the V2 page labels. |
| `label` | yes | Human-visible control/card/section name. |
| `kind` | yes | `page`, `section`, `button`, `row`, `value`, `overlay`, or `eventLog`. |
| `status` | yes | Semantic status from the table above. |
| `color` | yes | `green`, `yellow`, or `red` initially. |
| `componentSource` | yes | Existing path, extracted component path, new component path, or `inventory-pending`. |
| `endpoint` | when applicable | HTTP method/path or `visual-only`. |
| `tests` | yes | Empty array allowed only when status is not green. |
| `proofs` | yes | Empty array allowed only when status is not green. |
| `issueIds` | when applicable | Links to `V2_IssueRegister.md` IDs. |
| `docs` | yes | Markdown docs that describe this element. |
| `operatorNote` | yes | Plain-language current reality. |

### Historical inventory table template from pre-placement checkpoint

The table below is preserved for provenance from the pre-placement planning checkpoint. Current implementation truth is the page status matrix above plus the version notes below.

| V2 element | Current source path | Endpoint/handler | Existing test/proof | Reuse decision | V2 test needed | Status JSON ID | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `01 SETUP / Verify .env` | `dashboard/views/v2StartupOperatorMenuView.ts` + existing action | `POST /api/init/verify-env` | focused V2 tests | reused shared result/log surfaces | live endpoint proof | `v2.block.01.actions` | `wired_needs_verification` |
| `01 SETUP / Database controls` | V2 shared backend card/renderers | init DB endpoints | focused V2 tests | reused existing DB actions | live DB proof | `v2.block.01.actions` | `wired_needs_verification` |
| `02 AUTHENTICATION / NEW AUTH` | shared NEW AUTH action rows | `/api/auth/new/*` | focused V2 tests | extracted/reused | live auth proof | `v2.block.02.actions` | `wired_needs_verification` |
| `03 STARTUP / Raspberry scheduler` | inventory pending | cron/scheduler endpoints | inventory pending | inventory pending | crontab status actions | `v2.page03.scheduler` | `not_implemented` |
| `04 WORKERS / B3.1-B3.5` | `dashboard/data/v2OperatorCenterPanel.ts` + shared V2 backend card renderer | runtime worker endpoints | focused V2 render test | reuse existing runtime action IDs | live click/status proof later | `v2.block.04.worker-b3-*` | `wired_needs_verification` |
| `05 TROUBLESHOOTING / stale locks` | inventory pending | pipeline maintenance endpoints | inventory pending | inventory pending | stale-only behavior | `v2.page05.pipelineMaintenance` | `needs_verification` |
| `06 RECOVERY / placeholders` | new simple buttons | browser alerts first | none | new minimal component | exact alert tests | `v2.page06.recoveryPlaceholders` | `not_implemented` |
| `07 PIR / B5 subset` | inventory pending | activity handlers/PIR emulator | inventory pending | inventory pending | activity/emulator tests | `v2.page07.pirSimulation` | `needs_solution` |
| `08 PLAYBACK / drag-drop queue` | new component likely | visual/local first | none | new reusable queue component | file classification tests | `v2.page08.dragDropQueue` | `not_implemented` |
| `09 REAL PLAYBACK / explanation` | new page | visual only first | none | new page composition | render test | `v2.page09.realPlaybackExplanation` | `not_implemented` |

### Status synchronization checklist

Before any implementation report is final:

1. Update the structured JSON status file for every changed V2 element.
2. Update this Markdown tracker for every changed V2 element.
3. Update `V2_IssueRegister.md` when an unresolved item appears, changes status, or closes.
4. Ensure the V2 overlay labels and colors match the JSON.
5. Ensure any green status has actual test/proof references.
6. Include unresolved items/risks at the end of the report.


## v0.10.34 B2 shared infrastructure update

| Area | Status | Evidence |
| --- | --- | --- |
| Shared V2 page wrapper | `visual/tested` | `dashboard/views/v2OperatorPageWrapper.ts` wraps the existing V2 sidebar/main shell and centralizes Event history placement. |
| Event history placement | `visual/tested` | V2 renders `data-v2-event-history-panel`, heading `Event history`, `copy all log`, `Clear`, and reuses `renderHistory`. |
| Status/help metadata foundation | `visual/tested` | `dashboard/data/v2ImplementationStatus.json` is the chosen frontend-readable JSON source for B2/B3 status metadata. |
| Status overlay button | `planned` | B2 does not add the interactive `Implementation status` overlay button; that remains B3. |
| Per-section `?` icons | `planned` | B2 adds data attributes only; clickable question/status icons remain B3. |
| New pages `07`-`09` | `not implemented` | B2 did not add sidebar routes or page shells for `07 PIR`, `08 PLAYBACK`, or `09 REAL PLAYBACK`. |


## v0.10.35 B1 route-shell update

| Element | Status | Evidence/notes | Remaining work |
| --- | --- | --- | --- |
| `07 PIR` route/page shell | `visual/tested` | Sidebar route and center-panel shell blocks exist; page inherits shared V2 Event history wrapper. | Add visible B5 subset and PIR emulator in B7. |
| `08 PLAYBACK` route/page shell | `visual/tested` | Sidebar route and center-panel shell blocks exist; page inherits shared V2 Event history wrapper. | Add visible B4 subset and drag/drop queue in B8. |
| `09 REAL PLAYBACK` route/page shell | `visual/tested` | Sidebar route and explanation-only blocks exist; page documents future composition sources. | Compose only proven pieces later in B10. |


## v0.10.39 B3 implementation-status overlay findings

| V2 target | Current source path | Existing form | Endpoint/handler | Existing tests/proofs | Reuse decision | Missing V2 proof/test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V2 topbar explanation/status controls | `dashboard/views/v2OperatorPageWrapper.ts`; `dashboard/app.ts` | frontend-only toolbar buttons | existing `toggle-inspect-mode`, existing `toggle-value-inspect-mode`, local `toggle-v2-implementation-status` | `tests/v2ImplementationStatusSync.test.js` | reuse current explain modes; keep V2 status local/frontend-only | richer control/value copy for future real cards | visual/tested |
| V2 implementation-status highlights | `dashboard/styles.v2.css`; `dashboard/data/v2ImplementationStatus.json` | CSS highlight mode driven by `data-v2-implementation-status` | none | `tests/v2ImplementationStatusSync.test.js` | keep JSON as source for status color/class meaning | future green/done claims require stronger proofs | visual/tested |
| V2 per-section `?` status help | `dashboard/views/v2OperatorPageWrapper.ts`; `dashboard/views/v2StartupOperatorMenuView.ts`; `dashboard/app.ts` | per-surface help buttons opening a status/help modal | frontend modal only | `tests/v2ImplementationStatusSync.test.js` | reuse modal renderer; no duplicated per-page help markup | future text may need expansion as real cards land | visual/tested |
| V2 JSON/render sync check | `tests/v2ImplementationStatusSync.test.js` | automated registry coverage test | none | focused test passes for all nine routes | keep as guard before B4/B5 components are added | docs still require human judgement for status wording | tested |

## v0.10.47 docs/launcher reconciliation note

The root README files and this status document were refreshed after B5 so the repository entry points no longer describe the old six-page/no-action V2 baseline. The next planned implementation starts with B6.1 Troubleshooting pipeline maintenance, then B6.2 Recovery placeholders. See [`../../40_backlog_and_tasks/V2_NEXT_IMPLEMENTATION_PLAN_20260626.md`](../../40_backlog_and_tasks/V2_NEXT_IMPLEMENTATION_PLAN_20260626.md).


## v0.10.59-v0.10.62 B10/B11 update

| Slice | Status | Evidence/notes | Remaining work |
| --- | --- | --- | --- |
| `B10.1` `09 REAL PLAYBACK` layout | `visual/tested` | Final page now composes only proven surfaces: Raspberry scheduler controls, RPI-STAGES/RPI-WORKERS, B3.1-B3.5 worker cards, B8 rendering controls, B8 queue bridge, and B8 metadata bridge. | Final autonomous proof remains future. |
| `B10.2` status projection | `visual/tested` | Read-only projection summarizes scheduler, pipeline stages, queue bridge, metadata, rendering, and recovery gate state. | Projection is not a worker runner or recovery engine. |
| `B11.1` recovery schema | `schema/tested` | `dashboard/services/v2RecoveryStateSchema.ts` and `V2_RecoveryStateSchema.md` define same-media/queue-context recovery without exact timestamp requirement. | Manual save/load endpoints are implemented in B11.2; autosave/restart recovery is implemented in B11.3. |

| `B11.2` manual recovery endpoints | `wired/tested` | `POST /api/runtime/recovery/state/save`, `POST /api/runtime/recovery/state/load`, and `GET /api/runtime/recovery/state` persist same-media/queue-context snapshots without autoplay or secrets. | Live abrupt-restart proof remains required. |

| `B11.3` autosave/restart recovery flow | `wired/tested` | `POST /api/runtime/recovery/autosave` stores pre-shutdown/stage snapshots; `POST /api/runtime/recovery/restart-check` compares backend boot records and saved snapshots. | Live power-loss proof remains B12. |

| `B12` victory proof gate | `gate/tested` | `evaluateV2VictoryProofGate` requires scheduler/pipeline/queue/recovery prerequisites plus explicit live playback and recovery evidence. | Gate exists; live target-machine proof not passed in this sandbox. |


## v0.10.65 DOCS.2 status reconciliation

| Area | Status after reconciliation | Notes |
| --- | --- | --- |
| OpenSpec/page-level wording | `refreshed` | Removed stale setup/auth/troubleshooting/recovery/playback summaries that still described route-shell or visual-only states after B4-B12. |
| Structured JSON status source | `refreshed` | `dashboard/data/v2ImplementationStatus.json` page/block summaries now match v0.10.64 implementation reality while keeping live proof non-claims. |
| Root README/quickstart docs | `refreshed` | Root entry points now report v0.10.65 and the current integrated V2/recovery/proof-gate boundary. |
| B12 proof gate | `implemented/not live-passed` | The gate exists and blocks customer-ready claims until live autonomous playback and live abrupt-restart recovery evidence are supplied. |

## v0.10.68 numeric 3XACR status reconciliation

The durable numeric 3XACR tables live in [`../../50_audits_and_migrations/V2_NUMERIC_STATUS_3XACR_AND_DOC_HANDOFF_20260626.md`](../../50_audits_and_migrations/V2_NUMERIC_STATUS_3XACR_AND_DOC_HANDOFF_20260626.md). They add a conservative 1-10 completion estimate for OpenSpec coverage, implementation status, and the path toward the final `09 REAL PLAYBACK` goal.

Current headline scores from that pass:

| Area | Finished 1-10 | Reason |
| --- | ---: | --- |
| V2 route shell/status overlay | 9 | Implemented and tested across the nine-page V2 flow. |
| Recovery schema/manual/autosave/restart-check | 8 | Code and tests exist, but abrupt target restart evidence remains required. |
| `09 REAL PLAYBACK` composition/projection | 8 | Final page composes proven pieces and projects status, but does not prove autonomous target operation. |
| Playback page queue/render/metadata bridge | 7 | Browser-local queue and backend bridge tests exist; target fullscreen/address proof remains. |
| B12 proof gate/readiness manifest | 7 | Gate and manifest are implemented conservatively; live evidence is not attached. |
| Target live proof evidence | 3 | Scripts and required evidence categories exist, but live target playback/recovery/PIR proof has not been run in this checkpoint. |

This section does not change implementation truth. It only adds numeric readiness scoring for planning. Do not convert any target-live item to `proven` or green status until real target-machine evidence is attached.

