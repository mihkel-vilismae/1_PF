# Documentation Index

Estonian timestamp: 2026-06-11 18:30 EEST

This index classifies non-skill documentation files and separates current truth candidates from status snapshots, specs, backlog, archive material, and tool-local docs. The 2026-05-30 update archived old documentation-refactor status logs out of active `docs/` root navigation.

- Included documentation files: 135
- Included documentation LOC: 10850+



## 2026-06-25 root launcher and documentation placement refresh

- `full_windows_runner_status.cmd` is the only Windows terminal GUI launcher kept at repository root.
- Supporting Windows/Raspberry/packaging scripts are organized under `start_scripts/`; see `start_scripts/README.md`.
- `docs/10_runbooks/windows_runner_status_terminal_ui.md` documents the terminal GUI runner/status workflow.
- `docs/50_audits_and_migrations/root_script_and_doc_placement_xacr_20260625.md` records the XACR cleanup pass.

## 2026-05-30 navigation refresh

- `docs/table_of_contents.md` is now the short canonical documentation map for humans and agents.
- `docs/10_runbooks/gps_metadata_sources.md` documents the newly added local/offline GPS coordinate extraction methods.
- `docs/10_runbooks/geocode_provider_activation.md` documents safe reverse-geocode provider activation while preserving cache-first behavior and disabled-by-default network providers.
- The current detailed index still contains compatibility pointers and historical entries; use this refresh note plus the freshness matrix to avoid treating older snapshots as active truth.

## Recent additions

- `docs/proofs/raspberry_worker_startup_smoke_proof.md` — v0.8.57 three-worker startup smoke proof for Raspberry scheduler worker commands.
- `docs/20_architecture_and_specs/openspec/raspberry_v1_release_gate_matrix_openspec.md` — v0.8.56 answered question-matrix release gates for Raspberry v1.0.
- `docs/proofs/raspberry_v1_readiness_proof.md` — v0.8.56 proof-artifact evaluator for Raspberry v1.0 release readiness.
- `docs/proofs/raspberry_executable_permissions_proof.md` — v0.8.55 Raspberry executable-bit repair proof for ZIP extraction/launcher dry-run blockers.
- `docs/proofs/raspberry_env_preflight_proof.md` — v0.8.55 Raspberry `.env` bootstrap/preflight proof for scheduler/playback runtime blockers.
- `docs/20_architecture_and_specs/view_e_validation_hermetic_contract.md` — v0.8.41 View E validation hermeticity contract for proof-owned temp env/DB behavior.
- `docs/20_architecture_and_specs/openspec/raspberry_native_image_playback_proof_openspec.md` and `docs/proofs/raspberry_native_image_playback_proof.md` — v0.8.40 Raspberry target native image playback proof contract.
- `docs/20_architecture_and_specs/openspec/raspberry_native_video_playback_proof_openspec.md` and `docs/proofs/raspberry_native_video_playback_proof.md` — v0.8.42 Raspberry target native video playback proof contract.
- `docs/20_architecture_and_specs/openspec/raspberry_generated_fixture_proof_openspec.md` and `docs/proofs/raspberry_generated_fixture_proof.md` — v0.8.39 Raspberry target generated fixture validation proof contract.
- `docs/20_architecture_and_specs/openspec/raspberry_project_owned_launcher_openspec.md` and `docs/10_runbooks/raspberry_project_owned_launcher.md` — v0.8.38 Raspberry launcher skeleton contract and operator runbook.
- `docs/50_audits_and_migrations/PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md` — v0.8.33 structured project status, implementation coverage, OpenSpec coverage, endpoint/interface inventory, proof matrix, documentation issues, architecture risks, and next-slice plan.
- `docs/50_audits_and_migrations/DOCS_OPENSPEC_COVERAGE_GRADING_AUDIT_20260616.md` — v0.8.86.a documentation/OpenSpec coverage grading audit with v1 goal status, OpenSpec coverage table, documentation coverage table, and next governance fixes.
- `docs/proofs/dirty_shutdown_testing_proof.md` — deterministic proof for the Test Mode-only View C dirty-shutdown testing panel and guarded backend scaffold.
- `docs/proofs/windows_cronemulator_proof.md` — deterministic proof workflow for Windows CronEmulator boundaries and duplicate-run behavior.

- `docs/proofs/native_fullscreen_playback_proof.md` — deterministic proof workflow for native-player safety boundaries and browser fullscreen playback UI.
- `docs/table_of_contents.md` — short top-level table of contents for root docs, current truth, runbooks, architecture docs, backlog, scripts, config, and logs.
- `docs/10_runbooks/gps_metadata_sources.md` — operator examples for EXIF, JSON/XMP/text sidecars, filename tokens, and path tokens used by the GPS provider chain.
- `docs/proofs/gps_fallback_proof.md` and `tools/run-gps-fallback-proof.mjs` — deterministic local proof that GPS fallback providers can produce coordinates.
- `docs/proofs/deterministic_media_pipeline_proof.md` and `tools/run-deterministic-media-pipeline-proof.mjs` — deterministic local proof for GPS/geocode provider contracts plus playback worker selection semantics.
- `docs/10_runbooks/geocode_provider_activation.md` — safe activation checklist for cache-first reverse geocoding providers.
- `docs/90_archive/documentation_refactor_status_2026-05-25/README.md` — archive catalog for old root-level documentation-refactor slice status logs that were removed from active `docs/` root navigation.
- `docs/20_architecture_and_specs/reference/LOGGING_STANDARD_CONTRACT.md` — reusable logging contract extracted from the durable project logger, verbose request lifecycle logs, auth debug sink, private raw-provider boundary, Test/Real log isolation, and terminal-like UI controls.
- `docs/10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md` — operator-facing PC/runtime verification checklist and evidence capture table for Download, Index, GPS parser, Geocode, and Queue.
- `docs/00_current_truth/PROJECT_ISSUES_AND_IMPROVEMENT_GUIDE_20260528.md` — high-level, evidence-aware guide for recurring project issues, provider gaps, workflow safeguards, and verification strategy.
- `docs/30_status_snapshots/2026-05-28/LIVE_UPDATES_INSPECT_FAILURE_ANALYSIS_20260528.md` — repo-backed cause analysis for DevTools inspect instability under background re-renders.
- `docs/30_status_snapshots/2026-05-28/LIVE_UPDATES_INSPECT_FIX_DESIGN_20260528.md` — selected pause-live-updates design and boundaries.
- `docs/30_status_snapshots/2026-05-28/LIVE_UPDATES_INSPECT_VERIFICATION_20260528.md` — targeted verification and build notes for the live-update pause fix.
- `docs/proofs/real_download_continuation_proof.md` — opt-in real provider proof for repeated real-download continuation/deduplication behavior.
- `docs/proofs/address_display_proof.md` — deterministic proof that address text flows from GPS/geocode stages into playback payloads.

- `docs/50_audits_and_migrations/GATE_A_DOCUMENTATION_AUDIT_20260531.md` — Gate A documentation audit and inventory with recommended actions (2026‑05‑31).
- `docs/50_audits_and_migrations/MAIN_GOAL_IMPLEMENTATION_STATUS_VERIFICATION_20260531.md` — corrective implementation-status verification for the six main app goals (2026‑05‑31).

## Group summary

| Group | Files | LOC | Purpose |
| --- | --- | --- | --- |
| 01_root_core | 4 | 1391 | Root README, HOW_TO_RUN, AGENTS, and CHANGELOG entry points. |
| 02_current_auth_evidence | 2 | 106 | Current auth artifact/evidence guidance plus compatibility pointer. |
| 03_auth_flow_reference | 1 | 72 | Auth/provider verification reference docs now canonical under `docs/20_architecture_and_specs/auth/`. |
| 04_current_status_snapshots | 17 | 944 | Status snapshots; verify against code/evidence; includes Slice 11 root-level and Slice 12 categorized status snapshots plus compatibility pointers. |
| 05_vision_and_target_specs | 8 | 534 | Target architecture/product specs; includes Slice 13 canonical specs plus compatibility pointers. |
| 06_backlog_and_active_task_prompts | 15 | 758 | TODOs, backlog, active task prompts, including Slice 9 TODO docs and Slice 10 category backlog docs with compatibility pointers. |
| 07_historical_task_docs_archive | 38 | 2606 | Historical task archive, archived documentation-refactor status logs, plus compatibility pointers. |
| 08_audits_and_migration_reports | 5+ | 1340+ | Audits, migration snapshots, documentation consistency reports, current project status inventory, and OpenSpec/docs coverage grading. |
| 09_documentation_indexes_and_reference | 9 | 918+ | Legacy indexes/reference docs, including compatibility pointers and the A/B/D card-button audit pointer. |
| 13_operator_runbooks | 1 | 115 | Operator-facing runbooks moved into docs/10_runbooks. |
| 10_tool_docs_cronemulator | 5 | 319 | CronEmulator tool docs. |
| 11_tool_docs_network_scan_dirty | 4 | 173 | Network-scan submodule/tool docs; audit separately. |
| 12_test_data_docs | 1 | 41 | Test-data docs. |


## Goal 4 current media pipeline docs — 2026-05-28 12:28 EEST

| path | kind | authority | topics | note |
| --- | --- | --- | --- | --- |
| docs/10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md | runbook | operator_checklist | media_pipeline, pc_runtime, verification | PC/runtime stage checklist for evidence capture before filling subjective assessment columns. |
| docs/00_current_truth/MEDIA_PIPELINE_IMPLEMENTATION_STATUS_20260528.md | current_truth | repo_backed_current_truth | media_pipeline, download, index, gps, geocode, queue, playback | Current Goal 4 implementation-status table; subjective assessment column remains pending user PC testing. |
| docs/30_status_snapshots/2026-05-28/GOAL4_MEDIA_PIPELINE_INVENTORY_20260528.md | implementation_status_snapshot | repo_backed_snapshot | media_pipeline, evidence_inventory | Dated evidence map of routes, handlers, schema tables, tests, UI entry points, and docs. |
| docs/30_status_snapshots/2026-05-28/GOAL4_MEDIA_PIPELINE_STAGE_BEHAVIOR_20260528.md | implementation_status_snapshot | repo_backed_snapshot | media_pipeline, stage_behavior | Dated stage-by-stage behavior analysis with inputs, outputs, DB effects, boundaries, and non-goals. |
| docs/30_status_snapshots/2026-05-28/GOAL4_MEDIA_PIPELINE_VERIFICATION_ALIGNMENT_20260528.md | implementation_status_snapshot | repo_backed_snapshot | media_pipeline, verification | Dated mapping from stage claims to Wave D/E and related UI/compatibility tests. |

## Detailed index

| path | loc | title | kind | authority | freshness | group | topics | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AGENTS.md | 38 | Repository Instructions | root_core | source_of_truth_candidate | recent_verify_against_code | 01_root_core | general | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| docs/VIEW_CARD_MODE_CLASSIFICATION.md | 79 | View/card Test Mode vs Real Mode classification | implementation_status_snapshot | static_source_doc_and_user_observation_snapshot | current_latest_baseline | 09_documentation_indexes_and_reference | view_cards, test_mode, real_mode, universal_cards, b2_split | Baseline-specific card classification table covering all views and the B2 Test-only versus Real-only split; verify against code/tests before runtime claims. |
| docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md | 171 | Card/button implementation status audit | implementation_status_snapshot | static_source_doc_and_user_observation_snapshot | current_latest_baseline | 09_documentation_indexes_and_reference | view_a, view_b, view_d, card_buttons, implementation_status, user_observed_status, follow_up_issues | Baseline-specific A/B/D `.card` button/control inventory, status reconciliation, user-observed subjective assessment, and follow-up issue list; use for card/button work, but verify against code/tests before runtime claims. |
| docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md | 185+ | User-observed card status and issues — 2026-05-26 14:57 EEST | implementation_status_snapshot | user_observed_snapshot | current_latest_baseline | 04_current_status_snapshots | view_a, view_b, view_d, subjective_status, follow_up_issues | Dated user-observed A/B/D card/button status snapshot and follow-up issue list; verify against code/tests/runtime evidence before current-truth claims. |
| CHANGELOG.md | 1223 | CHANGELOG | root_core | source_of_truth_candidate | recent_verify_against_code | 01_root_core | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, real_vs_mock, download | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| HOW_TO_RUN.md | 28 | How to Run | root_core | runtime_runbook | recent_verify_against_code | 01_root_core | auth, new_auth, icloudpd, provider, view_a | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| README.md | 123 | Photo Frame Dashboard System | root_core | runtime_runbook | recent_verify_against_code | 01_root_core | auth, new_auth, icloudpd, provider, cron, monitoring, view_a, view_d, download | Root entry point; keep discoverable and link to doc index/freshness matrix. |
| docs/00_current_truth/PROJECT_ISSUES_AND_IMPROVEMENT_GUIDE_20260528.md | 270+ | PF_login / 1234_PF — Main Issues and Improvement Guide | current_truth | evidence_aware_planning_guide | current_latest_baseline | 02_current_auth_evidence | provider_gaps, test_real_separation, workflow, media_pipeline, ui_stability | High-level guide generated from recent chat context and v0.7.15 baseline evidence; use for planning future slices, but verify against code/tests/runtime evidence before implementation. |
| docs/00_current_truth/AUTH_EVIDENCE_PACK.md | 87 | NEW AUTH Evidence Pack | current_truth | evidence_pack_current | current_latest_baseline | 02_current_auth_evidence | auth, new_auth, icloudpd, provider, evidence_pack, download | Canonical current-truth auth artifact-debugging guide; verify code endpoints before execution. |
| docs/AUTH_EVIDENCE_PACK.md | 19 | NEW AUTH Evidence Pack | index_or_table_of_contents | historical_reference | recent_verify_against_code | 02_current_auth_evidence | auth, evidence_pack | Compatibility pointer only; do not add detailed content here. |
| docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | 76 | Implementation Status Update — NEW AUTH Provider Verification UX | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, view_d, download | Canonical dated status snapshot moved in Slice 11; verify against current routes/tests/evidence before runtime claims. |
| docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md | 9 | Compatibility pointer — status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | auth | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/20_architecture_and_specs/reference/LOGGING_STANDARD_CONTRACT.md | 165 | Logging Standard Contract | architecture_or_vision_spec | code_extracted_contract | current_latest_baseline | 05_vision_and_target_specs | logging, observability, request_correlation, redaction, terminal_panels, test_real_separation | Reusable logging contract extracted from current repo evidence; portable to other projects but verify against target architecture before implementation. |
| docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | 72 | NEW AUTH provider verification flow | auth_reference | code_verified_snapshot | recent_verify_against_code | 03_auth_flow_reference | auth, new_auth, icloudpd, provider | Canonical auth/provider reference moved in Slice 14; verify against routes/tests/evidence before making runtime claims. |
| docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md | 9 | NEW AUTH provider verification flow moved | compatibility_pointer | historical_reference | recent_verify_against_code | 03_auth_flow_reference | auth, new_auth, provider | Compatibility pointer to canonical auth-flow reference; keep until old-index replacement/link-retirement slice. |
| docs/30_status_snapshots/2026-05-12/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | 124 | Implementation Goal Status Reconciliation — 2026‑05‑12 | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, download | Canonical dated status snapshot moved in Slice 11; useful but not live truth. |
| docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md | 9 | Compatibility pointer — status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | auth | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | 62 | Runtime Truth Authority Map — 2026‑05‑12 | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, runtime_truth, monitoring | Canonical dated status snapshot moved in Slice 11; useful but not live truth. |
| docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md | 9 | Compatibility pointer — status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | runtime_truth | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/b4_playback_flow_status.md | 67 | B4 Playback Flow Status | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, cron, download | Canonical categorized status snapshot moved in Slice 12; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/b4_playback_flow_status.md | 11 | Compatibility pointer — categorized status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | auth, cron, download | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/button_and_view_verification_status.md | 81 | Button and View Verification Status | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, cron, view_a, view_d, download | Canonical categorized status snapshot moved in Slice 12; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md | 11 | Compatibility pointer — categorized status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | auth, cron, view_a, view_d, download | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/code_verified_dashboard_implementation_status.md | 156 | Code-Verified Dashboard Implementation Status | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, download | Canonical categorized status snapshot moved in Slice 12; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md | 11 | Compatibility pointer — categorized status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_a, view_d, download | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/documented_current_system_state.md | 110 | Documented Current System State | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_d, download | Canonical categorized status snapshot moved in Slice 12; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/documented_current_system_state.md | 11 | Compatibility pointer — categorized status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, cron, view_d, download | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/30_status_snapshots/2026-05-12/known_gaps_and_unresolved_questions.md | 100 | Known Gaps and Unresolved Questions | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, view_d, download | Canonical categorized status snapshot moved in Slice 12; useful but not live truth. |
| docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md | 11 | Compatibility pointer — categorized status snapshot moved | implementation_status_snapshot | historical_reference | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, runtime_truth, view_d, download | Compatibility pointer only; canonical snapshot is in docs/30_status_snapshots/2026-05-12/. |
| docs/categorized/current_implementation_status_docs/main_readme.md | 86 | Current Implementation Status Docs | implementation_status_snapshot | code_verified_snapshot | recent_verify_against_code | 04_current_status_snapshots | auth, new_auth, icloudpd, provider, cron, download | Status snapshot; useful but not live truth. |
| docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md | 91 | Architecture, Runtime, and Recovery Spec | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, provider, cron, download | Canonical vision/spec doc moved in Slice 13; target/spec material, not proof of implementation. |
| docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md | 16 | Compatibility pointer — vision/spec doc moved | index_or_table_of_contents | historical_reference | recent_verify_against_code | 05_vision_and_target_specs | auth, provider, cron, download | Compatibility pointer only; canonical spec is in docs/20_architecture_and_specs/. |
| docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md | 94 | Dashboard, Auth, and Pipeline Spec | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, new_auth, icloudpd, provider, view_a, view_d, download | Canonical vision/spec doc moved in Slice 13; target/spec material, not proof of implementation. |
| docs/categorized/vision_spec_docs/dashboard_auth_pipeline_spec.md | 16 | Compatibility pointer — vision/spec doc moved | index_or_table_of_contents | historical_reference | recent_verify_against_code | 05_vision_and_target_specs | auth, new_auth, icloudpd, provider, view_a, view_d, download | Compatibility pointer only; canonical spec is in docs/20_architecture_and_specs/. |
| docs/categorized/vision_spec_docs/main_readme.md | 62 | Vision Spec Docs - Canonical Set | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, cron | Target/spec material; not proof of implementation. |
| docs/20_architecture_and_specs/product_vision_and_authority.md | 64 | Product Vision and Authority | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, provider | Canonical vision/spec doc moved in Slice 13; target/spec material, not proof of implementation. |
| docs/categorized/vision_spec_docs/product_vision_and_authority.md | 16 | Compatibility pointer — vision/spec doc moved | index_or_table_of_contents | historical_reference | recent_verify_against_code | 05_vision_and_target_specs | auth, provider | Compatibility pointer only; canonical spec is in docs/20_architecture_and_specs/. |
| docs/40_backlog_and_tasks/todo_2026-05-13/3A_cronemulator.txt | 123 | **1. Task Understanding** | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | cron | Canonical backlog/TODO prompt moved in Slice 9; not current truth. |
| _TODO_13_05_26/3A_cronemulator.txt | 7 | Compatibility pointer — historical TODO moved | backlog_or_task_prompt | backlog | recent_verify_against_code | 06_backlog_and_active_task_prompts | cron | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/todo_2026-05-13/. |
| docs/40_backlog_and_tasks/todo_2026-05-13/D_monitoring_view.txt | 122 | 1. Task Understanding | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, runtime_truth, cron, monitoring, view_a, view_d, download | Canonical backlog/TODO prompt moved in Slice 9; not current truth. |
| _TODO_13_05_26/D_monitoring_view.txt | 7 | Compatibility pointer — historical TODO moved | backlog_or_task_prompt | backlog | recent_verify_against_code | 06_backlog_and_active_task_prompts | monitoring, view_d | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/todo_2026-05-13/. |
| _TODO_13_05_26/F_page.txt | 188 | Use this as the **GPT-5.5 orchestrator prompt**: | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, icloudpd, runtime_truth, download | Backlog task prompt intentionally not moved because it is an ignored dirty/unrelated file for this workflow. |
| docs/40_backlog_and_tasks/todo_2026-05-13/marked_for_removal.md | 54 | Marked For Removal | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, icloudpd, view_a, download | Canonical backlog/TODO prompt moved in Slice 9; not current truth. |
| _TODO_13_05_26/marked_for_removal.md | 7 | Compatibility pointer — historical TODO moved | backlog_or_task_prompt | backlog | recent_verify_against_code | 06_backlog_and_active_task_prompts | auth, view_a | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/todo_2026-05-13/. |
| docs/40_backlog_and_tasks/active_workflow/slice_8_9_route_selection.md | 27 | Slice 8 and Slice 9 Route Selection | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, provider | Canonical active workflow planning note moved in Slice 17; not current truth. |
| docs/active_workflow_docs/slice_8_9_route_selection.md | 8 | Compatibility pointer — Slice 8 and Slice 9 Route Selection | index_or_table_of_contents | historical_reference | medium_recent_reference | 09_documentation_indexes_and_reference | auth, provider | Compatibility pointer to canonical active workflow note. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/active_implementation_backlog.md | 66 | Active Implementation Backlog | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, new_auth, provider, runtime_truth, view_a, view_d, download | Canonical backlog category doc moved in Slice 10; not current implementation truth. |
| docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md | 8 | Compatibility pointer — backlog category doc moved | backlog_or_task_prompt | backlog | recent_verify_against_code | 06_backlog_and_active_task_prompts | auth, new_auth, provider, runtime_truth, view_a, view_d, download | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/task_documentation_still_to_implement/. |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | 52 | Task Category: Documentation Still To Implement | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth | Backlog/task prompt; not current truth. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | 41 | Rejected Or Superseded Tasks | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth | Canonical backlog category doc moved in Slice 10; not current implementation truth. |
| docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md | 8 | Compatibility pointer — backlog category doc moved | backlog_or_task_prompt | backlog | recent_verify_against_code | 06_backlog_and_active_task_prompts | auth | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/task_documentation_still_to_implement/. |
| docs/40_backlog_and_tasks/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | 47 | Verification And Reconciliation Tasks | backlog_or_task_prompt | backlog | medium_recent_reference | 06_backlog_and_active_task_prompts | auth, new_auth | Canonical backlog category doc moved in Slice 10; not current implementation truth. |
| docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md | 8 | Compatibility pointer — backlog category doc moved | backlog_or_task_prompt | backlog | recent_verify_against_code | 06_backlog_and_active_task_prompts | auth, new_auth | Compatibility pointer only; canonical file is in docs/40_backlog_and_tasks/task_documentation_still_to_implement/. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_dashboard-transit-terminal.md | 64 | Task Doc — Dashboard Transit Terminal + Single Gateway | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | monitoring, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-controls-inspect-mode.md | 232 | Task Doc — Explain Controls Inspect Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_explain-values-source-mode.md | 224 | Task Doc — Explain Values Source Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | view_a | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_runtime-backend-foundation.md | 374 | Task Doc — Runtime Backend Foundation | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, icloudpd, runtime_truth, view_a, view_d, download | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-backend-status-mode.md | 276 | Task Doc — Show Backend Status Inspection Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_show-real-vs-mock-mode.md | 258 | Task Doc — Show Real vs Mock Inspection Mode Button | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/2026-04-20_view-e-database-viewer.md | 445 | Task Doc — View E Database Viewer | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a, view_d | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/README.md | 44 | Task Docs | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth | Historical task doc; canonical archive path; provenance only. |
| docs/90_archive/task_docs_2026-04-20/_TABLE_OF_CONTENTS.md | 42 | Task Docs Table of Contents | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, view_a, real_vs_mock | Historical task doc; canonical archive path; provenance only. |
| docs/50_audits_and_migrations/PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md | 389 | PF_login project status, implementation coverage, OpenSpec coverage, and endpoint inventory — 2026-06-11 | audit_or_migration_report | current_status_analysis | current_latest_baseline | 08_audits_and_migration_reports | status, goals, implementation, openspec, endpoints, commands, proofs, risks | Current v0.8.33 structured analysis report for the v0.8.32 baseline; documentation-only, no runtime behavior changed. |
| docs/50_audits_and_migrations/DOCS_OPENSPEC_COVERAGE_GRADING_AUDIT_20260616.md | 200+ | PF_login documentation and OpenSpec coverage grading audit - 2026-06-16 | audit_or_migration_report | historical_reference | recent_verify_against_code | 08_audits_and_migration_reports | status, goals, implementation, openspec, docs, proofs, risks, v1 | Dated v0.8.86.a documentation/OpenSpec coverage grading audit; includes local v1 readiness BLOCKED result and proof README drift fix context. |
| docs/50_audits_and_migrations/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | 320 | Type Function Audit and Migration Plan | audit_or_migration_report | historical_reference | medium_recent_reference | 08_audits_and_migration_reports | auth, icloudpd, provider, runtime_truth, cron, download | Canonical audit/migration doc moved in Slice 15; recheck before using as implementation truth. |
| docs/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md | 9 | Compatibility pointer — audit/migration doc moved | audit_or_migration_report | historical_reference | recent_verify_against_code | 08_audits_and_migration_reports | auth, icloudpd, provider, runtime_truth, cron, download | Compatibility pointer only; canonical file is in docs/50_audits_and_migrations/. |
| docs/50_audits_and_migrations/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | 52 | Type Function Migration Closure Audit | audit_or_migration_report | historical_reference | medium_recent_reference | 08_audits_and_migration_reports | auth, provider, view_d | Canonical audit/migration doc moved in Slice 15; recheck before using as implementation truth. |
| docs/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md | 9 | Compatibility pointer — audit/migration doc moved | audit_or_migration_report | historical_reference | recent_verify_against_code | 08_audits_and_migration_reports | auth, provider, view_d | Compatibility pointer only; canonical file is in docs/50_audits_and_migrations/. |
| docs/50_audits_and_migrations/placeholder_implementations.md | 381 | Placeholder Implementation Audit | audit_or_migration_report | historical_reference | medium_recent_reference | 08_audits_and_migration_reports | auth, provider, runtime_truth, cron, monitoring, view_a, real_vs_mock, download | Canonical audit/migration doc moved in Slice 15; recheck before using as implementation truth. |
| placeholder_implementations.md | 9 | Compatibility pointer — audit/migration doc moved | audit_or_migration_report | historical_reference | recent_verify_against_code | 08_audits_and_migration_reports | auth, provider, runtime_truth, cron, monitoring, view_a, real_vs_mock, download | Compatibility pointer only; canonical file is in docs/50_audits_and_migrations/. |
| docs/90_archive/reference_material_2026-05-10/archive_and_reference_material.md | 52 | Archive and Reference Material | historical_task_archive | historical_reference | historical_reference_only | 07_historical_task_docs_archive | auth, runtime_truth | Canonical reference/archive orientation moved in Slice 17; not current truth. |
| docs/categorized/other_documentation/archive_and_reference_material.md | 8 | Compatibility pointer — Archive and Reference Material | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth, runtime_truth | Compatibility pointer to canonical archive/reference material. |
| docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md | 493 | Default Project Settings and Elements | architecture_or_vision_spec | target_spec | medium_recent_reference | 05_vision_and_target_specs | auth, real_vs_mock | Canonical reusable project settings checklist moved in Slice 17; reference/spec material, not implementation proof. |
| docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md | 8 | Compatibility pointer — Default Project Settings and Elements | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth, real_vs_mock | Compatibility pointer to canonical reference/spec checklist. |
| docs/10_runbooks/documentation_workflow_and_inventory.md | 64 | Documentation Workflow and Inventory | runbook | runtime_runbook | recent_verify_against_code | 10_runbooks | auth | Canonical documentation workflow/inventory runbook moved in Slice 17. |
| docs/categorized/other_documentation/documentation_workflow_and_inventory.md | 8 | Compatibility pointer — Documentation Workflow and Inventory | index_or_table_of_contents | historical_reference | recent_verify_against_code | 09_documentation_indexes_and_reference | auth | Compatibility pointer to canonical documentation workflow runbook. |
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

## Archived documentation-refactor status logs

Estonian timestamp: 2026-05-30 17:44 EEST

The old root-level `docs/IMPLEMENTATION_STATUS_DOC_*.md` files and `docs/IMPLEMENTATION_STATUS_AI_DOC_ENTRYPOINT_20260525_0236_EEST.md` are now archived under `docs/90_archive/documentation_refactor_status_2026-05-25/`.

| path | kind | authority | freshness | note |
| --- | --- | --- | --- | --- |
| docs/90_archive/documentation_refactor_status_2026-05-25/README.md | historical_task_archive | historical_reference | historical_reference_only | Archive catalog for documentation-refactor slice status logs removed from active `docs/` root navigation. |
| docs/90_archive/documentation_refactor_status_2026-05-25/IMPLEMENTATION_STATUS_AI_DOC_ENTRYPOINT_20260525_0236_EEST.md | historical_task_archive | historical_reference | historical_reference_only | Old AI documentation-entrypoint slice status log; use current governance docs instead. |
| docs/90_archive/documentation_refactor_status_2026-05-25/IMPLEMENTATION_STATUS_DOC_*.md | historical_task_archive | historical_reference | historical_reference_only | Old documentation-refactor slice status logs; redundant with the closure report, link audit, old-index decision, index, and freshness matrix. |

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

## Slice 9 backlog/TODO move

The canonical non-ignored `_TODO_13_05_26` backlog docs now live under `docs/40_backlog_and_tasks/todo_2026-05-13/`. The old moved paths remain as compatibility pointers. `_TODO_13_05_26/F_page.txt` remains untouched because it is an ignored dirty/unrelated file for the current workflow.

## Slice 16 reference/index handling decision

As of 2026-05-25 01:47 EEST, the remaining old category index files are intentionally retained as compatibility navigation rather than moved. The canonical documentation organization remains the target-folder structure plus this index. New content should go to the canonical folders, not the old `docs/categorized/*` index areas.

Retained compatibility indexes:

- `docs/main_readme.md`
- `docs/categorized/current_implementation_status_docs/main_readme.md`
- `docs/categorized/other_documentation/main_readme.md`
- `docs/categorized/task_documentation_still_to_implement/main_readme.md`
- `docs/categorized/vision_spec_docs/main_readme.md`

Decision: keep these files until a later full link-audit slice can either replace them with redirect-only pointers or archive them without breaking older prompts and references.

## Slice 18 link audit and old-index decision

As of 2026-05-25 02:06 EEST, the full documentation link audit is recorded in [`DOC_LINK_AUDIT.md`](DOC_LINK_AUDIT.md), and the retained old-index decision is recorded in [`OLD_INDEX_REPLACEMENT_DECISION.md`](OLD_INDEX_REPLACEMENT_DECISION.md).

- Local Markdown links checked: 125.
- Broken local Markdown links after this slice: 10.
- Old category indexes remain compatibility navigation, not canonical truth.
- New canonical docs should continue to use numbered target folders.

## Slice 19 closure status

Estonian timestamp: 2026-05-25 02:18 EEST

The documentation refactor closure report is now available at [`docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`](DOC_REFACTOR_CLOSURE_REPORT_20260525.md). Use it with this index as the final map for canonical folders, compatibility pointers, and future documentation placement.

For new documentation, prefer the numbered canonical folders and update this index plus [`DOC_FRESHNESS_MATRIX.md`](DOC_FRESHNESS_MATRIX.md).

## Card/button implementation status audit pointer

Estonian timestamp: 2026-05-26 14:25 EEST

Use [`docs/VIEW_CARD_MODE_CLASSIFICATION.md`](VIEW_CARD_MODE_CLASSIFICATION.md) for the all-view Universal/Test-only/Real-only card split table. Use [`docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md`](CARD_BUTTON_IMPLEMENTATION_STATUS.md) when working on View A/B/D `.card` button inventories, labels, actions, card/button implementation-status comparisons, user-observed subjective assessments, or the related follow-up issue list. It is a baseline-specific static/source/docs/user-observation snapshot, not live runtime proof. Code, tests, generated evidence packs, and runtime artifacts still override this document when they conflict.

## Runbooks

- `docs/10_runbooks/windows_full_launcher.md` — Windows full startup launcher: install dependencies, run tests/build, open API/frontend tabs, and open the browser.
Use [`docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md`](30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md) when working specifically from the dated user-observed subjective assessment snapshot or follow-up issue list captured on 2026-05-26 14:57 EEST. It is useful for validation planning, but code, tests, generated evidence packs, and runtime artifacts override it when they conflict.



## Auth logout EPERM fix notes

Estonian timestamp: 2026-05-28 12:48 EEST

Use these documents when investigating the Windows auth logout `EPERM` unit-test failure or the related test isolation fix:

- [`docs/30_status_snapshots/2026-05-28/AUTH_LOGOUT_EPERM_FAILURE_ANALYSIS_20260528.md`](30_status_snapshots/2026-05-28/AUTH_LOGOUT_EPERM_FAILURE_ANALYSIS_20260528.md)
- [`docs/30_status_snapshots/2026-05-28/AUTH_LOGOUT_EPERM_FIX_DESIGN_20260528.md`](30_status_snapshots/2026-05-28/AUTH_LOGOUT_EPERM_FIX_DESIGN_20260528.md)
- [`docs/30_status_snapshots/2026-05-28/AUTH_LOGOUT_EPERM_VERIFICATION_20260528.md`](30_status_snapshots/2026-05-28/AUTH_LOGOUT_EPERM_VERIFICATION_20260528.md)

## Nested payload scroll preservation fix notes

Estonian timestamp: 2026-05-28 13:06 EEST

Use these documents when investigating result payload / JSON panel scroll resets during dashboard re-renders:

- [`docs/30_status_snapshots/2026-05-28/NESTED_PAYLOAD_SCROLL_FAILURE_ANALYSIS_20260528.md`](30_status_snapshots/2026-05-28/NESTED_PAYLOAD_SCROLL_FAILURE_ANALYSIS_20260528.md)
- [`docs/30_status_snapshots/2026-05-28/NESTED_PAYLOAD_SCROLL_FIX_DESIGN_20260528.md`](30_status_snapshots/2026-05-28/NESTED_PAYLOAD_SCROLL_FIX_DESIGN_20260528.md)
- [`docs/30_status_snapshots/2026-05-28/NESTED_PAYLOAD_SCROLL_VERIFICATION_20260528.md`](30_status_snapshots/2026-05-28/NESTED_PAYLOAD_SCROLL_VERIFICATION_20260528.md)


- `docs/30_status_snapshots/2026-05-28/ENV_SINGLE_FILE_TEST_MODE_FIX_20260528.md` - explains the single `.env` Test Mode projection fix and why `test.env` is no longer a runtime source.

- `docs/20_architecture_and_specs/playback_resume_checkpoint_spec.md` — Power-outage playback resume checkpoint contract.

- `docs/10_runbooks/POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md` — Operator checklist for verifying playback resume after outage.


## Native playback runner

- [Native Playback Runner Spec](20_architecture_and_specs/native_playback_runner_spec.md)
- [Native Playback Runner Setup Runbook](10_runbooks/native_playback_runner_setup.md)

| `docs/40_backlog_and_tasks/active_workflow/runtime_gap_implementation_plan_20260530.md` | Backlog / active workflow | Ordered plan for real iCloudPD proof, geocode proof, GPS fallback proof, Raspberry recovery, View C restore, and View D monitor. | Current planning | Use for next slice planning only; not implementation proof. |

- `docs/20_architecture_and_specs/runtime_truth_local_state.md` — current contract for tracked runtime-truth seed vs ignored local mutable `conf/runtime-truth.json`.

- `docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md` — current same-origin HTTP API endpoint contract inventory and route-drift guard.

- `docs/20_architecture_and_specs/openspec/raspberry_local_tool_checker_openspec.md` — Raspberry target `mpv`/`ffmpeg`/`ffprobe` readiness preflight contract and non-claims.

- `docs/proofs/raspberry_tool_checker_proof.md` — proof workflow for `npm run proof:raspberry-tool-checker`.

| docs/20_architecture_and_specs/openspec/production_gps_geocode_placeholder_rules_openspec.md | current_truth | OpenSpec acceptance contract for v1.0 GPS/geocode placeholder rejection. | architecture_or_spec | current_requirements | current | gps, geocode, placeholders, v1.0, production_acceptance | Defines real GPS extraction, address cache provenance, real provider geocode, and deterministic placeholder non-acceptance for v1.0. |

| `docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md` | Planned Raspberry cron worker app-running proof contract; documentation-only in v0.8.44. |

| `docs/proofs/raspberry_worker_evidence_generator_proof.md` | Raspberry worker evidence generator for `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE`; target evidence required. |

| `docs/proofs/raspberry_app_running_chain_proof.md` | Raspberry app-running chain proof: worker evidence -> cron runtime -> app-running status. |

| `docs/proofs/raspberry_app_running_pass_harness_proof.md` | Raspberry app-running PASS harness proof docs. |

| `docs/proofs/raspberry_reboot_evidence_generator_proof.md` | Raspberry reboot evidence generator prepare/collect flow. |

| `docs/proofs/raspberry_cron_preflight_proof.md` | Raspberry managed cron preflight/check/install helper. |

- `docs/20_architecture_and_specs/openspec/raspberry_v1_question_matrix_decisions_openspec.md` — records confirmed/default/open v1 question-matrix decisions.
- `docs/40_backlog_and_tasks/raspberry_v1_plan_from_question_matrix.md` — v1 plan derived from the question matrix and target-pack evidence.
