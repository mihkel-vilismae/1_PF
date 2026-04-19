# View D — Running Process

## Purpose
View D is the real-runtime monitoring surface. It is intentionally separate from the test/simulation view. The user defined it as active only when there is a real run and not a mock or testing run.

## Real Runtime vs Test Mode
- **View B** is for simulation and test controls.
- **View D** is for live real runtime status only.

If no real run is active, the view still opens but shows a disabled or empty state.

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

## Future Backend Wiring Notes
- D1 should later consume real stage state and loop progression from the runtime source of truth.
- D2 should later consume real playback process heartbeat and current media status.
- D3 should later consume real screen worker heartbeat, activity-source updates, and timeout configuration.
- real-run activation should later be driven by backend state rather than the current frontend-only demo button.

## Evidence Basis
Derived from the user dashboard specification in this chat. The source basis includes the D view called Running Process, the three blocks for the five-stage pipeline worker, playback worker, and screen on-off worker, the requirement that only one pipeline stage be active at a time, the loop back to download, and the ongoing heartbeat-style checking for playback and screen workers.
