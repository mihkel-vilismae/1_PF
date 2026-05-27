---
name: pending-card-button-border-audit
description: Use when marking PF_login cards/buttons with pending/unreviewed visual borders based on View A, View B, and View D status context, without treating borders as implementation proof.
---

# Pending Card/Button Border Audit Skill

## Purpose

Use this skill to add, review, or retire distinctive pending border markers on cards and buttons.
The border means the element has not yet been reviewed, split, confirmed, or removed from the pending list by the user.

## When To Use

Use this skill when the task mentions:

- pending card borders
- unfinished button borders
- View A/B/D button/status table
- removing a pending border after user confirmation
- marking cards/buttons as not yet reviewed or not yet split for Test/Real mode

## Inputs Required

1. `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md`.
2. `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md`.
3. Current frontend card/button markup from the repo.
4. User confirmation for any element whose pending border should be removed.
5. Current mode CSS architecture if Test/Real styles are already present.

## Non-Goals

- Do not decide that an element is complete without explicit user confirmation or later implementation evidence.
- Do not use border removal as proof that backend behavior works.
- Do not change button behavior, labels, data-action values, endpoints, or payloads.
- Do not remove pending borders globally unless the user explicitly requests a global removal.
- Do not hide, disable, or reorder controls only because they are pending.

## Step-By-Step Workflow

1. Read the View A/B/D card/button status table and user-observed snapshot.
2. Build or update a pending-marker inventory by card and control.
3. Identify the smallest CSS/class mechanism for pending borders.
4. Apply the same pending marker meaning in both Test Mode and Real Mode.
5. Keep pending markers visually distinctive but not destructive to layout.
6. Preserve all existing controls and data attributes.
7. If the user says a specific card/control is done, remove only that element's pending marker.
8. Document each marker added or removed.

## Regression-Safety Rules

- Pending borders are visual-only.
- Pending borders must not block clicks unless the user explicitly asks for blocking behavior.
- Pending borders must not change `data-action`, `data-*`, button text, selectors, or endpoint routing.
- Pending borders must be compatible with both Test Mode and Real Mode backgrounds.
- Terminal-like div controls must keep copy all, clear, and expand row controls unless explicitly removed.

## Source-Of-Truth Rules

- Use code and tests to verify whether a card/button exists.
- Use docs/status snapshots to understand context and user subjective assessment.
- Treat user confirmation as the source of truth for removing pending markers.
- If a card or button cannot be located, report it as not found rather than inventing a selector.

## Output Format

When this skill is used, report:

1. Card/control inventory consulted.
2. Pending markers added.
3. Pending markers removed.
4. Elements not found or ambiguous.
5. Behavior preserved.
6. Manual verification checklist.

## Explicit First-Slice Restrictions

For the first slice, pending borders are visual annotations only. They must not imply that Test Mode behavior, Real Mode behavior, iCloudPD downloads, auth, scheduler workers, or playback workers have been split or completed.

## Risks And Tradeoffs

- Too many borders can visually overwhelm the dashboard. Use a consistent, understandable pending style.
- Borders may affect spacing if implemented with non-box-sizing-safe CSS. Prefer outlines or box-shadow where practical.
- Removing markers without evidence can hide unfinished work. Require explicit user confirmation per element.

## Verification Checklist

- Pending border appears in both Test Mode and Real Mode.
- Border does not move layout significantly.
- Buttons remain clickable.
- Existing labels and data attributes are unchanged.
- Removed borders are limited to user-approved elements.
- A clear pending-marker inventory is updated or reported.
