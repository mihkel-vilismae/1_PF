# V2 Implementation Status

Estonian timestamp: 2026-06-26 09:34 EEST

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

The top-right V2 `Implementation status` UI and each per-section `?` explanation must stay synchronized with this document.

Do not show a green/done state in the UI unless the corresponding row here is `tested` or `proven` with evidence.

## Current baseline summary

| Area | Current status | Notes |
| --- | --- | --- |
| V2 baseline | `visual` | v0.10.29 has startup option, six-item sidebar, and typed visual center-panel blocks. |
| Goals doc | `documented` | `docs/20_architecture_and_specs/v2_goals/goals.md` defines victory conditions. |
| New docs package | `planned/documented` | This document and companion OpenSpec files define next implementation direction. |
| Runtime implementation | `not changed by docs` | Documentation does not wire new UI behavior. |

## Page status matrix

| Page | Target role | Current intended state | Evidence needed before ready |
| --- | --- | --- | --- |
| `01 SETUP` | env/database readiness | reuse/extract existing controls | V2 render test + endpoint/action test |
| `02 AUTHENTICATION` | NEW AUTH session readiness | reuse existing NEW AUTH controls | V2 render test + new-auth endpoint proof |
| `03 STARTUP` | Raspberry scheduler/startup | reuse/extract Raspberry scheduler panel | Raspberry scheduler proof + V2 placement test |
| `04 WORKERS` | worker stage controls | reuse/extract B3 stage controls | worker endpoint proofs + V2 placement test |
| `05 TROUBLESHOOTING` | stale lock repair | reuse/extract pipeline maintenance controls | stale-lock behavior proof + V2 placement test |
| `06 RECOVERY` | recovery placeholder now; real recovery later | alert-only first | placeholder test first; later save/load/autosave/restart proof |
| `07 PIR` | activity/screen test | visible B5 subset only | mouse/keyboard test; PIR simulation/hardware proof later |
| `08 PLAYBACK` | queue/rendering test | visible B4 subset + drag/drop queue | rendering/queue tests; address overlay proof later |
| `09 REAL PLAYBACK` | final endpoint | explanation first, then composition | full autonomous playback + recovery proof |

## Shared component tracker

| Component | Intended pages | Status | Implementation notes | Evidence target |
| --- | --- | --- | --- | --- |
| Event Log / Event history | all V2 pages | extraction needed | Reuse existing log-entry renderer where possible; avoid page-local duplicates. | V2 render test confirms presence on each page. |
| Latest backend result panel | Setup/Auth/Startup/Workers/Troubleshooting | reused candidate | Existing `renderResultSurface` should be reused. | Button/action tests confirm result surface updates in V2 context. |
| Response payload viewer | Setup/Auth/Startup/Workers | reused candidate | Existing JSON payload viewer should be reused. | Scroll/payload rendering test if changed. |
| Status/source badges | all pages | reused candidate | Existing badge renderers should be reused. | Snapshot/render assertions. |
| Per-section `?` icon | major sections/cards | planned | New shared section wrapper or metadata-driven status control. | V2 status overlay test. |
| `Explain controls` | top V2 shell | planned | Keep current semantics if already present; otherwise add shared explain mode. | UI test toggles class/markers. |
| `Explain values` | top V2 shell | planned | Explains status/value rows. | UI test toggles class/markers. |
| `Implementation status` | top V2 shell | planned | New button; highlights elements by status. | UI test verifies status classes match metadata. |
| `RPI-STAGES` row | Startup/Workers/Troubleshooting | planned | Shared media-stage status row. | Render/status test. |
| `RPI-WORKERS` row | Startup/Workers/Troubleshooting/PIR/Playback | planned | Shared worker-call status row. | Render/status test. |

## Page `01 SETUP` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `1A Verify .env` | reused candidate | Existing View A control and endpoint are present. | V2 page render + click/action mapping to `POST /api/init/verify-env`. |
| `2A Database controls` | reused candidate | Existing View A DB buttons are present. | V2 page render + endpoint mapping for check/inspect/delete/recreate. |
| Event Log | extraction needed | Existing log rows exist in current cards. | Shared Event Log appears on page. |

## Page `02 AUTHENTICATION` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `1A-STASH-OFF NEW AUTH` | reused candidate | Existing View A NEW AUTH card and `/api/auth/new/*` actions exist. | V2 render/action test; secret boundary test. |
| Browser auth path | needs verification | Preferred path; may need runtime evidence. | New-auth proof/evidence pack. |
| CLI auth fallback | future/documented | Acceptable fallback if UI auth fails. | Runbook/proof once used. |
| Event Log | extraction needed | Auth logs exist. | Shared Event Log appears on page. |

## Page `03 STARTUP` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| Raspberry scheduler controls | reused candidate | Existing scheduler panel contains Windows and Raspberry target panels. | Extract/reuse Raspberry-safe panel only; V2 action tests. |
| Emulator-labeled buttons | needs decision | User requested labels but real path should avoid Windows emulator. | Keep test-only/visual unless explicitly approved. |
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
| Event Log | extraction needed | B3 cards already have status rows. | Shared Event Log appears on page. |

## Page `05 TROUBLESHOOTING` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `Detect issues in pipeline` | needs verification | User recalls it may work; exact behavior must be confirmed. | Test/proof documents stale lock detection semantics. |
| `Clear stale locks` | needs verification | User recalls it may work; exact behavior must be confirmed. | Test/proof documents stale-only clear semantics. |
| `RPI-STAGES` | planned | Shared row requested. | Render/status test. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | extraction needed | Need common placement. | Shared Event Log appears on page. |

## Page `06 RECOVERY` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| `SAVE STATE` button | placeholder | First implementation should only alert `SAVE STATE`. | Button alert test. |
| `LOAD STATE` button | placeholder | First implementation should only alert `LOAD STATE`. | Button alert test. |
| `EMULATE POWER OFF` button | placeholder | First implementation should only alert `EMULATE POWER OFF`. | Button alert test. |
| Lightweight saved state | future/needs design | Must be small enough for frequent autosave. | State schema OpenSpec + unit tests. |
| Autosave | future | Required for real recovery. | Durability/restart test. |
| Recovery worker | future | Cron-called worker detects restart and loads state. | Raspberry recovery proof. |

## Page `07 PIR` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| B5 visible subset | reused candidate | Existing activity model/rendering likely exists, but exact extraction needed. | V2 render test for visible subset only. |
| Mouse activity | needs verification | Can be tested directly. | Browser/UI activity test. |
| Keyboard activity | needs verification | Can be tested directly. | Browser/UI activity test. |
| PIR sensor | needs solution | Signal likely needs emulation/simulation until hardware is available. | PIR emulator contract + later hardware proof. |
| Screen off/on behavior | needs verification | Tier-2 goal. | Inactivity timeout test. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | extraction needed | Need common placement. | Shared Event Log appears on page. |

## Page `08 PLAYBACK` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| B4 rendering target/mode subsection | reused candidate | Existing View B B4 rendering controls exist. | V2 render test for visible subsection only. |
| Drag/drop queue | planned | New client-side or backend-backed queue needs design. | File drop/table test. |
| Type classification | planned | Must classify image/video/other. | Unit/UI test. |
| Video duration | planned | Can use browser metadata or backend helper. | Media metadata test. |
| GPS/address fields | needs verification | Extraction/address may require backend pipeline. | Metadata/pipeline integration proof. |
| Fullscreen playback | needs verification | Required for final victory. | Browser/native playback proof. |
| Address overlay | needs verification | Required for final victory. | UI/proof evidence. |
| `RPI-WORKERS` | planned | Shared row requested. | Render/status test. |
| Event Log | extraction needed | Need common placement. | Shared Event Log appears on page. |

## Page `09 REAL PLAYBACK` status

| Element | Status | Current evidence/notes | Required next proof/test |
| --- | --- | --- | --- |
| Sidebar/page | planned | New page requested. | V2 route/sidebar test. |
| Explanation text | planned | Initial page should document composition intent. | Render test. |
| Integrated real operation | future | Must be assembled from proven parts only. | Final autonomous playback proof. |
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
