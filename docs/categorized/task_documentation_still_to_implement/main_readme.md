# Task Category: Documentation Still To Implement

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
