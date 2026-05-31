---
name: button-workflow-verification
description: Apply the canonical button verification workflow in the PF_login dashboard repository. Use when Codex needs to audit a specific dashboard button or action, trace it from UI trigger through frontend wiring and backend execution, classify it as Works, Partial, Broken, or Mock-only, produce a per-button result report, and optionally add the smallest missing test or inspect-metadata fix.
---

# Button Workflow Verification

## Overview

Use the repo's canonical button workflow instead of improvising a one-off audit. Trace a single control from rendered button to backend response, then package the result in a compact evidence report that future audits can follow.

## Read First

1. `references/repo-evidence-map.md`
2. `references/report-template.md`
3. `docs/table_of_contents.md`
4. `docs/DOC_INDEX.md`
5. `docs/DOC_FRESHNESS_MATRIX.md`
6. The view-specific current-truth or status docs for the target button
7. Existing tests that already cover the button, endpoint, or inspect metadata

For View A actions, start with:

- `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md`
- `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md`
- `docs/50_audits_and_migrations/placeholder_implementations.md`

Treat old categorized docs and compatibility pointers as navigation only unless current code, tests, runtime evidence, or canonical current-truth docs verify the claim.

## Reuse Before Re-Audit

Before tracing code again:

- check `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md` for existing A/B/D audit context
- check dated status snapshots under `docs/30_status_snapshots/` when the target button is covered there
- reuse an existing per-button report when the same control was already audited
- reuse existing endpoint and metadata tests before adding new ones
- update shared reusable artifacts when the same search or fix pattern repeats

## Audit Workflow

1. Identify the exact control.
   - Capture the view, section code, visible label, and `data-action` when present.
   - If the request starts from a screenshot, map the screenshot to the rendered control in code before changing anything.
2. Trace the UI trigger.
   - Find the rendered control in `dashboard/views/*.js`.
   - Confirm the shared click binding in `dashboard/app.js`.
   - Confirm the action mapping in `dashboard/services/runtimeTruth/runtimeTruthBehavior.js`.
3. Verify the request contract.
   - Find the service module that defines the method and endpoint.
   - Verify the backend route exists in `server/index.js` or the relevant backend entrypoint.
   - If the backend is live locally, execute the endpoint and capture the result summary.
4. Verify frontend response handling.
   - Confirm the action runner writes status, logs, history, and result payload state.
   - Confirm the view renders a visible result surface or equivalent UI evidence.
5. Verify implementation truth.
   - Check inspect metadata in `dashboard/inspect/*.json` and the related helper modules.
   - Classify the button as `Real`, `Mock`, `Mixed`, or `Missing` based on code, not UI optimism.
   - If inspect copy is inline or wrong, move or fix it without changing behavior.
6. Verify tests.
   - Reuse existing backend tests when they already cover the endpoint contract.
   - Add the smallest missing test that proves the action path, response handling, or metadata claim.
   - In this repo, prefer small Node tests around runtime-truth action runners over speculative browser-only harnesses.
7. Produce the result.
   - Use `references/report-template.md`.
   - Include exact file references, live endpoint facts, gaps, and the final classification.
   - State clearly when evidence came from code tracing rather than an automated browser click.
8. Record the run.
   - If the task asks for a durable report, place it in the appropriate canonical docs folder and update documentation indexes according to `pf-doc-governance-writer`.
   - Do not create or update a run ledger unless the current repository contains that ledger or the user explicitly asks for one.

## Delegation Pattern

When the user explicitly wants delegation or subagents are otherwise appropriate:

- keep the main agent on final classification, live-result interpretation, and integration
- use smaller explorer agents for file discovery, action mapping, route lookup, and existing-test discovery
- use smaller worker agents only for isolated patches such as one new test file or one draft report skeleton
- avoid overlapping write ownership

Make this the standard conditional rule:

- use subagents for repeated audit batches or when there are `2+` independent sidecar tasks
- stay single-agent for small one-button audits without a discovery bottleneck
- never hand off the final truth classification to a smaller delegated agent

Use `references/agent-patterns.md` for concrete delegation splits.

## Fix Order

- Reachability or dead backend first
- Wrong handler or wrong endpoint second
- Frontend response-handling bug third
- Inspect metadata or docs last unless they are the only incorrect layer

## Guardrails

- Do not call a button real unless the backend route exists and the response is exercised or otherwise evidenced.
- Do not treat a running Vite page as proof that the backend works.
- Do not leave inspect text inline when it belongs in metadata.
- Do not invent current-truth doc paths; use `docs/table_of_contents.md`, `docs/DOC_INDEX.md`, and `docs/DOC_FRESHNESS_MATRIX.md` to locate canonical docs.
- Do not widen scope to unrelated buttons during a single audit unless the user asks.
- Do not let a smaller delegated agent make the final truth classification without main-agent review.

## Output Standard

- Final classification: `Works`, `Partial`, `Broken`, or `Mock-only`
- A short root-cause line if the result is not `Works`
- A compact step-by-step evidence section covering all workflow steps
- Tests run and whether they passed
- The smallest remaining manual follow-up, if any

## References

- `references/repo-evidence-map.md` for the fastest file lookup path
- `references/report-template.md` for consistent output structure
- `references/agent-patterns.md` for delegation guidance
- `references/compounding-reuse.md` for the reusable artifacts that should be kept current
