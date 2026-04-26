# Part 3 — Recommended Documentation Authority Model

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`  
Finalized in Slice 4.

## Proposed top-level documentation hierarchy

| Layer | Folder/file | Authority level | Purpose |
|---|---|---|---|
| 1 | `README.md` | Primary entrypoint | Human orientation and current system overview |
| 1 | `HOW_TO_RUN.md` | Primary operator runbook after regeneration | Exact commands, expected results, troubleshooting |
| 1 | `CHANGELOG.md`, `VERSION`, `package.json` | Version authority | Version/change truth |
| 2 | `docs/active_workflow_docs/` | Active workflow evidence | Generated analysis, truth matrices, reconciliation reports |
| 2 | Selected current docs under `docs/` | Supporting source-of-truth candidates | Auth, schema, implementation status, package policy |
| 3 | `.codex/skills/` | Workflow instruction authority | Local skill rules and audit workflows |
| 4 | `docs/OLD_DOCS/` | Historical archive | Old-but-useful context, not current authority unless reverified |
| 4 | `task_docs/` | Historical task notes | Implementation context and old task records |

## Recommended source-of-truth docs

- `README.md`
- Regenerated `HOW_TO_RUN.md`
- `CHANGELOG.md`
- `docs/active_workflow_docs/part3_browser_repo_verifier_doc_curator_report.md`
- `docs/active_workflow_docs/part3_documentation_truth_matrix.md`
- `docs/active_workflow_docs/part3_recommended_doc_authority_model.md`

## Recommended archive policy

Keep `docs/OLD_DOCS/` intact for now. Treat it as historical evidence only. Do not delete old docs until a later consolidation workflow has harvested useful sections and recorded what was superseded.

## Recommended merge targets

| Topic | Merge target | Source candidates |
|---|---|---|
| Auth/iCloud/2FA | Future `docs/AUTH_SOURCE_OF_TRUTH.md` | `docs/AI_AUTHENTICATION_2FA_HANDOFF.md`, `docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`, `docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md` |
| Run instructions | Regenerated `HOW_TO_RUN.md` | `package.json`, `README.md`, scripts, tests |
| Schema | Future `docs/SCHEMA_SOURCE_OF_TRUTH.md` | `schema.sql`, schema docs, SQLite bridge |
| API endpoints | Future `docs/API_ENDPOINT_SOURCE_OF_TRUTH.md` | `server/index.js`, API docs, tests |
| Button evidence | Future button-verification index | `docs/button_verification_results/` |

## Recommended docs to regenerate

1. `HOW_TO_RUN.md`
2. API endpoint reference
3. Schema reference
4. Button verification overview/index

## Recommended docs to leave untouched for now

- `docs/OLD_DOCS/`
- `task_docs/`
- existing button verification result files
- current auth docs until the auth consolidation task is explicitly started

## Proposed future folder structure

```text
docs/
  active_workflow_docs/
  source_of_truth/
    AUTH_SOURCE_OF_TRUTH.md
    API_ENDPOINT_SOURCE_OF_TRUTH.md
    SCHEMA_SOURCE_OF_TRUTH.md
    RUNBOOK_SOURCE_OF_TRUTH.md
  archive/
    old_docs/
  evidence/
    button_verification/
```

No docs were moved or deleted in this run.
