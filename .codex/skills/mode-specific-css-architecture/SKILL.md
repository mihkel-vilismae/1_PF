---
name: mode-specific-css-architecture
description: Use when splitting or reviewing PF_login frontend styles for Test Mode and Real Mode while keeping one shared dashboard structure and preserving the existing Real Mode visual baseline.
---

# Mode-Specific CSS Architecture Skill

## Purpose

Use this skill to organize CSS for the Test Mode / Real Mode visual split.
The goal is to make visual mode differences explicit while keeping the dashboard structure, controls, and text identical between modes.

## When To Use

Use this skill when a task mentions:

- shared/general CSS
- Real Mode-specific CSS
- Test Mode-specific CSS
- yellowish Test Mode background/theme
- preserving the existing Real Mode background
- avoiding duplicate dashboards or divergent CSS branches

## Inputs Required

1. Active immutable baseline ZIP or checked-out repo path.
2. Current frontend CSS files and import paths.
3. Current frontend bootstrap/render files that load styles.
4. Any user-provided visual requirements.
5. Accessibility/readability expectations for text and contrast.

## Non-Goals

- Do not redesign the app.
- Do not change card/control layout unless required for the modal or visual mode classes.
- Do not duplicate markup to create a separate Test dashboard.
- Do not use CSS changes to hide unfinished behavior.
- Do not use Test Mode styling to imply behavior separation has been implemented.

## Step-By-Step Workflow

1. Inspect current style files and imports.
2. Identify which rules are shared app styling versus mode-specific theme styling.
3. Keep shared layout, spacing, card structure, typography, and controls in a general/shared CSS file.
4. Put Real Mode-specific background/theme rules in a Real Mode CSS file or clearly isolated section.
5. Put Test Mode-specific yellowish background/theme rules in a Test Mode CSS file or clearly isolated section.
6. Apply mode styling through a top-level mode class/attribute where practical.
7. Keep the same DOM structure for both modes.
8. Check text readability in both modes.
9. Document which style files are shared and which are mode-specific.

## Regression-Safety Rules

- Real Mode must preserve the existing/current production background and visual baseline except for explicitly requested pending borders.
- Test Mode must use a compatible yellowish theme and remain readable.
- Shared CSS must continue to define common layout and controls.
- Avoid copying entire CSS blocks into both mode files if a shared rule is sufficient.
- Avoid selector changes that could break existing controls, modals, logs, or terminal-like div behavior.

## Source-Of-Truth Rules

- Inspect actual CSS/import structure before deciding file names.
- Do not assume `dashboard/styles.css` is the only CSS file without checking.
- Preserve existing class names used by tests or data-action selectors.
- Treat screenshots as visual context, not as exact CSS source truth.

## Output Format

When this skill is used, report:

1. Existing CSS files inspected.
2. New/changed CSS files.
3. Shared versus Real Mode versus Test Mode responsibility split.
4. How mode styling is applied.
5. Accessibility/readability notes.
6. Regression checks performed.

## Explicit First-Slice Restrictions

In the first slice, CSS architecture changes may support the mode-selection modal and visual mode classes only. They must not change behavior, endpoint calls, data loading, or runtime state transitions.

## Risks And Tradeoffs

- Over-splitting CSS can make maintenance harder. Keep the split minimal and purposeful.
- Under-splitting CSS can make future behavior separation unclear. Ensure mode-specific theme rules are easy to find.
- Yellowish themes can reduce contrast. Verify text, buttons, logs, and status labels remain readable.

## Verification Checklist

- There is a clear shared/general style area or file.
- There is a clear Real Mode-specific style area or file.
- There is a clear Test Mode-specific style area or file.
- Test Mode has a yellowish background/theme.
- Real Mode keeps the old/current production background.
- Layout, cards, controls, and text remain structurally identical in both modes.
- No dashboard markup was duplicated solely for mode styling.
