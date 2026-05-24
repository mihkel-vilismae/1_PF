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
| docs/AUTH_EVIDENCE_PACK.md | docs/00_current_truth/AUTH_EVIDENCE_PACK.md | 02_current_auth_evidence | medium | Current auth artifact-debugging entrypoint; verify code endpoints before execution. |
| docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | docs/20_architecture_and_specs/auth/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | 03_auth_flow_reference | medium | Auth/provider reference; verify against routes/tests before making runtime claims. |
| docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | 03_auth_flow_reference | medium | Auth/provider reference; verify against routes/tests before making runtime claims. |
| docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | docs/30_status_snapshots/2026-05-12/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md | docs/30_status_snapshots/2026-05-12/b4_playback_flow_status.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md | docs/30_status_snapshots/2026-05-12/button_and_view_verification_status.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md | docs/30_status_snapshots/2026-05-12/code_verified_dashboard_implementation_status.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/documented_current_system_state.md | docs/30_status_snapshots/2026-05-12/documented_current_system_state.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md | docs/30_status_snapshots/2026-05-12/known_gaps_and_unresolved_questions.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/main_readme.md | docs/30_status_snapshots/2026-05-12/main_readme.md | 04_current_status_snapshots | medium | Status snapshot; useful but not live truth. |
| docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md | docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md | 05_vision_and_target_specs | medium | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md | docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md | 05_vision_and_target_specs | medium | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/main_readme.md | docs/20_architecture_and_specs/main_readme.md | 05_vision_and_target_specs | medium | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/product_vision_and_authority.md | docs/20_architecture_and_specs/product_vision_and_authority.md | 05_vision_and_target_specs | medium | Target/spec material; not proof of implementation. |
| _TODO_13_05_26/3A_cronemulator.txt | docs/40_backlog_and_tasks/_TODO_13_05_26__3A_cronemulator.txt | 06_backlog_and_active_task_prompts | low-to-medium | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/D_monitoring_view.txt | docs/40_backlog_and_tasks/_TODO_13_05_26__D_monitoring_view.txt | 06_backlog_and_active_task_prompts | low-to-medium | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/F_page.txt | docs/40_backlog_and_tasks/_TODO_13_05_26__F_page.txt | 06_backlog_and_active_task_prompts | low-to-medium | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/marked_for_removal.md | docs/40_backlog_and_tasks/_TODO_13_05_26__marked_for_removal.md | 06_backlog_and_active_task_prompts | low-to-medium | Backlog/task prompt; not current truth. |
| docs/active_workflow_docs/slice_8_9_route_selection.md | docs/40_backlog_and_tasks/docs__active_workflow_docs__slice_8_9_route_selection.md | 06_backlog_and_active_task_prompts | medium | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md | docs/40_backlog_and_tasks/docs__categorized__task_documentation_still_to_implement__active_implementation_backlog.md | 06_backlog_and_active_task_prompts | medium | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | docs/40_backlog_and_tasks/docs__categorized__task_documentation_still_to_implement__main_readme.md | 06_backlog_and_active_task_prompts | medium | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | docs/40_backlog_and_tasks/docs__categorized__task_documentation_still_to_implement__rejected_or_superseded_tasks.md | 06_backlog_and_active_task_prompts | medium | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | docs/40_backlog_and_tasks/docs__categorized__task_documentation_still_to_implement__verification_and_reconciliation_tasks.md | 06_backlog_and_active_task_prompts | medium | Backlog/task prompt; not current truth. |
| task_docs/2026-04-20_dashboard-transit-terminal.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_explain-controls-inspect-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_explain-values-source-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_runtime-backend-foundation.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_show-backend-status-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_show-real-vs-mock-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/2026-04-20_view-e-database-viewer.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/README.md | docs/90_archive/task_docs_2026-04-20/README.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| task_docs/_TABLE_OF_CONTENTS.md | docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | 07_historical_task_docs_archive | low-to-medium | Historical task doc; archive/provenance only. |
| docs/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | docs/50_audits_and_migrations/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | 08_audits_and_migration_reports | medium | Audit/migration snapshot; recheck before using. |
| docs/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | docs/50_audits_and_migrations/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | 08_audits_and_migration_reports | medium | Audit/migration snapshot; recheck before using. |
| placeholder_implementations.md | docs/50_audits_and_migrations/placeholder_implementations.md | 08_audits_and_migration_reports | medium | Audit/migration snapshot; recheck before using. |
| docs/categorized/other_documentation/archive_and_reference_material.md | docs/90_archive/old_indexes/archive_and_reference_material.md | 09_documentation_indexes_and_reference | medium | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md | docs/90_archive/old_indexes/default_project_settings_and_elements_checklist.md | 09_documentation_indexes_and_reference | medium | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/documentation_workflow_and_inventory.md | docs/90_archive/old_indexes/documentation_workflow_and_inventory.md | 09_documentation_indexes_and_reference | medium | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/main_readme.md | docs/90_archive/old_indexes/main_readme.md | 09_documentation_indexes_and_reference | medium | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/operator_setup_and_auth_notes.md | docs/90_archive/old_indexes/operator_setup_and_auth_notes.md | 09_documentation_indexes_and_reference | medium | Index/reference material; new DOC_INDEX supersedes old navigation. |
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
