---
name: mock-test-real-implementation-boundary
description: Use when adding, reviewing, or refactoring mock/test/demo/simulation behavior beside real/production/backend/hardware behavior while preserving explicit contracts, adapters, labels, and real-side-effect safety gates.
---

# Mock/Test vs Real Implementation Boundary Skill

## Purpose

Use this skill when adding, reviewing, or refactoring mock/test/demo/simulation behavior beside real/production/backend/hardware behavior.

The goal is to keep test and real flows clear, safe, reusable, and regression-resistant without duplicating whole applications or silently changing existing behavior.

This skill is reusable across dashboard apps, hardware controllers, auth flows, download flows, scheduler flows, local AI tools, network tools, and other projects where test behavior and real behavior must coexist safely.

## When to Use

Use this skill when a project includes or is about to include any of these:

- Test Mode
- Real Mode
- Mock data
- Demo data
- Simulation mode
- Real backend mode
- Real hardware mode
- Real authentication
- Real downloads/uploads
- Real scheduler/cron execution
- Real file/database mutation
- A UI switch between safe/testing behavior and real behavior

## Core Rule

Always separate these concepts:

1. Visual mode
2. Data source mode
3. Behavior/execution mode
4. Safety/permission mode

A visual Test Mode theme does not automatically mean mocked backend behavior.

A visual Real Mode theme does not automatically mean real actions should run.

Real actions must be explicitly contracted, gated, and triggered by clear user intent.

## Required Architecture

Prefer this structure:

- Shared UI
- Shared domain model
- Shared typed contract/interface
- Mock/test adapter
- Real adapter
- Clear mode/state selector
- Explicit safety gates for real side effects

Avoid this structure unless explicitly justified:

- Separate duplicated Test dashboard
- Separate duplicated Real dashboard
- Mock logic mixed directly into rendering code
- Real side effects triggered during render/startup
- Hidden defaults that silently choose real behavior
- UI color used as the only real/test indicator

## Implementation Rules

When implementing mock/test versus real behavior:

1. Start with a neutral/unselected state when safety matters.
2. Make the user choose the mode explicitly when the choice affects risk or interpretation.
3. Keep UI structure shared unless there is a strong architectural reason not to.
4. Put mock/test and real behavior behind named adapters, services, or interfaces.
5. Keep backend/API contracts stable unless the slice explicitly changes them.
6. Do not trigger real side effects from visual mode selection alone.
7. Do not trigger real side effects during startup or render.
8. Label mock/test data clearly.
9. Label real readiness honestly.
10. Preserve existing behavior by default.
11. Add tests or manual verification for both mock/test and real boundary behavior.
12. Keep mode state explicit and inspectable.
13. Do not use color alone to communicate mode or safety state.

## UI and Status Label Rules

The UI must make the current mode visible using text, not only color.

Recommended labels include:

- Test Mode
- Real Mode
- Mock data
- Demo data
- Simulation only
- Real backend
- Real hardware
- Real action required
- Provider verified
- Not provider verified
- Pending review
- Unverified
- Requires explicit real action

Avoid labels that imply more certainty than the system has proven.

For example:

- Do not show “Authenticated” if only local session files exist.
- Do not show “Real ready” if provider verification has not succeeded.
- Do not show “Downloaded” if only a mock download ran.
- Do not show “Hardware connected” if only a simulated adapter is active.

## Real Side Effect Examples

Treat these as real side effects:

- Real authentication
- Real downloads/uploads
- Real file mutation or deletion
- Real database writes
- Real scheduler/cron activation
- Real hardware movement
- Real network provisioning
- Real notification/email/message sending
- Real payment/order/submission actions
- Real credential storage or credential use

These must not happen automatically just because the app opened or a visual mode was selected.

## Testing and Verification Checklist

Before completing a slice, verify:

- Existing behavior still works.
- Test mode does not trigger real side effects.
- Real mode does not auto-run dangerous actions.
- Mock/test labels are visible where relevant.
- Real readiness labels are honest and evidence-based.
- Shared UI has not been duplicated unnecessarily.
- Adapter/contract boundaries are preserved.
- Existing endpoint names are unchanged unless explicitly required.
- Existing payload shapes are unchanged unless explicitly required.
- Existing auth semantics are unchanged unless explicitly required.
- Existing scheduler behavior is unchanged unless explicitly required.
- Existing mock/demo behavior is unchanged unless explicitly required.
- Pending or unverified status is visibly shown where relevant.

## Regression Boundaries

Do not change these unless explicitly requested:

- Existing endpoint names
- Existing payload shapes
- Existing auth semantics
- Existing scheduler behavior
- Existing download behavior
- Existing hardware behavior
- Existing mock/demo behavior
- Existing user-visible labels, except where the slice explicitly changes mode/status language
- Existing startup behavior, except where the slice explicitly adds a safe mode-selection gate
- Existing data persistence behavior
- Existing secret-redaction behavior

## PF_login Example Application Notes

These notes are examples for the PF_login / 1234_PF photo-frame login project. They are not universal rules for every project.

For PF_login, the first Test Mode / Real Mode slice should be visual-only:

- Add a startup mode choice.
- Start with no selected mode.
- Show Test Mode and Real Mode buttons.
- Use one shared dashboard.
- Apply mode-specific visual styling.
- Preserve the current Real Mode production background.
- Add pending/review borders where requested.
- Do not change backend behavior.
- Do not change iCloudPD behavior.
- Do not change NEW AUTH behavior.
- Do not change download behavior.
- Do not change scheduler behavior.
- Do not change queue, playback, geocode, fullscreen, or runtime behavior.

In PF_login, selecting Real Mode must not automatically trigger real download, real login, scheduler activation, or playback actions.

In PF_login, selecting Test Mode must not automatically replace backend behavior with mocks unless a later explicit slice defines that adapter contract.
