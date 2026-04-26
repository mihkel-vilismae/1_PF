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
| `docs/VISION_SPEC/VISION_SPEC_readme.md` | ACTIVE_AUTHORITY | Entry point and reading order. |
| `docs/VISION_SPEC/05-project-vision.md` | ACTIVE_AUTHORITY | Product vision and purpose. |
| `docs/VISION_SPEC/07-current-implementation-spec.md` | ACTIVE_AUTHORITY | Current implementation reality summary. |
| `docs/VISION_SPEC/11-dashboard-views-spec.md` | ACTIVE_AUTHORITY | View A/B/C/D roles and boundaries. |
| `docs/VISION_SPEC/06-target-architecture-spec.md` | ACTIVE_AUTHORITY | Target architecture boundaries. |
| `docs/VISION_SPEC/08-pipeline-and-workers-spec.md` | ACTIVE_AUTHORITY | Pipeline and worker target model. |
| `docs/VISION_SPEC/10-auth-and-2fa-spec.md` | ACTIVE_AUTHORITY | Auth and 2FA target model. |
| `docs/VISION_SPEC/09-scheduler-and-runtime-recovery-spec.md` | ACTIVE_AUTHORITY | Scheduler, recovery, locks, logs, and platform targets. |
| `docs/VISION_SPEC/17-deprecated-superseded-docs-log.md` | ACTIVE_AUTHORITY | Tracks old docs that may be parsed, superseded, or later moved. |
| `docs/VISION_SPEC/16-unresolved-questions.md` | ACTIVE_AUTHORITY | Decision backlog for ambiguous specs. |
| `docs/VISION_SPEC/reconciliation/13-final-vision-spec-reconciliation-report.md` | ACTIVE_AUTHORITY | Final summary of this 3-slice workflow. |

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
