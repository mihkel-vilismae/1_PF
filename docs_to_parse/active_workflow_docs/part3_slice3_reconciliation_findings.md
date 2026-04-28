# Part 3 Slice 3 — Reconciliation Findings

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`  
Skill mode: `Browser Repo Verifier & Doc Curator — 1PF Documentation Reconciliation Mode`  
Input snapshot: post-Slice-2 `12_PF v0.3.24` repository state.  
Generated: 2026-04-26 18:04 EEST

## Scope and safety

This slice reconciles the Slice 2 truth matrix into practical documentation authority and consolidation findings. It does **not** move, delete, or rewrite existing documentation, and it does **not** modify production code.

## Slice 2 files verified as present

| File | Present in repo | Purpose |
|---|---:|---|
| `docs/active_workflow_docs/part3_documentation_truth_matrix.md` | Yes | Slice 2 table-first documentation truth matrix. |
| `docs/active_workflow_docs/part3_slice2_classification_notes.md` | Yes | Slice 2 method and classification notes. |

## Repo reality anchors used in this reconciliation

| Anchor | Evidence |
|---|---|
| Version file | `VERSION` = `0.3.24` |
| package.json version | `0.3.24` |
| npm scripts | 8 scripts found |
| API route table | 33 route keys found in `server/index.js` |
| Schema tables | 9 tables found in `schema.sql` |
| Tests | 29 root test files found under `tests/` |
| Dashboard files | 34 dashboard files found |
| Active workflow docs | 10 active workflow docs represented in Slice 2 matrix |

### npm scripts found

- `npm run api` → `node server/index.js`
- `npm run dev` → `vite`
- `npm run test` → `node --test`
- `npm run build` → `vite build`
- `npm run preview` → `vite preview`
- `npm run task-docs:toc` → `node scripts/generate-task-docs-toc.mjs`
- `npm run task-docs:check` → `node scripts/generate-task-docs-toc.mjs --check`
- `npm run validate:view-e` → `node scripts/validate-view-e.mjs`

### API endpoints found

- `GET /api/auth/status`
- `POST /api/auth/verify-icloudpd`
- `POST /api/auth/run`
- `POST /api/auth/2fa/submit`
- `POST /api/auth/test-login-download-one`
- `POST /api/auth/reset`
- `POST /api/auth/logout`
- `POST /api/auth/resume`
- `POST /api/init/verify-env`
- `GET /api/init/database/status`
- `POST /api/init/database/inspect`
- `POST /api/init/database/delete`
- `POST /api/init/database/recreate-empty`
- `POST /api/init/cron/install`
- `GET /api/init/cron/status`
- `GET /api/init/cron/print`
- `POST /api/database-viewer/verify`
- `POST /api/database-viewer/connect`
- `GET /api/database-viewer/tables`
- `POST /api/database-viewer/rows`
- `POST /api/database-viewer/logging/start`
- `POST /api/database-viewer/logging/stop`
- `POST /api/runtime/download/run`
- `POST /api/runtime/index/run`
- `POST /api/runtime/gps/run`
- `POST /api/runtime/geocode/run`
- `POST /api/runtime/queue/prepare`
- `POST /api/runtime/playback/select-current`
- `POST /api/runtime/orchestration/run`
- `GET /api/runtime/orchestration/current`
- `GET /api/runtime/orchestration/last`
- `GET /api/runtime-truth`
- `POST /api/runtime-truth`

### Schema tables found

- `canonical_media_assets`
- `media_asset_variants`
- `address_cache`
- `parse_files_for_gps_queue`
- `geocode_queue`
- `slideshow_queue`
- `runtime_state`
- `action_runs`
- `system_logs`

## Classification summary inherited from Slice 2

| Classification | Count |
|---|---:|
| old but still useful | 61 |
| current but incomplete | 16 |
| authoritative/current | 12 |
| stale/outdated | 1 |

## Recommended action summary inherited from Slice 2

| Recommended action | Count |
|---|---:|
| archive | 53 |
| keep | 18 |
| merge | 11 |
| update | 8 |

## Reconciliation findings

### Finding 1 — `HOW_TO_RUN.md` is the highest-priority regeneration target

Evidence:
- Slice 2 classified `HOW_TO_RUN.md` as `current but incomplete` with secondary labels `too thin / insufficient` and `needs HOW_TO_RUN regeneration`.
- Repo reality contains runnable scripts in `package.json`: `npm run api`, `npm run dev`, `npm run test`, `npm run build`, `npm run preview`, `npm run task-docs:toc`, `npm run task-docs:check`, `npm run validate:view-e`.
- There are no root start scripts listed in the active evidence index, so the current run handoff is incomplete relative to the repo's actual command surface.

Recommended action: regenerate `HOW_TO_RUN.md` in a later workflow using the HOW_TO_RUN Auto-Regenerator Agent. Do not rewrite it during this Slice 3 report-only run.

### Finding 2 — `docs/OLD_DOCS/` should remain archival until useful content is harvested

Evidence:
- Slice 2 classified most `docs/OLD_DOCS/` files as `old but still useful`.
- Several old docs include broad system concepts, invariants, state, schema, frontend/backend contracts, logging, recovery, and cron/watchdog topics.
- The folder name already signals archive status, but the content still contains planning and architectural context.

Recommended action: keep `docs/OLD_DOCS/` intact for now; later harvest useful content into current source-of-truth docs before any deletion decisions.

### Finding 3 — Authentication docs are current but overlapping

Evidence:
- Current auth docs exist in `docs/AI_AUTHENTICATION_2FA_HANDOFF.md`, `docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`, and `docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md`.
- API route reality includes auth endpoints such as `GET /api/auth/status`, `POST /api/auth/run`, `POST /api/auth/2fa/submit`, `POST /api/auth/resume`, `POST /api/auth/logout`, and `POST /api/auth/verify-icloudpd`.
- Slice 2 marked the auth docs as current but incomplete and repeating another doc.

Recommended action: keep a single authoritative auth overview plus smaller verification/session appendices, or merge the smaller docs into the handoff document after endpoint-level verification.

### Finding 4 — Schema documentation needs direct `schema.sql` reconciliation

Evidence:
- `schema.sql` defines 9 tables: `canonical_media_assets`, `media_asset_variants`, `address_cache`, `parse_files_for_gps_queue`, `geocode_queue`, `slideshow_queue`, `runtime_state`, `action_runs`, `system_logs`.
- `docs/CANONICAL_SCHEMA_PROPOSAL.md` exists and Slice 2 marked it as current but incomplete with `needs schema verification`.
- `docs/OLD_DOCS/06_DATABASE_SCHEMA.md` and `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` may overlap with current schema documentation.

Recommended action: create a future schema reconciliation pass that compares every documented table/field against `schema.sql` before promoting a schema doc to source-of-truth.

### Finding 5 — Endpoint documentation should be verified against the route table, not guessed

Evidence:
- `server/index.js` defines routes through a `routes = { ... }` object rather than Express-style `app.get()` calls.
- Slice 2 evidence indexing undercounted endpoints in one summary because it looked for Express-style patterns. The actual route table contains 33 endpoints.

Recommended action: update the skill rule to detect route-table patterns like `'GET /api/...': handler` in addition to Express-style route registrations.

### Finding 6 — Button verification docs are numerous and should be consolidated only after preserving per-button evidence

Evidence:
- `docs/button_verification_results/` and `docs/button_verification_workflow/` contain many workflow/result docs.
- Slice 2 classified these as mostly old but still useful or authoritative/current depending on location and scope.

Recommended action: keep per-button result docs as evidence records, but create or maintain a single current button verification index/summary as the reader-facing entrypoint.

## Current authoritative candidates

| Path | Surface purpose | Confidence |
|---|---|---|
| `CHANGELOG.md` | Version history and change log. | high |
| `README.md` | Root project overview and quick orientation. | medium |
| `docs/active_workflow_docs/README.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part1_documentation_inventory_skill.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part1_quick_documentation_inventory_with_loc.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part2_analyzing_repo_file_folder_structure_skill.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part2_repo_file_folder_structure_analysis.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part3_browser_repo_verifier_doc_curator_skill_improved.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part3_prompt_analysis_critique_refinement.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part3_slice1_documentation_scope_inventory.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/part3_slice1_repo_evidence_index.md` | Active workflow-generated analysis/report artifact. | high |
| `docs/active_workflow_docs/workflow_rule_active_docs_folder_prompt.md` | Active workflow-generated analysis/report artifact. | high |

## Current incomplete docs needing update/regeneration

| Path | Secondary labels | Recommended action | Confidence |
|---|---|---|---|
| `.codex/skills/button-workflow-verification/SKILL.md` | needs test verification, should be kept as source-of-truth | keep | medium |
| `.codex/skills/button-workflow-verification/references/agent-patterns.md` | needs test verification, should be kept as source-of-truth | keep | medium |
| `.codex/skills/button-workflow-verification/references/compounding-reuse.md` | needs test verification, should be kept as source-of-truth | keep | medium |
| `.codex/skills/button-workflow-verification/references/repo-evidence-map.md` | needs test verification, should be kept as source-of-truth | keep | medium |
| `.codex/skills/button-workflow-verification/references/report-template.md` | needs test verification, should be kept as source-of-truth | keep | medium |
| `.codex/skills/view-a-init-reconciliation/SKILL.md` | needs endpoint verification, should be kept as source-of-truth | keep | medium |
| `HOW_TO_RUN.md` | mentions command checked, too thin / insufficient, needs HOW_TO_RUN regeneration, repeats another doc | update | high |
| `docs/AI_AUTHENTICATION_2FA_HANDOFF.md` | mentions command checked, needs endpoint verification, needs test verification, repeats another doc | update | medium |
| `docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md` | mentions command checked, needs endpoint verification, needs test verification, repeats another doc | update | medium |
| `docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | needs endpoint verification, needs test verification, repeats another doc | update | medium |
| `docs/CANONICAL_SCHEMA_PROPOSAL.md` | needs schema verification, repeats another doc | update | medium |
| `docs/IMPLEMENTATION_STATUS_AUDIT.md` | needs endpoint verification, needs schema verification, needs test verification | update | medium |
| `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` | needs test verification, repeats another doc | update | medium |
| `docs/button_verification_workflow/BUTTON_VERIFICATION_ACCELERATION_LAYER.md` | needs test verification, should be merged, repeats another doc | merge | medium |
| `docs/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md` | needs endpoint verification, needs test verification, should be merged, repeats another doc | merge | medium |
| `docs/buttons_and_implementation_overview.md` | needs endpoint verification, needs test verification, repeats another doc | update | medium |

## Old docs that still contain useful information

| Path | LOC | First headings | Recommended action | Confidence |
|---|---:|---|---|---|
| `docs/OLD_DOCS/00_TABLE_OF_CONTENTS.md` | 126 | # Table of Contents (Master Control Document)<br>## Purpose<br>## Most Important Interpretation Rule<br>## Reading Order | archive | medium |
| `docs/OLD_DOCS/01_SYSTEM_OVERVIEW.md` | 85 | # System Overview<br>## Purpose<br>## Target System Shape<br>## Core System Goals | archive | medium |
| `docs/OLD_DOCS/02_SYSTEM_INVARIANTS.md` | 45 | # System Invariants<br>## Purpose<br>## Global Invariants<br>## Pipeline Invariants | archive | medium |
| `docs/OLD_DOCS/03_ARCHITECTURE.md` | 78 | # Architecture<br>## Purpose<br>## Primary Components<br>### 1. Dashboard Frontend | archive | medium |
| `docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md` | 99 | # Single Source of Truth<br>## Purpose<br>## Canonical Backend Contract Alignment<br>## Canonical Decision | archive | medium |
| `docs/OLD_DOCS/05_STATE_MACHINE.md` | 91 | # State Machine<br>## Purpose<br>## Canonical Backend Contract Alignment<br>## Top-Level System States | archive | medium |
| `docs/OLD_DOCS/06_DATABASE_SCHEMA.md` | 140 | # Database Schema<br>## Purpose<br>## Storage Principles<br>## Core Tables | archive | medium |
| `docs/OLD_DOCS/07_PIPELINE_STAGES.md` | 64 | # Pipeline Stages<br>## Purpose<br>## Ordered Stages<br>## Execution Contract | archive | medium |
| `docs/OLD_DOCS/08_WORKERS_AND_OWNERSHIP.md` | 73 | # Workers and Ownership<br>## Purpose<br>## Worker Set<br>### 1. Pipeline Worker | archive | medium |
| `docs/OLD_DOCS/09_CRON_AND_WATCHDOG.md` | 61 | # Cron and Watchdog<br>## Purpose<br>## Model<br>## Current Windows Implementation Note | archive | medium |
| `docs/OLD_DOCS/10_CONCURRENCY_AND_LOCKING.md` | 84 | # Concurrency and Locking<br>## Purpose<br>## Canonical Backend Contract Alignment<br>## Canonical Choice | archive | medium |
| `docs/OLD_DOCS/11_LOGGING_AND_EVENT_MODEL.md` | 75 | # Logging and Event Model<br>## Purpose<br>## Principles<br>## Required Event Categories | archive | medium |

## Merge / consolidation candidates

### Authentication / iCloud login docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/AI_AUTHENTICATION_2FA_HANDOFF.md` | Yes | current but incomplete / update |
| `docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md` | Yes | current but incomplete / update |
| `docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | Yes | current but incomplete / update |

### Schema / DB docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/CANONICAL_SCHEMA_PROPOSAL.md` | Yes | current but incomplete / update |
| `docs/OLD_DOCS/06_DATABASE_SCHEMA.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` | Yes | old but still useful / archive |

### System architecture historical docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/OLD_DOCS/01_SYSTEM_OVERVIEW.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/02_SYSTEM_INVARIANTS.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/03_ARCHITECTURE.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/05_STATE_MACHINE.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/12_STATE_AND_RECOVERY.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md` | Yes | old but still useful / archive |

### Button verification docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/button_verification_results/AUTHORITATIVE_MISSING_FUNCTIONALITY.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/INDEX.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/RUN_LOG.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_1A_VERIFY_ENV.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_CHECK_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_DELETE_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_INSPECT_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_RECREATE_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_3A_CHECK_SCHEDULER.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_3A_INSTALL_SCHEDULER.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_3A_PRINT_SCHEDULER.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_B_B1_LOGIN_FLOW.md` | Yes | old but still useful / archive |



## Skill improvement discovered in Slice 3

Add this route-discovery rule to the Browser Repo Verifier & Doc Curator skill:

```text
When verifying backend API documentation, detect both Express-style calls and route-table mappings.
For this repo, server/index.js uses route-table entries like:
  'GET /api/auth/status': authRouteHandlers.statusHandler
Therefore endpoint evidence must parse quoted METHOD /api/path route keys, not only app.get/app.post patterns.
```

## Recommended Slice 4 inputs

Slice 4 should use:
- `part3_slice1_repo_evidence_index.md`
- `part3_documentation_truth_matrix.md`
- `part3_slice2_classification_notes.md`
- this file: `part3_slice3_reconciliation_findings.md`
- `part3_recommended_doc_authority_model.md`

Slice 4 should produce the final human-readable report, update changelog/version metadata, and package the final repo ZIP with full Git history.
