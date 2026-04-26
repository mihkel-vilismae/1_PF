# Dashboard Inspect Controls Pattern

Status: Reusable default-project pattern.
Updated: 2026-04-26 23:40 Europe/Tallinn.

## Purpose

The Dashboard Inspect Controls Pattern is a reusable dashboard meta-inspection layer for projects that need honest, operator-friendly UI explanations.

It provides four portable controls:

1. **Explain controls** — explains what visible controls, cards, buttons, selectors, and navigation items do.
2. **Explain values** — explains what displayed values mean and where they come from.
3. **Show real vs mock** — classifies visible UI as real backend-backed behavior, mock/demo behavior, preview-only behavior, mixed behavior, or unknown.
4. **Show/Hide backend status** — exposes whether visible UI has real backend support, frontend-only mock behavior, missing backend support, or unknown status.

## Required behavior

- The controls must be page-aware.
- The controls must work consistently across all major dashboard pages.
- Metadata must be centralized rather than duplicated in each page.
- Unknown metadata must degrade gracefully.
- The UI must never claim real backend support unless code evidence proves that backend/API/runtime path exists.
- Backend status must not invent live backend results.

## Recommended architecture

Use this reusable structure in default project setups:

```text
dashboard/
  inspect/
    bindInspectModes.js
    controlMetadata.js
    realityMetadata.js
    backendStatusMetadata.js
    tooltipController.js
    inspectModeSummary.js
```

Recommended responsibilities:

| File | Responsibility |
| --- | --- |
| `bindInspectModes.js` | Finds inspectable elements, applies metadata datasets/classes, and binds hover/focus behavior. |
| `controlMetadata.js` | Explains controls and displayed values. |
| `realityMetadata.js` | Classifies real/mock/mixed/unknown implementation truth. |
| `backendStatusMetadata.js` | Classifies backend support as real/mock/missing/unknown. |
| `tooltipController.js` | Renders the shared tooltip/popover. |
| `inspectModeSummary.js` | Renders immediate page-aware feedback when an inspect mode is toggled on. |

## Default-project setup requirement

Future dashboards should include this pattern when they have multiple pages, mock-vs-real ambiguity, or backend/API/runtime status that an operator needs to understand.

Default controls should be visible in a shared toolbar:

```text
Explain controls
Explain values
Show real vs mock
Show backend status / Hide backend status
```

## Testing requirements

Each project that adopts this pattern should test:

- The four buttons render.
- Each button toggles a visible state.
- Backend status label changes from `Show backend status` to `Hide backend status`.
- Every major page has page-aware metadata or a clear fallback.
- Real/mock/backend-status metadata does not falsely claim backend support.
