---
name: operator-menu-acr-normalizer
description: Normalize PF_login / PhotoFrame operator-menu trees into stable left-sidebar routes, typed center-panel UI blocks, item-kind classifications, risk markers, and regression-aware implementation notes. Use when Codex is asked to ACR, design, refine, review, or implement the v2 operator menu, setup/auth/startup/workers/troubleshooting/recovery navigation, sidebar/center-panel structure, or raw menu-tree-to-UI-schema conversion.
---

# Operator Menu ACR Normalizer

## Overview

Use this skill to convert a raw PF_login / PhotoFrame operator-menu tree into a typed UI/navigation contract before implementation. Keep this skill in planning mode unless the user explicitly asks to implement code.

## Operating Rules

- Preserve existing PF_login / PhotoFrame behavior unless the user explicitly requests implementation.
- Treat the six top-level menu entries as stable sidebar routes, not as nested action trees.
- Render child items in the center panel by typed block and interaction kind.
- Keep auth/session flows isolated from setup, startup, worker, troubleshooting, and recovery pages.
- Keep v3, future, and example items visible only as disabled placeholders or diagnostic seeds unless explicitly promoted.
- Mark destructive or state-changing recovery/setup actions as guarded.
- Require backend contracts before real execution of actions that affect runtime state.

## ACR Workflow

When asked for ACR or menu normalization:

1. Analyze the raw tree: identify top-level pages, child items, version markers, notes, examples, controls, and safety constraints.
2. Criticize the tree: call out mixed object types, unsafe flattening, missing backend contracts, ambiguous destructive actions, and UI patterns that would blur read-only status versus executable actions.
3. Refine the model: produce a stable sidebar plus page-specific center-panel blocks, item-kind classifications, interaction types, risks, and implementation blockers.

## Stable Sidebar

Use exactly these route-level entries unless the user supplies a newer approved baseline:

| Order | Sidebar item | Route key | Center page intent |
|---:|---|---|---|
| 01 | setup.sh | `setup` | Preflight overview and safe setup checks |
| 02 | authentication.sh | `authentication` | Local iCloudPD authentication workflow |
| 03 | startup.sh | `startup` | Env, database, and crontab setup/control |
| 04 | workers | `workers` | Live worker status and controls |
| 05 | troubleshooting | `troubleshooting` | Diagnostics, logs, stale locks, health |
| 06 | recovery | `recovery` | Snapshot metadata, state inspection, guarded restore planning |

Keep numbering separate from labels. Keep route keys code-friendly. Do not expose all child items in the sidebar by default.

## Center-Panel Blocks

Use these block types when converting children into UI structure:

- `statusCard`: read-only current state or summary.
- `actionList`: safe manual actions or guarded actions with explicit status.
- `sectionGroup`: grouping container for related controls or checks.
- `toggleRow` / `toggleGroup`: enable/disable-style controls.
- `comboRow` / `multiComboRow`: constrained selectors, including linked selectors.
- `stageTable`: repeated worker or pipeline stages with shared columns.
- `infoPanel`: notes, local-only warnings, logging model, or security warnings.
- `snapshotViewer`: read-only state/snapshot inspection.
- `snapshotList`: table/list of stored snapshots.
- `futurePlaceholder`: v3 or future visual item, disabled or clearly marked.
- `exampleList`: diagnostic examples or edge cases, not direct actions until promoted.

## Page Patterns

Use these defaults when the raw tree matches the v2 operator-menu plan:

- `setup`: `infoPanel`, `statusCard`, `actionList`; preflight only, no full dependency installer by default.
- `authentication`: `infoPanel`, `statusCard`, `actionList`; local-only auth/session checks, intentionally narrow.
- `startup`: section groups for `env`, `database`, and `crontab`; custom worker scheduler as `multiComboRow`.
- `workers`: all-worker `statusCard`, regular-worker `stageTable`, playback status card, screen on/off `toggleGroup`, statistics as v3 placeholder.
- `troubleshooting`: safe action list, logging/error model panels, examples as `exampleList`.
- `recovery`: snapshot metadata card, backup policy panel, current/backup snapshot viewers, guarded snapshot actions, snapshot list.

## Item Schema

Represent normalized items with this conceptual shape:

```json
{
  "id": "04.02.04",
  "label": "download",
  "kind": "stage",
  "parentId": "04.02",
  "route": "workers",
  "section": "regularWorker",
  "status": "v2 visual | planned-safe | v2 enabled | v3",
  "interaction": "readOnly | action | toggle | input | combo | multiCombo | disabledPlaceholder",
  "risk": "safe | guarded | destructive | future",
  "description": "Human-readable explanation",
  "backendContract": "optional explicit command/status endpoint/proof hook later"
}
```

Keep `kind` and `interaction` separate. A worker stage can include read-only status, input, action, and future stats at the same time.

## Classifications

Use these item kinds:

- `page`: sidebar route-level item.
- `section`: center-panel group.
- `status`: read-only live/current state.
- `action`: one-click/manual command.
- `toggle`: enable/disable setting.
- `stage`: pipeline step with repeated controls.
- `input`: user-entered value.
- `combo`: constrained selector.
- `multiCombo`: linked selectors.
- `viewer`: structured read-only data display.
- `future`: visible placeholder for later version.
- `example`: diagnostic scenario or documentation seed.

Use these status markers:

- `planned-safe`: safe to design for v2; avoid destructive behavior.
- `v2 visual`: visible in v2 UI but not necessarily functional.
- `v2 enabled`: real v2 action is allowed only when implementation is explicitly requested.
- `v3`: out of v2 implementation except placeholder or underlying stat collection.
- `*DEV`: developer/advanced path; do not dominate normal operator UI.
- `*MK1`: special UI pattern marker, currently MultiComboRow.
- `*EX`: example/edge-case seed; requires future rule, answer, and documentation before promotion.

## Output Format

When using this skill, return:

1. The stable sidebar route list.
2. A center-panel page plan per route.
3. A normalized item-kind and interaction classification.
4. Risk and version-scope notes.
5. Ambiguities, backend-contract gaps, and implementation blockers.
6. A regression-aware note: preserved behavior, proposed changes, untouched areas, and risks.

When implementing after normalization, keep changes minimal and local, preserve existing dashboard/backend contracts, and update focused tests/docs only for the behavior actually changed.
