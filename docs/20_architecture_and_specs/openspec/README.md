# OpenSpec documentation

> Current checkpoint: `v0.10.65`. This README was refreshed in the docs/launcher reconciliation pass; code, focused tests, proof artifacts, and runtime evidence override stale prose.

This folder holds OpenSpec contracts, implementation-status trackers, and proof boundaries. Some entries are forward-looking; some record implemented-but-not-live-proven V2 work.

OpenSpec documents in this folder are requirements and proof contracts, not implementation proof. A feature is not considered implemented until code, tests, and generated or target-machine evidence prove the specific behavior.

Current OpenSpec entries:

- [Raspberry OS missing feature OpenSpec](raspberry_os_missing_features_openspec.md)

- [Raspberry cron worker runtime OpenSpec](raspberry_cron_worker_runtime_openspec.md) — defines Raspberry app-running as active cron plus `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker` with singleton, duplicate-skip, cross-worker independence, and stale-lock recovery proof requirements.

- [Endpoint contract inventory OpenSpec](endpoint_contract_inventory_openspec.md) — static inventory of PF_login `METHOD /api/...` routes and boundary notes.

- [Raspberry local tool checker OpenSpec](raspberry_local_tool_checker_openspec.md) — implemented preflight for `mpv`, `ffmpeg`, and `ffprobe` readiness without playback/recovery claims.

- [Raspberry project-owned launcher OpenSpec](raspberry_project_owned_launcher_openspec.md) — launcher skeleton for dry-run evidence and optional API ownership without playback/scheduler/recovery claims.

- [Raspberry generated fixture proof OpenSpec](raspberry_generated_fixture_proof_openspec.md) — target-gated generated fixture validation using `python3` and `ffprobe` without playback/recovery claims.

- [Raspberry native image playback proof OpenSpec](raspberry_native_image_playback_proof_openspec.md) — first target-gated Raspberry native image playback proof using the launcher dry-run boundary and bounded `mpv` command.

- [Raspberry native video playback proof OpenSpec](raspberry_native_video_playback_proof_openspec.md) — target-gated Raspberry native video playback proof using launcher dry-run, `ffprobe` metadata, and bounded `mpv` video playback.
- [Production GPS/geocode placeholder rules OpenSpec](production_gps_geocode_placeholder_rules_openspec.md) — v1.0 acceptance boundary requiring real GPS extraction, cache-first real geocoding, and explicit rejection of deterministic placeholder geocoding as production success.

- [Authentication checkpoint proof OpenSpec](auth_checkpoint_proof_openspec.md) — app-owned sanitized login/session state contract for manual real-provider authentication before downstream download proofs.

- [Debug Page OpenSpec](debug_page_openspec.md) — lightweight Debug page, sidebar/version tracker, pane template, crontab setup, worker debug pane, safety, and proof-boundary contract.

- [Project Completeness Reporting OpenSpec](project_completeness_reporting_openspec.md) — source priority, status enum, proof-artifact, planned-command, Debug docs/runtime split, and percentage rules for overall completeness reports.

- [Dashboard Test/Real Modes OpenSpec](dashboard_test_real_modes_openspec.md) — page-shell contract for the existing startup mode gate, Test Mode vs Real Mode behavior, shared navigation, and safety/non-claim boundaries.

- [Dashboard View A Init Page OpenSpec](dashboard_view_a_init_page_openspec.md) — page-level contract for Verify .env, legacy auth, NEW AUTH, database controls, scheduler controls, and Test Mode-only whole-logic controls.

- [Dashboard View B Test Page OpenSpec](dashboard_view_b_test_page_openspec.md) — page-level contract for B2 Test/Real download separation, B3 pipeline stages, B4 playback selection, and B5 simulation-only screen controls.

- [Dashboard Test/Real Modes 3XACR Review](dashboard_test_real_modes_xacr_review.md) — docs-only review of the OpenSpec coverage added for existing Test Mode and Real Mode pages.

- [Dashboard V2 Mode OpenSpec](dashboard_v2_mode_openspec.md) — historical third startup mode contract; current V2 has nine pages and later B3-B12 implementation notes in the V2 docs below.

- [Dashboard V2 Mode 3+2XACR and 3AXCR Review](dashboard_v2_mode_xacr_review.md) — docs-only multipass review and refined implementation prompt for the planned V2 shell.

- [V2 Operator Menu left sidebar OpenSpec](v2_operator_menu_left_sidebar_openspec.md) — historical six-route sidebar contract; current V2 sidebar has nine top-level rows, governed by `v2_operator_pages_openspec.md` and current tests.

- [V2 Operator Menu left sidebar 6ACR review](v2_operator_menu_left_sidebar_6acr_review.md) — docs-only multipass review that narrows the implementation contract to the six left-sidebar route rows before center-panel block coverage.

- [V2 Operator Menu center panel original items OpenSpec](v2_operator_menu_center_panel_original_openspec.md) — captures the original center-panel/sub-item typed-block contract for the six V2 operator routes, including startup groups, worker stage table, troubleshooting examples, and recovery snapshots. Implemented visually in v0.10.29 as non-executing typed center-panel blocks.

- [V2 Operator Menu center panel original XACR review](v2_operator_menu_center_panel_original_xacr_review.md) — docs-only multipass review of the original center-panel item coverage, risk boundaries, and later implementation prompt.
- [Repo Large-File Containment OpenSpec](repo_large_file_containment_openspec.md) — defines the large-file containment rule for glue-only edits above 1500 LOC, new-file preference for independent feature bodies, CSS/test split guidance, and automated check expectations.

- [Repo Large-File Containment XACR Review](repo_large_file_containment_xacr_review.md) — multipass review and refined prompt for applying the large-file containment policy without changing runtime behavior.

- [V2 Operator Pages OpenSpec](v2_operator_pages_openspec.md) — full V2 page/component/reuse/proof contract for pages `01` through `09`, including implemented Event history/status overlay, Setup/Auth/Startup/Workers/Troubleshooting/Recovery/PIR/Playback placements, `09 REAL PLAYBACK` composition, and live-proof boundaries.

- [V2 Implementation Status](V2_ImplementationStatus.md) — element-by-element status tracker for the V2 implementation and the sync target for the current implementation-status UI overlay.

- [V2 Goal Summary](V2_GoalSummary.md) — faithful summary of the V2 planning intent, requested page placements, component reuse constraint, and final `09 REAL PLAYBACK` path.

- [V2 Issue Register](V2_IssueRegister.md) — known issue/problem register for recovery state, corrupted downloads, PIR signal testing, cron direction, auth fallback, stale-lock verification, and fake-readiness risk.

- [V2 HR Decision Log](V2_HRDecisionLog.md) — answered implementation-planning questions for V2 baseline, code inventory, reuse/extraction, recovery, scheduler, PIR, playback, tests/proofs, reporting, and final `09 REAL PLAYBACK` behavior.
- [V2 Real Playback OpenSpec Coverage 3+2 ACR](../../50_audits_and_migrations/V2_REAL_PLAYBACK_OPENSPEC_COVERAGE_3PLUS2ACR_20260626.md) — audit record for the coverage-hardening pass that added inventory gates, JSON status schema, acceptance criteria, proof matrix, and drift guards.

- [V2 next implementation plan](../../40_backlog_and_tasks/V2_NEXT_IMPLEMENTATION_PLAN_20260626.md) — post-B12 implementation/proof sequence and remaining live-proof gates.
