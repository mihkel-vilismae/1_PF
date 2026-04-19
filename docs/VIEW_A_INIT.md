# View A — Init

## Purpose
View A is the setup and preparation surface. It groups early lifecycle actions that the operator should perform before relying on the system for tests or real runs.

## Sections
### 1A — Verify .env
This section provides a Run button, a latest-result surface, and a log area for configuration verification. The frontend now calls the documented backend contract endpoint and renders the returned payload or failure state directly in the card.

### 2A — Database controls
This section provides separate action buttons for:
- Check DB
- Inspect DB
- Delete DB
- Recreate DB

The panel also includes a shared log area and a status badge.
The latest triggered backend response is also rendered inside the card.

### 3A — Cron controls
This section provides separate action buttons for:
- Install cron
- Check cron
- Print cron

The panel also includes a shared log area and a status badge.
The latest triggered backend response is also rendered inside the card.

## UI Behavior
- every subsection shows a visible status badge
- every subsection writes frontend log entries for request start, success, and failure
- every subsection stores and displays the latest backend payload or error response
- the frontend now calls the documented `/api/init/*` endpoints
- this repository still does not contain the backend implementation behind those endpoints

## Future Backend Wiring Notes
- **1A** frontend wiring exists and now needs a real configuration validation backend implementation plus a stable response schema.
- **2A** frontend wiring exists and now needs database lifecycle endpoints, confirmation rules, and backend safety semantics.
- **3A** frontend wiring exists and now needs cron installation, inspection, and print implementations on the backend side.

## UI States
The view currently supports:
- idle
- running
- success
- error-ready pattern in the shared status system
- result rendering for the latest backend payload or error

## Evidence Basis
Derived from the user dashboard specification in this chat plus direct inspection of the current implementation, especially `dashboard/views/initView.js`, `dashboard/services/initService.js`, `dashboard/services/apiClient.js`, and `dashboard/services/runtimeTruth.js`.
