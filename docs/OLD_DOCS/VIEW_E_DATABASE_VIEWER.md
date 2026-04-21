# View E — Database Viewer

## Purpose
View E is the operator-facing database inspection surface. It focuses on repo-local database verification, bounded browsing, and honest backend-process-scoped activity review.

This surface is rendered through the shared dashboard shell and uses dedicated frontend state/service wiring plus repo-local backend routes.

## Workflow

### E1 — Verify Database
This step checks:
- whether the configured SQLite file exists
- whether the current DB contains the required tables

The required-table list is explicit and currently sourced from `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`.

### E2 — Connect to Database
This is a logical gate, not a durable connection primitive.
If verification passes, the backend can return `connected: true` with `gate: "logical_backend_authorization"`.
Later table and row requests still run as fresh backend calls.

### E3 — Show Tables
This step lists current tables/views plus SQLite metadata when the DB file exists.
The backend returns object names, kinds, and schema summary fields from the Python SQLite helper.

### E4 — Row Inspection
This step loads rows through backend-owned pagination.
Current bounds and rules:
- default page size: `50`
- maximum page size: `100`
- page index is zero-based
- ordering is backend-owned and explained in the response metadata

The ordering heuristic prefers:
- descending timestamp-like columns
- otherwise descending integer primary key
- otherwise `rowid DESC` for tables
- otherwise first-column descending as a best-effort fallback for rowid-less objects such as some views

### E5 — DB Logging
This step starts and stops an in-memory logging session for the current backend process.
Stopping the session returns the captured entries for that interval.

## Current Implementation Truth

- the dashboard shell includes View E in the shared nav and render path
- frontend actions are wired through `dashboard/services/databaseViewerService.js` and View E state coordination in `dashboard/services/runtimeTruth.js`
- `dashboard/views/databaseViewerView.js` renders the E1 through E4 cards, gating copy, row table, and logging surface
- repo-local backend endpoints exist in `server/index.js` for:
  - `POST /api/database-viewer/verify`
  - `POST /api/database-viewer/connect`
  - `GET /api/database-viewer/tables`
  - `POST /api/database-viewer/rows`
  - `POST /api/database-viewer/logging/start`
  - `POST /api/database-viewer/logging/stop`
- verification checks the configured SQLite path plus required-table presence against an explicit documented list
- table listing and row inspection are real backend calls and use `server/scripts/sqlite_admin.py`
- missing DB files remain explicit failure states for verify, connect, tables, and rows
- the backend returns bounded page metadata and ordering metadata rather than dumping unbounded table contents

## Logging Scope

- captured entries cover database-viewer requests and other repo-local backend DB actions observed through this server while logging is active
- logging is session-bounded and backend-process-scoped
- logging does **not** promise global SQL tracing
- logging does **not** guarantee capture of activity from external tools, separate processes, or writes that bypass this server
- a quiet or empty session must not be interpreted as proof that no DB activity happened anywhere else

## Current Caveats

- the required-table source is currently a canonical target-state truth-surface doc, not implemented migrations in this repo
- the configured DB file can be absent, which blocks successful verify/connect/table-browsing flows until the DB exists

## Evidence Basis

Derived from direct inspection of the current implementation, especially `dashboard/app.js`, `dashboard/services/databaseViewerService.js`, `dashboard/services/runtimeTruth.js`, `dashboard/views/databaseViewerView.js`, `server/index.js`, `server/scripts/sqlite_admin.py`, and `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`.


## Phase 3 hardening notes

- the current frontend requests `50` rows per page, but the backend helper also enforces its own hard maximum page size so oversized requests remain bounded
- an empty SQLite database is treated as a valid inspectable state for View E; verify may still fail against the required-table baseline while table browsing can still show zero objects honestly
- the recommended repeatable validation entrypoint for the current repo is `npm run validate:view-e`; this is a targeted smoke check, not a claim of full automated coverage for the whole dashboard
