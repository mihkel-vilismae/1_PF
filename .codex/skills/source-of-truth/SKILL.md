---
name: source-of-truth
description: Audit, classify, and reconcile source-of-truth claims in the 12_PF photo-frame repository. Use when Codex needs to decide whether a claim is code-verified, runtime/file state, target-spec, documentation-derived status, historical evidence, or unknown; when touching runtime truth, implementation status docs, inspect metadata, placeholder ledgers, dashboard truth panels, backend/frontend truth wiring, or any task where current implementation truth may be confused with target architecture.
---

# Source of Truth

## Overview

Use this skill to keep project truth claims honest. It is a workflow for finding and classifying evidence; it is not itself an authority source.

## Read First

Read only what is relevant to the claim:

- `AGENTS.md`
- `README.md`
- `CHANGELOG.md` for dated change evidence, not proof by itself
- `conf/runtime-truth.seed.json` for committed baseline runtime-truth defaults
- `conf/runtime-truth.json` only when inspecting local mutable runtime state produced by a run
- `docs/20_architecture_and_specs/runtime_truth_local_state.md` for the seed-versus-runtime-state contract
- `dashboard/services/runtimeTruth/*` for frontend truth state, guards, persistence, and actions
- `dashboard/inspect/*` for inspect-mode labels and value-source explanations
- `server/index.ts` and focused `server/**` modules for backend-owned projections and endpoints
- `schema.sql` and `server/database/**` for database-backed truth
- `docs/categorized/vision_spec_docs/*` for target specs
- `docs/categorized/current_implementation_status_docs/*` for implementation-status docs
- `docs/categorized/task_documentation_still_to_implement/*` and `placeholder_implementations.md` for gaps, backlog, and unresolved work

If a listed file path has moved, use `rg --files` and current repo evidence instead of assuming the old path still exists.

## Truth Classes

Classify each claim before relying on it:

| Class | Meaning | Typical evidence |
|---|---|---|
| `code-verified` | Confirmed from current code, tests, or live command output. | Source files, tests, endpoint responses, build/typecheck/test output. |
| `runtime-state` | Current local state, often mutable and time-bound. | Ignored `conf/runtime-truth.json`, lock files, logs, runtime data, live API responses. |
| `target-spec` | Intended architecture or desired behavior, not proof of implementation. | Vision/spec docs and decision records. |
| `documentation-derived` | Current docs say it, but code was not checked in this run. | Status docs, READMEs, changelog entries. |
| `evidence-history` | Useful audit/history material, not active behavioral authority by default. | Old docs, workflow reports, archived audits, run logs. |
| `unknown` | Evidence is missing, conflicting, stale, or outside the checked scope. | Any unresolved or unverified claim. |

## Workflow

1. State the exact claim or decision being checked.
   - Example: "`conf/runtime-truth.json` is the current local runtime-truth snapshot, while `conf/runtime-truth.seed.json` is the committed baseline seed."
   - Example: "View C is backend-backed."
2. Identify the affected surface.
   - UI truth panel
   - inspect metadata
   - frontend runtime-truth state
   - backend endpoint/projection
   - database/schema
   - docs/status/placeholder ledger
3. Gather direct evidence first.
   - Use `rg` or `rg --files` to find code paths.
   - Read tests that cover the relevant behavior.
   - Run the smallest relevant command when implementation truth depends on current behavior.
4. Compare evidence against target and status docs.
   - Treat specs as intended behavior unless code confirms them.
   - Treat status docs as documentation-derived unless they include current verification evidence.
   - Treat changelog entries as dated evidence, not proof that code still matches.
5. Classify the claim with one truth class.
   - Prefer `unknown` over overstating confidence.
   - Use `code-verified` only when current code, tests, or live output were checked.
6. Reconcile only the surfaces affected by the task.
   - Update docs only when implementation status actually changed or a checked doc claim is wrong.
   - Update inspect metadata only when UI source/status copy is inaccurate.
   - Update `placeholder_implementations.md` only when a gap is closed, newly discovered, or reclassified with evidence.
   - Do not edit runtime seed/state files as documentation substitutes.
7. Report the evidence boundary.
   - Separate verified facts, inferences, uncertainties, and user-side validation.

## Project-Specific Rules

- Do not treat `conf/runtime-truth.json` as committed baseline truth. It is ignored local runtime state; use `conf/runtime-truth.seed.json` for committed defaults and current code/tests/live output for implementation truth.
- Do not treat `conf/runtime-truth.json` as complete backend runtime authority. It is a dashboard/file-synced truth surface unless code proves a stronger backend-owned contract for the specific value.
- Do not claim backend ownership from frontend labels alone.
- Do not claim a target architecture rule is implemented without checking the relevant implementation path.
- Do not demote verified code behavior because an older doc disagrees; record the conflict instead.
- Do not promote archived or workflow evidence into behavioral truth unless a current authority file or current code supports it.
- Keep changes local and reversible. This skill should reduce truth drift, not create a parallel source-of-truth system.

## Output Format

For non-trivial truth work, include:

- Claim checked
- Classification
- Verified evidence
- Inferred context
- Uncertainty or conflict
- Files changed, if any
- Verification commands and results
- Regression risks or preserved behavior

## Examples

Use this skill for prompts like:

- "Is the Current truth panel honest?"
- "Reconcile this doc claim with the implementation."
- "Classify whether this button is real, mock, mixed, or unknown."
- "Update placeholder_implementations.md after this backend wiring change."
- "Explain which source owns playback state right now."
