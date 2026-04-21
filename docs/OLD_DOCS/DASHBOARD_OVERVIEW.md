# Dashboard Overview

## Purpose
This dashboard is a mostly prototype operator surface for the photo-frame system. It is intentionally split into five views so the operator can clearly distinguish setup work, testing and simulation, recovery inspection, runtime-preview monitoring, and database inspection. View A and the new View E database viewer are backed by repo-local endpoints, while views B, C, and D remain mock-driven in the current repo.

## Views
- **A — Init**: setup and environment preparation.
- **B — Test**: simulation-only workflows, including mock download, stage testing, playback emulation, and screen on-off simulation.
- **C — Last Run Info**: last known run demo states plus a restore placeholder flow.
- **D — Running Process**: frontend-only runtime preview monitoring.
- **E — Database Viewer**: repo-local database verification, logical connect gating, table browsing, paginated row inspection, and session-bounded backend DB activity logging.

## File Structure
- `dashboard/index.html` — structure for the complete frontend.
- `dashboard/styles.css` — all visual styling for the dashboard.
- `dashboard/app.js` — shell composition, event binding, and view dispatch.
- `dashboard/services/apiClient.js` — shared request and error handling for wired frontend calls.
- `dashboard/services/databaseViewerService.js` — frontend database-viewer contract wiring for verify/connect/tables/rows/logging actions.
- `dashboard/services/initService.js` — frontend init contract wiring for `.env`, database, and legacy cron/scheduler actions.
- `dashboard/views/databaseViewerView.js` — view-specific renderer for the E database viewer surface.
- `server/index.js` — backend implementation for the current A init endpoints, View E database-viewer endpoints, and runtime-truth persistence.
- `server/scheduler_host.js` — repo-local scheduler host used by the Windows scheduler bootstrap path.
- `server/scripts/sqlite_admin.py` — SQLite helper used by the A and E backend paths.
- `server/scripts/windows_task_scheduler.ps1` — Windows helper for scheduler install/status/print.
- `docs/OLD_DOCS/VIEW_A_INIT.md` — view-specific documentation for Init.
- `docs/OLD_DOCS/VIEW_B_TEST.md` — view-specific documentation for Test.
- `docs/OLD_DOCS/VIEW_C_LAST_RUN_INFO.md` — view-specific documentation for Last Run Info.
- `docs/OLD_DOCS/VIEW_D_RUNNING_PROCESS.md` — view-specific documentation for Running Process.
- `docs/OLD_DOCS/VIEW_E_DATABASE_VIEWER.md` — view-specific documentation for Database Viewer.
- `generated_test_data/` — pregenerated media files referenced by the mock download stage.

## Wired vs Unwired
### Already represented in the current repo
- all dashboard views and subsections for A through E
- repo-local backend endpoints for View A and View E
- Run buttons and action buttons
- status badges
- scrollable log and history panels
- current-state summary panel
- playback preview area
- view-level demo controls in C and a shared D4 preview log in D
- runtime-preview monitoring layout
- disabled and empty states

### Not implemented yet
- backend implementation for B/C/D and the rest of the documented API contracts
- dedicated frontend service modules for `/api/test/*` and `/api/runtime/*`
- any guaranteed global SQL tracing or cross-process DB audit capture; View E logging is bounded to backend-observed activity while active
- real pipeline/playback/screen/recovery services behind the installed scheduler host
- real file downloads
- real media playback engine
- real source-of-truth queries
- real persistence and checkpoint writes

## Future Backend Integration Notes
The UI is designed so each action can later connect to a specific backend endpoint or service call without redesigning the view structure. The main wiring points are:
- action buttons in A and B
- demo-state controls and resume placeholder button in C
- simulated runtime-preview activation and future runtime data refresh in D
- database verification, logical connect gating, table loading, row pagination, and start/stop logging in E
- state and history panels that will later reflect actual source-of-truth data

## State and History Representation
This frontend already exposes two core concepts that must later map to real system logic:
- **Current state**: the latest known truth needed for exact restore.
- **Event history**: append-only event summaries for stage runs, playback changes, screen transitions, and restore attempts.

The current implementation mostly uses in-memory mock state, with View A now calling a repo-local backend implementation of `/api/init/*`, View E now calling repo-local `/api/database-viewer/*` endpoints, and C and D still exposing explicit demo and preview wording to avoid overstating backend support. The View E logging surface remains intentionally narrow: it captures only database-viewer requests and other repo-local backend DB actions observed through this server while the logging session is active.

## Evidence Basis
Derived from direct repo inspection, especially:

- `dashboard/app.js`
- `dashboard/views/initView.js`
- `dashboard/views/testView.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `dashboard/views/databaseViewerView.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/services/databaseViewerService.js`
- `dashboard/services/initService.js`
- `server/index.js`
- `server/scripts/sqlite_admin.py`
- `server/scheduler_host.js`
