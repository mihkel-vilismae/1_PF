# Goal 3 — Fullscreen playback activity reuse

## Status

Goal 3 is implemented through five slices on top of the v0.7.4 Goal 2 baseline.

| Slice | Part | Status | Result |
| ---: | --- | --- | --- |
| 1 | Reuse boundary inspection / adapter | Implemented | Added `dashboard/services/osPlaybackActivityDetection.ts`, which reuses the proven View B/B5 `pir`, `mouse`, and `keyboard` source vocabulary without coupling fullscreen playback to View B UI state. |
| 2 | Playback detection state/view model | Implemented | Added OS playback activity state for Windows and Raspberry playback surfaces and exposed monitoring labels through the OS playback view model. |
| 3 | Fullscreen wake/keep-on UI state | Implemented | Rendered wake/keep-on monitoring status in the OS playback view and fullscreen HUD. |
| 4 | Wake/keep-on behavior wiring | Implemented | Fullscreen entry starts monitoring, fullscreen exit stops monitoring, and browser mouse/keyboard events extend the keep-awake state while monitoring is active. |
| 5 | Docs + regression checks | Implemented | Added this repo-backed implementation note and tests for adapter, view model, UI, runtime wiring, and documentation boundaries. |

## Preserved boundaries

- Backend playback selection remains owned by the existing playback worker/API contract.
- Browser-side playback rotation and media rendering remain unchanged.
- No `/api/runtime/playback/activity`, `/api/runtime/playback/wake`, or other new backend mutation endpoint was added.
- View B/B5 activity testing remains available and separate from fullscreen playback state.
- PIR remains honest: it is visible as a selected source, but unavailable/backend-dependent unless a verified source is added later.

## Behavior

When an OS playback view enters fullscreen, the dashboard starts activity monitoring for that platform. Mouse movement and keyboard input reuse the Goal 2 browser event path and update the platform activity state only while monitoring is active. A detected event records the source, visible timestamp, status message, and keep-awake deadline. Exiting fullscreen or leaving browser fullscreen stops monitoring and clears the active keep-awake window.

## Risks and follow-up

This slice implements a dashboard-side keep-awake state, not a real Raspberry Pi display power command. A later hardware/OS slice can connect this state to a verified Raspberry Pi wake/display mechanism through a separate adapter. PIR should only be wired after a real backend/hardware source is present and tested.
