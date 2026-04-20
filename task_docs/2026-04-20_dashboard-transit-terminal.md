# Task Doc — Dashboard Transit Terminal + Single Gateway

## Summary

Add a shared, bottom-of-view "transit terminal" panel to the dashboard UI. Initially it shows placeholder terminal-like output, then switches to live gateway traffic once the first dashboard request runs.

At the same time, harden the existing dashboard external I/O boundary so that all dashboard-to-backend traffic crosses a single gateway function in `dashboard/services/apiClient.js`, and mirror those gateway events into the terminal.

## Status

implemented

## Current Repo Truth

- The dashboard is a browser UI under `dashboard/`.
- The dashboard does not directly touch the filesystem.
- View A uses `dashboard/services/initService.js` to call backend endpoints, and those calls already go through `dashboard/services/apiClient.js` which wraps `fetch`.

## Invariant Enforced

All dashboard outbound requests and inbound responses/errors that cross the dashboard external boundary must pass through a single gateway function in `dashboard/services/apiClient.js`, and that gateway must emit normalized monitoring records.

## UX / Operator View

- A shared "Transit terminal" panel is rendered at the bottom of the main panel, beneath the active view markup.
- Before any live request occurs, the panel shows deterministic placeholder terminal-like lines and clearly labels itself as placeholder.
- Once live traffic occurs, the panel shows one line per gateway event (outbound + inbound).

## Implementation Notes

- `dashboard/services/apiClient.js`
  - `requestJson()` is treated as the single dashboard external I/O gateway.
  - It emits two records per request:
    - `direction: outbound` before calling `fetch`
    - `direction: inbound` after a response or after a failure
  - Emits to:
    - in-process subscribers via `subscribeTransit(listener)`
    - best-effort browser events via `CustomEvent('dashboard:transit', { detail })`
- `dashboard/app.js`
  - Renders a shared terminal-like panel at the bottom of the main panel.
  - Listens for `dashboard:transit` events and appends formatted lines to the terminal buffer.

## Files Changed

- `dashboard/services/apiClient.js`
- `dashboard/app.js`
- `task_docs/2026-04-20_dashboard-transit-terminal.md`
- `task_docs/_TABLE_OF_CONTENTS.md`
- `tests/transitGateway.test.js`

## Non-goals / Out of Scope

- Rewiring View B/C/D to backend endpoints (they remain simulated).
- Changing backend behavior or moving backend filesystem work into the dashboard.
- Large CSS refactors (the terminal uses existing styles).

## Acceptance Criteria

- A shared bottom "Transit terminal" is visible on every view (A/B/C/D).
- The terminal clearly labels placeholder content before any live traffic occurs.
- The terminal switches to live traffic once the first request is made.
- `fetch` is only used in `dashboard/services/apiClient.js` under the `dashboard/` tree.
- A minimal automated test verifies that the gateway emits outbound + inbound transit records.

