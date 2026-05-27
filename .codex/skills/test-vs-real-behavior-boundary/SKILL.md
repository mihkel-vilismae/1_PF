---
name: test-vs-real-behavior-boundary
description: Use for future PF_login slices that separate test/mock behavior from real iCloudPD/auth/download/runtime behavior, after the visual-only first slice is complete and explicitly authorized.
---

# Test-vs-Real Behavior Boundary Skill

## Purpose

Use this skill for future behavior-separation work after the first visual-only Test Mode / Real Mode slice.
It defines how to separate test/mock behavior from real iCloudPD, auth, download, scheduler, pipeline, playback, and runtime behavior without mixing boundaries or inventing implementation status.

## When To Use

Use this skill only when a later prompt explicitly authorizes behavior changes, such as:

- route gating by Test Mode versus Real Mode
- separating mock downloads from real iCloudPD downloads
- preventing real provider calls in Test Mode
- Real Mode auth/download warnings or guards
- pipeline behavior split between fixture/test data and provider-backed data
- scheduler/runtime worker behavior split by mode

## Inputs Required

1. Active immutable baseline or current checked-out repo.
2. Completed visual-mode implementation state.
3. Current frontend/backend contracts and endpoint inventory.
4. Auth and iCloudPD docs/tests.
5. Download, pipeline, scheduler, playback, and runtime worker docs/tests.
6. User approval for behavior-changing work.

## Non-Goals

- Do not use this skill during the first visual-only slice to change behavior.
- Do not move or gate behavior without code/test evidence.
- Do not weaken auth, secret redaction, provider proof, or session boundaries.
- Do not make Test Mode silently call real iCloudPD/provider behavior.
- Do not make Real Mode rely on mock success as proof of real readiness.

## Step-By-Step Workflow

1. Confirm that the user explicitly authorized behavior-separation work.
2. Inventory current real and test/mock entry points.
3. Classify each flow as real/provider-backed, test/mock/fixture-backed, hybrid, unknown, or documentation-only.
4. Identify exact endpoints, UI actions, and backend services affected.
5. Define a behavior boundary plan before editing.
6. Add or update tests that prove the boundary.
7. Implement one behavior boundary at a time.
8. Preserve secret redaction and provider-proof semantics.
9. Document what changed, what stayed unchanged, and what remains hybrid/unknown.

## Regression-Safety Rules

- Auth, iCloudPD, session, and provider-proof changes are high risk and must be tested.
- Real downloads must stay auth-gated.
- Test Mode must not perform real downloads unless the user explicitly authorizes a special test.
- Existing endpoint compatibility must be preserved unless a breaking change is explicitly approved.
- Do not remove mock/test tools that are still needed for development.
- Do not claim autonomous Raspberry Pi runtime readiness unless runtime evidence proves it.

## Source-Of-Truth Rules

- Code/tests/runtime evidence outrank docs.
- Docs can describe target behavior but do not prove implementation.
- User-observed behavior is important but must be separated from code-verified behavior.
- Provider-dependent success must be labeled provider-dependent unless tested live.
- Unknown or hybrid behavior must be reported honestly.

## Output Format

When this skill is used, report:

1. User authorization for behavior changes.
2. Flow inventory and classification table.
3. Proposed smallest behavior boundary slice.
4. Files/endpoints/services affected.
5. Tests added or updated.
6. Preserved behavior list.
7. Risks/tradeoffs.
8. Remaining hybrid/unknown items.

## Explicit First-Slice Restrictions

This skill is future-facing. In the first Test Mode / Real Mode implementation slice, do not use it to alter behavior. Use it only to name and document future boundaries.

## Risks And Tradeoffs

- Separating behavior too early can break working mock/dev flows.
- Leaving hybrid behavior undocumented can cause Real/Test mode confusion.
- Provider-dependent flows can appear broken when the issue is environment/session state. Keep diagnostics honest.
- Scheduler and playback runtime claims need runtime evidence, not only route presence.

## Verification Checklist

- Behavior-changing scope was explicitly authorized.
- Each changed flow has a before/after classification.
- Test Mode cannot accidentally trigger real provider side effects.
- Real Mode does not depend on mock-only success paths.
- Auth and secret redaction tests pass.
- Endpoint compatibility is preserved or approved as a breaking change.
- Documentation marks remaining partial/provider-dependent/unknown flows honestly.
