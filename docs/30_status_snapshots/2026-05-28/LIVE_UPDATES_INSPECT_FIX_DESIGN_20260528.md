# Live Updates Inspect Fix Design — 28.05.2026

## Selected fix

Add a small dashboard-shell control named `Pause live updates` / `Resume live updates`. The control pauses background polling and transit-triggered renders so the operator can inspect stable DOM nodes in DevTools.

## Why this design

The previous scroll fixes preserve scroll positions, but DevTools still loses inspected nodes when background updates rebuild the app root. A pause control is the smallest low-risk fix because it does not change backend routes, runtime truth semantics, Test/Real separation, auth behavior, media pipeline behavior, or playback contracts.

## Behavior

When live updates are paused:

- `dashboard:transit` records are still consumed, but render is deferred;
- View A scheduler polling does not start new refresh actions;
- OS playback observability polling does not start new refresh actions;
- backend version completion does not force an immediate render;
- user-triggered controls remain available from the visible dashboard.

When live updates are resumed:

- the dashboard renders again;
- background polling can continue on its next interval;
- any pending live-update render is cleared by the resumed render.

## Boundaries

This is an operator inspection helper, not a backend mode. It must not alter runtime mode headers, database paths, auth/session semantics, scheduler behavior, or playback state.
