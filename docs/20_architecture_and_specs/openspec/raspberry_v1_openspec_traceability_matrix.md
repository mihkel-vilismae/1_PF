# Raspberry v1 OpenSpec traceability matrix

Status: active traceability contract  
Introduced: v0.8.75

## Purpose

This matrix links v1 release gates, question-matrix decisions, OpenSpec documents, proof commands, and current proof status. It exists to stop later slices from adding product behavior without a matching contract/proof boundary.

## Traceability matrix

| V1 gate | Question IDs | Primary OpenSpec | Proof command / artifact | Current status |
|---|---|---|---|---|
| `raspberry_target_readiness` | n/a | `raspberry_local_tool_checker_openspec.md`, `raspberry_generated_fixture_proof_openspec.md` | `npm run proof:raspberry-tool-checker`, `npm run proof:raspberry-generated-fixtures` | PROVEN on latest Raspberry bundle |
| `install_runtime_preflight` | n/a | `raspberry_project_owned_launcher_openspec.md` | `npm run proof:raspberry-executable-permissions`, `npm run proof:raspberry-env-preflight` | PROVEN on latest Raspberry bundle |
| `real_icloud_media_source` | I1, I2, I3 | `raspberry_icloudpd_discovery_preflight_openspec.md` | `npm run proof:raspberry-icloudpd-preflight`, later `npm run proof:real-icloudpd` | SCAFFOLDED, NOT RUN on Raspberry |
| `real_gps_geocode` | G1, G2, G3 | `raspberry_gps_geocode_provider_chain_openspec.md` | `npm run proof:real-geocode-provider-chain` | SCAFFOLDED, NOT RUN with real provider |
| `regular_worker_product_pipeline` | R1, R2, R3 | `raspberry_icloud_first_regular_worker_pipeline_openspec.md` | `npm run proof:raspberry-regular-stage-worker-product-pipeline` | CONTRACTED, product work NOT PROVEN |
| `playback_native_display` | A1 | `raspberry_native_image_playback_proof_openspec.md`, `raspberry_native_video_playback_proof_openspec.md` | `npm run proof:raspberry-native-image-playback`, `npm run proof:raspberry-native-video-playback` | PROVEN on latest Raspberry bundle |
| `address_overlay_device_display` | A1, A2, A3 | `raspberry_address_overlay_device_proof_openspec.md` | `npm run proof:raspberry-address-overlay-device-display` | SCAFFOLDED, observation NOT RUN |
| `cron_app_running` | S2 | `raspberry_cron_worker_runtime_openspec.md` | `npm run proof:raspberry-app-running-target-pack` | PARTIAL; v0.8.68 ordering repair needs Raspberry rerun |
| `dashboard_status_view` | D1, D2 | `raspberry_dashboard_status_view_openspec.md` | status contract helpers; future dashboard proof | CONTRACTED, UI proof NOT RUN |
| `screen_worker_non_blocking` | S1, S2 | `raspberry_screen_worker_non_blocking_openspec.md` | future non-blocking proof | CONTRACTED, dedicated proof NOT RUN |
| `docs_reconciled` | DOC1, DOC2 | this matrix plus docs audit proof | `npm run proof:docs-reconciliation-audit` | PRE-PASS PROVEN, final v1 reconciliation NOT PROVEN |

## Required rule for future slices

Every future v1 slice must update at least one of:

- the relevant OpenSpec document;
- the proof command/artifact listed in this matrix;
- this traceability matrix current status;
- the v1 readiness gate evaluator.

## Non-claims

- Traceability does not prove runtime behavior.
- A scaffolded proof command is not a passed proof.
- A Windows-safe rehearsal is not a Raspberry/iCloud/display proof.
