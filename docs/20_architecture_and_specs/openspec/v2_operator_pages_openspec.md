# V2 Operator Pages OpenSpec

Estonian timestamp: 2026-06-26 09:34 EEST

## Status

Documentation-only OpenSpec. This document defines the V2 operator page architecture that must guide later implementation. It is not proof that V2 already works.

## Authority and relationship to goals

The V2 operator pages are the staged path toward `09 REAL PLAYBACK`.

The victory goals are defined in [`../v2_goals/goals.md`](../v2_goals/goals.md):

1. autonomous playback after login and Raspberry-oriented scheduler/cron installation;
2. autonomous recovery after rough shutdown or power loss;
3. second-tier screen on/off behavior from mouse, keyboard, and PIR activity.

This OpenSpec translates those goals into page structure, component placement, reuse rules, status tracking, and proof boundaries.

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

The `Implementation status` button must expose reality, not optimism. The overlay should highlight clickable elements and major parent sections/cards using the same status vocabulary tracked in [`V2_ImplementationStatus.md`](V2_ImplementationStatus.md).

| Status | Meaning | Suggested visual intent |
| --- | --- | --- |
| `placeholder` | visible only; no real behavior yet | orange/partial |
| `reused` | existing component is reused or extracted | neutral/blue |
| `wired` | calls an existing handler/endpoint | blue/active |
| `tested` | behavior has a test/proof in this V2 placement | green/proven |
| `needs verification` | may work but lacks current evidence | yellow |
| `needs solution` | known or suspected gap | red |
| `future` | documented target, intentionally not implemented yet | gray |

A status shown in UI must match the implementation status document and the available test/proof evidence. If evidence is missing, the status must say so.

## Shared reusable components

Later implementation should first inventory and reuse/extract these component families.

| Component family | Existing source likely involved | V2 use |
| --- | --- | --- |
| Event history/log rows | `dashboard/services/renderers.ts` and current log surfaces | every page |
| Latest backend result | existing `renderResultSurface` behavior | Setup, Auth, Startup, Workers, Troubleshooting |
| Response payload viewer | existing result JSON block | Setup, Auth, Startup, Workers |
| Status badges/source badges | shared renderers | all operational cards |
| Auth action rows | `NEW AUTH` card from View A | `02 AUTHENTICATION` |
| Scheduler target panel | `3A Scheduler controls` from View A | `03 STARTUP`, Raspberry-focused |
| Worker/stage card pattern | B3/Test page stage cards | `04 WORKERS`, `09 REAL PLAYBACK` status summary |
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

The first implementation can reuse existing page-local logs if a shared event component is not yet available, but the architecture target is one reusable Event Log renderer.

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

The real path must not depend on the Windows custom cron emulator. Raspberry/Raspberry-related cron is preferred. WSL or another Linux-like development route may be considered later for dev/test, but customer-facing victory remains Raspberry-oriented.

The user also requested these labels from the screenshot to remain considered for the scheduler area:

- `Check emulator scheduler`;
- `Run emulator`;
- `Stop emulator`;
- `Install crontab`;
- `Get active crontab`.

Because the first three labels are Windows/emulator-oriented, they must be tracked as design-risk controls. They may be visual/test-only in isolated V2 startup, but they must not become part of the final `09 REAL PLAYBACK` real path unless explicitly approved later.

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

The saved state must be lightweight enough for frequent autosave. It should identify current operational position, current media/queue checkpoint, recovery flags, and enough pipeline context to continue safely. It must not become a giant database dump.

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

Mouse and keyboard can be tested directly. PIR sensor signal likely needs emulation/simulation until target hardware input is proven. PIR must be tracked as `needs solution` or `needs verification` until proven.

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

The drag/drop area may accept other files for operator visibility/testing, but invalid or non-media files must not be allowed to advance far in the real media pipeline. The pipeline must detect/reject corrupt, partial, invalid, or non-media items before they pollute playback.

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

Do not bring every testing button into `09`. Bring only what is needed for real operation.

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
3. reuse or extend those tests/proofs for the new V2 placement;
4. update `V2_ImplementationStatus.md` with the actual evidence;
5. keep unknowns marked as `needs verification`;
6. keep suspected broken areas marked as `needs solution`.

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
