---
name: button-workflow-verification
description: Apply the canonical button verification workflow in the 1_PF dashboard repository. Use when Codex needs to audit a specific dashboard button or action, trace it from UI trigger through frontend wiring and backend execution, classify it as Works, Partial, Broken, or Mock-only, produce a per-button result report, and optionally add the smallest missing test or inspect-metadata fix.
---

# Button Workflow Verification

## Overview

Use the repo's canonical button workflow instead of improvising a one-off audit. Trace a single control from rendered button to backend response, then package the result in a compact evidence report that future audits can follow.

## Read First

1. `docs/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md`
2. `docs/button_verification_workflow/BUTTON_VERIFICATION_ACCELERATION_LAYER.md`
3. `docs/button_verification_results/RUN_LOG.md`
4. `references/repo-evidence-map.md`
5. The view-specific current-truth docs for the target button
6. Existing tests that already cover the button, endpoint, or inspect metadata

For View A actions, start with:

- `docs/OLD_DOCS/VIEW_A_INIT.md`
- `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
- `placeholder_implementations.md`

Do not assume the older non-`OLD_DOCS` file names still exist in this checkout.

## Reuse Before Re-Audit

Before tracing code again:

- check `docs/button_verification_results/INDEX.md`
- check `docs/button_verification_results/RUN_LOG.md`
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
   - Append one new row to `docs/button_verification_results/RUN_LOG.md` for every completed audit, including re-runs of the same button.
   - Prefer `python scripts/append_button_verification_run.py ...` so the ledger stays consistent.
   - Update `docs/button_verification_results/INDEX.md` to reflect the latest known status for that button.

## Delegation Pattern

When the user explicitly wants delegation or subagents are otherwise appropriate:

- keep the main agent on final classification, live-result interpretation, and integration
- use smaller explorer agents for file discovery, action mapping, route lookup, and existing-test discovery
- use smaller worker agents only for isolated patches such as one new test file or one draft report skeleton
- avoid overlapping write ownership

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
- Do not invent current-truth doc paths; this repo currently keeps several of them under `docs/OLD_DOCS/`.
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
