# View B — Test

## Purpose
View B is the simulation and test workspace. It is intentionally separate from the real runtime. This distinction is important because the user explicitly separated test/mock behavior from the actual production-style running process.

## Sections
### B1 — Auth preflight
Historical note: this old View B document predates the backend-auth restoration. Current B1 behavior lives in View A as a backend-auth-backed init/preflight surface. The UI shows:
- Run button
- status badge
- log area
- visible step list for login, required file handling, and 2FA

### B2 — Download 5 files
This section represents a frontend-only placeholder batch download flow with:
- Run button
- status badge
- log area

### B3 — Pipeline stages
This section contains the staged test pipeline.

#### B3 global controls
- execution mode toggle: auto pipeline or manual pipeline
- input mode toggle: one file at a time or all files
- all-files toggle remains visible but disabled for now

#### B3.1 — Mock download
This is the only mock stage. It explicitly references `/generated_test_data` as the source folder.

#### B3.2 — Index
Presented as a real-code-intended stage for later backend wiring.

#### B3.3 — Parse GPS
Presented as a real-code-intended stage for later backend wiring.

#### B3.4 — Geocode
Presented as a real-code-intended stage for later backend wiring.

#### B3.5 — Enqueue playback
Presented as a real-code-intended stage for later backend wiring. This stage enables the playback emulation area once queued media exists.

### B4 — Playback emulation
This section stays disabled until the slideshow queue has at least one item. Once media exists, the UI exposes:
- Run button
- playback preview surface
- current media summary
- log area

### B5 — Screen on-off simulation
This section controls simulated activity sources and timeout behavior that visually affect the playback emulation area. It includes:
- PIR toggle
- mouse toggle
- keyboard toggle
- enable-all toggle
- inactivity timeout input
- immediate change handling through the current input controls
- log area

There are no separate apply or simulate buttons in the current repo snapshot.

## B4 and B5 Relationship
B5 is a control/configuration area for playback visibility behavior. It is not an isolated mock; it is intentionally shown as affecting the B4 playback preview directly through screen ON/OFF state and checkpoint-style status updates.

## State and History Expectations Represented in UI
The user required explicit history and resumable current state across stage runs, playback, and screen transitions. This frontend represents that requirement with:
- sidebar current-state panel
- sidebar history panel
- checkpoint and screen transition log messages
- restore-oriented language in playback and simulation flows

No real persistence is implemented yet. The current implementation is strictly in-memory.

## Future Backend Wiring Notes
- Current B1 behavior now connects to backend auth preflight endpoints for status, run, reset, 2FA submit, and logout; backend auth truth remains authoritative.
- B2 should later connect to controlled test-download endpoints.
- B3 should later wire to real stage triggers and stage-status responses.
- B4 should later connect to real playback state and preview-compatible backend information.
- B5 should later connect to real screen activity logic and checkpoint/event recording.

## Evidence Basis
Derived from direct inspection of the current implementation, especially `dashboard/views/testView.js`, `dashboard/app.js`, `dashboard/services/runtimeTruth.js`, `docs/13_FRONTEND_BACKEND_CONTRACT.md`, and `generated_test_data/`.
