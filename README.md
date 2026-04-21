# Photo Frame Dashboard Frontend + System Docs

## What this repository currently is

This repository currently contains:

- a **Vite-based frontend prototype** under `dashboard/`
- **repo-local Node backend slices for View A and View E** under `server/`
- an already-built frontend output under `dist/`
- a **generated test-data bundle** under `generated_test_data/`
- a **documentation set** under `docs/OLD_DOCS/` that now explicitly separates:
  - **current implementation reality**, and
  - **target backend architecture / future wiring contracts**

It does **not** currently contain the full planned backend, real worker processes, or durable runtime persistence. It now does contain repo-local backend implementations for A `.env` verification, SQLite file operations, and a Windows-first scheduler bootstrap path for 3A, plus View E database verification, logical connect gating, table listing, paginated row inspection, and session-bounded backend DB activity logging.

## Run locally

1. Install dependencies:
   `npm install`
2. Start the repo-local API server in one terminal:
   `npm run api`
3. Start the Vite development server in another terminal:
   `npm run dev`
4. Open the local URL printed by Vite.

The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:4301`.
If the API server is not running, backend-backed A and E actions can fail even though the repo contains the route handler code.

## Build locally

1. Run:
   `npm run build`
2. Vite builds the frontend from `dashboard/` into `dist/`.

## Current repository structure

- `dashboard/` — current frontend implementation
  - `app.js` — shell composition and event binding
  - `views/` — view renderers for A / B / C / D / E
  - `services/databaseViewerService.js` — frontend transport layer for `/api/database-viewer/*`
  - `services/runtimeTruth.js` — in-memory mock state and action simulation
  - `services/renderers.js` — shared render helpers
  - `shared/constants.js` — shared labels and view metadata
- `server/` — current backend implementation slices for View A and View E
  - `index.js` — Node HTTP API exposing `/api/init/*`, `/api/database-viewer/*`, and `/api/runtime-truth`
  - `scheduler_host.js` — repo-local scheduler host used by the Windows bootstrap path
  - `scripts/sqlite_admin.py` — SQLite inspect/recreate/rows helper used by the A and E backend paths
  - `scripts/windows_task_scheduler.ps1` — Windows Task Scheduler install/status/print helper
- `docs/OLD_DOCS/` — implementation docs, architecture docs, and reconciliation docs
- `generated_test_data/` — sample media assets used by the mock/test UI
- `dist/` — current production build output
- `vite.config.js` — Vite configuration pointing at `dashboard/`

## Documentation reading order

### Current implementation truth first

1. `docs/OLD_DOCS/00_TABLE_OF_CONTENTS.md`
2. `docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
3. `docs/OLD_DOCS/16_DOCUMENTATION_RECONCILIATION_REPORT.md`
4. `docs/OLD_DOCS/DASHBOARD_OVERVIEW.md`
5. `docs/OLD_DOCS/VIEW_A_INIT.md`
6. `docs/OLD_DOCS/VIEW_B_TEST.md`
7. `docs/OLD_DOCS/VIEW_C_LAST_RUN_INFO.md`
8. `docs/OLD_DOCS/VIEW_D_RUNNING_PROCESS.md`
9. `docs/OLD_DOCS/VIEW_E_DATABASE_VIEWER.md`
10. `docs/OLD_DOCS/issues_errors_discrepancies.md`
11. `docs/OLD_DOCS/23_VIEW_A_INIT_RECONCILIATION_PROMPT.md`

### Target architecture and future implementation contract second

12. `docs/OLD_DOCS/01_SYSTEM_OVERVIEW.md`
13. `docs/OLD_DOCS/02_SYSTEM_INVARIANTS.md`
14. `docs/OLD_DOCS/03_ARCHITECTURE.md`
15. `docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md`
16. `docs/OLD_DOCS/05_STATE_MACHINE.md`
17. `docs/OLD_DOCS/06_DATABASE_SCHEMA.md`
18. `docs/OLD_DOCS/07_PIPELINE_STAGES.md`
19. `docs/OLD_DOCS/08_WORKERS_AND_OWNERSHIP.md`
20. `docs/OLD_DOCS/09_CRON_AND_WATCHDOG.md`
21. `docs/OLD_DOCS/10_CONCURRENCY_AND_LOCKING.md`
22. `docs/OLD_DOCS/11_LOGGING_AND_EVENT_MODEL.md`
23. `docs/OLD_DOCS/12_STATE_AND_RECOVERY.md`
24. `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
25. `docs/OLD_DOCS/14_VERSIONING_AND_CHANGELOG_RULES.md`
26. `docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md`
27. `docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md`
28. `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
29. `docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md`
30. `docs/OLD_DOCS/22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md`

When broader target-state docs overlap, prefer the canonical contract set in `docs/OLD_DOCS/18` through `docs/OLD_DOCS/22`.

## Current implementation summary

Implemented now:

- five dashboard views (A/B/C/D/E)
- A and E backend-backed operator flows, with B/C/D still explicitly mock or preview driven
- current-truth documentation plus repo-local backend support for the fifth operator surface E (Database Viewer)
- in-memory runtime truth model
- mock state transitions and log/history rendering
- guarded simulation behavior for pipeline/playback/screen-related UI actions
- minimal A backend endpoints for env verification and SQLite file operations
- repo-local E database viewer endpoints for verification, logical connect gating, table listing, paginated row inspection, and session-bounded backend DB activity logging
- destructive-action confirmation for DB delete/recreate in A
- production frontend build via Vite
- generated media/test-data bundle for UI simulation

Not implemented now:

- backend API for B/C/D and the rest of the planned system
- guaranteed cross-process or global SQL tracing; View E logging is limited to backend-observed activity while the session is active
- durable database schema/runtime persistence beyond empty SQLite file creation and inspection
- real pipeline/playback/screen/recovery services behind the installed 3A scheduler host
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
- `server/scheduler_host.js`
- `server/scripts/windows_task_scheduler.ps1`
- `server/scripts/sqlite_admin.py`
- `dashboard/views/testView.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `dashboard/views/databaseViewerView.js`
- `dashboard/services/databaseViewerService.js`
- `dashboard/shared/constants.js`
- `generated_test_data/`
- existing `docs/OLD_DOCS/` files
