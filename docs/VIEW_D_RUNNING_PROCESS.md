# View D — Running Process

## Purpose
View D is the runtime-monitoring preview surface. It is intentionally separate from the test/simulation view. In the current repo it remains frontend-only, so the view should present the intended live-monitor layout without implying that backend runtime state already exists.

## Runtime Preview vs Test Mode
- **View B** is for simulation and test controls.
- **View D** is reserved for live runtime status once `/api/runtime/*` exists, but today it is still a simulated preview of that layout.

If no simulated runtime preview is active, the view still opens but shows a disabled or empty state.

## Blocks
### D1 — Pipeline worker
This block contains the five real loop stages:
- Download
- Index
- Get GPS
- Geocode
- Queue Slideshow

The intended runtime behavior is:
- one stage active at a time
- stages run in order
- after queue slideshow completes, the loop returns to download

Each row should show:
- stage name
- status
- last run time
- latest summary or log reference

### D2 — Playback worker
This block represents a continuously maintained worker. The UI shows:
- status
- heartbeat
- current media
- summary/log area

### D3 — Screen on-off worker
This block represents a continuously maintained worker. The UI shows:
- status
- heartbeat
- current screen state
- last activity source
- inactivity timeout
- summary/log area

## Worker Heartbeat Expectations
The user described playback and screen on-off as continuously checked workers, with a likely interval around five seconds. The frontend reflects this by presenting heartbeat-oriented monitoring fields in D2 and D3.
Today those fields are still frontend-generated preview data, not real worker telemetry.

## Future Backend Wiring Notes
- D1 should later consume real stage state and loop progression from the runtime source of truth.
- D2 should later consume real playback process heartbeat and current media status.
- D3 should later consume real screen worker heartbeat, activity-source updates, and timeout configuration.
- runtime activation should later be driven by backend state rather than the current `Start simulated runtime preview` button.

## Evidence Basis
Derived from the user dashboard specification in this chat. The source basis includes the D view called Running Process, the three blocks for the five-stage pipeline worker, playback worker, and screen on-off worker, the requirement that only one pipeline stage be active at a time, the loop back to download, and the ongoing heartbeat-style checking for playback and screen workers.
