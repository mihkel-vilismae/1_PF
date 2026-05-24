# Documentation Index

Estonian timestamp: 2026-05-24 22:58 EEST

This index classifies non-skill documentation files and separates current truth candidates from status snapshots, specs, backlog, archive material, and tool-local docs. No files were moved by this analysis.

- Included documentation files: 59
- Included documentation LOC: 7717

## Group summary

| Group | Files | LOC | Purpose |
| --- | --- | --- | --- |
| 01_root_core | 4 | 1391 | Root README, HOW_TO_RUN, AGENTS, and CHANGELOG entry points. |
| 02_current_auth_evidence | 2 | 106 | Current auth artifact/evidence guidance plus compatibility pointer. |
| 03_auth_flow_reference | 2 | 148 | Auth/provider verification reference docs. |
| 04_current_status_snapshots | 8 | 786 | Status snapshots; verify against code/evidence. |
| 05_vision_and_target_specs | 4 | 311 | Target architecture/product specs. |
| 06_backlog_and_active_task_prompts | 9 | 720 | TODOs, backlog, active task prompts. |
| 07_historical_task_docs_archive | 18 | 2076 | Historical task archive plus compatibility pointers. |
| 08_audits_and_migration_reports | 3 | 753 | Audits and migration snapshots. |
| 09_documentation_indexes_and_reference | 8 | 918 | Legacy indexes/reference docs, including compatibility pointers. |
| 13_operator_runbooks | 1 | 115 | Operator-facing runbooks moved into docs/10_runbooks. |
| 10_tool_docs_cronemulator | 5 | 319 | CronEmulator tool docs. |
| 11_tool_docs_network_scan_dirty | 4 | 173 | Network-scan submodule/tool docs; audit separately. |
| 12_test_data_docs | 1 | 41 | Test-data docs. |

## Detailed index

| path | loc | title | kind | authority | freshness | group | topics | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AGENTS.md | 17 | Repository Instructions | root_core | source_of_truth_candidate | recent_verify_against_code | 01_root_core | general | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| CHANGELOG.md | 1223 | CHANGELOG | root_core | source_of_truth_candidate | recent_verify_against_code | 01_root_core | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, real_vs_mock, download | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| HOW_TO_RUN.md | 28 | How to Run | root_core | runtime_runbook | recent_verify_against_code | 01_root_core | auth, new_auth, icloudpd, provider, view_a | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| README.md | 123 | Photo Frame Dashboard System | root_core | runtime_runbook | recent_verify_against_code | 01_root_core | auth, new_auth, icloudpd, provider, cron, monitoring, view_a, view_d, download | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| docs/00_current_truth/AUTH_EVIDENCE_PACK.md | 87 | NEW AUTH Evidence Pack | current_truth | evidence_pack_current | current_latest_baseline | 02_current_auth_evidence | auth, new_auth, icloudpd, provider, evidence_pack, download | Canonical current-truth auth artifact-debugging guide; verify code endpoints before execution. |
| docs/AUTH_EVIDENCE_PACK.md | 19 | NEW AUTH Evidence Pack | index_or_table_of_contents | historical_reference | recent_verify_against_code | 02_current_auth_evidence | auth, evidence_pack | Compatibility pointer only; do not add detailed content here. |
| docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | 76 | Implementation Status Update — NEW AUTH Provider Verification UX | auth_reference | code_verified_snapshot | recent_verify_against_code | 03_auth_flow_reference | auth, new_auth, icloudpd, provider, view_d, download | Auth/provider reference; verify against routes/tests before making runtime claims. |
| docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | 72 | NEW AUTH provider verification flow | auth_reference | code_verified_snapshot | recent_verify_against_code | 03_auth_flow_reference | auth, new_auth, icloudpd, provider | Auth/provider reference; verify against routes/tests before making runtime claims. |
| docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | 124 | Implementation Goal Status Reconciliation — 2026‑05‑12 | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, download | Status snapshot; useful but not live truth. |
| docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | 62 | Runtime Truth Authority Map — 2026‑05‑12 | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, runtime_truth, monitoring | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md | 67 | B4 Playback Flow Status | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, cron, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md | 81 | Button and View Verification Status | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, cron, view_a, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md | 156 | Code-Verified Dashboard Implementation Status | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/documented_current_system_state.md | 110 | Documented Current System State | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md | 100 | Known Gaps and Unresolved Questions | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, view_d, download | Status snapshot; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/main_readme.md | 86 | Current Implementation Status Docs | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, cron, download | Status snapshot; useful but not live truth. |
| docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md | 91 | Architecture, Runtime, and Recovery Spec | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, provider, cron, download | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md | 94 | Dashboard, Auth, and Pipeline Spec | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, new_auth, icloudpd, provider, view_a, view_d, download | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/main_readme.md | 62 | Vision Spec Docs - Canonical Set | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, cron | Target/spec material; not proof of implementation. |
| docs/categorized/vision_spec_docs/product_vision_and_authority.md | 64 | Product Vision and Authority | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, provider | Target/spec material; not proof of implementation. |
| _TODO_13_05_26/3A_cronemulator.txt | 123 | **1. Task Understanding** | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | cron | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/D_monitoring_view.txt | 122 | 1. Task Understanding | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, runtime_truth, cron, monitoring, view_a, view_d, download | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/F_page.txt | 188 | Use this as the **GPT-5.5 orchestrator prompt**: | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, icloudpd, runtime_truth, download | Backlog/task prompt; not current truth. |
| _TODO_13_05_26/marked_for_removal.md | 54 | Marked For Removal | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, icloudpd, view_a, download | Backlog/task prompt; not current truth. |
| docs/active_workflow_docs/slice_8_9_route_selection.md | 27 | Slice 8 and Slice 9 Route Selection | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, provider | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md | 66 | Active Implementation Backlog | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, new_auth, provider, runtime_truth, view_a, view_d, download | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | 52 | Task Category: Documentation Still To Implement | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | 41 | Rejected Or Superseded Tasks | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth | Backlog/task prompt; not current truth. |
| docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | 47 | Verification And Reconciliation Tasks | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, new_auth | Backlog/task prompt; not current truth. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | 64 | Task Doc — Dashboard Transit Terminal + Single Gateway | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | monitoring, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | 232 | Task Doc — Explain Controls Inspect Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | 224 | Task Doc — Explain Values Source Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | 374 | Task Doc — Runtime Backend Foundation | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, icloudpd, runtime_truth, view_a, view_d, download | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | 276 | Task Doc — Show Backend Status Inspection Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | 258 | Task Doc — Show Real vs Mock Inspection Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | 445 | Task Doc — View E Database Viewer | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a, view_d | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/README.md | 44 | Task Docs | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | 42 | Task Docs Table of Contents | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | 320 | Type Function Audit and Migration Plan | audit_or_migration_report | historical_reference | medium_recent_reference | 08_audits_and_migration_reports | auth, icloudpd, provider, runtime_truth, cron, download | Audit/migration snapshot; recheck before using. |
| docs/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | 52 | Type Function Migration Closure Audit | audit_or_migration_report | historical_reference | medium_recent_reference | 08_audits_and_migration_reports | auth, provider, view_d | Audit/migration snapshot; recheck before using. |
| placeholder_implementations.md | 381 | Placeholder Implementation Audit | audit_or_migration_report | historical_reference | medium_recent_reference | 08_audits_and_migration_reports | auth, provider, runtime_truth, cron, monitoring, view_a, real_vs_mock, download | Audit/migration snapshot; recheck before using. |
| docs/categorized/other_documentation/archive_and_reference_material.md | 52 | Archive and Reference Material | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth, runtime_truth | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md | 493 | Default Project Settings and Elements | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth, real_vs_mock | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/documentation_workflow_and_inventory.md | 64 | Documentation Workflow and Inventory | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/categorized/other_documentation/main_readme.md | 63 | Other Documentation | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth, icloudpd | Index/reference material; new DOC_INDEX supersedes old navigation. |
| docs/10_runbooks/operator_setup_and_auth_notes.md | 115 | Operator Setup and Auth Notes | runbook | runtime_runbook | recent_verify_against_code | 13_operator_runbooks | auth, new_auth, icloudpd, provider, download | Canonical operator setup/auth runbook moved in Slice 7; verify commands and endpoints against current code before execution. |
| docs/categorized/other_documentation/operator_setup_and_auth_notes.md | 12 | Operator Setup and Auth Notes | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth | Compatibility pointer only; canonical runbook moved to docs/10_runbooks/operator_setup_and_auth_notes.md. |
| docs/main_readme.md | 208 | Categorized Documentation Index | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth, new_auth, icloudpd, provider, cron, view_a, view_d, download | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/CronEmulator/TABLE_OF_CONTENTS.md | 12 | Table of Contents | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | cron, view_a | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/network-scan-terminal-gui/TABLE_OF_CONTENTS.md | 14 | Table of Contents | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | view_a | Index/reference material; new DOC_INDEX supersedes old navigation. |
| tools/CronEmulator/CHANGELOG.md | 9 | Changelog | tool_local_doc | runtime_runbook | medium_recent_reference | 10_tool_docs_cronemulator | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/HOW_TO_RUN.md | 92 | How to Run CronEmulator | tool_local_doc | runtime_runbook | medium_recent_reference | 10_tool_docs_cronemulator | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/README.md | 72 | CronEmulator | tool_local_doc | runtime_runbook | medium_recent_reference | 10_tool_docs_cronemulator | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/crontab_emulated.example.txt | 3 | */10 * * * * powershell -NoProfile -ExecutionPolicy Bypass -File ".\entrypoints\regular_st | tool_local_doc | runtime_runbook | medium_recent_reference | 10_tool_docs_cronemulator | cron | Tool-local doc; keep with CronEmulator. |
| tools/CronEmulator/docs/PLANNING_DOCUMENT.md | 143 | Windows 11 Cron Emulator — Planning Document | tool_local_doc | runtime_runbook | medium_recent_reference | 10_tool_docs_cronemulator | cron | Tool-local doc; keep with CronEmulator. |
| tools/network-scan-terminal-gui/CHANGELOG.md | 24 | Changelog | tool_local_doc | dirty_or_untracked_risk | dirty_or_untracked_risk | 11_tool_docs_network_scan_dirty | general | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/HOW_TO_RUN.md | 49 | HOW_TO_RUN | tool_local_doc | dirty_or_untracked_risk | dirty_or_untracked_risk | 11_tool_docs_network_scan_dirty | general | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/README.md | 62 | Network Scan Terminal GUI | tool_local_doc | dirty_or_untracked_risk | dirty_or_untracked_risk | 11_tool_docs_network_scan_dirty | general | Tool-local submodule doc; audit separately. |
| tools/network-scan-terminal-gui/docs/IMPLEMENTATION_PROMPT.md | 38 | Implementation Prompt | tool_local_doc | dirty_or_untracked_risk | dirty_or_untracked_risk | 11_tool_docs_network_scan_dirty | general | Tool-local submodule doc; audit separately. |
| generated_test_data/README.md | 41 | Photo Frame Test Dataset | test_data_doc | historical_reference | medium_recent_reference | 12_test_data_docs | general | Dataset README; keep with test data. |

## Trust rule

Use docs as navigation, not proof. Prefer generated evidence packs, tests, and code over stale docs or historical prompts.

## Slice 6 current-truth move note

`docs/00_current_truth/AUTH_EVIDENCE_PACK.md` is now the canonical current-truth copy. `docs/AUTH_EVIDENCE_PACK.md` is preserved only as a compatibility pointer for older links.

## Completed runbook move

Slice 7 moved the canonical operator setup/auth runbook to `docs/10_runbooks/operator_setup_and_auth_notes.md`. The old categorized path remains a compatibility pointer for older links.


## Slice 8 compatibility pointers

These old paths remain only to keep earlier links working. Use the canonical archive paths for new references.

| compatibility path | canonical path | status |
| --- | --- | --- |
| task_docs/2026-04-20_dashboard-transit-terminal.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | Pointer only; not current truth. |
| task_docs/2026-04-20_explain-controls-inspect-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | Pointer only; not current truth. |
| task_docs/2026-04-20_explain-values-source-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | Pointer only; not current truth. |
| task_docs/2026-04-20_runtime-backend-foundation.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | Pointer only; not current truth. |
| task_docs/2026-04-20_show-backend-status-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | Pointer only; not current truth. |
| task_docs/2026-04-20_show-real-vs-mock-mode.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | Pointer only; not current truth. |
| task_docs/2026-04-20_view-e-database-viewer.md | docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | Pointer only; not current truth. |
| task_docs/README.md | docs/90_archive/task_docs_2026-04-20/README.md | Pointer only; not current truth. |
| task_docs/_TABLE_OF_CONTENTS.md | docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | Pointer only; not current truth. |
