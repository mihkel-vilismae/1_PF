# Dashboard View B — Test Page OpenSpec

Status: documentation-only page-level OpenSpec for the existing View B Test page in Test Mode and Real Mode.

## Purpose

View B runs and observes runtime pipeline actions. It is a mixed page: some cards are real backend calls, some are Test Mode/mock-only, and B5 remains simulation-only rather than real hardware control.

This OpenSpec documents the existing page contract. It does not add new UI or backend behavior.

## Source files

```text
dashboard/views/testView.ts
dashboard/app.ts
dashboard/services/runtimeTruth.ts
dashboard/services/runtimeExecutionService.ts
dashboard/services/playbackRenderer.ts
dashboard/services/viewBActivityDetection.ts
```

Related existing OpenSpec/docs:

```text
docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md
docs/20_architecture_and_specs/playback_resume_checkpoint_spec.md
docs/20_architecture_and_specs/native_playback_runner_spec.md
docs/20_architecture_and_specs/openspec/runtime_state_durable_checkpoint_openspec.md
```

## Page identity

Visible identity:

```text
B — Test
Use real runtime actions where they already exist, and keep the remaining placeholders unmistakable.
```

The page hero must keep the mixed-status boundary visible through source badges such as:

```text
MIXED VIEW
REAL ACTIONS PRESENT
PLACEHOLDERS STILL VISIBLE
```

## Mode-specific B2 download cards

### `B2` — Download test action

Mode visibility:

```text
Test Mode: visible
Real Mode: hidden
```

Backend surface:

```text
POST /api/runtime/download/run
```

Purpose:

- Test Mode mock/generated download path;
- does not claim real iCloudPD media download;
- real iCloudPD download control must stay hidden in Test Mode.

### `B2-REAL_DOWNLOAD` — Authenticated real download

Mode visibility:

```text
Test Mode: hidden
Real Mode: visible
```

Backend surface:

```text
POST /api/runtime/download/real-run
```

Requirements:

- requires an authenticated iCloudPD session;
- UI may show a batch-size selector;
- backend must verify authentication again before starting;
- button should be disabled when no authenticated session is detected in dashboard state.

Non-claims:

- visibility of this card does not prove real download success;
- a successful run requires separate backend result/evidence.

## `B3` — Pipeline stages

Mode visibility:

```text
Test Mode: visible
Real Mode: visible
```

Purpose:

- run pipeline stages individually;
- run backend orchestration through auto-run;
- show stage logs/status;
- keep geocode placeholder boundary visible.

Current B3 controls:

```text
Execution mode
├── Auto pipeline
└── Manual pipeline

Mock input mode
├── One file at a time
└── All files (disabled)

Auto run
└── Run all stages

Pipeline maintenance
├── Detect issues in pipeline
└── Clear stale locks
```

Stage cards:

| Stage | Backend surface | Boundary |
|---|---|---|
| `B3.1` Download | `POST /api/runtime/download/run` | backend runtime stage |
| `B3.2` Index | `POST /api/runtime/index/run` | backend runtime stage |
| `B3.3` Parse GPS | `POST /api/runtime/gps/run` | backend runtime stage |
| `B3.4` Geocode | `POST /api/runtime/geocode/run` | deterministic placeholder geocoder, not production geocode |
| `B3.5` Enqueue playback | `POST /api/runtime/queue/prepare` | prepares queue/backend item |

Required safety behavior:

- pipeline stages must display their status/log surfaces;
- B3.4 must not be described as production geocoding while it uses the placeholder geocoder;
- stale-lock clearing must be limited to stale persisted locks and must not kill healthy processes.

## `B4` — Playback selection

Mode visibility:

```text
Test Mode: visible
Real Mode: visible
```

Backend surface:

```text
POST /api/runtime/playback/select-current
```

Purpose:

- select current backend playback item;
- display selected item in the preview frame;
- show current media, media type, queue position, playback status, rendering mode, and rendering target.

Rendering controls:

- Windows/browser rendering may be available after B4 has selected/activated playback;
- Raspberry OS rendering tab is currently planned/disabled in this frontend slice;
- rendering tabs affect preview/fullscreen presentation and must not imply backend selection changes.

Non-claims:

- browser preview is not proof of Raspberry native playback;
- Raspberry playback requires separate target proof/evidence.

## `B5` — Screen on-off simulation

Mode visibility:

```text
Test Mode: visible
Real Mode: visible
```

Purpose:

- configure backend-owned simulation state;
- update dashboard preview;
- run bounded activity-detection tests for selected sources.

It is explicitly not a real hardware claim.

Controls/fields:

```text
Enable PIR sensor
Enable mouse movement
Enable keyboard activity
Enable all
B5 activity detection test sources
Activity detection test runner
Activity detection results
Inactivity timeout
```

Required boundary:

- B5 is simulation-only unless a later OpenSpec and proof explicitly implement target hardware behavior;
- selecting PIR/mouse/keyboard sources in B5 only affects the next bounded test window;
- result rows must not imply real PIR hardware support.

## Current media preview boundary

View B can display browser-native image/video elements in the preview frame when the selected media has a usable media URL and Windows/browser rendering is selected.

This display is an operator preview. It is not a substitute for Raspberry native playback proof.

## Safety and non-claims

View B does not by itself prove:

- real iCloud authentication;
- real iCloud download unless the Real Mode endpoint succeeds and evidence exists;
- real production geocode when placeholder geocode is active;
- Raspberry native playback;
- real PIR/screen hardware behavior;
- full recovery readiness.

Those require separate proof contracts/evidence.
