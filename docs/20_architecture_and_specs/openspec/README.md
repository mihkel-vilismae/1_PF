# OpenSpec documentation

This folder holds forward-looking OpenSpec contracts for implementation areas that are not yet proven by current runtime evidence.

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

