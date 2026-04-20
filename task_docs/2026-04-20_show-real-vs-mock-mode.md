# Task Doc — Show Real vs Mock Inspection Mode Button

## Summary

Add a third topbar button next to `Explain controls` and `Explain values` called `Show real vs mock`.

When enabled, this mode highlights UI elements based on implementation truth:

- real elements use a green treatment
- mock / simulated / placeholder elements use a red treatment
- mixed or uncertain elements use a neutral fallback treatment

The goal is to let operators and reviewers understand at a glance which parts of the dashboard are wired to real behavior and which parts are still demo-driven.

## Status

implemented

## Current Repo Truth

- The repo now has three related guide-mode concepts:
  - `Explain controls`
  - `Explain values`
  - `Show real vs mock`
- The dashboard docs explicitly distinguish wired vs prototype-driven areas.
- View A has real backend wiring for init endpoints.
- Views B, C, and D still contain substantial simulated, demo, or frontend-only behavior.
- The real-vs-mock mode is implemented in the dashboard shell and classifies rendered UI elements as:
  - `real`
  - `mock`
  - `mixed`
  - `unknown`
- The current implementation uses explicit classification rules in the shell instead of runtime code introspection.

## Goals

- Make implementation truth visible in the UI without requiring the user to read docs first.
- Show which actions, values, panels, and notices are real, mock, mixed, or unknown.
- Reduce confusion in hybrid dashboards where some sections are wired and others are simulated.
- Keep the feature reusable in other dashboards with similar partial-implementation states.

## Non-goals

- Replacing documentation or implementation-status reports.
- Performing automatic code analysis at runtime.
- Using color alone as the only signal.
- Forcing an incorrect real/mock label when the element is actually mixed or unknown.
- Explaining every decorative or static layout element.

## Workflow / UX

1. The user clicks `Show real vs mock` in the topbar.
2. Real/mock inspection mode turns on.
3. Relevant UI elements in the current rendered view are highlighted according to their implementation truth.
4. Hovering or focusing a highlighted element opens a tooltip.
5. The tooltip briefly explains why the element is real, mock, mixed, or unknown.
6. Clicking the button again turns the mode off.

## Portable Behavior Contract

### Button behavior

- Place the button in the global header or toolbar beside the other guide buttons.
- Make the active state visually obvious.
- If multiple guide modes would visually conflict, prefer making them mutually exclusive.

### Classification categories

Use these categories:

- `real`
  - backed by live backend endpoints, real runtime state, or actual implemented behavior
- `mock`
  - frontend-only simulation, placeholder behavior, seeded demo state, or non-authoritative preview logic
- `mixed`
  - the shell/control is real, but the result/value/panel is still simulated
- `unknown`
  - there is not enough reliable information to classify safely

### What should be highlightable

These are good candidates:

- action buttons
- result panels
- value cards
- preview surfaces
- notices
- status badges
- rows or cards whose purpose is to communicate whether a feature is wired or simulated

Avoid highlighting:

- decorative wrappers
- static headings that do not communicate real/mock truth
- layout-only elements

### Tooltip rules

- Use a custom tooltip component.
- The tooltip should briefly explain *why* the element was classified the way it was.
- Keep tooltip copy short and evidence-oriented.

Good examples:

- `Real: calls a live backend init endpoint.`
- `Mock: frontend-only simulation; no backend call exists yet.`
- `Mixed: control is wired, but the displayed data is still seeded demo state.`
- `Unknown: no reliable classification metadata is available.`

### Accessibility rules

- Do not rely on green/red color alone.
- Add a secondary cue such as border style, label, badge, icon, tooltip wording, or legend.
- Keep the interface readable when the mode is active.

## Architecture Guidance

- Store the mode state in the shared UI state layer so it survives rerenders.
- Resolve real/mock classification from a centralized metadata map or resolver rather than scattered ad hoc logic.
- Make the classification system explicit per element or per UI section.
- Prefer safe fallback to `mixed` or `unknown` instead of overstating truth.
- Coordinate this mode cleanly with the existing guide buttons.

## Acceptance Criteria

- A topbar button labeled `Show real vs mock` exists beside the other guide buttons.
- Real elements are visibly distinct from mock elements while the mode is active.
- Mixed and unknown cases are handled safely.
- Hovering or focusing a highlighted element shows a tooltip explaining the classification.
- Existing dashboard behavior still works.
- The UI remains readable and accessible while the mode is active.

## Files Changed In This Repo

- `dashboard/app.js`
- `dashboard/styles.css`
- `dashboard/services/runtimeTruth.js`
- `task_docs/2026-04-20_show-real-vs-mock-mode.md`
- `task_docs/_TABLE_OF_CONTENTS.md`

## Prompt Analysis

Original intent, cleaned up:

> Add a button called `Show real vs mock` that highlights mock elements with a red hue and real elements with a green hue.

What is good:

- It clearly states the new feature.
- It communicates the desired visual outcome very quickly.
- It identifies the key semantic split: real vs mock.

What is missing:

- It does not define which elements should be classified.
- It assumes every element is either real or mock, which is often false.
- It does not define what counts as evidence for "real".
- It does not define tooltip behavior or wording.
- It does not mention accessibility.
- It does not mention whether this mode should coexist with or exclude the other guide modes.

## Prompt Critique

The idea is strong, but the raw prompt is too binary for a real hybrid dashboard.

The biggest risk is misclassification. In dashboards like this one, some controls are real while the values or panels they affect are still simulated. Forcing everything into a red/green split would overstate implementation truth and make the UI less trustworthy.

The second risk is accessibility. A red/green-only system is not enough by itself, especially for users with color-vision limitations.

The third risk is ambiguity in scope. Without defining which elements count, developers may either under-highlight only buttons or over-highlight entire layout containers.

## Refined Prompt

```text
Add a third topbar button next to "Explain controls" and "Explain values" called "Show real vs mock".

Purpose:
- This button toggles an implementation-truth inspection mode.
- The mode should help users see which UI elements are backed by real functionality and which are still mock, simulated, placeholder, or demo-driven.

Behavior:
- When the mode is ON, highlight relevant UI elements based on implementation truth.
- Use a green treatment for elements backed by real data, live backend behavior, or actual runtime wiring.
- Use a red treatment for elements that are mock, simulated, placeholder, frontend-only, or demo-driven.
- If an element is mixed or cannot be classified confidently, use a neutral fallback state instead of forcing an incorrect red/green label.
- Apply the mode to the current rendered view only.

Scope:
- Classify user-facing elements that communicate behavior or state, such as:
  - action buttons
  - result panels
  - status badges
  - value displays
  - preview panels
  - notices
  - cards or rows that represent real vs simulated behavior
- Do not highlight purely decorative layout elements or static headings unless they directly communicate real/mock truth.

Tooltip behavior:
- On hover or keyboard focus, show a custom tooltip near the highlighted element.
- The tooltip must briefly explain why the element is classified as real, mock, mixed, or unknown.
- Use clear wording such as:
  - `Real: backed by a live backend endpoint.`
  - `Mock: frontend-only simulation.`
  - `Mixed: control is wired, but displayed data is still demo state.`
  - `Unknown: no reliable classification metadata is available.`

Implementation constraints:
- Place the button in the existing topbar action area beside the other guide buttons.
- Keep the mode state in the shared UI state layer so it survives rerenders.
- Keep classification logic centralized in a shared resolver or metadata map.
- If needed, make this mode mutually exclusive with the other guide modes to avoid conflicting highlights.
- Use a custom tooltip component, not the browser title attribute.
- Do not rely on color alone; also provide borders, labels, badges, or tooltip wording that make the classification clear.
- Preserve existing click, hover, and keyboard behavior.

Acceptance criteria:
- The "Show real vs mock" button toggles the mode on and off.
- Real elements are visually distinct from mock elements.
- Mixed and unknown cases are handled safely.
- Hovering or focusing a highlighted element shows a brief explanation of the classification.
- Existing dashboard functionality still works.
- The UI remains readable and accessible while the mode is active.
```

## GitHub Issue / Spec-Style Task Description

Title:

`Add reusable "Show real vs mock" inspection mode for hybrid dashboards`

Description:

Add a third reusable inspection mode for hybrid dashboards and control panels. The mode should be triggered by a topbar button labeled `Show real vs mock`. When enabled, it should visually classify relevant UI elements based on implementation truth and show a tooltip that briefly explains why each element is considered real, mock, mixed, or unknown.

This is intended to help operators and reviewers quickly understand which parts of the interface are fully wired and which parts remain simulated or placeholder-driven.

Scope:

- add a third topbar guide button
- classify relevant rendered UI elements
- visually distinguish real vs mock states
- provide short explanatory tooltips
- coordinate cleanly with the existing guide modes

Out of scope:

- full runtime introspection or code analysis
- replacing documentation or implementation-status reports
- forcing a binary label when the truth is mixed or unknown

Definition of done:

- the button is present and usable
- real/mock/mixed/unknown classification is visually clear
- tooltips explain the classification briefly and accurately
- the mode is reusable in other dashboard-style projects
