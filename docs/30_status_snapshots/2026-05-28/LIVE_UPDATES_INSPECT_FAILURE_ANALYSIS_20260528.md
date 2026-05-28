# Live Updates Inspect Failure Analysis — 28.05.2026

## Scope

This note analyzes the operator-observed issue where browser DevTools `Inspect element` cannot reliably stay attached to dashboard nodes because the page appears to refresh while the dashboard is open.

## Repo-backed cause

The dashboard still uses a full-root render path in `dashboard/app.ts` where the `#app` root is rebuilt with `app.innerHTML = ...`. That architecture is intentionally preserved in this fix, but it means the exact DOM node DevTools is inspecting can be destroyed and recreated during any render.

The current repo already includes scroll preservation for marked containers. That preserves selected scroll offsets after render, but it cannot preserve the identity of DOM nodes that DevTools has selected.

## Trigger paths

The inspected element can be replaced by render triggers that do not come from the operator's current click, including:

- global runtime-truth subscription renders,
- `dashboard:transit` events that redraw the transit terminal,
- View A scheduler polling,
- OS playback observability polling,
- backend version refresh completion.

## User-visible symptom

Opening DevTools and choosing `Inspect element` can appear to refresh or jump because the selected DOM node is removed by a background-driven render. DevTools then loses the original node reference even when the browser page did not perform a hard reload.

## Constraint

Do not remove the global render architecture in this bug fix. A broader partial-DOM rendering refactor would carry more risk and is not needed for the immediate DevTools inspection workflow.
