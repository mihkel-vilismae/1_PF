# Task Doc — Explain Values Source Mode Button

## Summary

Add a second topbar button next to `Explain controls` that toggles a value-source inspection mode. When enabled, the UI highlights live values rather than actions and shows a tooltip that briefly explains where each value comes from.

This is useful in dashboards where operators can see many changing values but do not know which input, state object, backend result, or simulation control is driving each one.

## Status

implemented

## Current Repo Truth

- The companion value-source mode is implemented in this repo's dashboard shell.
- The mode toggle state lives in `dashboard/services/runtimeTruth.js`.
- The second topbar button and the value-source metadata resolver live in `dashboard/app.js`.
- The value-mode highlight styling lives in `dashboard/styles.css`.
- In the current implementation, the mode highlights dynamic UI surfaces such as:
  - definition-list values
  - status badges
  - backend result summaries and JSON blocks
  - history/log timestamps, type chips, and messages
  - playback preview values
  - worker summary/status fields
  - notices and modal value blocks

## Goals

- Help users understand where displayed values come from.
- Make state-driven UI easier to debug and learn.
- Visually separate action controls from data readouts.
- Provide lightweight provenance hints without requiring external docs.
- Keep the feature reusable in other dashboards or admin panels.

## Non-goals

- Full data lineage or backend tracing.
- Explaining every static label in the UI.
- Replacing observability tools or developer debugging tools.
- Turning the interface into a schema browser.

## Workflow / UX

1. The user clicks `Explain values` in the topbar.
2. Value-source mode turns on.
3. Dynamic UI values are highlighted.
4. Hovering or focusing a highlighted value opens a tooltip.
5. The tooltip answers a simple question: where does this value come from?
6. Clicking the button again turns the mode off.

## Portable Behavior Contract

### Button behavior

- Place the value-source button next to the control-guide button in the global header or toolbar.
- The label should clearly communicate that the mode explains live values, for example `Explain values`, `Trace values`, or `Show value sources`.
- The active state should be visually obvious.
- If both guide modes would conflict visually, prefer making them mutually exclusive.

### What should count as a value

Treat these as value surfaces by default:

- read-only numbers, labels, badges, counters, statuses, timestamps, and summaries
- result panels populated by backend responses
- preview fields derived from shared state
- list entries populated from logs, history, or runtime state
- dynamic notices that switch message based on state

Do not include:

- static headings
- decorative copy
- fixed labels like section names
- controls whose main purpose is to trigger actions rather than display state

### Tooltip behavior

- Use a custom tooltip component.
- Tooltip content should be brief and source-oriented.
- The tooltip should explain the state/input/source behind the displayed value.
- Prefer wording like:
  - `Source: state.truth.queueLength`
  - `Source: latest backend response for Verify .env`
  - `Source: simulation toggles in B5`
  - `Source: selected log entry stored in modal state`
- Avoid long implementation dumps.

### Architecture rules

- Store the mode state centrally so it survives rerenders.
- Resolve tooltip copy from a stable mapping or inference layer.
- Keep the value-source logic in the shell/shared layer where possible.
- Highlight values only while the mode is active.
- Hide tooltips when scroll/resize makes placement stale.

## Acceptance Criteria

- A second topbar button exists next to `Explain controls`.
- When the mode is ON, dynamic values are visually highlighted.
- Hovering or focusing a highlighted value shows a brief tooltip about where that value comes from.
- The value mode is visually distinct from the control mode.
- Existing dashboard behavior still works.
- The project builds cleanly after the change.

## Files Changed In This Repo

- `dashboard/app.js`
- `dashboard/styles.css`
- `dashboard/services/runtimeTruth.js`
- `task_docs/2026-04-20_explain-values-source-mode.md`
- `task_docs/_TABLE_OF_CONTENTS.md`

## Prompt Analysis

Original intent, cleaned up:

> Add another button next to the explain-controls button. It should highlight every element whose displayed value is not static text and can change because of some input or state. On hover, show a brief tooltip explaining where that value comes from.

What is good:

- It clearly requests a second mode rather than overloading the first one.
- It distinguishes action controls from dynamic data.
- It asks for provenance-style tooltips, which is high-value for complex dashboards.

What is missing:

- It does not define what counts as a dynamic value.
- It does not define whether the two guide modes may be active at the same time.
- It does not define whether the tooltip should explain exact state paths or higher-level sources.
- It does not define whether focus behavior matters in addition to hover.
- It does not define whether static labels inside dynamic panels should be ignored.

## Prompt Critique

The original idea is strong, but it is easy to implement badly.

The main risk is over-highlighting. If "every non-static element" is interpreted too broadly, the UI becomes noisy and developers will end up highlighting labels, wrappers, or decorative text that do not actually represent changing data.

The second risk is vague provenance text. Without an explicit instruction to keep tooltips short and source-oriented, the implementation often drifts into generic filler like "This value changes based on state."

The third risk is interaction overlap. If the value mode and control mode are not intentionally coordinated, the dashboard can end up with conflicting highlights and confusing tooltip behavior.

## Refined Prompt

```text
Add a second topbar button next to "Explain controls" called "Explain values".

Purpose:
- This button toggles a value-source inspection mode.
- The mode should help users understand where changing UI values come from.

Behavior:
- When value-source mode is ON, highlight dynamic UI values in the current rendered view.
- Dynamic values include:
  - read-only statuses and badges
  - counters, timestamps, summaries, and state fields
  - values shown in definition lists
  - backend result summaries and payload blocks
  - log/history entries populated from runtime state
  - preview values derived from shared state
  - modal detail values
- Do not highlight static headings, fixed labels, decorative copy, or action buttons.

Tooltip behavior:
- On hover or keyboard focus, show a custom tooltip near the highlighted value.
- The tooltip must briefly explain where the value comes from.
- Use source-oriented wording, for example:
  - `Source: shared truth state`
  - `Source: latest backend response for this card`
  - `Source: simulation controls in B5`
  - `Source: selected log/history entry`
- Keep the tooltip brief and useful.

Implementation constraints:
- Place the button next to the existing explain-controls button in the topbar.
- Keep the mode state in the shared UI state layer so it survives rerenders.
- Keep the resolver for value-source copy centralized where possible.
- If needed, make this mode mutually exclusive with the control-inspection mode to avoid conflicting highlights.
- Use a custom tooltip component, not the browser title attribute.
- Make the highlight styling visually distinct from the control-inspection mode.
- Preserve normal dashboard behavior and existing event handlers.

Acceptance criteria:
- The second button toggles value-source mode on and off.
- Dynamic values are clearly highlighted while the mode is active.
- Hovering or focusing a highlighted value shows a brief source tooltip.
- The UI remains readable and existing functionality still works.
- The project builds cleanly after the change.
```

## GitHub Issue / Spec-Style Task Description

Title:

`Add reusable "Explain values" mode for dynamic dashboard data`

Description:

Add a second reusable inspection mode for dashboards and control panels. The mode should be activated from a topbar button placed next to the existing control-guide button. When enabled, it should highlight dynamic values in the current view and show a tooltip that briefly explains where each value comes from.

This feature is intended to help users understand the provenance of changing readouts, statuses, counters, summaries, and result fields without requiring them to inspect code or external documentation.

Scope:

- Add a second topbar toggle button.
- Highlight dynamic value surfaces in the rendered UI.
- Show short source-oriented tooltips for each highlighted value.
- Coordinate the mode cleanly with the existing control-guide feature.

Out of scope:

- Full debugging or tracing infrastructure.
- Highlighting static labels or decorative text.
- Replacing observability tooling or documentation.

Definition of done:

- The button is present and visually aligned with the existing guide button.
- Dynamic values are highlighted only while the mode is active.
- Tooltips explain where the value comes from in a brief useful way.
- Existing dashboard behavior still works.
- The feature is reusable in other projects with minimal adaptation.
