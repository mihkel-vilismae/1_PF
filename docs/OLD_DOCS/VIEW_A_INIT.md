# View A — Init

## Purpose
View A is the setup and preparation surface. It groups early lifecycle actions that the operator should perform before relying on the system for tests or real runs.

## Sections
### 1A — Verify .env
This section provides a Run button, a latest-result surface, and a log area for configuration verification. The frontend now calls a repo-local backend endpoint and renders the returned payload or failure state directly in the card.

### 2A — Database controls
This section provides separate action buttons for:
- Check DB
- Inspect DB
- Delete DB
- Recreate DB

The panel also includes a shared log area and a status badge.
The latest triggered backend response is also rendered inside the card.

### 3A — Scheduler controls
This section provides separate action buttons for:
- Install scheduler
- Check scheduler
- Print scheduler

The panel also includes a shared log area and a status badge.
The latest triggered backend response is also rendered inside the card.
The card now reads a shared scheduler capability profile and can disable install actions when support is deferred or unsupported for the active platform.

## UI Behavior
- every subsection shows a visible status badge
- every subsection writes frontend log entries for request start, success, and failure
- every subsection stores and displays the latest backend payload or error response
- the frontend now calls a repo-local backend implementation of `/api/init/*`
- delete and recreate DB actions require explicit confirmation before the request is sent
- recreate DB now bootstraps canonical schema tables from `schema.sql` after recreating the DB file
- env verification and DB actions are implemented in the repo-local backend
- the legacy cron routes now return a platform-aware scheduler payload with explicit support levels (`supported`, `deferred`, `unsupported`)
- Windows 11 keeps the real Task Scheduler bootstrap-host path for install/status/print
- Raspberry Pi OS profile currently keeps install deferred while status/print expose honest capability metadata

## Operational Dependency
- View A is only backend-wired if the repo-local init API is actually running and reachable from the frontend.
- In local development, this means the frontend and `node server/index.js` must both be running, with `/api/*` reaching `127.0.0.1:4301` through the Vite proxy.
- If the init API process is not running, View A can show endpoint failures even though the route implementations exist in the repository.
- Runtime troubleshooting must therefore separate:
  - init API not running or not reachable
  - backend handler returned an error
  - contract mismatch between frontend and backend

## Future Backend Wiring Notes
- **1A** now has an implemented backend path plus a response schema derived from the checked-in `.env` contract.
- **2A** now has implemented backend endpoints for status, inspect, delete, and recreate-empty, with confirmation gating for destructive actions and schema bootstrap on recreate.
- **3A** now uses one shared capability model across backend and frontend so platform behavior is explicit and reusable.
- **3A** resolves the Windows platform contradiction by installing an AtLogOn Task Scheduler bootstrap task that starts a repo-local scheduler host.
- the remaining 3A gap is not installation semantics anymore; it is wiring real pipeline/playback/screen/recovery services behind that host.

## UI States
The view currently supports:
- idle
- running
- success
- error-ready pattern in the shared status system
- result rendering for the latest backend payload or error

## Evidence Basis
Derived from direct inspection of the current implementation, especially `dashboard/views/initView.js`, `dashboard/services/initService.js`, `dashboard/services/apiClient.js`, `dashboard/services/runtimeTruth.js`, `server/index.js`, `server/scheduler_host.js`, `server/scripts/sqlite_admin.py`, and `server/scripts/windows_task_scheduler.ps1`.
