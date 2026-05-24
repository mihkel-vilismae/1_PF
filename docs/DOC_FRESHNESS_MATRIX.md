# Documentation Freshness Matrix

Estonian timestamp: 2026-05-24 22:58 EEST

This matrix groups documentation by freshness and trust risk. Freshness estimates are navigation aids, not proof of implementation correctness.

## Freshness summary

| Freshness | Files | LOC | How to use |
| --- | --- | --- | --- |
| current_latest_baseline | 1 | 87 | Start here for latest/current docs. |
| recent_verify_against_code | 23 | 3365 | Useful, but verify against code/tests/evidence. |
| medium_recent_reference | 22 | 2144 | Reference/spec/workflow value; not proof. |
| historical_reference_only | 9 | 1959 | Archive/provenance only. |
| dirty_or_untracked_risk | 4 | 173 | Audit before trusting. |
| unknown | 0 | 0 | Manual review required. |

## Full matrix

| path | freshness | authority | kind | topics | note |
| --- | --- | --- | --- | --- | --- |
| AGENTS.md | recent_verify_against_code | source_of_truth_candidate | root_core | general | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| CHANGELOG.md | recent_verify_against_code | source_of_truth_candidate | root_core | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, real_vs_mock, download | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| HOW_TO_RUN.md | recent_verify_against_code | runtime_runbook | root_core | auth, new_auth, icloudpd, provider, view_a | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| README.md | recent_verify_against_code | runtime_runbook | root_core | auth, new_auth, icloudpd, provider, cron, monitoring, view_a, view_d, download | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| docs/00_current_truth/AUTH_EVIDENCE_PACK.md | current_latest_baseline | evidence_pack_current | current_truth | auth, new_auth, icloudpd, provider, evidence_pack, download | Canonical current-truth auth artifact-debugging guide; verify code endpoints before execution. |
| docs/AUTH_EVIDENCE_PACK.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, evidence_pack | Compatibility pointer only; canonical guide moved to docs/00_current_truth/AUTH_EVIDENCE_PACK.md. |
| docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | recent_verify_against_code | code_verified_snapshot | auth_reference | auth, new_auth, icloudpd, provider, view_d, download | Auth/provider reference; verify against routes/tests before making runtime claims. |
| docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | recent_verify_against_code | code_verified_snapshot | auth_reference | auth, new_auth, icloudpd, provider | Auth/provider reference; verify against routes/tests before making runtime claims. |
| docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, download | Status snapshot; useful but not live truth. |
| docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, runtime_truth, monitoring | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, cron, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, cron, view_a, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/documented_current_system_state.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/main_readme.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, cron, download | Status snapshot; useful but not live truth. |
| docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, provider, cron, download | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, new_auth, icloudpd, provider, view_a, view_d, download | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/main_readme.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, cron | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/product_vision_and_authority.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, provider | Target/spec material; not proof of implementation. |
| _TODO_13_05_26/3A_cronemulator.txt | medium_recent_reference | backlog | backlog_or_task_prompt | cron | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/D_monitoring_view.txt | medium_recent_reference | backlog | backlog_or_task_prompt | auth, runtime_truth, cron, monitoring, view_a, view_d, download | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/F_page.txt | medium_recent_reference | backlog | backlog_or_task_prompt | auth, icloudpd, runtime_truth, download | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/marked_for_removal.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, icloudpd, view_a, download | Backlog/task prompt; not current truth. |
| docs/active_workflow_docs/slice_8_9_route_selection.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, provider | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, new_auth, provider, runtime_truth, view_a, view_d, download | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, new_auth | Backlog/task prompt; not current truth. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | historical_reference_only | historical_reference | historical_task_archive | monitoring, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | historical_reference_only | historical_reference | historical_task_archive | view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | historical_reference_only | historical_reference | historical_task_archive | auth, icloudpd, runtime_truth, view_a, view_d, download | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | historical_reference_only | historical_reference | historical_task_archive | view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a, view_d | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/README.md | historical_reference_only | historical_reference | historical_task_archive | auth | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | medium_recent_reference | historical_reference | audit_or_migration_report | auth, icloudpd, provider, runtime_truth, cron, download | Audit/migration snapshot; recheck before using. |
| docs/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | medium_recent_reference | historical_reference | audit_or_migration_report | auth, provider, view_d | Audit/migration snapshot; recheck before using. |
| placeholder_implementations.md | medium_recent_reference | historical_reference | audit_or_migration_report | auth, provider, runtime_truth, cron, monitoring, view_a, real_vs_mock, download | Audit/migration snapshot; recheck before using. |
| docs/categorized/other_documentation/archive_and_reference_material.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, runtime_truth | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, real_vs_mock | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/documentation_workflow_and_inventory.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/main_readme.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, icloudpd | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/10_runbooks/operator_setup_and_auth_notes.md | recent_verify_against_code | runtime_runbook | runbook | auth, new_auth, icloudpd, provider, download | Canonical operator setup/auth runbook moved in Slice 7; verify commands and endpoints against current code before execution. |
| docs/categorized/other_documentation/operator_setup_and_auth_notes.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth | Compatibility pointer only; canonical runbook moved to docs/10_runbooks/operator_setup_and_auth_notes.md. |
| docs/main_readme.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, new_auth, icloudpd, provider, cron, view_a, view_d, download | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/CronEmulator/TABLE_OF_CONTENTS.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | cron, view_a | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/network-scan-terminal-gui/TABLE_OF_CONTENTS.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | view_a | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/CronEmulator/CHANGELOG.md | medium_recent_reference | runtime_runbook | tool_local_doc | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/HOW_TO_RUN.md | medium_recent_reference | runtime_runbook | tool_local_doc | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/README.md | medium_recent_reference | runtime_runbook | tool_local_doc | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/crontab_emulated.example.txt | medium_recent_reference | runtime_runbook | tool_local_doc | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/docs/PLANNING_DOCUMENT.md | medium_recent_reference | runtime_runbook | tool_local_doc | cron | Tool-local doc; keep with CronEmulator. |
| tools/network-scan-terminal-gui/CHANGELOG.md | dirty_or_untracked_risk | dirty_or_untracked_risk | tool_local_doc | general | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/HOW_TO_RUN.md | dirty_or_untracked_risk | dirty_or_untracked_risk | tool_local_doc | general | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/README.md | dirty_or_untracked_risk | dirty_or_untracked_risk | tool_local_doc | general | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/docs/IMPLEMENTATION_PROMPT.md | dirty_or_untracked_risk | dirty_or_untracked_risk | tool_local_doc | general | Tool-local submodule doc; audit separately. |
| generated_test_data/README.md | medium_recent_reference | historical_reference | test_data_doc | general | Dataset README; keep with test data. |

## Slice 6 current-truth move note

The latest auth evidence guide moved to `docs/00_current_truth/AUTH_EVIDENCE_PACK.md`. The old `docs/AUTH_EVIDENCE_PACK.md` path remains a compatibility pointer and should not be treated as the canonical content source.

## Completed runbook move

The operator setup/auth notes moved to `docs/10_runbooks/operator_setup_and_auth_notes.md`. The old categorized path remains a compatibility pointer and should not be treated as canonical content.


## Slice 8 compatibility pointer freshness


| compatibility path | canonical path | freshness | safe use |
| --- | --- | --- | --- |
| task_docs/2026-04-20_dashboard-transit-terminal.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/2026-04-20_explain-controls-inspect-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/2026-04-20_explain-values-source-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/2026-04-20_runtime-backend-foundation.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/2026-04-20_show-backend-status-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/2026-04-20_show-real-vs-mock-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/2026-04-20_view-e-database-viewer.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/README.md | docs/90_archive/task_docs_2026-04-20/README.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
| task_docs/_TABLE_OF_CONTENTS.md | docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | historical_reference_only | Pointer only; open canonical archive path for historical content. |
