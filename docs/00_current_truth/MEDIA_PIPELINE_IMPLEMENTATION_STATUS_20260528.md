# Media Pipeline Implementation Status — 2026-05-28 12:24 EEST

Latest review timestamp: 30.05.2026, 21:12 EEST

## ACR slice record

### Original instruction
Run Goal 4 workflow slice 4: create/update the implementation-status table for the media pipeline stages.

### Draft prompt
Using the Goal 4 inventory, behavior analysis, and verification alignment, create the final implementation-status table for Download, Index, GPS parser, Geocode, Queue, and Playback Select.

### Analyze
This document should be the operator-facing current-truth table. It must compare docs status against code/tests status, preserve evidence, and leave the user subjective assessment column empty until PC testing.

### Critique
Do not fill the user's subjective assessment without user input. Do not claim production geocoding or fully proven real iCloudPD download. Include evidence and gaps so future changes are accountable.

### Refined prompt run
Create a current-truth media pipeline implementation-status table for Goal 4. Include stage, implementation status according to docs, implementation status according to code/tests, user's subjective assessment, evidence, and gaps/risks. Base claims on repo evidence from slices 1–3 and leave subjective assessment pending PC testing.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| Implemented / covered | Current code and tests directly support the claim. |
| Implemented / bounded | Code exists and is tested, but a known scope limit must remain visible. |
| Partial | Some code or docs exist, but important production or integration work remains. |
| Pending user assessment | Requires Mihkel's PC/runtime observation before filling the subjective column. |
| PC/runtime checklist | Use `docs/10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md` to capture evidence before updating the subjective assessment column. |

## Pipeline status table

| Stage | Implementation status according to docs | Implementation status according to code/tests | Your subjective assessment | Evidence | Gaps / risks |
| --- | --- | --- | --- | --- | --- |
| Download | Implemented / bounded. Existing docs and UI describe B3.1 mock/generated download and a separate Real Mode iCloudPD download route. | Implemented / covered for deterministic mock/generated download. `tests/waveD.e2e.test.js` proves fixture copy into `DOWNLOAD_DIR`; `tests/waveE.step5.test.js` proves orchestration success and controlled missing-source failure at download; `tests/viewB.buttonWorkflow.test.js` proves View B route wiring. Real iCloudPD download route exists but is separately auth-gated. | Pending user PC testing. | `server/index.ts` `runtimeDownloadRunHandler`, `runtimeRealDownloadRunHandler`; `tests/waveD.e2e.test.js`; `tests/waveE.step5.test.js`; `tests/runtimeRealDownloadAuthHandoff.slice1.test.js`; `dashboard/views/testView.ts`. | Mock path is not production iCloudPD. Real download depends on verified NEW AUTH/iCloudPD session and is not the same as deterministic Wave D/E coverage. |
| Index | Implemented. Docs/UI describe B3.2 as `POST /api/runtime/index/run`. | Implemented / covered. Stage 2 scans downloaded media, writes canonical assets/variants, and seeds GPS queue. Wave D verifies canonical rows/variant paths and inserted counts. | Pending user PC testing. | `server/database/databaseService.ts` `runStage2IndexRegister`; `server/scripts/sqlite_admin.py stage2_index_register`; `schema.sql`; `tests/waveD.e2e.test.js`; `tests/waveE.step5.test.js`. | Coverage is strongest for supported fixture media and configured download paths. New media formats/extensions need explicit future tests. |
| GPS parser | Implemented / bounded. Docs/UI describe B3.3 as `POST /api/runtime/gps/run`; provider-interface docs now describe EXIF-first local/offline fallback methods. | Implemented / covered. Stage 3 reads queued canonical files through the `GpsProvider` chain: EXIF first, then JSON sidecar, XMP sidecar, text sidecar, filename coordinate tokens, and path coordinate tokens. Successful parses mark GPS-found rows and seed geocode queue; missing/malformed metadata remains an honest no-result. | Pending user PC testing. | `server/database/databaseService.ts` `runStage3ProcessGpsQueue`; `server/scripts/sqlite_admin.py stage3_process_gps_queue`; `server/scripts/media_pipeline/gps_exif_provider.py`; `server/scripts/media_pipeline/gps_sidecar_providers.py`; `server/scripts/media_pipeline/provider_chain.py`; `tests/mediaPipelineProviderContracts.test.js`; `tests/waveD.e2e.test.js`; `tests/waveE.step5.test.js`; `docs/20_architecture_and_specs/media_pipeline_provider_interfaces.md`; `docs/10_runbooks/gps_metadata_sources.md`. | Automated tests cover provider fallback behavior, but broad real-library evidence is still pending. HEIC/video/tool-specific metadata should be added only after fixture/runtime evidence identifies the exact source format. |
| Geocode | Implemented / bounded. Docs/UI should now describe B3.4 as a cache-first reverse-geocode provider chain with network/account providers registered but disabled by default, ending in the deterministic placeholder fallback unless disabled. | Implemented / covered for cache-first provider chain and deterministic placeholder fallback. Stage 4 uses `ReverseGeocodeProvider`, checks `address_cache` before other providers, keeps network providers behind global and provider-specific gates, writes sanitized provider results, and preserves existing placeholder behavior by default. | Pending user PC testing. | `server/database/databaseService.ts` `runStage4ProcessGeocodeQueue`; `server/scripts/sqlite_admin.py stage4_process_geocode_queue`; `server/scripts/media_pipeline/geocode_provider_registry.py`; `server/scripts/media_pipeline/geocode_http_providers.py`; `server/scripts/media_pipeline/geocode_address_cache_provider.py`; `server/scripts/media_pipeline/geocode_placeholder_provider.py`; `server/scripts/media_pipeline/geocode_config.py`; `tests/mediaPipelineProviderContracts.test.js`; `tests/waveD.e2e.test.js`; `tests/waveE.step5.test.js`; `docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md`; `docs/10_runbooks/geocode_provider_activation.md`. | Production reverse geocoding is not enabled by default and is not runtime-proven here. Each network provider still needs safe activation evidence, rate-limit/terms awareness, sanitized logging review, and address-quality validation. |
| Queue | Implemented. Docs/UI describe B3.5 as `POST /api/runtime/queue/prepare`. | Implemented / covered. Stage 5 inserts only eligible geocoded assets with usable variants and skips ineligible assets with structured reasons. Wave D verifies `already_queued`, `geocode_not_ready`, `missing_variant`, and `missing_file_path` behavior and idempotent second run. | Pending user PC testing. | `server/database/databaseService.ts` `runStage5PrepareQueue`; `server/scripts/sqlite_admin.py prepare_slideshow_queue`; `tests/waveD.e2e.test.js`; `tests/viewB.buttonWorkflow.test.js`. | Eligibility rules are intentionally strict. Future queue policies such as prioritization, retention, or unresolved-asset policy must update tests/docs together. |
| Playback Select | Implemented / bounded. Docs/UI describe B4 as backend playback selection, not rendering. Playback view docs cover browser display separately. | Implemented / covered. Stage 6 selects a playable READY queue item, updates `view_count`/`last_shown_datetime`, persists `current_media_asset_id`, and rejects no-ready/no-playable cases. Worker tests protect the boundary that playback worker selects only and does not render. | Pending user PC testing. | `server/playback/playbackSelectionService.ts`; `server/scripts/sqlite_admin.py select_current_item`; `tests/waveD.e2e.test.js`; `tests/waveE.step5.test.js`; `tests/playbackApiContract.test.js`; `tests/playbackWorker.test.js`; `tests/playbackLoop.test.js`. | Rendering/fullscreen/wake behavior is separate from Stage 6. Missing/invalid files are marked failed; broad real-device playback should be manually checked. |
| Orchestration | Implemented / bounded. Docs/UI describe B3 auto-run and View C last-run read path. | Implemented / covered. `POST /api/runtime/orchestration/run` runs stages in order, persists current/last state, and stops with controlled failure data. View C reads `/api/runtime/orchestration/last` without claiming restore. | Pending user PC testing. | `server/index.ts` `ORCHESTRATION_STAGE_PIPELINE`, `runtimeOrchestrationRunHandler`; `tests/waveE.step5.test.js`; `tests/runtimeStatusRoutesCompatibility.test.js`; `tests/viewC.orchestrationWiringGuard.test.js`. | Restore/resume mutation is not implemented. Real production download/geocode limitations still apply to orchestrated runs. |

## PC testing checklist for the subjective column

Use this checklist when filling the subjective assessment column after a real PC run.

| Stage | PC observation to record |
| --- | --- |
| Download | Did the expected source files appear in the configured download directory? Was Test Mode vs Real Mode clear? |
| Index | Did database rows appear for the downloaded media? Did counts match expectations? |
| GPS parser | Did GPS-found/no-GPS outcomes match the actual media files and, where applicable, the expected provider method: EXIF, JSON sidecar, XMP sidecar, text sidecar, filename token, or path token? |
| Geocode | Did address text appear, and was it clear whether it came from `address_cache`, a disabled/enabled network provider, or the deterministic placeholder `Lat/Lon` fallback? |
| Queue | Did eligible items enter the queue, and did skipped items show understandable reasons? |
| Playback Select | Did B4/current playback select the expected item and show it in playback views without raw filesystem paths? |
| Orchestration | Did auto-run execute stages in order and show clear success/failure state in View C / logs? |

## Current-truth conclusion

The deterministic backend media pipeline is implemented and covered by repo tests from Download through Playback Select. The current GPS stage is now EXIF-first with local/offline fallback providers for explicit sidecar, filename, and path coordinates. The geocode stage is now cache-first with registered network/account providers disabled by default and deterministic placeholder fallback preserved for safe behavior. The honest limitations are Real Mode iCloudPD production download dependency, unproven production reverse-geocoding activation, absent View C restore mutation, and the need for Mihkel's PC-tested subjective assessment before the subjective column is filled.
