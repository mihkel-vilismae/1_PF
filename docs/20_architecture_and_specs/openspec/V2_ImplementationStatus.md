# V2 Implementation Status

Estonian timestamp: 2026-06-26 10:54 EEST

## Status

Authoritative implementation-status tracker for the planned V2 operator pages and the path to `09 REAL PLAYBACK`.

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
| V2 baseline | `visual` | v0.10.35 has startup option, nine-item sidebar, shared Event history placement, typed visual center-panel blocks, and shell/explanation pages for `07`-`09`. |
| Goals doc | `documented` | `docs/20_architecture_and_specs/v2_goals/goals.md` defines victory conditions. |
| New docs package | `planned/documented` | This document and companion OpenSpec files define next implementation direction. |
| Runtime implementation | `not changed by docs` | Documentation does not wire new backend/runtime behavior. |
| Shared V2 page wrapper | `visual/tested` | v0.10.34 adds `renderV2OperatorPageWrapper` as a reusable V2 shell wrapper; v0.10.35 extends the route shell to all nine V2 routes. |
| V2 Event history panel | `visual/tested` | v0.10.34 renders a reusable V2 event-history panel with existing `copy all log` and `Clear` actions. |
| V2 status/help metadata foundation | `visual/tested` | v0.10.39 keeps `dashboard/data/v2ImplementationStatus.json` synchronized with every rendered V2 status target and B3 status/help controls. |

## Page status matrix

| Page | Target role | Current intended state | Evidence needed before ready |
| --- | --- | --- | --- |
| `01 SETUP` | env/database readiness | `1A Verify .env` reused/wired in V2; DB controls pending | V2 render test + endpoint/action test |
| `02 AUTHENTICATION` | NEW AUTH session readiness | reuse existing NEW AUTH controls | V2 render test + new-auth endpoint proof |
| `03 STARTUP` | Raspberry scheduler/startup | reuse/extract Raspberry scheduler panel | Raspberry scheduler proof + V2 placement test |
| `04 WORKERS` | worker stage controls | reuse/extract B3 stage controls | worker endpoint proofs + V2 placement test |
| `05 TROUBLESHOOTING` | stale lock repair | reuse/extract pipeline maintenance controls | stale-lock behavior proof + V2 placement test |
| `06 RECOVERY` | recovery placeholder now; real recovery later | alert-only first | placeholder test first; later save/load/autosave/restart proof |
| `07 PIR` | activity/screen test | shell implemented; visible B5 subset later | route render test now; mouse/keyboard test and PIR simulation/hardware proof later |
| `08 PLAYBACK` | queue/rendering test | shell implemented; visible B4 subset + drag/drop queue later | route render test now; rendering/queue tests and address overlay proof later |
| `09 REAL PLAYBACK` | final endpoint | explanation-only shell implemented; composition later | route render test now; full autonomous playback + recovery proof later |

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
| `RPI-STAGES` row | Startup/Workers/Troubleshooting | planned | Shared media-stage status row. | Render/status test. |
| `RPI-WORKERS` row | Startup/Workers/Troubleshooting/PIR/Playback | planned | Shared worker-call status row. | Render/status test. |

## Page `01 SETUP` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `1A Verify .env` | wired/needs verification | v0.10.40 renders the control in V2 Setup using existing `verify-env` runtime action, shared latest backend result panel, response payload viewer, and local log entries. | Focused V2 render/action mapping test and backend endpoint regression test. |
| `2A Database controls` | reused candidate | Existing View A DB buttons are present. | V2 page render + endpoint mapping for check/inspect/delete/recreate. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `02 AUTHENTICATION` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `1A-STASH-OFF NEW AUTH` | reused candidate | Existing View A NEW AUTH card and `/api/auth/new/*` actions exist. | V2 render/action test; secret boundary test. |
| Browser auth path | needs verification | Preferred path; may need runtime evidence. | New-auth proof/evidence pack. |
| CLI auth fallback | future/documented | Acceptable fallback if UI auth fails. | Runbook/proof once used. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `03 STARTUP` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| Raspberry scheduler controls | reused candidate | Existing scheduler panel contains Windows and Raspberry target panels. | Extract/reuse Raspberry-safe panel only; V2 action tests. |
| Scheduler button concepts formerly tied to emulator | planned/needs verification | Keep the button concepts, but wire to real crontab/scheduler behavior, not Windows emulator. | Inspect crontab examples/configs; V2 action tests confirm no Windows emulator dependency. |
| WSL placeholder controls | future/placeholder | May exist only clearly marked WSL and disabled. | Render test confirms disabled state and labeling. |
| `RPI-STAGES` | planned | Shared row requested. | Render/status test. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | extraction needed | Scheduler endpoint terminal exists separately. | Decide relation to global Event Log. |

## Page `04 WORKERS` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `B3.1 Download` | reused candidate | Existing runtime endpoint path known. | V2 render + action test + worker proof. |
| `B3.2 Index` | reused candidate | Existing runtime endpoint path known. | V2 render + action test + worker proof. |
| `B3.3 Parse GPS` | reused candidate | Existing runtime endpoint path known. | V2 render + action test + worker proof. |
| `B3.4 Geocode` | reused candidate | Existing runtime endpoint path known. | V2 render + action test + geocode proof. |
| `B3.5 Enqueue playback` | reused candidate | Existing runtime endpoint path known. | V2 render + action test + queue proof. |
| `RPI-STAGES` | planned | Shared row requested. | Render/status test. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `05 TROUBLESHOOTING` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `Detect issues in pipeline` | needs verification | User recalls it may work; exact behavior must be confirmed. | Test/proof documents stale lock detection semantics. |
| `Clear stale locks` | needs verification | User recalls it may work; exact behavior must be confirmed. | Test/proof documents stale-only clear semantics. |
| `RPI-STAGES` | planned | Shared row requested. | Render/status test. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `06 RECOVERY` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `SAVE STATE` button | placeholder | First implementation should only alert `SAVE STATE`. | Button alert test. |
| `LOAD STATE` button | placeholder | First implementation should only alert `LOAD STATE`. | Button alert test. |
| `EMULATE POWER OFF` button | placeholder | First implementation should only alert `EMULATE POWER OFF`. | Button alert test. |
| Lightweight saved state | future/needs design | At minimum must restore the same current media file/queue context; exact fields remain design-open. | State schema OpenSpec + unit tests. |
| Autosave | future/needs design | Likely state/stage-change based and/or resource-aware interval; decide after runtime inspection. | Durability/restart test. |
| Recovery worker | future | Cron-called worker detects restart and loads state. | Raspberry recovery proof. |

## Page `07 PIR` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| B5 visible subset | reused candidate | Existing activity model/rendering likely exists, but exact extraction needed. | V2 render test for visible subset only. |
| Mouse activity | needs verification | Can be tested directly. | Browser/UI activity test. |
| Keyboard activity | needs verification | Can be tested directly. | Browser/UI activity test. |
| PIR sensor | needs solution | Add a PIR-emulation button first; real hardware proof comes later. | PIR emulator contract + later hardware proof. |
| Screen off/on behavior | needs verification | Tier-2 goal. | Inactivity timeout test. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `08 PLAYBACK` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| B4 rendering target/mode subsection | reused candidate | Existing View B B4 rendering controls exist. | V2 render test for visible subsection only. |
| Drag/drop queue | planned | New queue accepts images, videos, and other files; non-media entries are reported as not playable when selected. | File drop/table and not-playable handling tests. |
| Type classification | planned | Must classify image/video/other. | Unit/UI test. |
| Video duration | planned | Can use browser metadata or backend helper. | Media metadata test. |
| GPS/address fields | needs verification | Extraction/address may require backend pipeline; missing-address policy will use a future toggle. | Metadata/pipeline integration proof plus missing-address handling test. |
| Fullscreen playback | needs verification | Required for final victory. | Browser/native playback proof. |
| Address overlay | needs verification | Required when address exists; allow/require-address toggle is future design. | UI/proof evidence for visible address and graceful missing-address behavior. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | visual/tested | Shared V2 wrapper renders Event history for current V2 pages, including `07`-`09` route shells. | Future page-specific slices must keep using wrapper. |

## Page `09 REAL PLAYBACK` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| Sidebar/page | planned | New page requested. | V2 route/sidebar test. |
| Explanation text | planned | Initial page should document composition intent. | Render test. |
| Integrated real operation | future | Must be assembled from proven parts only; test-only controls may appear disabled. | Final autonomous playback proof. |
| Autonomous recovery | future | Must recover after rough shutdown/power loss. | Final recovery proof. |
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

### Inventory table template for next checkpoint

The next non-UI checkpoint should fill this table from actual code inspection.

| V2 element | Current source path | Endpoint/handler | Existing test/proof | Reuse decision | V2 test needed | Status JSON ID | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `01 SETUP / Verify .env` | inventory pending | `POST /api/init/verify-env` | inventory pending | inventory pending | render/click/result | `v2.page01.verifyEnv` | `not_implemented` |
| `01 SETUP / Database controls` | inventory pending | init DB endpoints | inventory pending | inventory pending | render/click/result | `v2.page01.databaseControls` | `not_implemented` |
| `02 AUTHENTICATION / NEW AUTH` | inventory pending | `/api/auth/new/*` | inventory pending | inventory pending | render/click/result | `v2.page02.newAuth` | `not_implemented` |
| `03 STARTUP / Raspberry scheduler` | inventory pending | cron/scheduler endpoints | inventory pending | inventory pending | crontab status actions | `v2.page03.scheduler` | `not_implemented` |
| `04 WORKERS / B3.1-B3.5` | inventory pending | runtime worker endpoints | inventory pending | inventory pending | per-worker click/status | `v2.page04.workerCards` | `not_implemented` |
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
