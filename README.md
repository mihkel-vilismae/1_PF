# Photo Frame Dashboard Frontend + System Docs

## What this repository currently is

This repository currently contains:

- a **Vite-based frontend prototype** under `dashboard/`
- a **minimal Node backend slice for View A** under `server/`
- an already-built frontend output under `dist/`
- a **generated test-data bundle** under `generated_test_data/`
- a **documentation set** under `docs/` that now explicitly separates:
  - **current implementation reality**, and
  - **target backend architecture / future wiring contracts**

It does **not** currently contain the full planned backend, real worker processes, durable runtime persistence, or a resolved cron/watchdog runtime implementation. It now does contain a repo-local backend implementation for A `.env` verification and SQLite file operations.

## Run locally

1. Install dependencies:
   `npm install`
2. Start the init API server in one terminal:
   `npm run api`
3. Start the Vite development server in another terminal:
   `npm run dev`
4. Open the local URL printed by Vite.

The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:4301`.

## Build locally

1. Run:
   `npm run build`
2. Vite builds the frontend from `dashboard/` into `dist/`.

## Current repository structure

- `dashboard/` — current frontend implementation
  - `app.js` — shell composition and event binding
  - `views/` — view renderers for A / B / C / D
  - `services/runtimeTruth.js` — in-memory mock state and action simulation
  - `services/renderers.js` — shared render helpers
  - `shared/constants.js` — shared labels and view metadata
- `server/` — current backend implementation slice for View A
  - `index.js` — Node HTTP API exposing `/api/init/*`
  - `scripts/sqlite_admin.py` — SQLite inspect/recreate helper used by the A backend
- `docs/` — implementation docs, architecture docs, and reconciliation docs
- `generated_test_data/` — sample media assets used by the mock/test UI
- `dist/` — current production build output
- `vite.config.js` — Vite configuration pointing at `dashboard/`

## Documentation reading order

### Current implementation truth first

1. `docs/00_TABLE_OF_CONTENTS.md`
2. `docs/15_CURRENT_IMPLEMENTATION_STATUS.md`
3. `docs/16_DOCUMENTATION_RECONCILIATION_REPORT.md`
4. `docs/DASHBOARD_OVERVIEW.md`
5. `docs/VIEW_A_INIT.md`
6. `docs/VIEW_B_TEST.md`
7. `docs/VIEW_C_LAST_RUN_INFO.md`
8. `docs/VIEW_D_RUNNING_PROCESS.md`
9. `docs/issues_errors_discrepancies.md`

### Target architecture and future implementation contract second

10. `docs/01_SYSTEM_OVERVIEW.md`
11. `docs/02_SYSTEM_INVARIANTS.md`
12. `docs/03_ARCHITECTURE.md`
13. `docs/04_SINGLE_SOURCE_OF_TRUTH.md`
14. `docs/05_STATE_MACHINE.md`
15. `docs/06_DATABASE_SCHEMA.md`
16. `docs/07_PIPELINE_STAGES.md`
17. `docs/08_WORKERS_AND_OWNERSHIP.md`
18. `docs/09_CRON_AND_WATCHDOG.md`
19. `docs/10_CONCURRENCY_AND_LOCKING.md`
20. `docs/11_LOGGING_AND_EVENT_MODEL.md`
21. `docs/12_STATE_AND_RECOVERY.md`
22. `docs/13_FRONTEND_BACKEND_CONTRACT.md`
23. `docs/14_VERSIONING_AND_CHANGELOG_RULES.md`

## Current implementation summary

Implemented now:

- four dashboard views (A/B/C/D)
- in-memory runtime truth model
- mock state transitions and log/history rendering
- guarded simulation behavior for pipeline/playback/screen-related UI actions
- minimal A backend endpoints for env verification and SQLite file operations
- destructive-action confirmation for DB delete/recreate in A
- production frontend build via Vite
- generated media/test-data bundle for UI simulation

Not implemented now:

- backend API for B/C/D and the rest of the planned system
- durable database schema/runtime persistence beyond empty SQLite file creation and inspection
- real cron installation/checking that matches the documented 5-second watchdog contract
- real playback worker
- real screen worker
- real pipeline worker
- real recovery/checkpoint persistence
- real last-run loading from durable state

## Why the docs were updated

This repository contains both:

- a **real, inspectable frontend implementation**, and
- a **forward-looking backend architecture design**.

The docs were updated so future work can distinguish:

- what is already true in this repo,
- what is only simulated in the frontend, and
- what remains target-state design for later backend implementation.

## Evidence Basis

Derived from direct inspection of the uploaded repository contents, especially:

- `package.json`
- `vite.config.js`
- `dashboard/app.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/services/renderers.js`
- `dashboard/views/initView.js`
- `server/index.js`
- `server/scripts/sqlite_admin.py`
- `dashboard/views/testView.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `dashboard/shared/constants.js`
- `generated_test_data/`
- existing `docs/` files
