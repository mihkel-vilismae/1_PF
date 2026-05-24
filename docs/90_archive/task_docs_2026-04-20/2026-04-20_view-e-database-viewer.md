# Task Doc — View E Database Viewer

## Status

- Proposed on `2026-04-20`
- Scope: add a fifth dashboard view for database inspection and session-bounded database activity review

## Summary

Add a new dashboard view named `E - Database Viewer`.

The view should provide a lightweight operator-facing database panel that can:

- verify database existence and required tables
- gate a logical "connect" step after verification succeeds
- list database tables
- show recent rows for a selected table with pagination
- start and stop a bounded database logging session
- display the database activity captured between the logging start and stop timestamps

This should stay honest to the current repo reality: the repository already has a SQLite-focused backend helper for inspection, but it does not yet have a general-purpose database admin surface or guaranteed global SQL tracing.

## Current Repo Truth

Based on direct inspection of the current repository:

- `dashboard/shared/constants.js` defines only views `A` through `D`
- `dashboard/app.js` renders and binds only views `A` through `D`
- `dashboard/views/` currently contains `initView.js`, `testView.js`, `lastRunView.js`, and `runningProcessView.js`
- `dashboard/services/initService.js` exists, but there is no database-viewer service yet
- `dashboard/services/runtimeTruth.js` is still the main UI state/event coordinator
- `server/index.js` currently exposes only `/api/init/*` routes
- `server/scripts/sqlite_admin.py` currently supports SQLite inspection and empty-db recreation, but not row pagination or logging-session support
- `docs/OLD_DOCS/06_DATABASE_SCHEMA.md` contains the proposed durable table set that can serve as the initial reference for "required tables" unless a newer canonical table list is defined during implementation

## Goals

1. Add a fifth operator view: `E - Database Viewer`
2. Let the operator verify DB existence plus required-table presence in one action
3. Let the operator browse tables and inspect recent rows safely
4. Keep result loading paginated and bounded
5. Provide an honest start/stop logging workflow for database activity
6. Make button enable/disable states clearly follow the intended workflow

## Non-Goals

- Do not build a full pgAdmin- or DBeaver-like tool
- Do not fetch entire large tables into the frontend
- Do not claim raw SQL capture across all external processes unless it is actually implemented
- Do not silently invent missing schema expectations; define the source of required-table truth explicitly
- Do not expand this task into unrelated B/C/D runtime work

## Main Ambiguities To Resolve Honestly

### 1. What counts as "Connect to Database"?

Refinement:

- treat this as a logical operator step, not necessarily a persistent socket/session
- the button can represent "backend is authorized to open table-browsing actions now"

### 2. What is the required table list?

Refinement:

- use an explicit required-table list derived from a documented source
- initial source can be `docs/OLD_DOCS/06_DATABASE_SCHEMA.md`
- if implementation chooses a hard-coded list for now, document the list and its source clearly

### 3. How do we define "last 50 entries"?

Refinement:

- prefer deterministic ordering
- use descending timestamp when a clear timestamp column exists
- otherwise fall back to descending integer primary key or `rowid`
- the backend should own the ordering rule and return enough metadata for the UI to explain it

### 4. What does DB logging really mean in this repo?

Refinement:

- the current repo does not obviously contain a centralized DB access layer for all future runtime writes
- because of that, "capture every SQL query from every process" may not be feasible yet
- implementation must either:
  - capture activity that flows through the repo-local backend while logging is active, or
  - implement a technically real SQLite trace/audit mechanism if that can be done safely
- the UI and docs must describe the actual coverage honestly

## Operator Workflow

1. Open `E - Database Viewer`
2. Click `Verify Database`
3. Backend checks:
   - database file exists
   - required tables exist
4. If verification fails:
   - show clear error details
   - keep `Connect to Database` disabled
5. If verification succeeds:
   - enable `Connect to Database`
6. Click `Connect to Database`
7. Enable `Show Tables`
8. Click `Show Tables`
9. Display table list
10. Click a table
11. Show recent rows for that table
12. Use pagination controls to move through bounded pages
13. Click `Start DB Logging`
14. Perform other app actions
15. Return to View E and click `Stop DB Logging`
16. Show captured DB activity for the interval

## Functional Requirements

### FR1 — Fifth View

Add `E - Database Viewer` to the navigation order and render path.

### FR2 — Verify Database

Add one button that performs both checks:

- database exists
- required tables exist

Expected behavior:

- success enables `Connect to Database`
- failure shows a clear error/result surface
- the UI should show which required tables are missing when verification fails

### FR3 — Connect To Database

Add a button labeled `Connect to Database`.

Expected behavior:

- disabled until verification succeeds
- after successful connect, enable `Show Tables`
- connect may be a logical gating step rather than a durable connection primitive

### FR4 — Show Tables

Add a `Show Tables` action.

Expected behavior:

- fetch a list of tables/views from the backend
- show table name, kind, and useful schema metadata when available
- selecting a table loads bounded rows

### FR5 — Row Viewer

Expected behavior:

- default page size: `50`
- backend pagination required
- do not request huge result sets
- show deterministic ordering metadata if the ordering is heuristic

### FR6 — DB Logging Controls

Add:

- `Start DB Logging`
- `Stop DB Logging`

Expected behavior:

- start stores a session start timestamp
- stop stores an end timestamp
- UI reflects whether logging is active
- after stop, show captured activity for that session

### FR7 — Honest Logging Semantics

The implementation must not overclaim.

Examples:

- if only backend-mediated DB actions are captured, say so
- if only viewer-related queries plus repo-local backend actions are captured, say so
- if global raw SQL tracing becomes real, document its exact scope and limits

### FR8 — Errors And Empty States

Expected behavior:

- missing DB file should be explicit
- missing required tables should be explicit
- empty table results should render cleanly
- logging with no captured activity should render a truthful empty-state message

## Suggested Implementation Shape

The following file set is the most likely landing zone for the work:

- `dashboard/shared/constants.js`
- `dashboard/app.js`
- `dashboard/views/databaseViewerView.js`
- `dashboard/services/databaseViewerService.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/services/renderers.js`
- `server/index.js`
- `server/scripts/sqlite_admin.py`

Possible supporting docs to update if the feature gets implemented later:

- `README.md`
- `placeholder_implementations.md`
- any current-truth view overview doc that enumerates dashboard views

## Backend Design Notes

Keep the backend aligned with the repo's existing patterns:

- `server/index.js` currently uses a small route table with simple handlers
- `server/scripts/sqlite_admin.py` is already the SQLite helper boundary
- prefer extending that helper instead of duplicating SQLite logic in Node

Suggested backend capabilities:

- verify database + required tables
- list tables/views and schema metadata
- fetch table rows with `limit` and cursor/page inputs
- start a logging session
- stop a logging session and return captured activity

The exact endpoint names can follow the existing `/api/init/*` style, but should be grouped consistently for the new view.

## Acceptance Criteria

- View `E` appears in the sidebar and opens correctly
- `Verify Database` checks DB existence and required tables in one action
- failed verification clearly identifies the problem
- `Connect to Database` is disabled before successful verification
- `Show Tables` is disabled before successful connect
- table list loads from the backend
- selecting a table shows recent rows
- row loading is paginated and bounded
- DB logging has clear active/inactive UI states
- stopping logging shows the activity captured during that session
- documentation and UI text do not exaggerate logging coverage

## Risks / Open Questions

1. The required-table source may still be target-state documentation rather than implemented migrations
2. Query logging across unrelated external writers may not be possible in this repo without new architecture
3. Some tables may not have a clean timestamp or integer PK for "recent rows" sorting
4. The current backend is Windows-first in some areas, but SQLite inspection itself is portable

## Codex-Ready Implementation Prompt

Implement a new fifth dashboard view in this repository named `E - Database Viewer`.

Work against the current repo reality, not the aspirational architecture. The repo currently has four views (`A` through `D`), a Vite frontend under `dashboard/`, a repo-local Node backend in `server/index.js`, and a SQLite helper script in `server/scripts/sqlite_admin.py`. View A already uses real `/api/init/*` endpoints, while other areas remain partially or fully simulated.

Deliver the feature end-to-end with minimal, focused changes.

### Scope

Add a fifth operator view that acts as a lightweight DB admin panel with this workflow:

1. `Verify Database`
   - one action that checks both:
     - whether the DB file exists
     - whether all required tables exist
   - if verification fails, show a clear error and keep `Connect to Database` disabled
   - if verification succeeds, enable `Connect to Database`

2. `Connect to Database`
   - treat this as a logical gating step if a persistent connection is not needed
   - after success, enable `Show Tables`

3. `Show Tables`
   - fetch and render the list of tables/views
   - allow selecting a table
   - when selected, show the most recent 50 rows
   - add pagination so the frontend never requests large result sets in one call

4. `Start DB Logging` / `Stop DB Logging`
   - start records the start timestamp and begins a logging session
   - stop records the end timestamp and shows the captured DB activity for that session
   - capture only what is technically real in this repo
   - if full raw SQL tracing is not feasible, implement the closest honest backend-mediated audit and label the scope clearly in UI/doc text

### Implementation Constraints

- Reuse the existing frontend architecture:
  - add `E` to `dashboard/shared/constants.js`
  - add a new renderer such as `dashboard/views/databaseViewerView.js`
  - add a dedicated service such as `dashboard/services/databaseViewerService.js`
  - wire actions/state through `dashboard/services/runtimeTruth.js` and `dashboard/app.js`
- Reuse the existing backend architecture:
  - extend `server/index.js` with new grouped routes for the database viewer
  - extend `server/scripts/sqlite_admin.py` for table listing, row pagination, and any SQLite-side inspection work
- Do not fake backend responses for this view
- Do not fetch whole tables into memory unnecessarily
- Keep the UI simple and operator-focused
- Keep button enable/disable states explicit and deterministic

### Required-Table Truth

Use an explicit required-table list. Derive it from the best current documented source in this repo, likely `docs/OLD_DOCS/06_DATABASE_SCHEMA.md`, unless you find a more current authoritative definition in code. Document the chosen source in code comments or docs where appropriate.

### Sorting / Pagination

For the "most recent 50 rows" view:

- prefer descending timestamp if a clear timestamp column exists
- otherwise use descending integer PK or `rowid`
- keep pagination backend-owned and bounded

### Deliverables

- frontend view and state wiring
- backend endpoints for verification, table listing, row pagination, and logging session handling
- SQLite helper updates as needed
- small documentation updates so the repo truth stays honest

### Validation

After implementation, run the most targeted validation available for this repo and report any remaining limitations honestly, especially around DB logging coverage.

## GitHub Issue / Spec-Style Task Description

### Title

Add `E - Database Viewer` dashboard view with schema verification, table browsing, paginated row inspection, and bounded DB activity logging

### Background

The dashboard currently exposes four views (`A` through `D`). The repo already contains SQLite-oriented backend support for database status and inspection in the View A backend slice, but there is no dedicated database viewer/admin surface for operators.

We want a fifth view that lets an operator validate database readiness, browse tables safely, inspect recent rows, and review database activity captured during an explicit logging session.

### Problem

Right now there is no lightweight operator-facing way to:

- verify that the expected DB schema exists
- browse the database contents from the dashboard
- inspect recent rows without direct filesystem / manual SQLite access
- capture a bounded slice of DB activity while testing or operating the app

### Goals

- add a fifth dashboard view: `E - Database Viewer`
- combine DB existence + required-table verification into one action
- gate table browsing behind explicit verification and connect steps
- expose safe paginated table inspection
- add a start/stop DB logging workflow with honest scope reporting

### Non-Goals

- full database administration tooling
- unlimited row export / full-table fetches
- fake or overstated query logging coverage
- unrelated runtime/backend feature work outside this view

### Functional Scope

#### 1. Verify Database

Add a single `Verify Database` button that:

- checks whether the configured DB exists
- checks whether the required tables exist
- returns clear success/error details

Success enables `Connect to Database`.

#### 2. Connect To Database

Add a `Connect to Database` button that:

- remains disabled until verification passes
- acts as the gate before table browsing
- enables `Show Tables` after success

#### 3. Show Tables

Add a `Show Tables` button that:

- loads the list of tables/views
- renders a selectable list
- loads recent rows for the selected table

#### 4. Row Inspection

For a selected table:

- show the most recent `50` rows by default
- support pagination
- avoid large unbounded backend responses

#### 5. DB Logging

Add:

- `Start DB Logging`
- `Stop DB Logging`

When logging starts:

- record the session start time
- begin collecting database activity within the supported scope

When logging stops:

- record the end time
- show the activity captured between start and stop

### Repo Constraints

- Frontend lives under `dashboard/`
- Current backend lives under `server/index.js`
- SQLite helper boundary is `server/scripts/sqlite_admin.py`
- Current repo truth must be preserved: do not claim global DB tracing unless it is truly implemented

### Acceptance Criteria

- sidebar includes view `E`
- verification checks DB existence and required tables in one step
- missing tables are surfaced clearly
- connect/show-tables buttons are properly gated
- table list and row viewer are backend-driven
- row inspection is paginated
- DB logging has explicit start/stop behavior and visible results
- logging scope is documented honestly in UI and/or docs

### Suggested Files

- `dashboard/shared/constants.js`
- `dashboard/app.js`
- `dashboard/views/databaseViewerView.js`
- `dashboard/services/databaseViewerService.js`
- `dashboard/services/runtimeTruth.js`
- `server/index.js`
- `server/scripts/sqlite_admin.py`

### Notes

If the repo cannot yet support raw query capture across all DB writers, implement the closest honest version and document the exact coverage rather than faking a broader solution.
