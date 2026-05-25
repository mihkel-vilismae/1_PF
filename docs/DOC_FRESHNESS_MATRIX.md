# Documentation Freshness Matrix

Estonian timestamp: 2026-05-24 22:58 EEST

This matrix groups documentation by freshness and trust risk. Freshness estimates are navigation aids, not proof of implementation correctness.

## Freshness summary

| Freshness | Files | LOC | How to use |
| --- | --- | --- | --- |
| current_latest_baseline | 1 | 87 | Start here for latest/current docs. |
| recent_verify_against_code | 29 | 3440 | Useful, but verify against code/tests/evidence; includes compatibility pointers for moved docs. |
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
| docs/30_status_snapshots/2026-05-25/MAIN_GOAL_IMPLEMENTATION_STATUS_20260525.md | current_latest_baseline | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, download, pipeline, playback, fullscreen, raspberry, windows, scheduler | Main-goal autonomous picture-frame implementation status snapshot for v0.5.26; verify against newer code before current-truth claims. |
| docs/00_current_truth/AUTH_EVIDENCE_PACK.md | current_latest_baseline | evidence_pack_current | current_truth | auth, new_auth, icloudpd, provider, evidence_pack, download | Canonical current-truth auth artifact-debugging guide; verify code endpoints before execution. |
| docs/AUTH_EVIDENCE_PACK.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, evidence_pack | Compatibility pointer only; canonical guide moved to docs/00_current_truth/AUTH_EVIDENCE_PACK.md. |
| docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, view_d, download | Canonical dated status snapshot moved in Slice 11; verify against current routes/tests/evidence before runtime claims. |
| docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | auth | Compatibility pointer only; use canonical moved status snapshot. |
| docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | recent_verify_against_code | code_verified_snapshot | auth_reference | auth, new_auth, icloudpd, provider | Canonical auth/provider reference moved in Slice 14; verify against routes/tests/evidence before runtime claims. |
| docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | recent_verify_against_code | historical_reference | compatibility_pointer | auth, new_auth, provider | Compatibility pointer to the canonical auth-flow reference; not canonical content. |
| docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, download | Canonical dated status snapshot moved in Slice 11; useful but not live truth. |
| docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | auth | Compatibility pointer only; use canonical moved status snapshot. |
| docs/30_status_snapshots/2026-05-12/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, runtime_truth, monitoring | Canonical dated status snapshot moved in Slice 11; useful but not live truth. |
| docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | runtime_truth | Compatibility pointer only; use canonical moved status snapshot. |
| docs/30_status_snapshots/2026-05-12/b4_playback_flow_status.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, cron, download | Canonical categorized status snapshot moved in Slice 12; verify against code/evidence before current-truth claims. |
| docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | auth, cron, download | Compatibility pointer only; use canonical file in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/button_and_view_verification_status.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, cron, view_a, view_d, download | Canonical categorized status snapshot moved in Slice 12; verify against code/evidence before current-truth claims. |
| docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | auth, cron, view_a, view_d, download | Compatibility pointer only; use canonical file in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/code_verified_dashboard_implementation_status.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, download | Canonical categorized status snapshot moved in Slice 12; verify against code/evidence before current-truth claims. |
| docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, download | Compatibility pointer only; use canonical file in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/documented_current_system_state.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_d, download | Canonical categorized status snapshot moved in Slice 12; verify against code/evidence before current-truth claims. |
| docs/categorized/current_implementation_status_docs/documented_current_system_state.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_d, download | Compatibility pointer only; use canonical file in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/known_gaps_and_unresolved_questions.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, view_d, download | Canonical categorized status snapshot moved in Slice 12; verify against code/evidence before current-truth claims. |
| docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md | recent_verify_against_code | historical_reference | implementation_status_snapshot | auth, new_auth, icloudpd, provider, runtime_truth, view_d, download | Compatibility pointer only; use canonical file in docs/30_status_snapshots/2026-05-12/. |
| docs/categorized/current_implementation_status_docs/main_readme.md | recent_verify_against_code | code_verified_snapshot | implementation_status_snapshot | auth, new_auth, icloudpd, provider, cron, download | Status snapshot; useful but not live truth. |
| docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, provider, cron, download | Canonical vision/spec doc moved in Slice 13; target/spec material, not runtime proof. |
| docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, provider, cron, download | Compatibility pointer only; use canonical moved spec. |
| docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, new_auth, icloudpd, provider, view_a, view_d, download | Canonical vision/spec doc moved in Slice 13; target/spec material, not runtime proof. |
| docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, new_auth, icloudpd, provider, view_a, view_d, download | Compatibility pointer only; use canonical moved spec. |
| docs/categorized/vision_spec_docs/main_readme.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, cron | Target/spec material; not proof of implementation. |
| docs/20_architecture_and_specs/product_vision_and_authority.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, provider | Canonical vision/spec doc moved in Slice 13; target/spec material, not runtime proof. |
| docs/categorized/vision_spec_docs/product_vision_and_authority.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, provider | Compatibility pointer only; use canonical moved spec. |
| docs/40_backlog_and_tasks/todo_2026-05-13/3A_cronemulator.txt | medium_recent_reference | backlog | backlog_or_task_prompt | cron | Canonical backlog/TODO prompt moved in Slice 9; not current truth. |
| _TODO_13_05_26/3A_cronemulator.txt | recent_verify_against_code | backlog | backlog_or_task_prompt | cron | Compatibility pointer only; use canonical moved file. |
| docs/40_backlog_and_tasks/todo_2026-05-13/D_monitoring_view.txt | medium_recent_reference | backlog | backlog_or_task_prompt | auth, runtime_truth, cron, monitoring, view_a, view_d, download | Canonical backlog/TODO prompt moved in Slice 9; not current truth. |
| _TODO_13_05_26/D_monitoring_view.txt | recent_verify_against_code | backlog | backlog_or_task_prompt | monitoring, view_d | Compatibility pointer only; use canonical moved file. |
| _TODO_13_05_26/F_page.txt | medium_recent_reference | backlog | backlog_or_task_prompt | auth, icloudpd, runtime_truth, download | Backlog task prompt intentionally not moved because it is an ignored dirty/unrelated file for this workflow. |
| docs/40_backlog_and_tasks/todo_2026-05-13/marked_for_removal.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, icloudpd, view_a, download | Canonical backlog/TODO prompt moved in Slice 9; not current truth. |
| _TODO_13_05_26/marked_for_removal.md | recent_verify_against_code | backlog | backlog_or_task_prompt | auth, view_a | Compatibility pointer only; use canonical moved file. |
| docs/40_backlog_and_tasks/active_workflow/slice_8_9_route_selection.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, provider | Canonical active workflow planning note moved in Slice 17; not current truth. |
| docs/active_workflow_docs/slice_8_9_route_selection.md | medium_recent_reference | historical_reference | index_or_table_of_contents | auth, provider | Compatibility pointer to canonical active workflow note. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/active_implementation_backlog.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, new_auth, provider, runtime_truth, view_a, view_d, download | Canonical backlog category doc moved in Slice 10; not current implementation truth. |
| docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md | recent_verify_against_code | backlog | backlog_or_task_prompt | auth, new_auth, provider, runtime_truth, view_a, view_d, download | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/task_documentation_still_to_implement/. |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth | Backlog/task prompt; not current truth. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth | Canonical backlog category doc moved in Slice 10; not current implementation truth. |
| docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | recent_verify_against_code | backlog | backlog_or_task_prompt | auth | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/task_documentation_still_to_implement/. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | medium_recent_reference | backlog | backlog_or_task_prompt | auth, new_auth | Canonical backlog category doc moved in Slice 10; not current implementation truth. |
| docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | recent_verify_against_code | backlog | backlog_or_task_prompt | auth, new_auth | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/task_documentation_still_to_implement/. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | historical_reference_only | historical_reference | historical_task_archive | monitoring, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | historical_reference_only | historical_reference | historical_task_archive | view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | historical_reference_only | historical_reference | historical_task_archive | auth, icloudpd, runtime_truth, view_a, view_d, download | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | historical_reference_only | historical_reference | historical_task_archive | view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a, view_d | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/README.md | historical_reference_only | historical_reference | historical_task_archive | auth | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | historical_reference_only | historical_reference | historical_task_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/50_audits_and_migrations/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | medium_recent_reference | historical_reference | audit_or_migration_report | auth, icloudpd, provider, runtime_truth, cron, download | Canonical audit/migration doc moved in Slice 15; recheck before using. |
| docs/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | recent_verify_against_code | historical_reference | audit_or_migration_report | auth, icloudpd, provider, runtime_truth, cron, download | Compatibility pointer only; canonical file is in docs/50_audits_and_migrations/. |
| docs/50_audits_and_migrations/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | medium_recent_reference | historical_reference | audit_or_migration_report | auth, provider, view_d | Canonical audit/migration doc moved in Slice 15; recheck before using. |
| docs/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | recent_verify_against_code | historical_reference | audit_or_migration_report | auth, provider, view_d | Compatibility pointer only; canonical file is in docs/50_audits_and_migrations/. |
| docs/50_audits_and_migrations/placeholder_implementations.md | medium_recent_reference | historical_reference | audit_or_migration_report | auth, provider, runtime_truth, cron, monitoring, view_a, real_vs_mock, download | Canonical audit/migration doc moved in Slice 15; recheck before using. |
| placeholder_implementations.md | recent_verify_against_code | historical_reference | audit_or_migration_report | auth, provider, runtime_truth, cron, monitoring, view_a, real_vs_mock, download | Compatibility pointer only; canonical file is in docs/50_audits_and_migrations/. |
| docs/90_archive/reference_material_2026-05-10/archive_and_reference_material.md | historical_reference_only | historical_reference | historical_task_archive | auth, runtime_truth | Canonical reference/archive orientation moved in Slice 17; not current truth. |
| docs/categorized/other_documentation/archive_and_reference_material.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, runtime_truth | Compatibility pointer to canonical archive/reference material. |
| docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md | medium_recent_reference | target_spec | architecture_or_vision_spec | auth, real_vs_mock | Canonical reusable default project checklist moved in Slice 17; reference/spec only. |
| docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth, real_vs_mock | Compatibility pointer to canonical reference/spec checklist. |
| docs/10_runbooks/documentation_workflow_and_inventory.md | recent_verify_against_code | runtime_runbook | runbook | auth | Canonical documentation workflow/inventory runbook moved in Slice 17. |
| docs/categorized/other_documentation/documentation_workflow_and_inventory.md | recent_verify_against_code | historical_reference | index_or_table_of_contents | auth | Compatibility pointer to canonical documentation workflow runbook. |
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

## Slice 9 backlog/TODO move

The moved non-ignored TODO docs are now canonical under `docs/40_backlog_and_tasks/todo_2026-05-13/`. Old paths are compatibility pointers. `_TODO_13_05_26/F_page.txt` remains untouched due to the ignored dirty-file rule.

## Slice 16 compatibility-index freshness decision

As of 2026-05-25 01:47 EEST, old category index files remain medium-trust navigation aids only. They are not current implementation truth and should not receive new canonical content. Use them to resolve older links, then follow their notices to `DOC_INDEX.md`, `DOC_FRESHNESS_MATRIX.md`, `DOC_REORGANIZATION_PLAN.md`, and the canonical target folders.

Freshness classification for retained old indexes: `compatibility_navigation_only`.

## Slice 18 link-audit freshness update

As of 2026-05-25 02:06 EEST, [`DOC_LINK_AUDIT.md`](DOC_LINK_AUDIT.md) and [`OLD_INDEX_REPLACEMENT_DECISION.md`](OLD_INDEX_REPLACEMENT_DECISION.md) are current latest-baseline documentation-governance docs.

The retained old category indexes are navigation compatibility files. They are useful for orientation, but they are not current implementation truth. Use the canonical numbered folders and generated evidence/code/tests for stronger authority.

## Slice 19 closure status

Estonian timestamp: 2026-05-25 02:18 EEST

The documentation refactor is closed as an organization pass. [`DOC_REFACTOR_CLOSURE_REPORT_20260525.md`](DOC_REFACTOR_CLOSURE_REPORT_20260525.md) summarizes canonical folders, pointer policy, and where future docs should be added.

Freshness rules remain unchanged: code, tests, generated evidence packs, and direct runtime checks are stronger than documentation. Compatibility pointers and old category indexes are navigation only.
