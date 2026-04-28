# Documentation Authority Map

Status: Slice 3 updated authority map.
Created: 2026-04-26 19:47 EEST.
Updated: 2026-04-26 20:08 EEST.
Scope: current authority classification after the 3-slice vision/specification workflow.

## Authority tiers

| Tier | Source | Use |
|---|---|---|
| 1 | Current repository code and tests | Implementation truth. |
| 2 | `docs/vision_and_implementation/` | Reconciled vision/specification authority. |
| 3 | Root docs and metadata | Run, version, changelog, and project entrypoint information. |
| 4 | `docs/active_workflow_docs/` | Recent workflow evidence and prompt records. |
| 5 | `docs/button_verification_*` | Button-specific verification evidence. |
| 6 | `docs/OLD_DOCS/` and historical task docs | Historical/reference evidence only until harvested or revalidated. |

## Current authority files

| File | Authority role | Notes |
|---|---|---|
| `docs/vision_and_implementation/README.md` | ACTIVE_AUTHORITY | Entry point and reading order. |
| `docs/vision_and_implementation/PROJECT_VISION.md` | ACTIVE_AUTHORITY | Product vision and purpose. |
| `docs/vision_and_implementation/CURRENT_IMPLEMENTATION_SPEC.md` | ACTIVE_AUTHORITY | Current implementation reality summary. |
| `docs/vision_and_implementation/DASHBOARD_VIEWS_SPEC.md` | ACTIVE_AUTHORITY | View A/B/C/D roles and boundaries. |
| `docs/vision_and_implementation/TARGET_ARCHITECTURE_SPEC.md` | ACTIVE_AUTHORITY | Target architecture boundaries. |
| `docs/vision_and_implementation/PIPELINE_AND_WORKERS_SPEC.md` | ACTIVE_AUTHORITY | Pipeline and worker target model. |
| `docs/vision_and_implementation/AUTH_AND_2FA_SPEC.md` | ACTIVE_AUTHORITY | Auth and 2FA target model. |
| `docs/vision_and_implementation/SCHEDULER_AND_RUNTIME_RECOVERY_SPEC.md` | ACTIVE_AUTHORITY | Scheduler, recovery, locks, logs, and platform targets. |
| `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md` | ACTIVE_AUTHORITY | Tracks old docs that may be parsed, superseded, or later moved. |
| `docs/vision_and_implementation/UNRESOLVED_QUESTIONS.md` | ACTIVE_AUTHORITY | Decision backlog for ambiguous specs. |
| `docs/vision_and_implementation/reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md` | ACTIVE_AUTHORITY | Final summary of this 3-slice workflow. |

## Historical / candidate-superseded groups

| Path/group | Current classification | Handling rule |
|---|---|---|
| `docs/OLD_DOCS/` | HISTORICAL_REFERENCE / PARSE_CANDIDATE | Do not treat as current truth until harvested or verified. |
| `task_docs/` | HISTORICAL_WORKFLOW_REFERENCE / PARSE_CANDIDATE | Keep for implementation history; harvest useful durable claims into authority docs. |
| `docs/active_workflow_docs/` | ACTIVE_WORKFLOW_EVIDENCE | Recent workflow evidence, but not always final product spec. |
| `docs/button_verification_results/` | SPECIALIZED_EVIDENCE | Use for button-level truth and audit provenance. |

## Contradiction handling rule

When documents disagree:

1. Check current code/tests for implementation reality.
2. Check `docs/vision_and_implementation/` for reconciled target/current distinction.
3. Preserve old claims as historical evidence unless they are revalidated.
4. If a contradiction needs user choice, move it to `UNRESOLVED_QUESTIONS.md`.
5. Do not silently delete or rewrite old docs as if their history never existed.

## Next documentation-governance step

The next documentation workflow should decide whether parsed historical docs move into:

- `docs/docs_parsed/` for harvested reference material;
- `docs/to_be_deleted/` for fully superseded/stale material marked with a deletion notice;
- a permanent archive folder for historical implementation context.

No relocation was performed in the 3-slice vision/specification workflow.
