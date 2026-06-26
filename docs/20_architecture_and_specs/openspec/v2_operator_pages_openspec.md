# V2 Operator Pages OpenSpec

Estonian timestamp: 2026-06-26 10:54 EEST

## Status

Documentation-only OpenSpec. This document defines the V2 operator page architecture that must guide later implementation. It is not proof that V2 already works.

## Authority and relationship to goals

The V2 operator pages are the staged path toward `09 REAL PLAYBACK`.

The victory goals are defined in [`../v2_goals/goals.md`](../v2_goals/goals.md):

1. autonomous playback after login and Raspberry-oriented scheduler/cron installation;
2. autonomous recovery after rough shutdown or power loss;
3. second-tier screen on/off behavior from mouse, keyboard, and PIR activity.

This OpenSpec translates those goals into page structure, component placement, reuse rules, status tracking, and proof boundaries.

The implementation-planning answers are recorded in [`V2_HRDecisionLog.md`](V2_HRDecisionLog.md). Where this OpenSpec previously held an open question, the decision log is the current operator decision source.

## Implementation boundary

V2 implementation must be regression-safe and reuse-first:

- Do not copy/paste large HTML blocks from View A, View B, Debug, Real Mode, or any screenshot-derived source.
- If the same visible element already exists, reuse the existing component or extract a shared component.
- If a source page currently contains page-local markup, factor the reusable part before rendering it in V2.
- Keep endpoint and handler behavior centralized. A moved/reused control must not silently call a different endpoint.
- The first V2 implementation pass may render visual placement without functional wiring, but the status overlay and `V2_ImplementationStatus.md` must state that honestly.
- Do not claim a control is working merely because it is visible.

## Page model

The V2 sidebar must become a nine-page operator structure.

| Order | Page | Role |
| ---: | --- | --- |
| `01` | `SETUP` | environment and database readiness |
| `02` | `AUTHENTICATION` | iCloudPD/new-auth readiness and session visibility |
| `03` | `STARTUP` | Raspberry-oriented scheduler/startup controls |
| `04` | `WORKERS` | worker/stage controls and pipeline visibility |
| `05` | `TROUBLESHOOTING` | stale-lock and pipeline repair visibility |
| `06` | `RECOVERY` | manual placeholder controls first, future save/load/autosave recovery |
| `07` | `PIR` | isolated activity and screen on/off testing |
| `08` | `PLAYBACK` | isolated playback queue/rendering testing |
| `09` | `REAL PLAYBACK` | final integrated real-use endpoint page |

Pages `01` through `08` are staging/proving pages. `09 REAL PLAYBACK` is the final composed operational page.

## Shared page shell requirements

Every V2 page must share these shell behaviors when implemented:

| Shared element | Requirement |
| --- | --- |
| Version display | Top-right version number remains visible as usual. |
| `Explain controls` | A top control that visually explains/highlights clickable controls. |
| `Explain values` | A top control that visually explains/highlights status/value rows. |
| `Implementation status` | A top control that highlights V2 elements by implementation state. |
| Per-section `?` icon | Every major card/section/div has a small top-right question/status icon. Clicking it shows the section status/explanation. |
| Event Log | Event history/log appears on every V2 view. |

The top control `Show marked for removal` must not be part of the V2 page shell.

## Implementation status overlay

The `Implementation status` button is scoped to V2 pages only. It must expose reality, not optimism. The overlay should highlight clickable elements and major parent sections/cards using a structured implementation-status JSON file that the V2 frontend can read.

The frontend-readable JSON source is `dashboard/data/v2ImplementationStatus.json`. That JSON source, [`V2_ImplementationStatus.md`](V2_ImplementationStatus.md), and the rendered V2 status attributes/overlay must remain synchronized. The requirement is a structured JSON source, not hand-written duplicate status strings scattered across components.

| Status/color | Meaning | Required boundary |
| --- | --- | --- |
| green | done/proven | Only use when implementation and tests/proofs support the claim. |
| yellow | in progress | Use for partial work or actively wired but not fully proven controls. |
| red | not implemented | Use for planned/missing behavior or known gaps. |
| additional colors | optional later refinement | Must be documented before use. |

A status shown in UI must match the implementation status document, the structured JSON, and the available test/proof evidence. If evidence is missing, the status must say so.

## Shared reusable components

Later implementation should first inventory and reuse/extract these component families.

| Component family | Existing source likely involved | V2 use |
| --- | --- | --- |
| Event history/log rows | `dashboard/services/renderers.ts` and current log surfaces | every page |
| Latest backend result | existing `renderResultSurface` behavior | Setup, Auth, Startup, Workers, Troubleshooting |
| Response payload viewer | existing result JSON block | Setup, Auth, Startup, Workers |
| Status badges/source badges | shared renderers | all operational cards |
| Auth action rows | `NEW AUTH` card from View A | `02 AUTHENTICATION` |
| Scheduler target panel | shared `schedulerActionRows` renderer extracted from View A | `03 STARTUP`, Raspberry-focused |
| Worker/stage card pattern | shared `RPI-STAGES` visual row plus later B3/Test stage cards | `03 STARTUP`, `04 WORKERS`, `05 TROUBLESHOOTING`, later `09 REAL PLAYBACK` status summary |
| B4 rendering controls | View B playback selection | `08 PLAYBACK`, later `09 REAL PLAYBACK` |
| B5 activity controls | View B / OS playback activity model | `07 PIR`, later `09 REAL PLAYBACK` |
| RPI-STAGES row | current/status row if existing, otherwise extract from status model | Startup, Workers, Troubleshooting |
| RPI-WORKERS row | current/status row if existing, otherwise extract from status model | Startup, Workers, Troubleshooting, PIR, Playback |

If any of these are currently embedded in large page render functions, implementation should extract a narrow reusable renderer instead of duplicating the markup.

## Global Event Log requirement

Each V2 page must include an Event Log / Event history panel similar to the reference UI:

- heading `Event history` or page-consistent equivalent;
- `copy all log` action;
- `Clear` action;
- scrollable event cards;
- timestamps;
- status chips such as `SUCCESS` or `INFO`;
- descriptive event text.

The first shared-infrastructure implementation reuses the existing `renderHistory` event renderer through `dashboard/views/v2OperatorPageWrapper.ts`. Later V2 pages must use that wrapper or an extracted successor rather than duplicating event-log markup.

## Page `01 SETUP`

### Required components

| Item | Component | Notes |
| --- | --- | --- |
| `1A` | `Verify .env` | Validate required configuration keys. |
| `2A` | `Database controls` | Check, inspect, delete, and recreate DB controls. |
| shared | Event Log | Page-local events plus global V2 event surface. |

### `Verify .env` expected content

- title `Verify .env`;
- status badge;
- description about validating required configuration keys;
- `Run` button;
- `Latest backend result` section;
- Operation/Endpoint/Updated rows;
- endpoint `POST /api/init/verify-env`;
- response payload viewer;
- event/log rows below.

### `Database controls` expected content

- title `Database controls`;
- status badge;
- v0.10.41 V2 placement reuses existing `check-db`, `inspect-db`, `delete-db`, and `recreate-db` action IDs;
- description about documented init endpoints;
- buttons `Check DB`, `Inspect DB`, `Delete DB`, `Recreate DB`;
- latest backend result section;
- endpoint example `GET /api/init/database/status`;
- response payload viewer;
- event/log rows below.

### Proof boundary

If these controls are reused from existing View A, the V2 implementation must add or extend tests so the same controls are proven in the V2 page placement.

## Page `02 AUTHENTICATION`

### Required component

| Item | Component | Notes |
| --- | --- | --- |
| `1A-STASH-OFF` | `NEW AUTH` | New auth controls only. |
| shared | Event Log | Page-local and global auth history. |

### Required auth actions

v0.10.42 renders the V2 Authentication `1A-STASH-OFF - NEW AUTH` card with the existing shared NEW AUTH action-row renderer and these endpoint intents. It must stay on the `new-auth-*` action family and must not reuse old login-card action IDs.

| Button | Endpoint intent |
| --- | --- |
| `Verify iCloudPD install` | `POST /api/auth/new/verify-icloudpd` |
| `Verify with iCloudPD` | `GET /api/auth/new/status` |
| `Login using .env values` | `POST /api/auth/new/login` |
| `Check login` | `GET /api/auth/new/status?mode=passive` |
| `Log out and remove existing session` | `POST /api/auth/new/logout` |
| `Show auth/session paths and files` | `GET /api/auth/new/session-files` |
| `Generate auth evidence pack` | `POST /api/auth/new/artifacts/generate` |
| `List auth evidence packs` | `GET /api/auth/new/artifacts` |

### Auth fallback note

The browser UI/new-auth path is preferred. If browser auth proves unreliable, command-line auth may be used as an operator fallback. That fallback must be documented and must not leak credentials, 2FA values, cookies, or session secrets into UI/docs/proofs.

## Page `03 STARTUP`

### Required components

| Item | Component | Notes |
| --- | --- | --- |
| `3A` | Scheduler controls | Raspberry part is the real target. |
| shared | `RPI-STAGES / Media pipeline stage row` | Also appears on Workers and Troubleshooting. |
| shared | `RPI-WORKERS / Worker call status row` | Also appears on Workers, Troubleshooting, PIR, Playback. |
| shared | Event Log | Scheduler/startup history. |

### Scheduler controls rule

The real path must not depend on the Windows custom cron emulator. Raspberry/Raspberry-related crontab is the implementation target. WSL controls may exist only as clearly marked disabled placeholders for development visibility.

The user requested the scheduler button concepts from the screenshot to remain, but their behavior must be repurposed to real crontab/scheduler behavior instead of Windows emulator behavior:

- `Check emulator scheduler` concept → check real crontab/scheduler state;
- `Run emulator` concept → run the relevant crontab-backed scheduler/worker action manually or by approved real-path trigger;
- `Stop emulator` concept → stop/disable the relevant crontab-backed path where supported;
- `Install crontab` → install project-owned crontab block;
- `Get active crontab` → print/read active project-owned crontab state.

The final labels may be adjusted during implementation if needed for honesty, but the controls must not call or depend on the deprecated Windows cron emulator. Cron intervals must be customizable, with existing crontab examples/configs inspected before choosing defaults.

### Raspberry scheduler actions

The real scheduler panel should expose Raspberry-safe controls such as:

- `Install scheduler`;
- `Check scheduler`;
- `Print scheduler`;
- latest backend result for routes such as `GET /api/init/cron/status`.

## Page `04 WORKERS`

### Required worker cards

| Item | Title | Endpoint intent |
| --- | --- | --- |
| `B3.1` | `Download` | `POST /api/runtime/download/run` |
| `B3.2` | `Index` | `POST /api/runtime/index/run` |
| `B3.3` | `Parse GPS` | `POST /api/runtime/gps/run` |
| `B3.4` | `Geocode` | `POST /api/runtime/geocode/run` |
| `B3.5` | `Enqueue playback` | `POST /api/runtime/queue/prepare` |

Each card should include:

- `REAL` badge;
- circular or equivalent `Idle` status;
- `Run` button;
- endpoint text;
- local event/status row.

### Additional shared rows

- `RPI-STAGES / Media pipeline stage row`;
- `RPI-WORKERS / Worker call status row`;
- Event Log.

## Page `05 TROUBLESHOOTING`

### Required controls

| Section | Controls |
| --- | --- |
| `Pipeline maintenance` | `Detect issues in pipeline`, `Clear stale locks` |

Purpose: detect stale persisted pipeline locks and clear only stale locks.

### Verification boundary

These controls may already work, but their exact behavior must be rediscovered from code/docs/tests. They must remain `needs verification` until a current test/proof confirms what they do and confirms the V2 placement.

### Additional shared rows

- `RPI-STAGES / Media pipeline stage row`;
- `RPI-WORKERS / Worker call status row`;
- Event Log.

## Page `06 RECOVERY`

### Initial placeholder controls

| Button | Initial behavior |
| --- | --- |
| `SAVE STATE` | browser alert with exactly `SAVE STATE` |
| `LOAD STATE` | browser alert with exactly `LOAD STATE` |
| `EMULATE POWER OFF` | browser alert with exactly `EMULATE POWER OFF` |

### Future recovery contract

The placeholder UI is not the end goal. The recovery page exists because real operation must survive rough shutdown and power loss.

Future intended behavior:

1. The running system periodically saves lightweight runtime state.
2. `SAVE STATE` manually persists the current state.
3. `EMULATE POWER OFF` simulates rough shutdown/power-loss behavior for testing.
4. After restart, `LOAD STATE` restores the last saved state.
5. In the real path, a Raspberry cron/worker lane detects possible restart recovery, sets `recovery in process`, calls load/recovery behavior, and resumes operation.
6. Playback recovery may restore the same media item and start from the beginning; exact video timestamp resume is not required.

### State-size principle

The saved state must be lightweight enough for frequent autosave. It should identify at least the current media item and queue context so playback can continue from the same file after restart. Exact video timestamp recovery is not required.

The exact recovery-state schema remains a design decision after code inventory. Candidate fields include current media file, queue position, playback mode, screen state, last activity source, worker stage/status, `recovery in progress` flag, scheduler/crontab status, and auth/session readiness. It must not become a giant database dump.

Autosave policy remains open. The expected direction is autosave on important state/stage changes and/or a resource-aware interval after runtime cost is understood.

## Page `07 PIR`

### Required visible subset only

Add `B5 Screen on-off simulation`, but only the items displayed in the provided reference image.

| Section | Required items |
| --- | --- |
| `B5 activity detection test sources` | checkboxes `PIR sensor`, `Mouse movement`, `Keyboard activity` |
| `Activity detection test` | explanation, `Start Test`, `Ready to start` |
| `Activity detection results` | `PIR sensor pending`, `Mouse movement pending`, `Keyboard activity pending` |
| config/status rows | `Inactivity timeout: 5 seconds`, `Current screen state: ON`, `Last activity source: None`, `Shared timeout: 5s`, `Playback checkpoint: No checkpoint yet` |
| local event row | `Screen simulation controls ready.` |

### PIR status boundary

Mouse and keyboard can be tested directly. PIR sensor signal gets an emulation button first: clicking it simulates receiving a PIR signal until real hardware input is available and proven. PIR hardware integration remains a later target.

### Additional shared rows

- `RPI-WORKERS / Worker call status row`;
- Event Log.

## Page `08 PLAYBACK`

### Required B4 visible subsection only

Add only the visible rendering target/mode subsection of B4 Playback selection.

| Area | Required items |
| --- | --- |
| `Rendering target` | explanation, `Windows`, `Raspberry OS (disabled)` |
| `Rendering mode` | explanation, `Playback without rendering`, `Show real rendering in preview window`, `Switch to fullscreen` |
| status/info row | `Run B4 successfully before changing rendering mode or target.` |

### Drag/drop playback queue

Add a drag-and-drop element that accepts:

- images;
- videos;
- other/random files.

Dropped files form the queue that the playback page chooses from.

After files are added, display them in a table with at least:

| Column | Rule |
| --- | --- |
| `Filename` | always shown |
| `Type` | image/video/other classification |
| `Duration` | for videos when available |
| `GPS coordinates` | if available, otherwise blank/unknown |
| `Address string` | if available, otherwise blank/unknown |

### Invalid/non-media boundary

The drag/drop area may accept other files for operator visibility/testing. Non-media files may enter the `08 PLAYBACK` queue/table, but when selected for playback the system must handle them gracefully and report that the file is not an image or video instead of trying to play it.

In the real media pipeline, corrupt, partial, invalid, or non-media items must not pollute the database or advance through real media stages. Corrupt/incomplete downloads should be deleted and redownloaded where possible, leveraging provider integrity behavior such as iCloudPD checks when available.

### Additional shared rows

- `RPI-WORKERS / Worker call status row`;
- Event Log.

## Page `09 REAL PLAYBACK`

### Initial content

At first, `09 REAL PLAYBACK` should contain explanatory text only. It should state that earlier pages are isolated proving pages and this page is the final integrated endpoint.

### Final composition

When proven pieces exist, `09 REAL PLAYBACK` should compose the minimum real operational surface from:

| Source page | Contribution |
| --- | --- |
| `02 AUTHENTICATION` | auth/session readiness summary |
| `03 STARTUP` | Raspberry scheduler/cron status |
| `04 WORKERS` | active worker/pipeline status |
| `06 RECOVERY` | recovery state/status |
| `07 PIR` | activity/screen state |
| `08 PLAYBACK` | playback queue/rendering/current media |
| shared | Event Log and Implementation status overlay |

Do not bring every testing button into `09` as active operator behavior. Test-related controls may be present for visibility, but they must be disabled unless explicitly promoted into the real operational path.

## RPI-STAGES row

This shared element appears on `03 STARTUP`, `04 WORKERS`, and `05 TROUBLESHOOTING`.

Visible structure:

- label `RPI-STAGES`;
- title `Media pipeline stage row`;
- stage cards `Download`, `Index`, `GPS parser`, `Geocode`, `Queue`;
- each stage shows `Idle` initially;
- pipeline label `DOWNLOAD → INDEX → GPS PARSER → GEOCODE → QUEUE`.

## RPI-WORKERS row

This shared element appears on `03 STARTUP`, `04 WORKERS`, `05 TROUBLESHOOTING`, `07 PIR`, and `08 PLAYBACK`.

Visible structure:

| Worker card | Initial visible state | Description |
| --- | --- | --- |
| `Regular state worker` | `Waiting`, `Last called: Never`, `Since last call: No worker call observed yet` | owns Download → Index → GPS parser → Geocode → Queue checks |
| `Playback worker` | same initial state | selects current playable queue items while UI/fullscreen owns rendering |
| `On-off worker` | same initial state | tracks screen wake/keep-on state before PIR/mouse/keyboard reuse |

## Testing/proof policy

Before a moved/reused control is marked ready:

1. locate the original component/control and endpoint;
2. locate existing tests/proofs for original behavior;
3. if the reused control lacks a quick/reasonable test, add that test before continuing; if coverage would be large, document the gap and align before proceeding;
4. reuse or extend tests/proofs for the new V2 placement;
5. verify that frontend buttons work and handle backend replies gracefully, including success and error display behavior instead of crashing on failures such as HTTP 500;
6. verify backend endpoints separately with backend tests/proofs;
7. update `V2_ImplementationStatus.md` with the actual evidence;
8. keep unknowns marked as `needs verification`;
9. keep suspected broken areas marked as `needs solution`.

Final evidence should include both an autonomous playback proof and an autonomous recovery proof. The playback proof should cover auth, one-or-more-file download, pipeline progression, queue insertion, and media display. The recovery proof should simulate abrupt termination/restart and verify the restored state is acceptable for continued operation.

## Address overlay policy

The final address/GPS playback rule is intentionally deferred until implementation design. The UI should plan for a toggle/control that can switch between allowing playback without an address and requiring address data before playback selection. Until that toggle is designed, media with missing address data should be handled honestly and visibly rather than treated as a failure of the entire playback system.

## Definition of done for `09 REAL PLAYBACK`

`09 REAL PLAYBACK` is working only when evidence shows:

1. user login/auth succeeds;
2. Raspberry scheduler/cron jobs are installed and active;
3. downloads start according to configured runtime rules;
4. files progress through Download, Index, GPS parser, Geocode, and Queue;
5. GPS coordinates are found where available;
6. address strings are produced where available;
7. media reaches playback queue;
8. fullscreen playback displays images/videos;
9. address overlay is visible on playback;
10. power loss or rough shutdown is recoverable without manual repair;
11. system restores enough state to continue operation;
12. screen on/off behavior works for mouse/keyboard and eventually PIR.

## 3+2 ACR coverage expansion — implementation contract hardening

Estonian timestamp: 2026-06-26 11:05 EEST

This section expands OpenSpec coverage after a 3+2 ACR review focused on preventing implementation drift. It is still documentation-only. It defines what the next code-inventory and implementation phases must prove before controls are marked ready.

### ACR pass summary

| Pass | Coverage finding | Required OpenSpec response |
| --- | --- | --- |
| A1 — requirement extraction | The existing docs define pages and goals, but implementation can still drift if page elements are not tied to components, endpoints, proofs, and status metadata. | Add traceability from every V2 element to component source, endpoint, test/proof, status JSON entry, and target page. |
| C1 — duplication critique | The largest code risk is repeated screenshot-derived HTML. | Require a component inventory and extraction decision before UI placement. |
| R1 — sequencing refinement | `09 REAL PLAYBACK` must not be assembled before isolated pages prove their pieces. | Add phase gates and acceptance criteria. |
| C2 — status honesty critique | A visible card can look complete while behavior is placeholder or unproven. | Require synchronized JSON/docs/UI status and status-specific evidence. |
| R2 — proof refinement | Existing backend proofs do not automatically prove V2 placement. | Require endpoint proof plus V2 render/click/result handling tests. |

### Coverage gate before any V2 UI placement

Before adding or moving any V2 UI element, the implementation must produce a code inventory/reuse map. The inventory can be a temporary implementation report or a committed docs update, but it must answer these fields for each requested element.

| Field | Required answer |
| --- | --- |
| Requested V2 element | Exact page/card/control from this OpenSpec. |
| Current source location | Existing component, renderer, page-local block, or `not found`. |
| Reuse decision | `reuse directly`, `extract shared component`, `new component`, or `defer`. |
| Endpoint/handler | Existing endpoint/handler used by the control, or `visual only`. |
| Existing tests/proofs | Test/proof names or `none found`. |
| New V2 tests needed | Render, click, response-handling, status-overlay, or proof gap. |
| Implementation-status JSON ID | Stable ID that the V2 status overlay will read. |
| Documentation status | Matching row in `V2_ImplementationStatus.md`. |
| Risk status | `green`, `yellow`, `red`, or documented later color. |

No large HTML or JSX block may be copied into a new V2 page merely to satisfy visual placement. If the same structure appears on more than one V2 page, it must be a reusable component or renderer unless a documented exception is approved.

### Reusable component extraction checklist

A reused/extracted component is acceptable only when these conditions are met.

| Check | Requirement |
| --- | --- |
| Boundary | Component accepts data/handlers as inputs and does not hard-code page-specific global state unless that behavior already exists and is documented. |
| Endpoint stability | Moving the component must not silently change backend endpoint names, methods, payloads, or result handling. |
| Status metadata | Component or wrapper can expose an implementation-status JSON ID. |
| Section help | Component or wrapper can render the top-right `?` explanation/status icon. |
| Event logging | Component either writes to the shared Event Log path or exposes events to the V2 page shell. |
| Testing | Component has or receives render/click tests in the V2 placement. |
| Duplication guard | Duplicated markup is limited to small composition wrappers, not repeated card bodies. |

### Structured status JSON contract

The implementation-status overlay must read a structured JSON source. The exact path is decided during code inventory, but the schema must cover at least the following fields.

```json
{
  "schemaVersion": "v2-implementation-status-v1",
  "updatedAt": "2026-06-26T00:00:00+03:00",
  "items": [
    {
      "id": "v2.page01.verifyEnv",
      "page": "01 SETUP",
      "label": "Verify .env",
      "kind": "section",
      "status": "red",
      "statusLabel": "not implemented",
      "componentSource": "inventory-pending",
      "endpoint": "POST /api/init/verify-env",
      "tests": [],
      "proofs": [],
      "docs": [
        "docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md"
      ],
      "operatorNote": "Planned reused control; V2 placement proof missing."
    }
  ]
}
```

Rules:

- IDs must be stable and unique.
- UI overlay colors must derive from `status`, not from ad hoc component state.
- `V2_ImplementationStatus.md` must name the same element and current status.
- If the JSON says `green`, a test/proof reference must exist.
- If status evidence is missing, status must not be green.
- The JSON file is the frontend-readable status source; the Markdown file is the operator-readable status record.

### Page acceptance criteria matrix

| Page | Minimum render acceptance | Minimum behavior acceptance | Minimum proof/status acceptance |
| --- | --- | --- | --- |
| `01 SETUP` | Verify `.env`, Database controls, Event Log, section `?` icons. | Buttons call existing setup/database handlers or are explicitly marked placeholder. | Endpoint tests/proofs mapped; V2 placement tests added. |
| `02 AUTHENTICATION` | NEW AUTH card, auth actions, Event Log, section `?` icon. | New-auth endpoints only; no old login-card route drift. | Auth proof mapped; CLI fallback documented as fallback, not UI success. |
| `03 STARTUP` | Raspberry scheduler controls, disabled WSL placeholders, RPI-STAGES, RPI-WORKERS, Event Log. | Real crontab actions only; Windows emulator excluded. | Crontab status/install/check proof or marked unverified. |
| `04 WORKERS` | B3.1–B3.5 cards, shared rows, Event Log. | Worker controls call documented runtime endpoints or are marked placeholder. | Per-worker endpoint tests/proofs mapped. |
| `05 TROUBLESHOOTING` | Pipeline maintenance buttons, shared rows, Event Log. | Stale lock detection/clear semantics are stale-only. | Original docs/commit found and new proof added before green. |
| `06 RECOVERY` | Save/Load/Emulate buttons, Event Log. | Initial buttons alert exact labels; later state behavior follows recovery schema. | Placeholder tests first; later restart proof. |
| `07 PIR` | Visible B5 subset only, PIR emulation button, RPI-WORKERS, Event Log. | Mouse/keyboard direct tests; PIR emulator simulates signal. | PIR hardware remains non-green until hardware proof exists. |
| `08 PLAYBACK` | Visible B4 subsection, drag/drop queue/table, RPI-WORKERS, Event Log. | Image/video/other classification; non-media fails gracefully when selected. | Queue/rendering tests and media proof mapped. |
| `09 REAL PLAYBACK` | Explanation first; later composed real operational surface. | Only proven pieces active; test controls disabled unless promoted. | Final autonomous playback and recovery proofs required. |

### Final proof coverage matrix

| Victory objective | Required evidence | Source pages involved | Notes |
| --- | --- | --- | --- |
| Authentication succeeds | Browser/new-auth proof or documented CLI fallback proof. | `02`, `09` | UI success cannot replace backend/session proof. |
| Scheduler active | Raspberry crontab install/check/print proof. | `03`, `09` | Windows emulator evidence is not accepted for real path. |
| Download starts | Runtime download worker proof/log. | `04`, `09` | Batch/config behavior must be visible or traceable. |
| Pipeline progresses | Download → Index → GPS parser → Geocode → Queue stage evidence. | `04`, `05`, `09` | Stage row must reflect real state, not static labels. |
| GPS/address works | GPS extraction and geocode/address result proof where metadata exists. | `04`, `08`, `09` | Missing-address policy is controlled by future toggle. |
| Playback displays media | Visual/native/browser proof that image/video is shown. | `08`, `09` | Address overlay proof is required when address exists. |
| Recovery works | Abrupt shutdown/restart proof with restored same media/queue context. | `06`, `09` | Exact video timestamp is not required. |
| Screen on/off works | Mouse/keyboard tests and PIR emulator; later hardware proof. | `07`, `09` | PIR hardware is not green until real input is proven. |

### Prohibited implementation patterns

| Pattern | Reason |
| --- | --- |
| Copying screenshot HTML into multiple pages | Violates reuse-first architecture and makes status/proof sync fragile. |
| Marking visible controls as complete without endpoint or UI tests | Creates fake readiness. |
| Wiring scheduler buttons to Windows cron emulator for the real path | Conflicts with operator decision. |
| Letting corrupt/incomplete files enter DB/pipeline | Violates recovery and pipeline integrity goals. |
| Letting `09 REAL PLAYBACK` become a dump of every test button | Undermines the final operator endpoint. |
| Keeping status strings only in Markdown | Frontend overlay needs structured JSON; docs and JSON must sync. |

### Next required OpenSpec-to-code handoff

The next implementation checkpoint should be a code inventory/reuse map, not page UI. It should update `V2_ImplementationStatus.md` with actual discovered component paths, endpoints, tests/proofs, and extraction decisions. Only after that inventory is reviewed should V2 shell/sidebar/component placement begin.


## v0.10.34 shared infrastructure boundary

Batch B2 establishes the reusable V2 wrapper and status/help metadata foundation without moving old View A/B cards and without wiring new backend behavior.

| Implemented in B2 | Not implemented in B2 |
| --- | --- |
| `renderV2OperatorPageWrapper` shared shell wrapper | New sidebar routes `07`, `08`, `09` |
| V2 Event history panel using existing `renderHistory` | Final `09 REAL PLAYBACK` composition |
| Existing `copy all log` / `Clear` event actions inside V2 | Screenshot card migration from source pages |
| `dashboard/data/v2ImplementationStatus.json` metadata source | Interactive Implementation status overlay button |
| `data-v2-status-id` and `data-v2-implementation-status` attributes | Per-section clickable `?` icons |

The result is infrastructure only: it is allowed to support future V2 UI placement but must not claim real playback, PIR, recovery, scheduler, or worker behavior.


## v0.10.35 B1 route-shell implementation note

B1 implements only the V2 route/page shell for `07 PIR`, `08 PLAYBACK`, and `09 REAL PLAYBACK`.

Acceptance boundary:

- the left sidebar has nine top-level routes in order `01` through `09`;
- `07 PIR` and `08 PLAYBACK` are shell pages only;
- `09 REAL PLAYBACK` is explanation-only and lists future composition sources;
- all new pages inherit the shared V2 wrapper and Event history placement;
- no setup/auth/scheduler/worker/troubleshooting/recovery/PIR/playback backend behavior is newly wired;
- no screenshot panels are copied into the new pages.


## v0.10.39 B3 implementation-status overlay

- Added the V2-only topbar controls: `Explain controls`, `Explain values`, and `Implementation status`.
- Wired the Implementation status view to `dashboard/data/v2ImplementationStatus.json` through rendered `data-v2-status-id`, `data-v2-implementation-status`, `data-v2-status-label`, and `data-v2-status-help` attributes.
- Added per-section `?` buttons that open a JSON-backed status/help modal without adding backend/runtime behavior.
- Added `tests/v2ImplementationStatusSync.test.js` to ensure every rendered V2 status target for all nine routes has a JSON registry element.
