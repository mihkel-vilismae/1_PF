# Task Category: Documentation Still To Implement

> Current checkpoint: `v0.10.65`. This compatibility README is preserved for navigation/provenance; use root README, current OpenSpec docs, and proof evidence for live implementation truth.


## Documentation navigation notice

This category index is preserved for local and historical organization. For current cross-repository navigation, start with:

- [`docs/DOC_INDEX.md`](../../DOC_INDEX.md) — the current main map for documentation by purpose, kind, authority, and freshness.
- [`docs/DOC_FRESHNESS_MATRIX.md`](../../DOC_FRESHNESS_MATRIX.md) — the trust/freshness guide for current, stale, historical, and risky docs.
- [`docs/DOC_REORGANIZATION_PLAN.md`](../../DOC_REORGANIZATION_PLAN.md) — the required plan to check before moving documentation files.

Docs in this category may include snapshots, specs, backlog, or reference material. Do not treat them as current implementation truth unless code, tests, or generated evidence confirm the claim.
## Final reference/index handling decision

As of 2026-05-25 01:47 EEST, this category index remains in place as a compatibility pointer for older links and backlog orientation. The canonical backlog/task documents now live under [`../../40_backlog_and_tasks/`](../../40_backlog_and_tasks/).

Keep this file until a later old-index replacement slice performs a full link audit. Do not add new backlog or task-prompt content here; add it under `docs/40_backlog_and_tasks/` and update `docs/DOC_INDEX.md`.

## Slice 18 link audit status

As of 2026-05-25 02:06 EEST, this backlog category compatibility index was retained in place after the full documentation link audit. Use [../../DOC_LINK_AUDIT.md](../../DOC_LINK_AUDIT.md) for the audit result and [../../OLD_INDEX_REPLACEMENT_DECISION.md](../../OLD_INDEX_REPLACEMENT_DECISION.md) for the old-index replacement decision.

This file remains compatibility navigation only. New canonical documentation should go to the numbered target folders documented in `DOC_INDEX.md` and `DOC_REORGANIZATION_PLAN.md`.

## Purpose
This category consolidates still-actionable documentation-derived tasks that are not yet fully implemented, while preserving authority boundaries and conflict handling from the current vision/spec workflow.

## Canonical files
- `active_implementation_backlog.md` (implementation gap inventory and priorities)
- `verification_and_reconciliation_tasks.md` (verification, reconciliation, and decision-gated follow-up work)
- `rejected_or_superseded_tasks.md` (conflicting, stale, duplicate, or workflow-only instructions that are not actionable work)

## Authority limits
1. Implementation truth: code/tests (Tier 1 in authority map).
2. Documentation authority for this category: `docs_to_parse/VISION_SPEC/*` active authority files (Tier 2).
3. Workflow docs and button-verification docs are evidence only; they can generate reconciliation tasks but cannot override Tier 1/2 authority.

## Absorbed source docs
- `placeholder_implementations.md`
- `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md`
- `docs_to_parse/VISION_SPEC/16-unresolved-questions.md`
- `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md`
- `docs_to_parse/vision_and_implementation/UNRESOLVED_QUESTIONS.md` (predecessor to #16)
- `docs_to_parse/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md`
- `docs_to_parse/active_workflow_docs/part3_slice3_reconciliation_findings.md`
- `docs_to_parse/active_workflow/INSPECT_CONTROLS_SLICE1_ANALYSIS.md`
- `docs_to_parse/VISION_SPEC/VISION_SPEC_readme.md`
- `docs_to_parse/VISION_SPEC/17-deprecated-superseded-docs-log.md`

## Task status rules
- `Active`: implementation or decision work still required and not in conflict with authority map.
- `Decision-gated`: implementation task is valid but blocked by unresolved question(s).
- `Verification/Reconciliation`: documentation-validation or authority-alignment task; does not assert behavior changes.
- `Superseded/Rejected`: stale, conflicting, duplicate, or workflow-only instruction not usable as behavioral authority.

## Conflict / reduction notes
- Superseded rule retained for traceability: "merged Voice doc always wins" is no longer global authority; active authority-map tiering now governs precedence.
- Active-workflow artifacts are treated as non-canonical evidence, not top-level authority candidates.
- Inspect-controls Slice 1 repair instructions are workflow execution guidance only, not product behavior authority.
- Duplicate unresolved-question lists were reduced to `VISION_SPEC/16-unresolved-questions.md` as active list; predecessor remains historical evidence.

## Migration map
| Source | Destination | Migration status |
|---|---|---|
| `placeholder_implementations.md` | `active_implementation_backlog.md` | Absorbed (active tasks extracted; implemented View E-only items excluded). |
| `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md` | `active_implementation_backlog.md`, `verification_and_reconciliation_tasks.md` | Absorbed (implementation phases + schema/doc verification tasks split). |
| `docs_to_parse/VISION_SPEC/16-unresolved-questions.md` | `active_implementation_backlog.md`, `verification_and_reconciliation_tasks.md` | Absorbed (decision gates + reconciliation tasks). |
| `docs_to_parse/vision_and_implementation/UNRESOLVED_QUESTIONS.md` | `rejected_or_superseded_tasks.md` | Superseded as predecessor (content retained via #16). |
| `docs_to_parse/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md` | `rejected_or_superseded_tasks.md`, `verification_and_reconciliation_tasks.md` | Partially superseded (authority claim), partially retained (verification workflow evidence use). |
| `docs_to_parse/active_workflow_docs/part3_slice3_reconciliation_findings.md` | `verification_and_reconciliation_tasks.md`, `rejected_or_superseded_tasks.md` | Partially absorbed (verification leads), partially superseded (authority-candidate framing). |
| `docs_to_parse/active_workflow/INSPECT_CONTROLS_SLICE1_ANALYSIS.md` | `verification_and_reconciliation_tasks.md`, `rejected_or_superseded_tasks.md` | Workflow-only instructions reduced to evidence/verification follow-up; not behavioral authority. |

## Migration status
Status: Initial category consolidation complete for `task_documentation_still_to_implement`; actionable, verification-only, and superseded tracks are now separated with explicit authority boundaries.
