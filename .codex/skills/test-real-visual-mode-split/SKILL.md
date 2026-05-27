---
name: test-real-visual-mode-split
description: Use when adding, reviewing, or repairing the Test Mode / Real Mode startup modal and visual-mode state in PF_login while preserving existing backend, API, auth, download, scheduler, pipeline, and playback behavior.
---

# Test/Real Visual Mode Split Skill

## Purpose

Use this skill to add or audit the first-slice Test Mode / Real Mode visual split for the PF_login dashboard.
The first slice is intentionally visual-only: it introduces an immediate startup choice and applies visual mode state without changing runtime behavior.

## When To Use

Use this skill when the task mentions any of these topics:

- Test Mode / Real Mode selection
- startup mode-selection modal
- visual-only mode split
- selected mode state
- preventing mock/test and real behavior drift during the first UI split
- making Real Mode equivalent to the old/current app after the modal choice

## Inputs Required

1. Active immutable baseline ZIP or checked-out repo path.
2. Current user prompt and any attached chat-log handoff.
3. `AGENTS.md`.
4. `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md` when card/button status matters.
5. `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md` when user-observed View A/B/D status matters.
6. The current frontend entrypoint and app bootstrap files, verified from the repo rather than memory.

## Non-Goals

- Do not change backend endpoints.
- Do not change iCloudPD, NEW AUTH, provider proof, session handling, real downloads, mock downloads, cron, scheduler, pipeline, playback, or screen-worker logic.
- Do not persist the selected mode unless a later prompt explicitly asks for persistence.
- Do not create two separate dashboards or duplicate frontend flows.
- Do not use the mode choice as proof that any feature is implemented.

## Step-By-Step Workflow

1. Confirm the active baseline and record it in the response.
2. Inspect the frontend bootstrap path before editing.
3. Locate the smallest safe place to gate dashboard rendering behind a startup mode modal.
4. Add a selected visual mode with three states: `null`, `test`, and `real`.
5. Ensure initial mode is `null` / unchosen.
6. Show the dashboard only after the user chooses Test Mode or Real Mode.
7. Treat Real Mode selection as equivalent to old/current app startup after the modal choice.
8. Apply the selected mode through a central visual-mode source rather than scattered ad hoc checks.
9. Verify that no backend/API/runtime behavior changed.
10. Document what was preserved, what changed, and what remains future work.

## Regression-Safety Rules

- The first slice must affect visual state and CSS/class application only.
- Real Mode must preserve the old/current dashboard behavior after selection.
- Test Mode must not disable, redirect, fake, or change existing controls in this slice.
- Do not alter request payloads, route names, endpoint URLs, auth guards, download counts, scheduler commands, or runtime workers.
- Do not silently rename user-facing controls outside the modal unless explicitly requested.
- If a requested change would alter behavior, stop and ask for confirmation.

## Source-Of-Truth Rules

- Verify file paths from the current repo before naming them.
- Treat code/tests/runtime evidence as more authoritative than docs.
- Treat user-observed status snapshots as useful context, not as proof of implementation.
- Treat older voice-chat wording of “mock mode” as Test Mode unless directly quoting.
- Use Test Mode and Real Mode as the official mode names.

## Output Format

When this skill is used, report:

1. Baseline used.
2. Files inspected.
3. Files changed.
4. Exact first-slice boundary.
5. Preserved behavior list.
6. Verification performed.
7. Risks/tradeoffs.

## Explicit First-Slice Restrictions

For the first implementation slice, the mode selection is visual-only. Do not change backend logic, API behavior, auth, downloads, scheduler, pipeline, playback, runtime workers, or database behavior.

## Risks And Tradeoffs

- Adding a render gate can accidentally delay existing initialization. Keep the gate as small and local as possible.
- Scattered mode reads can create inconsistent visuals. Prefer one centralized apply/read path.
- A modal can be mistaken for a behavior boundary. State clearly that behavior separation is future work unless implemented later.

## Verification Checklist

- App starts with a modal and no hidden default mode.
- Test Mode and Real Mode buttons are visible and understandable.
- Choosing Real Mode reaches the same dashboard behavior as the old/current app.
- Choosing Test Mode reaches the same dashboard structure with only visual differences.
- No backend files changed unless explicitly approved.
- No endpoint names, request bodies, auth flows, scheduler flows, or download flows changed.
- Existing tests still pass or the reason for not running them is documented.
