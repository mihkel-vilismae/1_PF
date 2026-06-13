# Documentation Freshness Matrix

Estonian timestamp: 2026-06-13 01:05 EEST

This matrix is a navigation aid for deciding which PF_login documents can be trusted first. Code, tests, generated evidence, and target-machine runtime output remain stronger than prose documentation.

## Current authoritative entry points

| Path | Freshness | Authority note |
|---|---|---|
| `README.md` | current_latest_baseline | Current project overview, proof milestone summaries, and navigation entry point. |
| `HOW_TO_RUN.md` | current_latest_baseline | Current run instructions; active `npm run ...` references are covered by `tests/docsNpmScriptReferences.test.js`. |
| `CHANGELOG.md` | current_latest_baseline | Forward version log through v0.8.42; v0.8.28 is marked superseded by v0.8.29. |
| `docs/table_of_contents.md` | current_latest_baseline | Short operator-friendly map. |
| `docs/proofs/README.md` | current_latest_baseline | Proof vocabulary and complete current `proof:*` npm script index. |
| `docs/proofs/windows_native_proof_milestone_v0.8.26.md` | current_latest_baseline | Consolidated Windows target-machine proof milestone and non-claim boundary. |
| `docs/proofs/windows_reboot_recovery_preflight.md` | current_latest_baseline | Safe preflight contract for future manual Windows reboot/restart proof; no reboot, no Windows Task Scheduler. |
| `docs/proofs/raspberry_tool_checker_proof.md` | current_latest_baseline | Implemented Raspberry tool-checker proof workflow; PASS requires Raspberry-like target and tools. |
| `docs/proofs/raspberry_generated_fixture_proof.md` | current_latest_baseline | Implemented Raspberry generated fixture proof workflow; PASS requires Raspberry-like target, `python3`, `ffprobe`, and validator success. |
| `docs/proofs/raspberry_native_image_playback_proof.md` | current_latest_baseline | Implemented Raspberry native image proof workflow; PASS requires non-override Raspberry-like display target, `mpv`, deterministic fixture, launcher dry-run evidence, and bounded playback process evidence. |
| `docs/proofs/raspberry_native_video_playback_proof.md` | current_latest_baseline | Implemented Raspberry native video proof workflow; PASS requires non-override Raspberry-like display target, `mpv`/`ffprobe`, deterministic fixture, launcher dry-run evidence, metadata evidence, and bounded playback process evidence. |
| `docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md` | current_latest_baseline | Raspberry OS missing-feature OpenSpec; documentation only, no Raspberry runtime proof. |
| `docs/20_architecture_and_specs/openspec/raspberry_cron_worker_runtime_openspec.md` | current_latest_baseline | Raspberry app-running cron worker runtime OpenSpec; documentation only, no runtime cron proof yet. |
| `docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md` | current_latest_baseline | Planned proof contract for three-worker singleton, duplicate-skip, cross-worker independence, stale-lock reclaim, reboot continuation, and restored-power recovery. |
| `docs/20_architecture_and_specs/openspec/raspberry_local_tool_checker_openspec.md` | current_latest_baseline | Raspberry `mpv`/`ffmpeg`/`ffprobe` readiness preflight contract; no playback/recovery claim. |
| `docs/20_architecture_and_specs/openspec/raspberry_project_owned_launcher_openspec.md` | current_latest_baseline | Raspberry project-owned launcher skeleton contract; optional API ownership only, no playback/scheduler/recovery claim. |
| `docs/20_architecture_and_specs/openspec/raspberry_generated_fixture_proof_openspec.md` | current_latest_baseline | Raspberry target generated fixture proof contract; fixture validation only, no playback/scheduler/recovery claim. |
| `docs/20_architecture_and_specs/openspec/raspberry_native_image_playback_proof_openspec.md` | current_latest_baseline | Raspberry target native image playback proof contract; no video/scheduler/recovery claim. |
| `docs/20_architecture_and_specs/openspec/raspberry_native_video_playback_proof_openspec.md` | current_latest_baseline | Raspberry target native video playback proof contract; no scheduler/recovery claim. |
| `docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md` | current_latest_baseline | Same-origin HTTP API route inventory; guarded by `npm run contract:endpoints:check`. |
| `docs/20_architecture_and_specs/view_e_validation_hermetic_contract.md` | current_latest_baseline | View E validation hermeticity contract; guarded by `tests/viewEValidationHermetic.test.js`. |
| `docs/50_audits_and_migrations/DOC_CONSISTENCY_AUDIT_20260611.md` | current_latest_baseline | Latest documentation issue registry and recommended next doc/implementation slices. |
| `docs/50_audits_and_migrations/PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md` | current_latest_baseline | Current v0.8.33 structured status report covering goals, implementation coverage, OpenSpec/docs coverage, endpoints/interfaces, proof matrix, issues, and next slices. |

## Current proof/documentation milestones

| Version | Documentation/proof status | Freshness note |
|---|---|---|
| v0.8.24 | Target-machine native Windows video playback PASSED. | Current proof milestone; does not prove Raspberry playback. |
| v0.8.25 | Controlled Windows native recovery PASSED. | Controlled API/process restart only; not OS reboot. |
| v0.8.26 | Proof-owned live Windows scheduler loop PASSED. | Project-owned/CronEmulator-style evidence path; not Windows Task Scheduler. |
| v0.8.27 | Windows proof milestone docs consolidated. | Current proof-status reference. |
| v0.8.28 | Windows Task Scheduler dry-run proof added then superseded. | Historical only; removed from project scope by v0.8.29. |
| v0.8.29 | Windows Task Scheduler removed from project scope. | Current project decision; do not recommend Task Scheduler paths. |
| v0.8.30 | Windows reboot/restart recovery preflight PASSED. | Safe preflight only; no reboot proof. |
| v0.8.31 | Raspberry OS missing-feature OpenSpec added. | Documentation only; no Raspberry runtime proof. |
| v0.8.32 | Documentation consistency audit/fix. | Removes stale proof command references and adds docs-command regression coverage. |
| v0.8.33 | Project status analysis and endpoint inventory report. | Documentation-only report; no runtime behavior changed. |
| v0.8.34 | Runtime proof artifact ignore guard. | `.gitignore` and regression test only; local proof evidence remains uploadable but untracked. |
| v0.8.35 | Task docs TOC drift repair. | Documentation-maintenance only; `npm run task-docs:check` restored to PASS. |
| v0.8.36 | Endpoint contract OpenSpec extraction. | Static same-origin API route inventory plus docs drift guard; no runtime route behavior changed. |
| v0.8.37 | Raspberry local tool checker preflight. | Implemented target-readiness proof runner for `mpv`, `ffmpeg`, and `ffprobe`; no playback/recovery proof claimed. |
| v0.8.38 | Raspberry project-owned launcher skeleton. | Adds conservative dry-run launcher and optional project-owned API start; no playback/scheduler/recovery proof claimed. |
| v0.8.39 | Raspberry generated fixture proof. | Adds target-gated generated fixture validation proof runner; no playback/scheduler/recovery proof claimed. |
| v0.8.40 | Raspberry native image playback proof. | Adds first target-gated native image playback proof; no video/scheduler/recovery proof claimed. |
| v0.8.41 | Hermetic View E validation. | `npm run validate:view-e` uses proof-owned temp env/DB and ignores local `.env`/ambient DB paths. |
| v0.8.42 | Raspberry native video playback proof. | Adds target-gated native video playback proof with launcher dry-run, `ffprobe` metadata, and bounded `mpv` playback evidence; no scheduler/recovery proof claimed. |
| v0.8.43 | v1.0 production GPS/geocode placeholder rejection OpenSpec. | Documentation/test-only acceptance contract; no runtime provider chain behavior changed. |
| v0.8.44 | Raspberry cron worker runtime OpenSpec. | Documentation/test-only app-running contract for active cron plus all three worker lanes; no runtime cron proof claimed. |

## Trust classes

| Freshness | How to use |
|---|---|
| `current_latest_baseline` | Start here. Still verify runtime claims with code/tests/evidence where possible. |
| `recent_verify_against_code` | Useful, but check against current source, tests, or generated evidence. |
| `historical_reference_only` | Provenance only; do not treat as current implementation truth. |
| `compatibility_navigation_only` | Old navigation/pointer docs; follow links to canonical numbered folders. |
| `superseded_scope` | Do not implement from this doc unless project scope is explicitly reversed. |

## Superseded or high-risk docs

| Path / topic | Freshness | Reason |
|---|---|---|
| v0.8.28 Windows Task Scheduler dry-run proof references | `superseded_scope` | Windows Task Scheduler is not part of PF_login project scope as of v0.8.29. |
| `docs/50_audits_and_migrations/placeholder_implementations.md` | `recent_verify_against_code` | Contains older Windows Task Scheduler implementation notes from before the scope decision; verify and do not reuse that path. |
| `docs/categorized/` | `compatibility_navigation_only` | Retained for old links only. |
| `docs/90_archive/` | `historical_reference_only` | Archive/provenance only. |
| `task_docs/` compatibility pointers | `historical_reference_only` | Old task docs; do not use as current truth. |

## Current non-claims to preserve

- No Windows Task Scheduler proof path is part of PF_login.
- No full Windows reboot recovery proof is claimed yet.
- Raspberry native image/video playback is now target-gated by `proof:raspberry-native-image-playback` and `proof:raspberry-native-video-playback`; v0.8.44 defines but does not prove Raspberry cron/systemd/autostart, app-running through all three worker lanes, Raspberry reboot, or Raspberry power-loss recovery.
- No monitor-pixel proof is claimed yet.
- No production iCloud continuation proof is claimed by the Windows proof milestone.
- `tools/mpv/` and `tools/ffmpeg/` are local-only ignored tool bundles and must not be vendored or re-tracked.

| `docs/20_architecture_and_specs/openspec/production_gps_geocode_placeholder_rules_openspec.md` | `current_truth` | v0.8.43 OpenSpec acceptance contract for v1.0 GPS/geocode placeholder rejection; docs/test only until runtime proofs satisfy it. |

| v0.8.49 | Raspberry worker evidence generator. | Generates the evidence file consumed by cron worker runtime proof; incomplete evidence remains blocked. |

| `docs/proofs/raspberry_worker_evidence_generator_proof.md` | current_latest_baseline | Worker evidence generator documentation; no fake worker evidence claims. |

| v0.8.50 | Raspberry app-running PASS chain. | Chains worker evidence generation, cron runtime proof, and app-running status without faking missing target evidence. |
| `docs/proofs/raspberry_app_running_chain_proof.md` | current_latest_baseline | App-running chain proof documentation; target evidence required. |

| v0.8.51 | Real worker status/lock instrumentation. | Adds status/lock evidence for regular and screen workers without claiming product work or screen hardware behavior. |

| v0.8.52 | Raspberry app-running PASS harness. | Adds proof-owned app-running harness; off-target remains blocked and reboot/power-loss remain non-claims. |

| v0.8.53 | Raspberry reboot evidence generator. | Adds prepare/collect evidence flow for manual reboot recovery; no automatic reboot or power-loss claim. |

| v0.8.54 | Scheduler CLI bootstrap repair and Raspberry cron preflight. | Fixes HttpError TDZ/env bootstrap blocker and adds managed cron preflight/install helper. |
