# Current Implementation Status

## Purpose

> Note: A documentation-only proposed canonical schema has been added at `docs/CANONICAL_SCHEMA_PROPOSAL.md`. It is a forward-looking contract artifact and is **not** evidence that the durable runtime schema is implemented in this snapshot.


This document describes what is actually implemented in the uploaded repository snapshot.
It is the primary implementation-truth document for this repo.

## Repository Reality Summary

The repository currently implements a **dashboard-first frontend prototype** built with Vite plus **repo-local backend slices for View A and View E**.
Most runtime behavior is still driven by an **in-memory mock state service**, but View A now includes both a frontend service layer and repo-local backend endpoints for env verification and SQLite file operations, and View E now includes dedicated frontend state/service wiring plus repo-local endpoints for database verification, logical connect gating, table listing, paginated row inspection, and session-bounded DB activity logging.

The repository also includes a substantial target-state documentation bundle for later backend implementation, but that backend is not present yet.

## Implemented Now

### Frontend shell and build

Implemented:

- Vite project setup via `package.json`
- development and production build scripts
- frontend app rooted in `dashboard/`
- built output in `dist/`

Evidence:

- `package.json`
- `vite.config.js`
- `dist/`

### Dashboard structure

Implemented:

- five views: A, B, C, D, E
- sidebar navigation
- current-truth side panel
- event history panel
- topbar context header
- shared rendering helpers

Evidence:

- `dashboard/app.js`
- `dashboard/shared/constants.js`
- `dashboard/services/renderers.js`
- `dashboard/views/databaseViewerView.js`
- `dashboard/views/`

### Database viewer contract wiring

Implemented:

- dedicated database viewer service module targeting `/api/database-viewer/*`
- frontend action/state handling for verify, connect, show tables, row paging, and start/stop logging
- a dedicated View E renderer with E1 through E4 cards
- explicit button gating derived from verification, connect, catalog, and logging state

Evidence:

- `dashboard/services/databaseViewerService.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/views/databaseViewerView.js`
- `dashboard/app.js`

### Mock runtime truth and simulation

Implemented:

- in-memory state object
- subscription-based rerendering
- per-card logs
- event history
- mock action dispatch
- frontend guards against overlapping simulated actions in key areas
- simulated pipeline sequencing
- simulated playback state
- simulated screen-state interaction with playback preview/status

Evidence:

- `dashboard/services/runtimeTruth.js`
- `docs/issues_errors_discrepancies.md`

### Init contract wiring

Implemented:

- shared request/error handling for wired frontend calls
- dedicated init service module targeting `/api/init/*`
- async init action handling for `.env`, database, and scheduler actions
- per-card backend result rendering for View A
- View A wiring assumes a separate repo-local init API process is reachable at runtime; the frontend build does not embed that server

Evidence:

- `dashboard/services/apiClient.js`
- `dashboard/services/initService.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/views/initView.js`
- `dashboard/services/renderers.js`

### Init backend slice

Implemented:

- a repo-local Node HTTP server for `/api/init/*`
- real `.env` verification against a checked-in config schema
- real SQLite status, inspect, delete, and recreate-empty endpoints
- frontend confirmation gating for destructive DB actions
- platform-aware scheduler capability responses behind the legacy cron routes
- Windows Task Scheduler install/status/print support behind the same legacy route names
- Raspberry Pi OS profile alignment through deferred Unix-cron capability metadata (install not implemented yet)
- a repo-local scheduler host that preserves the documented 5-second and 15-second timing model

Evidence:

- `server/index.js`
- `server/scheduler_host.js`
- `server/scripts/windows_task_scheduler.ps1`
- `server/scripts/sqlite_admin.py`
- `dashboard/app.js`
- `dashboard/services/initService.js`

### Database viewer backend slice

Implemented:

- a repo-local Node HTTP server route group for `/api/database-viewer/*`
- required-table verification against an explicit list sourced from `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
- logical connect gating that only opens after verification passes
- real table/view listing plus SQLite metadata reads when the DB file exists
- backend-owned paginated row inspection via the Python SQLite helper
- in-memory, session-bounded DB activity logging for database-viewer requests and repo-local backend DB actions observed through this server
- honest coverage text that explicitly avoids global SQL-tracing claims

Evidence:

- `server/index.js`
- `server/scripts/sqlite_admin.py`
- `docs/OLD_DOCS/VIEW_E_DATABASE_VIEWER.md`

### Generated test data

Implemented:

- generated image/video sample tree used by the mock/test UI documentation and intended simulation flows

Evidence:

- `generated_test_data/`
- `generated_test_data/manifest.json`
- `generated_test_data/README.md`

## Not Implemented Now

### Backend/API

Not present in this repository snapshot:

- backend services for B/C/D runtime features and the rest of the planned system outside A/E
- request validation and auth layers beyond the current A confirmation flow
- backend services for playback, screen, pipeline, or recovery
- guaranteed cross-process or global SQL tracing; View E logging remains backend-process-scoped

### Durable storage

Not present in this repository snapshot:

- database schema implementation
- migrations
- runtime-state persistence
- checkpoint persistence
- worker lease persistence
- event-log persistence

### Real worker/runtime system

Not present in this repository snapshot:

- real pipeline worker
- real playback worker
- real screen worker
- real pipeline/playback/screen/recovery services behind the scheduler host
- watchdog process
- durable last-run restoration

### Real external integrations

Not present in this repository snapshot:

- real login/download/test execution
- real playback control
- real screen hardware activity handling

## Status by View

### View A — Init

Current state:

- implemented as frontend cards, buttons, status labels, and logs
- actions now dispatch through a dedicated frontend init service layer
- the frontend renders the latest backend payload or error for each A card
- repo-local backend endpoints exist for env verification and SQLite status/inspect/delete/recreate-empty
- the repo-local backend must be started separately; if it is down or unreachable, A fails operationally before handler logic can be judged
- destructive DB actions require explicit frontend confirmation
- legacy cron endpoints now return platform-aware scheduler capability data and preserve route compatibility
- Windows keeps the real Task Scheduler bootstrap-host implementation for install/status/print
- Raspberry Pi OS profile currently marks install as deferred while status/print remain informational
- the installed scheduler host currently emits tick and heartbeat state only; it does not yet own real runtime business services

Primary files:

- `dashboard/views/initView.js`
- `dashboard/services/initService.js`
- `dashboard/services/apiClient.js`
- `dashboard/services/runtimeTruth.js`
- `server/index.js`
- `server/scripts/sqlite_admin.py`

### View B — Test

Current state:

- implemented as simulation UI
- mock download and staged pipeline behavior are frontend-driven
- playback emulation and screen simulation are mock behaviors only
- B5 toggles and the inactivity-timeout input apply immediately through frontend change handlers; there are no separate apply/simulate buttons
- does not touch a real backend or durable runtime

Primary files:

- `dashboard/views/testView.js`
- `dashboard/services/runtimeTruth.js`
- `generated_test_data/`

### View C — Last Run Info

Current state:

- implemented as a frontend presentation of mock last-run states
- manual demo buttons drive the `no run`, `error`, and `ready` layouts
- can show explicit no-run / error / ready demo states in-memory
- restore action is a placeholder
- no real durable state loading exists

Primary files:

- `dashboard/views/lastRunView.js`
- `dashboard/services/runtimeTruth.js`

### View D — Running Process

Current state:

- implemented as a frontend-only monitoring layout
- the view exposes a local `Start simulated runtime preview` button but no stop control
- simulated runtime-preview activation is local to the D view and handled inside the frontend state service
- D2 and D3 render summary fields in-card, while D4 is the shared preview-log surface
- worker rows and heartbeats are mock projections, not live process telemetry

Primary files:

- `dashboard/views/runningProcessView.js`
- `dashboard/services/runtimeTruth.js`

### View E — Database Viewer

Current state:

- implemented as a dedicated frontend view with E1 through E4 cards, status badges, gating, and log surfaces
- frontend actions dispatch through a dedicated `databaseViewerService` module plus View E state handling in `runtimeTruth.js`
- repo-local backend endpoints exist for `POST /api/database-viewer/verify`, `POST /api/database-viewer/connect`, `GET /api/database-viewer/tables`, `POST /api/database-viewer/rows`, `POST /api/database-viewer/logging/start`, and `POST /api/database-viewer/logging/stop`
- verification checks both DB-file existence and required-table presence against an explicit list sourced from `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
- the connect step is a logical backend authorization gate, not a durable DB session; later table and row requests still execute as fresh backend calls
- table listing returns current table/view objects plus SQLite metadata when the DB file exists
- row inspection is paginated and backend-bounded, with default page size `50`, maximum page size `100`, and backend-owned ordering heuristics
- logging start/stop returns an in-memory, session-bounded event list for database-viewer requests and other repo-local backend DB actions observed through this server while the logging session is active
- logging does **not** provide global SQL tracing and does **not** guarantee capture of external-process activity

Primary files:

- `dashboard/app.js`
- `dashboard/services/databaseViewerService.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/views/databaseViewerView.js`
- `server/index.js`
- `server/scripts/sqlite_admin.py`
- `docs/OLD_DOCS/VIEW_E_DATABASE_VIEWER.md`

## Interpretation Rules

- If a document describes API endpoints, worker leases, DB tables, cron behavior, or checkpoint recovery, that is target-state design unless matching implementation files are present.
- The in-memory runtime-truth service is useful for UI behavior and simulation, but it is not equivalent to a backend source of truth.
- `dist/` reflects a built version of the current frontend implementation, not proof of backend existence.

## Recommended Use

Use this document when the question is:

- What does the repo actually do today?
- Which parts are real code versus design docs?
- What can be safely wired next without inventing implementation status?

## Evidence Basis

Derived from direct inspection of:

- `package.json`
- `vite.config.js`
- `dashboard/app.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/services/renderers.js`
- `dashboard/views/initView.js`
- `dashboard/views/testView.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `dashboard/views/databaseViewerView.js`
- `dashboard/services/databaseViewerService.js`
- `dashboard/shared/constants.js`
- `server/index.js`
- `server/scripts/sqlite_admin.py`
- `server/scheduler_host.js`
- `server/scripts/windows_task_scheduler.ps1`
- `generated_test_data/`
- `dist/`
