# Task Doc — Explain Controls Inspect Mode Button

## Summary

Add a reusable topbar button labeled `Explain controls` that toggles an inspect mode. When enabled, the UI highlights every interactive control in the active view and shows a custom tooltip on hover or focus that explains what the control does in plain operator language.

This is intended to make complex operator dashboards easier to learn without forcing the user to click random controls or read external documentation first.

## Status

implemented

## Current Repo Truth

- The feature is implemented in this repo's dashboard shell.
- State for the toggle lives in `dashboard/services/runtimeTruth.js`.
- The topbar button, inspectable-target metadata, and tooltip behavior live in `dashboard/app.js`.
- Highlighting and tooltip visuals live in `dashboard/styles.css`.
- The current implementation covers:
  - topbar action buttons
  - sidebar navigation buttons
  - major action buttons in views A-D
  - radio/checkbox wrapper controls in B3/B5
  - the B5 inactivity-timeout field row
  - clickable log entries
  - clickable history entries

## Goals

- Make the dashboard self-explaining for first-time users.
- Help operators discover every actionable or clickable element in the current view.
- Provide tooltip copy that explains purpose, not just label text.
- Keep the feature easy to toggle on and off.
- Make the pattern portable to other projects with similar dashboards or control panels.

## Non-goals

- Replacing all product documentation.
- Using browser-native `title` tooltips.
- Interrupting or blocking normal click behavior.
- Explaining non-interactive text, badges, or layout-only elements.
- Moving feature-specific copy into every individual view file unless necessary.

## Workflow / UX

1. The user clicks `Explain controls` in the topbar.
2. Inspect mode turns on.
3. All inspectable controls in the current rendered dashboard view gain a visible highlight.
4. Hovering or focusing any highlighted control shows a custom tooltip near that target.
5. The tooltip explains what the control does in plain language.
6. Clicking `Explain controls` again turns inspect mode off and removes the overlay behavior.

## Portable Behavior Contract

### Button behavior

- The feature is controlled by a single toggle button placed in a globally visible toolbar or header.
- The button label should clearly indicate learning/help behavior, for example `Explain controls` or `Show control guide`.
- The active state should be visually obvious.

### Inspectable target scope

Treat these as inspectable by default:

- buttons that trigger actions
- navigation tabs or nav buttons
- clickable cards or rows
- custom-styled radio / checkbox wrappers
- field rows that behave as operator controls
- modal close buttons
- list items that open details when clicked

Avoid highlighting:

- static text
- status badges with no click/focus behavior
- decorative layout containers

### Tooltip rules

- Use a custom tooltip component, not the browser default tooltip.
- Show the tooltip on both hover and keyboard focus.
- Tooltip text should explain the control's effect in plain language.
- Tooltip content should be specific per control, not generic filler.
- Hide the tooltip when the pointer leaves, focus moves away, or layout changes make the position stale.

### State and architecture rules

- Inspect mode should survive rerenders.
- The feature should be implemented centrally where possible.
- Tooltip copy should come from a stable mapping or metadata layer, not ad hoc DOM scraping alone.
- The feature must not break existing click handlers or keyboard interaction.

## Implementation Notes

- Prefer one central registry or resolver that maps controls to tooltip copy.
- Use shared selectors for "inspectable" targets so new controls can opt in consistently.
- Store inspect-mode state in the same state layer that survives dashboard rerenders.
- Recompute inspectable targets after rerender instead of trying to persist direct DOM references forever.
- Hide the tooltip on resize and scroll to avoid stale positioning.
- Use operator-facing wording such as:
  - what this control starts
  - what this control changes
  - whether it is simulated, destructive, or read-only

## Acceptance Criteria

- A visible topbar button toggles inspect mode on and off.
- Inspect mode highlights all major clickable/operator controls in the current view.
- Hovering or focusing a highlighted control shows a custom tooltip.
- Tooltip copy is specific to each control and explains its purpose clearly.
- Normal control behavior still works.
- The inspect-mode toggle survives rerenders.
- The feature can be transplanted into another dashboard project with minimal architecture-specific rewrite.

## Files Changed In This Repo

- `dashboard/app.js`
- `dashboard/styles.css`
- `dashboard/services/runtimeTruth.js`
- `task_docs/2026-04-20_explain-controls-inspect-mode.md`
- `task_docs/_TABLE_OF_CONTENTS.md`

## Prompt Analysis

Original intent, cleaned up:

> Put a button in the top-right area. The button should highlight every button and clickable item and add a tooltip on hover that explains the button.

What is good about that prompt:

- It clearly identifies the user-facing feature.
- It communicates the desired outcome quickly.
- It identifies the two most important behaviors:
  - highlight controls
  - explain controls with a tooltip

What is missing:

- It does not define the scope of "clickable item".
- It does not say whether this is always on or toggle-based.
- It does not say whether the tooltip should be native or custom.
- It does not define how tooltip text should be authored.
- It does not mention keyboard focus behavior.
- It does not mention rerender safety.
- It does not mention preserving existing click handlers.

## Prompt Critique

The original prompt is strong as a sketch, but weak as an implementation spec.

The biggest problem is ambiguity. A developer could interpret "every clickable item" too narrowly and only cover buttons, or too broadly and start highlighting decorative containers, non-action badges, or layout cards that were never meant to be part of the feature.

The second problem is missing architectural guidance. Without saying that inspect mode should be a toggle, survive rerenders, and stay centralized, the implementation can drift into fragile one-off DOM patches.

The third problem is content quality. If the prompt does not require specific per-control tooltip copy, the result often becomes low-value filler like "Click this button to perform an action."

## Refined Prompt

```text
Add a reusable dashboard feature called "Explain controls".

UI placement:
- Add a button labeled "Explain controls" in the top-right header or toolbar area.
- The button must act as a toggle with a clear ON/OFF visual state.

Behavior:
- When inspect mode is ON, highlight every interactive control in the current rendered view.
- Interactive controls include:
  - action buttons
  - navigation buttons or tabs
  - clickable rows or cards that open details
  - custom radio/checkbox wrapper controls
  - field rows that behave like operator controls
  - modal close buttons
- Do not highlight decorative or non-interactive elements.

Tooltip behavior:
- When the user hovers or keyboard-focuses a highlighted control, show a custom tooltip near that control.
- The tooltip must explain what that specific control does in plain operator language.
- Tooltip copy must be specific per control and should not use generic filler text.
- Hide the tooltip when hover/focus ends, or when scroll/resize makes the position stale.

Implementation constraints:
- Keep the feature centralized in the dashboard shell or shared UI layer where possible.
- Store inspect-mode state in the main UI state layer so it survives rerenders.
- Preserve normal click and keyboard behavior.
- Recompute inspectable targets after rerender.
- Use a custom tooltip component, not the browser default title attribute.
- Keep the styling clear but lightweight: highlighted controls should be easy to spot, and the currently hovered/focused target should stand out more strongly than the rest.

Acceptance criteria:
- The button toggles inspect mode on and off.
- Major interactive controls are visibly highlighted while inspect mode is on.
- Hovering or focusing a highlighted control shows a clear explanatory tooltip.
- Existing functionality still works.
- The project builds cleanly after the change.
```

## GitHub Issue / Spec-Style Task Description

Title:

`Add reusable "Explain controls" inspect mode for dashboard UIs`

Description:

Add a reusable inspect-mode feature for complex dashboards and control panels. The feature should be triggered from a topbar button labeled `Explain controls`. When enabled, it should visually highlight major interactive controls in the current view and show a custom tooltip on hover or focus that explains what each control does.

This feature is intended to improve learnability for operator-facing interfaces without changing existing control behavior.

Scope:

- Add a topbar toggle button.
- Highlight interactive controls in the current rendered view.
- Show custom explanatory tooltips for each control.
- Support both pointer hover and keyboard focus.
- Keep the implementation centralized and rerender-safe.

Out of scope:

- Rewriting unrelated UI architecture.
- Using browser-native title tooltips.
- Highlighting non-interactive decorative elements.

Definition of done:

- Inspect mode can be toggled on and off.
- Highlighting clearly identifies interactive controls.
- Tooltip content is control-specific and useful.
- Existing actions still work.
- The feature can be reused in other dashboard-style projects with minimal changes.
