# PF_login documentation table of contents

Estonian timestamp: 30.05.2026, 21:04 EEST

## Purpose

This table of contents is the short, operator-friendly entry point for the PF_login / 1234_PF documentation set. It complements the detailed inventory in `docs/DOC_INDEX.md` and the authority/freshness guidance in `docs/DOC_FRESHNESS_MATRIX.md`.

Use current-truth docs, code, tests, generated evidence, and runtime output before relying on older snapshots. Archive and compatibility-pointer docs are context only unless a current code/test/evidence check confirms them.

## Root project documents

| Path | Use |
| --- | --- |
| `README.md` | Project overview, run entry points, architecture summary, documentation navigation. |
| `HOW_TO_RUN.md` | Short run instructions. |
| `CHANGELOG.md` | Forward-only version/history notes. |
| `AGENTS.md` | Repository instructions for automated agents. |
| `VERSION` | Canonical repository version. |
| `package.json` | npm scripts and package version. |

## Documentation navigation and governance

| Path | Use |
| --- | --- |
| `docs/table_of_contents.md` | Short top-level documentation map. |
| `docs/DOC_INDEX.md` | Detailed documentation inventory with classification and topic notes. |
| `docs/DOC_FRESHNESS_MATRIX.md` | Freshness/authority matrix for deciding what can be trusted. |
| `docs/DOC_LINK_AUDIT.md` | Link-audit status. |
| `docs/DOC_REORGANIZATION_PLAN.md` | Documentation move/compatibility plan. |
| `docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md` | Closure report for the canonical docs folder layout. |

## Current-truth docs

| Path | Use |
| --- | --- |
| `docs/00_current_truth/AUTH_EVIDENCE_PACK.md` | NEW AUTH evidence and artifact debugging guide. |
| `docs/00_current_truth/MEDIA_PIPELINE_IMPLEMENTATION_STATUS_20260528.md` | Current media pipeline implementation-status table. |
| `docs/00_current_truth/PROJECT_ISSUES_AND_IMPROVEMENT_GUIDE_20260528.md` | Evidence-aware issue and improvement guide. |

## Operator runbooks

| Path | Use |
| --- | --- |
| `docs/10_runbooks/operator_setup_and_auth_notes.md` | Operator setup, auth, session, and iCloudPD notes. |
| `docs/10_runbooks/windows_full_launcher.md` | Full Windows startup workflow. |
| `docs/10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md` | PC/runtime evidence checklist for Download, Index, GPS parser, Geocode, and Queue. |
| `docs/10_runbooks/POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md` | Power-outage recovery verification checklist. |
| `docs/10_runbooks/native_playback_runner_setup.md` | Native playback runner setup. |
| `docs/10_runbooks/gps_metadata_sources.md` | GPS metadata source formats for EXIF, sidecars, filename tokens, and path tokens. |
| `docs/10_runbooks/geocode_provider_activation.md` | Safe geocode provider activation and cache-first verification. |
| `docs/10_runbooks/documentation_workflow_and_inventory.md` | Documentation workflow and inventory rules. |


## Proof artifacts

| Path | Use |
| --- | --- |
| `docs/proofs/README.md` | Proof artifact overview and status vocabulary. |
| `docs/proofs/proof_artifact_schema.md` | Shared proof JSON schema. |
| `docs/proofs/full_test_suite_stability_proof.md` | Full test suite stability proof workflow. |
| `docs/proofs/real_icloudpd_pipeline_proof.md` | Real iCloudPD pipeline proof workflow. |
| `docs/proofs/geocode_provider_proof.md` | Real geocode provider proof workflow. |
| `docs/proofs/raspberry_power_loss_recovery_proof.md` | Raspberry power-loss recovery proof workflow. |

## Architecture and specs

| Path | Use |
| --- | --- |
| `docs/20_architecture_and_specs/product_vision_and_authority.md` | Product goal and authority boundaries. |
| `docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md` | Runtime/recovery architecture. |
| `docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md` | Dashboard/auth pipeline architecture. |
| `docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md` | NEW AUTH provider verification reference. |
| `docs/20_architecture_and_specs/media_pipeline_provider_interfaces.md` | GPS/geocode provider contracts and chain rules. |
| `docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md` | Reverse-geocode provider registry/config behavior. |
| `docs/20_architecture_and_specs/native_playback_runner_spec.md` | Native playback runner contract. |
| `docs/20_architecture_and_specs/playback_resume_checkpoint_spec.md` | Playback checkpoint save/read/clear contract. |
| `docs/20_architecture_and_specs/runtime_truth_local_state.md` | Runtime-truth seed vs local mutable file contract. |
| `docs/20_architecture_and_specs/reference/LOGGING_STANDARD_CONTRACT.md` | Logging standard contract. |
| `docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md` | Default project settings and reusable UI/runtime elements. |

## Status snapshots

| Path | Use |
| --- | --- |
| `docs/30_status_snapshots/` | Dated status snapshots. Use for history and evidence trails; verify against current code/tests before current claims. |

## Backlog, tasks, and active workflow

| Path | Use |
| --- | --- |
| `docs/40_backlog_and_tasks/active_workflow/` | Active workflow notes and slice plans. |
| `docs/40_backlog_and_tasks/active_workflow/runtime_gap_implementation_plan_20260530.md` | Ordered plan for remaining runtime proof and implementation gaps. |
| `docs/40_backlog_and_tasks/task_documentation_still_to_implement/active_implementation_backlog.md` | Backlog items; verify against current implementation before acting. |
| `docs/40_backlog_and_tasks/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md` | Verification/reconciliation tasks. |
| `docs/40_backlog_and_tasks/task_documentation_still_to_implement/rejected_or_superseded_tasks.md` | Rejected/superseded items. |

## Audits and migrations

| Path | Use |
| --- | --- |
| `docs/50_audits_and_migrations/placeholder_implementations.md` | Placeholder audit. Some entries may need reconciliation against current code. |
| `docs/50_audits_and_migrations/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md` | Type/function migration plan. |
| `docs/50_audits_and_migrations/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md` | Type/function migration closure audit. |
| `docs/50_audits_and_migrations/GATE_A_DOCUMENTATION_AUDIT_20260531.md` | Gate A documentation audit and inventory (2026‑05‑31). |

## Archive and compatibility pointers

| Path | Use |
| --- | --- |
| `docs/90_archive/` | Historical material. Do not treat as current implementation truth. |
| `docs/categorized/` | Compatibility navigation from the older categorized layout. |
| Root-level moved-doc pointers under `docs/` | Compatibility pointers only unless explicitly listed as current above. |

## Scripts, config, and logs

| Path | Use |
| --- | --- |
| `start_win_full.cmd` / `start_scripts/start_win_full.ps1` | Full Windows launcher. |
| `start_win.cmd` | Lighter Windows startup path. |
| `conf/runtime-truth.seed.json` | Committed neutral runtime-truth seed used at dashboard boot. |
| `conf/runtime-truth.json` | Ignored local runtime-truth state written during app use. |
| `example.env` | Environment key template, including geocode provider settings. |
| `logs/` | Runtime logs when generated locally. Do not commit secrets. |
| `tools/` | Tool-local utilities such as CronEmulator and repo-update helpers. |
