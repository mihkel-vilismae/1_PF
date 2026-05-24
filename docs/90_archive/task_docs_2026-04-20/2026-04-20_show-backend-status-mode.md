# Task Doc — Show Backend Status Inspection Mode Button

## Summary

Add a new topbar button next to the existing guide buttons called `Show backend status`.

When enabled, this mode highlights UI elements based on backend wiring truth:

- `real` when the UI calls a live backend endpoint and receives an implemented response
- `mock` when the UI uses frontend-only simulation, seeded demo state, or fake responses
- `missing` when the UI expects backend support but the endpoint, handler, or real backend response is absent or unimplemented
- `unknown` when the system cannot classify safely

The goal is to make backend wiring gaps visible directly in the rendered dashboard instead of forcing the user to infer them from behavior or documentation.

## Status

implemented

## Current Repo Truth

- The repo already has reusable guide-mode specs for:
  - `Explain controls`
  - `Explain values`
  - `Show real vs mock`
- The dashboard now also implements `Show backend status` as a fourth guide button in the topbar.
- The dashboard itself currently contains a hybrid mix of:
  - real View A backend calls
  - simulated/demo-only View B, C, and D behaviors
- The implemented backend-status mode classifies relevant elements as:
  - `real`
  - `mock`
  - `missing`
  - `unknown`
- In this repo, the classification is driven by centralized frontend metadata and recent response evidence rather than automatic backend introspection.
- In this repo, a useful backend-status model needs at least four states:
  - `real`
  - `mock`
  - `missing`
  - `unknown`

## Goals

- Make backend wiring truth visible in the UI.
- Distinguish between frontend simulation and genuinely missing backend implementation.
- Help operators and reviewers see when a control is wired, mocked, or blocked by missing backend support.
- Keep the pattern reusable in other hybrid dashboards and admin panels.

## Non-goals

- Replacing API documentation or contract documents.
- Performing full runtime introspection or route discovery automatically.
- Using color alone as the only signal.
- Forcing a confident classification when the truth is uncertain.
- Explaining every decorative or non-functional element.

## Workflow / UX

1. The user clicks `Show backend status` in the topbar.
2. Backend-status inspection mode turns on.
3. Relevant UI elements in the current rendered view are highlighted by backend status.
4. Hovering or focusing a highlighted element opens a tooltip.
5. The tooltip briefly explains why the element is classified as `real`, `mock`, `missing`, or `unknown`.
6. Clicking the button again turns the mode off.

## Portable Behavior Contract

### Button behavior

- Place the button in the global header or toolbar beside the other guide buttons.
- Make the active state visually obvious.
- If multiple guide modes would visually conflict, prefer making them mutually exclusive.

### Classification categories

Use these categories:

- `real`
  - the UI calls a live backend endpoint and receives an implemented response
- `mock`
  - the UI behavior is simulated in the frontend or backed by fake/demo data rather than a real backend call
- `missing`
  - the UI is intended to call backend behavior, but the endpoint is absent, unimplemented, not wired, returns `404`/`501`, or does not produce a usable backend response
- `unknown`
  - there is not enough reliable information to classify the element safely

### What should be highlightable

These are good candidates:

- action buttons
- result panels
- response and status cards
- value displays that depend on backend data
- readiness notices
- cards or rows that communicate backend availability or absence

Avoid highlighting:

- decorative wrappers
- static headings that do not communicate backend status
- layout-only containers

### Tooltip rules

- Use a custom tooltip component.
- The tooltip should briefly explain *why* the element was classified the way it was.
- Keep tooltip copy short and backend-oriented.

Good examples:

- `Real: calls a live backend endpoint and shows its response.`
- `Mock: frontend-only simulation; no real backend call is made.`
- `Missing: UI expects backend support, but no implemented endpoint exists yet.`
- `Missing: route exists in the contract, but no usable backend response is returned.`
- `Unknown: no reliable backend-status metadata is available.`

### Accessibility rules

- Do not rely on color alone.
- Add a secondary cue such as border style, badge, icon, label, or tooltip wording.
- Keep the interface readable while the mode is active.

## Architecture Guidance

- Store the mode state in the shared UI state layer so it survives rerenders.
- Resolve backend-status classification from a centralized metadata map or resolver rather than scattered ad hoc logic.
- Prefer explicit per-element or per-section metadata where possible.
- Prefer safe fallback to `unknown` instead of overstating backend support.
- Coordinate this mode cleanly with the existing guide buttons.

## Acceptance Criteria

- A topbar button labeled `Show backend status` exists beside the other guide buttons.
- Relevant elements are visibly distinguishable as `real`, `mock`, `missing`, or `unknown` while the mode is active.
- Hovering or focusing a highlighted element shows a tooltip explaining the classification.
- Missing backend cases are clearly visible.
- Existing dashboard behavior still works.
- The UI remains readable and accessible while the mode is active.

## Files Changed In This Repo

- `dashboard/app.js`
- `dashboard/styles.css`
- `dashboard/services/runtimeTruth.js`
- `task_docs/2026-04-20_show-backend-status-mode.md`
- `task_docs/_TABLE_OF_CONTENTS.md`

## Prompt Analysis

Original intent, cleaned up:

> Add a button called `Show backend status` that marks things as real, mock, or missing when a UI action expects backend support but there is no endpoint or no backend response.

What is good:

- It clearly identifies a new guide mode.
- It distinguishes `missing` from `mock`, which is the most valuable refinement.
- It focuses on a practical problem users actually encounter in hybrid UIs.

What is missing:

- It does not define the difference between `mock` and `missing`.
- It does not define which UI elements should be classified.
- It does not define what counts as evidence for `real`.
- It does not define tooltip behavior.
- It does not mention fallback handling when the truth is uncertain.
- It does not mention accessibility or interaction rules.

## Prompt Critique

The idea is strong because `missing backend` is not the same as `mock behavior`, and users benefit from seeing that difference directly.

The biggest risk is collapsing too many states together. If the implementation treats all non-real behavior as `mock`, the most important case, namely “the UI contract exists but the backend is absent,” becomes invisible.

The second risk is false certainty. Some elements may not expose enough information to determine whether the backend is mocked, missing, or simply not loaded yet, so the prompt needs an explicit `unknown` fallback.

The third risk is over-highlighting. Without defining scope, developers may end up tagging every visible node instead of the elements that actually communicate backend readiness or lack of it.

## Refined Prompt

```text
Add a new topbar button next to the existing guide buttons called "Show backend status".

Purpose:
- This button toggles a backend-status inspection mode.
- The mode should help users see which UI elements are backed by a real backend, which are frontend-only mock behavior, and which are missing backend implementation.

Classification rules:
- `real`
  - the UI calls a live backend endpoint and receives a real implemented response
- `mock`
  - the UI behavior is simulated in the frontend, uses seeded demo state, fake responses, or placeholder logic instead of a real backend
- `missing`
  - the UI is intended to call backend behavior, but the endpoint is absent, unimplemented, not wired, returns 404/501, or never produces a real backend response
- `unknown`
  - use this safe fallback when the classification is not reliable

Behavior:
- When backend-status mode is ON, highlight relevant UI elements in the current rendered view.
- Use a distinct treatment for each backend status:
  - green for `real`
  - red for `mock`
  - amber or gray for `missing`
  - neutral fallback for `unknown`
- Do not apply the mode to decorative layout elements or static headings unless they directly communicate backend status.

Scope:
- Apply the classification to user-facing elements such as:
  - action buttons
  - result panels
  - response/status cards
  - value displays that depend on backend data
  - notices that describe backend readiness
  - cards or rows representing wired vs simulated vs missing backend behavior

Tooltip behavior:
- On hover or keyboard focus, show a custom tooltip near the highlighted element.
- The tooltip must briefly explain why the element is classified as `real`, `mock`, `missing`, or `unknown`.
- Use short, concrete wording such as:
  - `Real: calls a live backend endpoint and shows its response.`
  - `Mock: frontend-only simulation; no real backend call is made.`
  - `Missing: UI expects backend support, but no implemented endpoint exists yet.`
  - `Missing: route exists in the contract, but no usable backend response is returned.`
  - `Unknown: no reliable backend-status metadata is available.`

Implementation constraints:
- Place the button in the existing topbar action area beside the other guide buttons.
- Keep the mode state in the shared UI state layer so it survives rerenders.
- Keep classification logic centralized in a shared resolver or metadata map.
- If needed, make this mode mutually exclusive with the other guide modes to avoid conflicting highlights.
- Use a custom tooltip component, not the browser title attribute.
- Do not rely on color alone; also provide a secondary cue through borders, badges, labels, or tooltip wording.
- Preserve existing click, hover, and keyboard behavior.

Acceptance criteria:
- The "Show backend status" button toggles the mode on and off.
- Relevant elements are clearly marked as `real`, `mock`, `missing`, or `unknown`.
- Hovering or focusing a highlighted element shows a brief explanation of the classification.
- Missing backend cases are visible and understandable to the user.
- Existing dashboard behavior still works.
- The project builds cleanly after the change.
```

## GitHub Issue / Spec-Style Task Description

Title:

`Add reusable "Show backend status" inspection mode for hybrid dashboards`

Description:

Add a reusable inspection mode for hybrid dashboards and control panels. The mode should be triggered by a topbar button labeled `Show backend status`. When enabled, it should visually classify relevant UI elements by backend wiring truth and show a tooltip that briefly explains why each element is considered `real`, `mock`, `missing`, or `unknown`.

This is intended to help operators and reviewers quickly see where backend support exists, where behavior is frontend-only, and where the UI expects backend implementation that does not yet exist.

Scope:

- add a topbar guide button
- classify relevant rendered UI elements by backend status
- visually distinguish `real`, `mock`, `missing`, and `unknown`
- provide short explanatory tooltips
- coordinate cleanly with the existing guide modes

Out of scope:

- full automatic route discovery
- replacing API or contract documentation
- forcing a confident label when evidence is not reliable

Definition of done:

- the button is present and usable
- backend status is visually understandable
- tooltips explain the classification briefly and accurately
- the mode is reusable in other dashboard-style projects
