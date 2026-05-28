# Nested payload scroll failure analysis

Estonian timestamp: 2026-05-28 12:59 EEST

## Baseline

- Baseline ZIP: `PF_login--v0.7.12--auth-logout-eperm-fix-full_git.zip`
- Repo version before this fix: `0.7.12`

## User-observed failure

The latest video shows a scroll jump inside the `Response payload` JSON panel. The larger page, modal, and log scroll containers already have scroll preservation markers, but the inner result payload panel is a separately scrollable `.result-json` element.

## Repo-backed cause

`dashboard/services/renderers.ts` renders backend result payloads through `renderResultSurface()`. The payload body is emitted as:

```html
<pre class="result-json">...</pre>
```

`dashboard/styles.css` makes `.result-json` independently scrollable with `overflow: auto` and `max-height: 220px`. Because `.result-json` did not have a `data-scroll-preserve` key, the scroll-preservation helper could not capture or restore this nested scroll position when the global dashboard root was rebuilt.

## Impact

Any card that renders `renderResultSurface()` can still jump to the top inside the nested JSON payload panel during background state updates, API transit updates, or other full-dashboard re-renders.

## Boundary

This is not a backend issue and does not require changes to routes, auth, media pipeline, Test/Real mode, or runtime truth semantics.
