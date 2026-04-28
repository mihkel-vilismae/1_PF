# Verification And Reconciliation Tasks

## Purpose
Track documentation-validation and authority-reconciliation work that should happen before or alongside implementation, without treating workflow artifacts as behavioral authority.

## Absorbed source docs
- `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md`
- `docs_to_parse/VISION_SPEC/16-unresolved-questions.md`
- `docs_to_parse/CANONICAL_SCHEMA_PROPOSAL.md`
- `docs_to_parse/active_workflow_docs/part3_slice3_reconciliation_findings.md`
- `docs_to_parse/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md`
- `docs_to_parse/active_workflow/INSPECT_CONTROLS_SLICE1_ANALYSIS.md`
- `docs_to_parse/VISION_SPEC/VISION_SPEC_readme.md`
- `docs_to_parse/VISION_SPEC/17-deprecated-superseded-docs-log.md`

## Task status rules
- `Pending`: not yet reconciled/validated.
- `In progress`: active reconciliation/verification run exists.
- `Done`: verified and aligned with authority map.
- `Needs decision`: blocked on unresolved user/product decision.

## Verification/reconciliation task list
| ID | Task | Source basis | Status |
|---|---|---|---|
| VR-1 | Reconcile schema documentation against actual `schema.sql` table/field reality before promoting schema wording to source-of-truth. | `part3_slice3_reconciliation_findings.md` Finding 4; `CANONICAL_SCHEMA_PROPOSAL.md` | Pending |
| VR-2 | Reconcile endpoint documentation using route-table detection pattern (not only Express-style scans) when validating docs. | `part3_slice3_reconciliation_findings.md` Finding 5 | Pending |
| VR-3 | Consolidate button verification reader entrypoint while preserving per-button evidence artifacts (`RUN_LOG`, per-button reports). | `part3_slice3_reconciliation_findings.md` Finding 6 | Pending |
| VR-4 | Verify unresolved-question list against newer addenda and mark answered items vs still-open items. | `VISION_SPEC_readme.md` practical next-update step 4; `16-unresolved-questions.md` | Pending |
| VR-5 | Verify documentation authority labels in category docs remain aligned with current tiering (Tier 1 code/tests, Tier 2 VISION_SPEC, workflow/docs evidence lower tiers). | `12-documentation-authority-map.md` | Done |
| VR-6 | Keep predecessor unresolved-questions file archived as historical evidence and avoid dual active lists. | `vision_and_implementation/UNRESOLVED_QUESTIONS.md`, `16-unresolved-questions.md` | Done |
| VR-7 | Validate inspect-control documentation claims with rendered behavior checks (A/B/C/D/E), while classifying this as workflow verification evidence, not behavioral authority replacement. | `INSPECT_CONTROLS_SLICE1_ANALYSIS.md` | Pending |
| VR-8 | Prepare future doc-relocation pass (`docs_parsed`/`to_be_deleted`) only after harvesting unique content and adding required deletion markers. | `17-deprecated-superseded-docs-log.md` | Needs decision |
| VR-9 | Regenerate/expand run instructions documentation from actual command surface as a dedicated documentation workflow. | `part3_slice3_reconciliation_findings.md` Finding 1 | Pending |

## Conflict / reduction notes
- Workflow-generated reports are used as evidence sources for tasks, not as behavioral authority overrides.
- Button-verification workflow remains valid for verification process steps, but not for global documentation precedence rules.
- Inspect-controls slice guidance remains a workflow repair plan and must be validated against higher-tier authority before behavior claims are promoted.

## Migration status
| Source | Migration result |
|---|---|
| `part3_slice3_reconciliation_findings.md` | Findings converted to explicit verification tasks; authority-candidate framing not adopted. |
| `BUTTON_VERIFICATION_WORKFLOW.md` | Verification steps retained as process evidence; authority-precedence rule moved to superseded list. |
| `INSPECT_CONTROLS_SLICE1_ANALYSIS.md` | Verification follow-ups retained; behavioral-authority use rejected. |
| `12-documentation-authority-map.md` | Authority-tier constraints applied as governing rule for this category. |
