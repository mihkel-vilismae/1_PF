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

## UI Behavior
- every subsection shows a visible status badge
- every subsection writes frontend log entries for request start, success, and failure
- every subsection stores and displays the latest backend payload or error response
- the frontend now calls a repo-local backend implementation of `/api/init/*`
- delete and recreate DB actions require explicit confirmation before the request is sent
- env verification and DB actions are implemented in the repo-local backend
- the legacy cron routes now manage a Windows Task Scheduler bootstrap path and render scheduler task plus host status directly in the card

## Future Backend Wiring Notes
- **1A** now has an implemented backend path plus a response schema derived from the checked-in `.env` contract.
- **2A** now has implemented backend endpoints for status, inspect, delete, and recreate-empty, with confirmation gating for destructive actions.
- **3A** now resolves the Windows platform contradiction by installing an AtLogOn Task Scheduler bootstrap task that starts a repo-local scheduler host.
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
