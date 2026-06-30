# PF_login documentation table of contents

Estonian timestamp: 2026-06-11 18:30 EEST

## Purpose

This table of contents is the short, operator-friendly entry point for the PF_login / 1234_PF documentation set. It complements the detailed inventory in `docs/DOC_INDEX.md` and the authority/freshness guidance in `docs/DOC_FRESHNESS_MATRIX.md`.

Use current-truth docs, code, tests, generated evidence, and runtime output before relying on older snapshots. Archive and compatibility-pointer docs are context only unless a current code/test/evidence check confirms them.

## Root project documents

| Path | Use |
| --- | --- |
| `README.md` | Project overview, run entry points, architecture summary, documentation navigation. |
| `HOW_TO_RUN.md` | Short quickstart only; long run guidance belongs in linked runbooks. |
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
| `docs/10_runbooks/how_to_run_full_reference.md` | Preserved full run reference moved out of root HOW_TO_RUN. |
| `docs/10_runbooks/windows_full_launcher.md` | Full Windows startup workflow. |
| `docs/10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md` | PC/runtime evidence checklist for Download, Index, GPS parser, Geocode, and Queue. |
| `docs/10_runbooks/POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md` | Power-outage recovery verification checklist. |
| `docs/10_runbooks/native_playback_runner_setup.md` | Native playback runner setup. |
| `docs/10_runbooks/gps_metadata_sources.md` | GPS metadata source formats for EXIF, sidecars, filename tokens, and path tokens. |
| `docs/10_runbooks/geocode_provider_activation.md` | Safe geocode provider activation and cache-first verification. |
| `docs/10_runbooks/documentation_workflow_and_inventory.md` | Documentation workflow and inventory rules. |
| `docs/10_runbooks/improve_create_skills_flow_prompt.md` | Reusable 3x2 ACR prompt for extracting/upgrading workflow skills from the current chat. |
| `docs/10_runbooks/voice_ai_transcript_intake.md` | Workflow for extracting safe requirements and proof notes from messy Voice AI transcripts. |
| `docs/10_runbooks/debug_page_runbook.md` | Operator/developer runbook for the planned Debug page, crontab setup, worker debug panes, and safety checks. |
| `docs/10_runbooks/raspberry_project_owned_launcher.md` | Raspberry project-owned launcher skeleton runbook. |
| `docs/10_runbooks/overall_project_completeness_reporting.md` | Source-backed workflow for overall project completeness tables, status handling, and proof honesty. |


## Proof artifacts

| Path | Use |
| --- | --- |
| `docs/proofs/README.md` | Proof artifact overview and status vocabulary. |
| `docs/proofs/proof_artifact_schema.md` | Shared proof JSON schema. |
| `docs/proofs/full_test_suite_stability_proof.md` | Full test suite stability proof workflow. |
| `docs/proofs/real_icloudpd_pipeline_proof.md` | Real iCloudPD pipeline proof workflow. |
| `docs/proofs/geocode_provider_proof.md` | Real geocode provider proof workflow. |
| `docs/proofs/real_download_continuation_proof.md` | Real download continuation/deduplication proof workflow. |
| `docs/proofs/address_display_proof.md` | Deterministic proof that resolved address text reaches playback payloads. |
| `docs/proofs/gps_fallback_proof.md` | Deterministic local GPS fallback proof workflow. |
| `docs/proofs/deterministic_media_pipeline_proof.md` | Deterministic local media pipeline proof workflow. |
| `docs/proofs/raspberry_power_loss_recovery_proof.md` | Raspberry power-loss recovery proof workflow. |
| `docs/proofs/raspberry_tool_checker_proof.md` | Raspberry `mpv`/`ffmpeg`/`ffprobe` target readiness proof workflow. |
| `docs/proofs/native_fullscreen_playback_proof.md` | Native/fullscreen playback boundary proof workflow. |
| `docs/proofs/dirty_shutdown_testing_proof.md` | Test Mode-only dirty-shutdown testing panel and backend guard proof. |
| `docs/proofs/windows_cronemulator_proof.md` | Windows CronEmulator boundary and duplicate-run proof. |
| `docs/proofs/windows_native_proof_milestone_v0.8.26.md` | Consolidated v0.8.26 Windows native proof milestone and non-claim boundary. |
| `docs/proofs/windows_reboot_recovery_preflight.md` | Safe Windows reboot/restart recovery preflight contract; no reboot and no Windows Task Scheduler. |
| `docs/proofs/raspberry_generated_fixture_proof.md` | Raspberry target generated fixture validation proof contract. |
| `docs/proofs/raspberry_native_image_playback_proof.md` | Raspberry target native image playback proof contract. |
| `docs/proofs/raspberry_native_video_playback_proof.md` | Raspberry target native video playback proof contract. |
| `docs/proofs/overall_project_completeness_registry_proof.md` | Static proof that the overall project goal registry is source-backed and proof-honest. |

## Architecture and specs

| Path | Use |
| --- | --- |
| `docs/20_architecture_and_specs/product_vision_and_authority.md` | Product goal and authority boundaries. |
| `docs/20_architecture_and_specs/v2_goals/goals.md` | Authoritative V2 real playback goals: autonomous playback, autonomous recovery, and screen on/off tier-2 goal. |
| `docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md` | V2 pages `01` through `09`, shared components, reuse-first implementation contract, and proof boundaries. |
| `docs/20_architecture_and_specs/openspec/terminal_demo_v2_operator_rc_handoff_openspec.md` | Terminal Demo v2.0 Real Demo Mode operator RC handoff, proof pack, boundaries, and implementation prompt. |
| `docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md` | Element-by-element V2 implementation state tracker synchronized with the planned status overlay. |
| `docs/20_architecture_and_specs/openspec/V2_GoalSummary.md` | Authoritative summary of the V2 planning conversation, requested placements, constraints, and final Real Playback intent. |
| `docs/20_architecture_and_specs/openspec/V2_IssueRegister.md` | Known V2 design issues, unresolved items, and verification gaps. |
| `docs/20_architecture_and_specs/openspec/V2_HRDecisionLog.md` | Operator answers to the V2 implementation-planning question set and current decision source for remaining OpenSpec questions. |
| `docs/50_audits_and_migrations/V2_REAL_PLAYBACK_OPENSPEC_COVERAGE_3PLUS2ACR_20260626.md` | 3+2 ACR audit that expanded V2 OpenSpec coverage before implementation. |
| `docs/20_architecture_and_specs/architecture_runtime_and_recovery_spec.md` | Runtime/recovery architecture. |
| `docs/20_architecture_and_specs/dashboard_auth_pipeline_spec.md` | Dashboard/auth pipeline architecture. |
| `docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md` | NEW AUTH provider verification reference. |
| `docs/20_architecture_and_specs/openspec/auth_checkpoint_proof_openspec.md` | Authentication checkpoint state contract for manual/provider login proof before downstream real-provider tests. |
| `docs/20_architecture_and_specs/openspec/debug_page_openspec.md` | Debug page route/sidebar/version tracker/pane/crontab/worker OpenSpec and proof boundaries. |
| `docs/20_architecture_and_specs/media_pipeline_provider_interfaces.md` | GPS/geocode provider contracts and chain rules. |
| `docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md` | Reverse-geocode provider registry/config behavior. |
| `docs/20_architecture_and_specs/native_playback_runner_spec.md` | Native playback runner contract. |
| `docs/20_architecture_and_specs/test_mode_whole_logic_emulator_contract.md` | Test Mode whole-logic emulator UI and safety contract. |
| `docs/20_architecture_and_specs/view_e_validation_hermetic_contract.md` | View E validation hermeticity contract for proof-owned temporary env/DB behavior. |
| `docs/20_architecture_and_specs/playback_resume_checkpoint_spec.md` | Playback checkpoint save/read/clear contract. |
| `docs/20_architecture_and_specs/runtime_truth_local_state.md` | Runtime-truth seed vs local mutable file contract. |
| `docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md` | Raspberry OS OpenSpec for missing launcher, tooling, playback, scheduler, recovery, power-loss, and evidence-export features. |
| `docs/20_architecture_and_specs/openspec/raspberry_local_tool_checker_openspec.md` | Raspberry tool-readiness preflight contract and non-claims. |
| `docs/20_architecture_and_specs/openspec/raspberry_project_owned_launcher_openspec.md` | Raspberry project-owned launcher skeleton contract and non-claims. |
| `docs/20_architecture_and_specs/openspec/raspberry_generated_fixture_proof_openspec.md` | Raspberry target generated fixture validation contract and non-claims. |
| `docs/20_architecture_and_specs/openspec/raspberry_native_image_playback_proof_openspec.md` | Raspberry target native image playback contract and non-claims. |
| `docs/20_architecture_and_specs/openspec/raspberry_native_video_playback_proof_openspec.md` | Raspberry target native video playback contract and non-claims. |
| `docs/20_architecture_and_specs/openspec/production_gps_geocode_placeholder_rules_openspec.md` | v1.0 production GPS/geocode acceptance boundary: real GPS extraction, cache-first real geocoding, and placeholder rejection. |
| `docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md` | Same-origin HTTP API endpoint contract inventory and drift guard. |
| `docs/20_architecture_and_specs/openspec/README.md` | OpenSpec area overview and documentation-only boundary. |
| `docs/20_architecture_and_specs/openspec/project_completeness_reporting_openspec.md` | Source priority, status enum, proof-artifact, planned-command, Debug split, and percentage rules for overall project completeness reports. |
| `docs/20_architecture_and_specs/reference/LOGGING_STANDARD_CONTRACT.md` | Logging standard contract. |
| `docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md` | Default project settings and reusable UI/runtime elements. |
| `docs/20_architecture_and_specs/reference/project_status_enum_registry.md` | Normalized status and proof-command-state vocabulary for completeness reporting. |

## Status snapshots

| Path | Use |
| --- | --- |
| `docs/30_status_snapshots/` | Dated status snapshots. Use for history and evidence trails; verify against current code/tests before current claims. |

## Backlog, tasks, and active workflow

| Path | Use |
| --- | --- |
| `docs/40_backlog_and_tasks/terminal_demo_v2_implementation_handoff.md` | Implementation handoff for turning v1.9.0 Terminal Demo into v2.0.0 operator RC. |
| `docs/40_backlog_and_tasks/active_workflow/` | Active workflow notes and slice plans. |
| `docs/40_backlog_and_tasks/active_workflow/runtime_gap_implementation_plan_20260530.md` | Ordered plan for remaining runtime proof and implementation gaps. |
| `docs/40_backlog_and_tasks/task_documentation_still_to_implement/active_implementation_backlog.md` | Backlog items; verify against current implementation before acting. |
| `docs/40_backlog_and_tasks/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md` | Verification/reconciliation tasks. |
| `docs/40_backlog_and_tasks/task_documentation_still_to_implement/rejected_or_superseded_tasks.md` | Rejected/superseded items. |
| `docs/40_backlog_and_tasks/debug_page_goal_registry.md` | Active Debug page goal registry for regularly adding implementation goals, proof expectations, and risk notes. |

## Audits and migrations

| Path | Use |
| --- | --- |
| `docs/50_audits_and_migrations/placeholder_implementations.md` | Placeholder audit. Some entries may need reconciliation against current code. |
| `docs/50_audits_and_migrations/TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md` | Type/function migration plan. |
| `docs/50_audits_and_migrations/TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md` | Type/function migration closure audit. |
| `docs/50_audits_and_migrations/GATE_A_DOCUMENTATION_AUDIT_20260531.md` | Gate A documentation audit and inventory (2026‑05‑31). |
| `docs/50_audits_and_migrations/MAIN_GOAL_IMPLEMENTATION_STATUS_VERIFICATION_20260531.md` | Corrective main-goal implementation-status verification (2026‑05‑31). |
| `docs/50_audits_and_migrations/DOC_CONSISTENCY_AUDIT_20260611.md` | Current documentation consistency audit, stale-reference cleanup, and next-slice recommendations. |
| `docs/50_audits_and_migrations/PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md` | Current v0.8.33 project status, implementation coverage, OpenSpec coverage, endpoint/interface inventory, proof matrix, issues, and next slices. |
| `docs/50_audits_and_migrations/DOCS_OPENSPEC_COVERAGE_GRADING_AUDIT_20260616.md` | Dated v0.8.86.a documentation/OpenSpec coverage grading audit, v1 status table, and next documentation-governance fixes. |

## Archive and compatibility pointers

| Path | Use |
| --- | --- |
| `docs/90_archive/` | Historical material. Do not treat as current implementation truth. |
| `docs/categorized/` | Compatibility navigation from the older categorized layout. |
| Root-level moved-doc pointers under `docs/` | Compatibility pointers only unless explicitly listed as current above. |


## Root launcher and script organization — 2026-06-25

| Path | Use |
| --- | --- |
| `full_windows_runner_status.cmd` | Preferred root Windows terminal GUI launcher. Shows Start All, Stop All, Refresh Status, and status table. |
| `start_scripts/README.md` | Current map for moved Windows/Raspberry/packaging helper scripts. |
| `docs/10_runbooks/windows_runner_status_terminal_ui.md` | Operator runbook for the Windows terminal GUI runner/status menu. |
| `docs/50_audits_and_migrations/root_script_and_doc_placement_xacr_20260625.md` | Cleanup report for root script/doc placement. |

## Scripts, config, and logs

| Path | Use |
| --- | --- |
| `start_scripts/windows/start_win_full.cmd` / `start_scripts/start_win_full.ps1` | Full Windows launcher with API, frontend, and component-status monitor tabs/windows. |
| `start_raspberry_full.sh` / `start_scripts/start_raspberry_full.sh` | Raspberry project-owned launcher skeleton; dry-run by default, optional API start only. |
| `start_scripts/windows/start_win.cmd` | Lighter Windows startup path with API, frontend, and component-status monitor terminals. |
| `start_scripts/start_component_status.ps1` | API/dashboard running-status and version monitor for Windows launchers. |
| `conf/runtime-truth.seed.json` | Committed neutral runtime-truth seed used at dashboard boot. |
| `conf/runtime-truth.json` | Ignored local runtime-truth state written during app use. |
| `example.env` | Environment key template, including geocode provider settings. |
| `logs/` | Runtime logs when generated locally. Do not commit secrets. |
| `tools/` | Tool-local utilities such as CronEmulator and repo-update helpers. |
| `generated_test_data/README.md` | Proof-only generated media fixture inventory, including repaired synthetic video fixtures. |
| `tools/verify_generated_test_data.py` | Deterministic generated fixture validation script. |
| `docs/VIDEO_FIXTURE_REPAIR_HANDOFF_20260603.md` | Handoff and repair context for generated video fixture mismatch. |

| `docs/20_architecture_and_specs/openspec/raspberry_cron_worker_runtime_openspec.md` | Raspberry cron worker app-running contract and proof boundary. |

| `docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md` | Planned three-worker singleton/recovery proof contract for Raspberry app-running. |

| `docs/proofs/raspberry_worker_evidence_generator_proof.md` | Raspberry worker evidence generator proof docs. |

| `docs/proofs/raspberry_app_running_chain_proof.md` | Raspberry app-running PASS chain proof docs. |

| `docs/proofs/raspberry_app_running_pass_harness_proof.md` | Raspberry app-running PASS harness proof docs. |

| `docs/proofs/raspberry_reboot_evidence_generator_proof.md` | Raspberry reboot evidence generator proof docs. |

| `docs/proofs/raspberry_cron_preflight_proof.md` | Raspberry managed cron preflight proof docs. |


## v0.8.55 Raspberry install/runtime repair docs

- `docs/proofs/raspberry_executable_permissions_proof.md` — checks/repairs repo-owned executable bits after ZIP extraction.
- `docs/proofs/raspberry_env_preflight_proof.md` — creates/checks `.env` from `example.env` before playback worker runtime.


## v0.8.56 Raspberry v1.0 release-gate docs

- `docs/20_architecture_and_specs/openspec/raspberry_v1_release_gate_matrix_openspec.md` — answered matrix and required/non-blocking release gates.
- `docs/proofs/raspberry_v1_readiness_proof.md` — proof-artifact evaluator for current Raspberry v1.0 readiness.


## v0.8.57 Raspberry worker startup smoke docs

- `docs/proofs/raspberry_worker_startup_smoke_proof.md` — proof that all three scheduler worker commands can start cleanly on Raspberry after preflight repair.

| `docs/50_audits_and_migrations/DEBUG_PAGE_DOCS_2ACR_REVIEW_20260617.md` | Second-pass 2ACR review of Debug page OpenSpec/runbook/goal-registry coverage and non-claims. |

| `docs/40_backlog_and_tasks/overall_project_goal_registry.md` | Canonical active registry for project-completeness reports across v1 gates, Debug goals, and active backlog items. |
