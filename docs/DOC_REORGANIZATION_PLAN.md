# Documentation Reorganization Plan

Estonian timestamp: 2026-05-24 22:58 EEST

This is a plan only. No existing documentation files were moved, renamed, or deleted in this analysis.

## Proposed target structure

- Keep README.md, HOW_TO_RUN.md, AGENTS.md, and CHANGELOG.md at repository root.
- docs/00_current_truth/ for latest truth/evidence docs.
- docs/10_runbooks/ for operator runbooks.
- docs/20_architecture_and_specs/ for specs and target architecture.
- docs/30_status_snapshots/ for dated status snapshots.
- docs/40_backlog_and_tasks/ for TODOs and task prompts.
- docs/50_audits_and_migrations/ for audit/migration reports.
- docs/90_archive/ for historical task docs and replaced indexes.
- Keep tool docs next to their tools.

## Proposed move map

| path | proposed | group | link_risk | reason |
| --- | --- | --- | --- | --- |
| AGENTS.md | KEEP_ROOT: AGENTS.md | 01_root_core | none if kept in place | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| CHANGELOG.md | KEEP_ROOT: CHANGELOG.md | 01_root_core | none if kept in place | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| HOW_TO_RUN.md | KEEP_ROOT: HOW_TO_RUN.md | 01_root_core | none if kept in place | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| README.md | KEEP_ROOT: README.md | 01_root_core | none if kept in place | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| docs/AUTH_EVIDENCE_PACK.md | completed: canonical content moved to docs/00_current_truth/AUTH_EVIDENCE_PACK.md; old path is compatibility pointer | 02_current_auth_evidence | resolved for old links | Current auth artifact-debugging guide moved in Slice 6 with link preservation. |
| docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | completed canonical status snapshot path; old path remains compatibility pointer at docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | 04_current_status_snapshots | resolved for old links | Status update moved in Slice 11 with link preservation. |
| docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for root-level status snapshot link. |
| docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | KEEP_CANONICAL | 03_auth_flow_reference | none | Canonical auth-flow reference moved in Slice 14. |
| docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | COMPATIBILITY_POINTER_TO docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | 03_auth_flow_reference | low | Old path preserved as compatibility pointer until link-retirement slice. |
| docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | completed canonical status snapshot path; old path remains compatibility pointer at docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | 04_current_status_snapshots | resolved for old links | Status snapshot moved in Slice 11 with link preservation. |
| docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for root-level status snapshot link. |
| docs/30_status_snapshots/2026-05-12/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | completed canonical status snapshot path; old path remains compatibility pointer at docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | 04_current_status_snapshots | resolved for old links | Status snapshot moved in Slice 11 with link preservation. |
| docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for root-level status snapshot link. |
| docs/30_status_snapshots/2026-05-12/b4_playback_flow_status.md | completed canonical categorized status snapshot path; old path remains compatibility pointer at docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md | 04_current_status_snapshots | resolved for old links | Categorized status snapshot moved in Slice 12 with link preservation. |
| docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/b4_playback_flow_status.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for old category links. |
| docs/30_status_snapshots/2026-05-12/button_and_view_verification_status.md | completed canonical categorized status snapshot path; old path remains compatibility pointer at docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md | 04_current_status_snapshots | resolved for old links | Categorized status snapshot moved in Slice 12 with link preservation. |
| docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/button_and_view_verification_status.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for old category links. |
| docs/30_status_snapshots/2026-05-12/code_verified_dashboard_implementation_status.md | completed canonical categorized status snapshot path; old path remains compatibility pointer at docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md | 04_current_status_snapshots | resolved for old links | Categorized status snapshot moved in Slice 12 with link preservation. |
| docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/code_verified_dashboard_implementation_status.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for old category links. |
| docs/30_status_snapshots/2026-05-12/documented_current_system_state.md | completed canonical categorized status snapshot path; old path remains compatibility pointer at docs/categorized/current_implementation_status_docs/documented_current_system_state.md | 04_current_status_snapshots | resolved for old links | Categorized status snapshot moved in Slice 12 with link preservation. |
| docs/categorized/current_implementation_status_docs/documented_current_system_state.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/documented_current_system_state.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for old category links. |
| docs/30_status_snapshots/2026-05-12/known_gaps_and_unresolved_questions.md | completed canonical categorized status snapshot path; old path remains compatibility pointer at docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md | 04_current_status_snapshots | resolved for old links | Categorized status snapshot moved in Slice 12 with link preservation. |
| docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md | completed: canonical content moved to docs/30_status_snapshots/2026-05-12/known_gaps_and_unresolved_questions.md; old path is compatibility pointer | 04_current_status_snapshots | resolved for old links | Compatibility pointer retained for old category links. |
| docs/categorized/current_implementation_status_docs/main_readme.md | docs/30_status_snapshots/2026-05-12/main_readme.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md | completed canonical vision/spec path; old path remains compatibility pointer at docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md | 05_vision_and_target_specs | resolved for old links | Vision/spec doc moved in Slice 13 with link preservation. |
| docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md | completed: canonical content moved to docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md; old path is compatibility pointer | 05_vision_and_target_specs | resolved for old links | Compatibility pointer retained for old category links. |
| docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md | completed canonical vision/spec path; old path remains compatibility pointer at docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md | 05_vision_and_target_specs | resolved for old links | Vision/spec doc moved in Slice 13 with link preservation. |
| docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md | completed: canonical content moved to docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md; old path is compatibility pointer | 05_vision_and_target_specs | resolved for old links | Compatibility pointer retained for old category links. |
| docs/categorized/vision_spec_docs/main_readme.md | docs/20_architecture_and_specs/main_readme.md | 05_vision_and_target_specs | medium | Target/spec material; not proof of implementation. |
| docs/20_architecture_and_specs/product_vision_and_authority.md | completed canonical vision/spec path; old path remains compatibility pointer at docs/categorized/vision_spec_docs/product_vision_and_authority.md | 05_vision_and_target_specs | resolved for old links | Vision/spec doc moved in Slice 13 with link preservation. |
| docs/categorized/vision_spec_docs/product_vision_and_authority.md | completed: canonical content moved to docs/20_architecture_and_specs/product_vision_and_authority.md; old path is compatibility pointer | 05_vision_and_target_specs | resolved for old links | Compatibility pointer retained for old category links. |
| _TODO_13_05_26/3A_cronemulator.txt | completed: canonical content moved to docs/40_backlog_and_tasks/todo_2026-05-13/3A_cronemulator.txt; old path is compatibility pointer | 06_backlog_and_active_task_prompts | resolved for old links | Backlog/TODO prompt moved in Slice 9 with link preservation. |
| _TODO_13_05_26/D_monitoring_view.txt | completed: canonical content moved to docs/40_backlog_and_tasks/todo_2026-05-13/D_monitoring_view.txt; old path is compatibility pointer | 06_backlog_and_active_task_prompts | resolved for old links | Backlog/TODO prompt moved in Slice 9 with link preservation. |
| _TODO_13_05_26/F_page.txt | not moved: ignored dirty/unrelated file for current workflow | 06_backlog_and_active_task_prompts | unchanged | Do not move unless user explicitly scopes this file later. |
| _TODO_13_05_26/marked_for_removal.md | completed: canonical content moved to docs/40_backlog_and_tasks/todo_2026-05-13/marked_for_removal.md; old path is compatibility pointer | 06_backlog_and_active_task_prompts | resolved for old links | Backlog/TODO prompt moved in Slice 9 with link preservation. |
| docs/active_workflow_docs/slice_8_9_route_selection.md | docs/40_backlog_and_tasks/active_workflow/slice_8_9_route_selection.md | 06_backlog_and_active_task_prompts | done; compatibility pointer retained | Moved in Slice 17. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/active_implementation_backlog.md | completed canonical backlog path; old path remains compatibility pointer at docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md | 06_backlog_and_active_task_prompts | resolved for old links | Backlog category doc moved in Slice 10 with link preservation. |
| docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md | completed: canonical content moved to docs/40_backlog_and_tasks/task_documentation_still_to_implement/active_implementation_backlog.md; old path is compatibility pointer | 06_backlog_and_active_task_prompts | resolved for old links | Compatibility pointer retained for old category links. |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | docs/40_backlog_and_tasks/docs__categorized__task_documentation_still_to_implement__main_readme.md | 06_backlog_and_active_task_prompts | medium | Backlog/task prompt; not current truth. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | completed canonical backlog path; old path remains compatibility pointer at docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | 06_backlog_and_active_task_prompts | resolved for old links | Backlog category doc moved in Slice 10 with link preservation. |
| docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | completed: canonical content moved to docs/40_backlog_and_tasks/task_documentation_still_to_implement/rejected_or_superseded_tasks.md; old path is compatibility pointer | 06_backlog_and_active_task_prompts | resolved for old links | Compatibility pointer retained for old category links. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | completed canonical backlog path; old path remains compatibility pointer at docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | 06_backlog_and_active_task_prompts | resolved for old links | Backlog category doc moved in Slice 10 with link preservation. |
| docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | completed: canonical content moved to docs/40_backlog_and_tasks/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md; old path is compatibility pointer | 06_backlog_and_active_task_prompts | resolved for old links | Compatibility pointer retained for old category links. |
| task_docs/2026-04-20_dashboard-transit-terminal.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_explain-controls-inspect-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_explain-values-source-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_runtime-backend-foundation.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_show-backend-status-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_show-real-vs-mock-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_view-e-database-viewer.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/README.md | docs/90_archive/task_docs_2026-04-20/README.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/_TABLE_OF_CONTENTS.md | docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| docs/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | completed: canonical content moved to docs/50_audits_and_migrations/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md; old path is compatibility pointer | 08_audits_and_migration_reports | resolved for old links | Audit/migration doc moved in Slice 15 with link preservation. |
| docs/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | completed: canonical content moved to docs/50_audits_and_migrations/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md; old path is compatibility pointer | 08_audits_and_migration_reports | resolved for old links | Audit/migration doc moved in Slice 15 with link preservation. |
| placeholder_implementations.md | completed: canonical content moved to docs/50_audits_and_migrations/placeholder_implementations.md; old path is compatibility pointer | 08_audits_and_migration_reports | resolved for old links | Audit/migration doc moved in Slice 15 with link preservation. |
| docs/categorized/other_documentation/archive_and_reference_material.md | docs/90_archive/reference_material_2026-05-10/archive_and_reference_material.md | 07_historical_task_docs_archive | done; compatibility pointer retained | Moved in Slice 17 as reference/provenance material. |
| docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md | docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md | 05_vision_and_target_specs | done; compatibility pointer retained | Moved in Slice 17 as reusable reference/spec material. |
| docs/categorized/other_documentation/documentation_workflow_and_inventory.md | docs/10_runbooks/documentation_workflow_and_inventory.md | 10_runbooks | done; compatibility pointer retained | Moved in Slice 17 as documentation workflow runbook. |
| docs/categorized/other_documentation/main_readme.md | docs/90_archive/old_indexes/main_readme.md | 09_documentation_indexes_and_reference | medium | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/operator_setup_and_auth_notes.md | completed: canonical content moved to docs/10_runbooks/operator_setup_and_auth_notes.md; old path is compatibility pointer | 13_operator_runbooks | resolved for old links | Operator setup/auth runbook moved in Slice 7 with link preservation. |
| docs/main_readme.md | docs/90_archive/old_indexes/main_readme.md | 09_documentation_indexes_and_reference | medium | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/CronEmulator/TABLE_OF_CONTENTS.md | docs/90_archive/old_indexes/TABLE_OF_CONTENTS.md | 09_documentation_indexes_and_reference | high if moved | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/network-scan-terminal-gui/TABLE_OF_CONTENTS.md | docs/90_archive/old_indexes/TABLE_OF_CONTENTS.md | 09_documentation_indexes_and_reference | high if moved | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/CronEmulator/CHANGELOG.md | KEEP_TOOL_LOCAL: tools/CronEmulator/CHANGELOG.md | 10_tool_docs_cronemulator | none if kept in place | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/HOW_TO_RUN.md | KEEP_TOOL_LOCAL: tools/CronEmulator/HOW_TO_RUN.md | 10_tool_docs_cronemulator | none if kept in place | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/README.md | KEEP_TOOL_LOCAL: tools/CronEmulator/README.md | 10_tool_docs_cronemulator | none if kept in place | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/crontab_emulated.example.txt | KEEP_TOOL_LOCAL: tools/CronEmulator/crontab_emulated.example.txt | 10_tool_docs_cronemulator | none if kept in place | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/docs/PLANNING_DOCUMENT.md | KEEP_TOOL_LOCAL: tools/CronEmulator/docs/PLANNING_DOCUMENT.md | 10_tool_docs_cronemulator | none if kept in place | Tool-local doc; keep with CronEmulator. |
| tools/network-scan-terminal-gui/CHANGELOG.md | KEEP_TOOL_LOCAL_AFTER_SUBMODULE_AUDIT: tools/network-scan-terminal-gui/CHANGELOG.md | 11_tool_docs_network_scan_dirty | none if kept in place | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/HOW_TO_RUN.md | KEEP_TOOL_LOCAL_AFTER_SUBMODULE_AUDIT: tools/network-scan-terminal-gui/HOW_TO_RUN.md | 11_tool_docs_network_scan_dirty | none if kept in place | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/README.md | KEEP_TOOL_LOCAL_AFTER_SUBMODULE_AUDIT: tools/network-scan-terminal-gui/README.md | 11_tool_docs_network_scan_dirty | none if kept in place | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/docs/IMPLEMENTATION_PROMPT.md | KEEP_TOOL_LOCAL_AFTER_SUBMODULE_AUDIT: tools/network-scan-terminal-gui/docs/IMPLEMENTATION_PROMPT.md | 11_tool_docs_network_scan_dirty | none if kept in place | Tool-local submodule doc; audit separately. |
| generated_test_data/README.md | KEEP_WITH_DATA: generated_test_data/README.md | 12_test_data_docs | none if kept in place | Dataset README; keep with test data. |

## Recommended implementation slices

1. Root-link navigation: link root docs to DOC_INDEX, DOC_FRESHNESS_MATRIX, DOC_REORGANIZATION_PLAN, and AUTH_EVIDENCE_PACK.
2. Root-link validation: verify README/HOW_TO_RUN/docs indexes point to current navigation.
3. Current-truth folder slice: move/copy only current docs after link checks.
4. Snapshot/archive slice: move dated snapshots and task docs with link updates.
5. Cleanup slice: retire old indexes only after all references are updated.

## Completed physical moves

- Slice 6 moved the canonical NEW AUTH Evidence Pack guide from `docs/AUTH_EVIDENCE_PACK.md` to `docs/00_current_truth/AUTH_EVIDENCE_PACK.md`. The original path remains as a compatibility pointer.

- Slice 7 moved the canonical operator setup/auth runbook from `docs/categorized/other_documentation/operator_setup_and_auth_notes.md` to `docs/10_runbooks/operator_setup_and_auth_notes.md`. The original path remains as a compatibility pointer.


## Slice 8 completed archive move


The following historical task docs have been moved. Old paths remain as compatibility pointers.

| old pointer path | canonical archive path | status |
| --- | --- | --- |
| task_docs/2026-04-20_dashboard-transit-terminal.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | Completed in Slice 8; old path is pointer only. |
| task_docs/2026-04-20_explain-controls-inspect-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | Completed in Slice 8; old path is pointer only. |
| task_docs/2026-04-20_explain-values-source-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | Completed in Slice 8; old path is pointer only. |
| task_docs/2026-04-20_runtime-backend-foundation.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | Completed in Slice 8; old path is pointer only. |
| task_docs/2026-04-20_show-backend-status-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | Completed in Slice 8; old path is pointer only. |
| task_docs/2026-04-20_show-real-vs-mock-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | Completed in Slice 8; old path is pointer only. |
| task_docs/2026-04-20_view-e-database-viewer.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | Completed in Slice 8; old path is pointer only. |
| task_docs/README.md | docs/90_archive/task_docs_2026-04-20/README.md | Completed in Slice 8; old path is pointer only. |
| task_docs/_TABLE_OF_CONTENTS.md | docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | Completed in Slice 8; old path is pointer only. |

## Slice 9 completed backlog move

The non-ignored `_TODO_13_05_26` backlog docs were moved to `docs/40_backlog_and_tasks/todo_2026-05-13/` with compatibility pointers at the old paths. `_TODO_13_05_26/F_page.txt` remains untouched because it is explicitly ignored as dirty/unrelated for the current workflow.

## Slice 16 final reference/index handling decision

As of 2026-05-25 01:47 EEST, old category indexes are retained in place as compatibility navigation. They must not be used as canonical destinations for new content.

Retain in place until a later link-audit/replacement slice:

- `docs/main_readme.md`
- `docs/categorized/current_implementation_status_docs/main_readme.md`
- `docs/categorized/other_documentation/main_readme.md`
- `docs/categorized/task_documentation_still_to_implement/main_readme.md`
- `docs/categorized/vision_spec_docs/main_readme.md`

Do not move tool-local docs as part of this decision. Do not touch the known ignored dirty files. The next safe physical move slice should handle remaining reference material only if it has a clear canonical target and compatibility pointer plan.

## Slice 17 remaining reference/workflow moves

Estonian timestamp: 2026-05-25 01:56 EEST

Slice 17 moved selected remaining reference/workflow documents to clear canonical target folders while retaining compatibility pointers at the old paths:

| Old path | Canonical path | Authority |
|---|---|---|
| `docs/categorized/other_documentation/archive_and_reference_material.md` | `docs/90_archive/reference_material_2026-05-10/archive_and_reference_material.md` | historical/reference only |
| `docs/categorized/other_documentation/documentation_workflow_and_inventory.md` | `docs/10_runbooks/documentation_workflow_and_inventory.md` | runbook/process guidance |
| `docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md` | `docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md` | reusable reference/spec checklist |
| `docs/active_workflow_docs/slice_8_9_route_selection.md` | `docs/40_backlog_and_tasks/active_workflow/slice_8_9_route_selection.md` | planning/workflow context |

Do not move tool-local docs or ignored dirty/unrelated files as part of this workflow.

## Slice 18 full link audit and old-index replacement decision

As of 2026-05-25 02:06 EEST, the reorganization has enough compatibility pointers that a full link audit was run before replacing old indexes.

Decision:

- Keep `docs/main_readme.md` and the four `docs/categorized/*/main_readme.md` files as compatibility navigation.
- Do not convert them to redirect-only pointers yet.
- Record the audit in [`DOC_LINK_AUDIT.md`](DOC_LINK_AUDIT.md).
- Record the retained-index decision in [`OLD_INDEX_REPLACEMENT_DECISION.md`](OLD_INDEX_REPLACEMENT_DECISION.md).
- Fix the one detected broken local documentation link in `tools/CronEmulator/TABLE_OF_CONTENTS.md`.

Next safe slice: run a final documentation summary/consolidation pass or begin targeted runbook additions only if a specific missing runbook is identified.

## Slice 19 closure status

Estonian timestamp: 2026-05-25 02:18 EEST

The planned documentation reorganization is complete enough to close the broad refactor phase. Selected docs have been moved to canonical numbered folders with compatibility pointers. Old category indexes are retained as compatibility navigation.

Use [`DOC_REFACTOR_CLOSURE_REPORT_20260525.md`](DOC_REFACTOR_CLOSURE_REPORT_20260525.md) for final folder placement rules. Future work should be limited to feature-specific documentation updates or a separately scoped compatibility-pointer retirement slice after a new full link audit.
