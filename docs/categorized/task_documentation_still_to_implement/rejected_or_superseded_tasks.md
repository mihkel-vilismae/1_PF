# Rejected Or Superseded Tasks

## Purpose
Record task statements that are stale, conflicting, duplicate, or non-authoritative for implementation behavior, with explicit reasons and replacement rules.

## Absorbed source docs
- `docs_to_parse/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md`
- `docs_to_parse/active_workflow_docs/part3_slice3_reconciliation_findings.md`
- `docs_to_parse/active_workflow/INSPECT_CONTROLS_SLICE1_ANALYSIS.md`
- `docs_to_parse/vision_and_implementation/UNRESOLVED_QUESTIONS.md`
- `docs_to_parse/VISION_SPEC/16-unresolved-questions.md`
- `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md`
- `docs_to_parse/VISION_SPEC/17-deprecated-superseded-docs-log.md`

## Task status rules
- `Superseded`: previously valid wording replaced by newer authority or clarified governance.
- `Rejected`: not accepted as implementation authority due to scope/type mismatch.
- `Duplicate`: retained elsewhere as active source; this copy is archival only.

## Rejected/superseded task list
| ID | Task statement (source wording/context) | Status | Reason | Replacement / handling |
|---|---|---|---|---|
| RS-1 | "When merged spec conflicts with older docs, inspect copy, or current UI wording, the merged spec wins." (`BUTTON_VERIFICATION_WORKFLOW.md`, Step 0) | Superseded | Conflicts with active authority-map tiering that places code/tests as Tier 1 and VISION_SPEC authority as Tier 2 with explicit contradiction handling. | Use `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md` precedence rules. |
| RS-2 | Active-workflow artifacts listed as "current authoritative candidates." (`part3_slice3_reconciliation_findings.md`) | Superseded | Treating workflow artifacts as authority candidates conflicts with current authority-map classification of workflow docs as evidence-tier material. | Keep as evidence only; do not use as behavioral source-of-truth. |
| RS-3 | Inspect-controls Slice 1 repair plan as implementation-authority direction. (`INSPECT_CONTROLS_SLICE1_ANALYSIS.md`) | Rejected (as authority) | Document is explicitly workflow/audit-only and not behavioral spec authority. | Use it only to generate verification tasks; behavioral authority remains Tier 1/2 docs. |
| RS-4 | Using `vision_and_implementation/UNRESOLVED_QUESTIONS.md` as active unresolved backlog. | Duplicate / Superseded | It is predecessor content now represented in `VISION_SPEC/16-unresolved-questions.md`. | Keep predecessor as historical evidence; track active questions in `16-unresolved-questions.md`. |
| RS-5 | Immediate relocation/deletion of historical docs without harvesting. | Rejected | Conflicts with deprecated/superseded log rule requiring harvest-first and deletion marker workflow. | Follow `17-deprecated-superseded-docs-log.md` staged cleanup process. |

## Conflict / reduction notes
- Conflicts are preserved for auditability; only their authority effect is superseded.
- No source documents were altered or removed; this file only records precedence and migration outcomes.
- Superseded here does not mean "discard evidence"; it means "do not use as primary behavior authority."

## Migration status
| Source | Migration result |
|---|---|
| `BUTTON_VERIFICATION_WORKFLOW.md` | Authority-precedence rule superseded; verification workflow remains usable as evidence process. |
| `part3_slice3_reconciliation_findings.md` | Authority-candidate framing superseded; reconciliation findings retained as task input. |
| `INSPECT_CONTROLS_SLICE1_ANALYSIS.md` | Workflow repair guidance retained as verification input only. |
| `vision_and_implementation/UNRESOLVED_QUESTIONS.md` | Marked predecessor/archive relative to `VISION_SPEC/16-unresolved-questions.md`. |
| `17-deprecated-superseded-docs-log.md` | Harvest-first, marker-required cleanup rule adopted. |
