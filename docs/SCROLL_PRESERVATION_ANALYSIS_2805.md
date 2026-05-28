# Scroll Preservation Analysis — 28.05.2026, 11:55 EEST

## Scope

This note records the repo-backed analysis for the global dashboard issue where scrollable UI areas jump back to the top while the user is reading them.

## Confirmed render path

`dashboard/app.ts` renders the whole dashboard through one global `render()` function. That function builds the active view markup and then replaces the full app root with `app.innerHTML = ...`.

`render()` is subscribed to runtime state changes through `subscribe(render)`, so polling, transit logging, modal state, history updates, activity updates, and runtime truth changes can all rebuild the app root.

## Root cause

When the full app root is replaced, existing scrollable DOM nodes are destroyed and new nodes are created. Browser scroll state attached to the destroyed nodes is lost. The replacement node starts at its default scroll position, which is usually the top.

The issue is global because the same render path owns modals, event history, transit logs, scheduler terminal rows, OS playback terminal panels, and view content.

## Regression-safe fix direction

Use explicit scroll preservation markers and a small helper that captures marked scroll containers before `app.innerHTML` replacement, then restores those positions after the replacement. This keeps the current rendering architecture intact and avoids suppressing background state updates.

## Preserved boundaries

- No backend endpoints are changed.
- No runtime truth semantics are changed.
- No polling is disabled.
- No modal, log, terminal, or playback controls are removed.
- The fix is presentation-only and should not change data flow.
