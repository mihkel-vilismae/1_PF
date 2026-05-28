# Nested payload scroll fix design

Estonian timestamp: 2026-05-28 13:01 EEST

## Selected fix

Add explicit stable `data-scroll-preserve` markers to the result payload surfaces emitted by `renderResultSurface()`:

- `.result-json-block`
- `.result-json`

## Why this fix

The existing scroll helper is intentionally explicit. It only preserves scroll positions for elements that opt in through stable `data-scroll-preserve` keys. Extending the renderer is therefore the smallest architecture-respecting fix.

## Stable key design

The key is built from stable result metadata:

- operation
- method
- endpoint
- payload label

The key is normalized to lower-case kebab-style text. It intentionally avoids timestamps, random IDs, array indexes, and mutable payload content.

## Preserved behavior

- No route changes.
- No backend behavior changes.
- No polling suppression.
- No global render architecture change.
- No broad automatic scan of all scrollable elements.
- Existing larger scroll preservation remains unchanged.

## Verification plan

Run focused tests that prove:

- `renderResultSurface()` emits scroll preservation markers on nested JSON payload elements.
- Existing new auth prompt rendering remains stable.
- Existing scroll marker coverage remains present.
