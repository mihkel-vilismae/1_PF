# Goal 4 Media Pipeline Stage Behavior — 2026-05-28 12:16 EEST

## ACR slice record

### Original instruction
Run Goal 4 workflow slice 2: analyze stage behavior for the media pipeline.

### Draft prompt
Use the inventory from Slice 1 and explain each pipeline stage's inputs, outputs, DB effects, success/failure behavior, and boundaries.

### Analyze
The stage notes must distinguish mock/test download from real iCloudPD download, deterministic placeholder geocoding from production geocoding, and backend selection from frontend rendering.

### Critique
Do not overclaim production readiness. Do not merge View B, workers, playback views, and orchestration into one behavior. Preserve explicit “does not do” boundaries because these prevent future regressions.

### Refined prompt run
Create a stage-by-stage behavior analysis for Download, Index, GPS parser, Geocode, Queue, Playback Select, and Orchestration. For each stage, list inputs, outputs, database effects, success/failure behavior, and non-goals/boundaries using current repo evidence only.

## Stage 1 — Download

| Aspect | Behavior |
| --- | --- |
| Primary route | `POST /api/runtime/download/run` |
| Inputs | `DOWNLOAD_DIR`, optional `MOCK_DOWNLOAD_SOURCE_DIR`; defaults to `generated_test_data` when no mock source is configured. |
| Main work | Creates the download directory, copies regular files from the configured source to `DOWNLOAD_DIR`, counts supported media before/after, and reports new media count. |
| Output payload | `stage: stage1_auth_download`, status `ok` or `warning`, source/destination diagnostics, copied/failed file counts, media counts, and `executedAt`. |
| DB effects | None directly. Stage 2 performs DB registration after files exist. |
| Failure behavior | Fails when the source directory is missing, not a directory, empty, or copying produces no copied files. Partial copy failures produce warning status when at least one file was copied. |
| Boundary | The deterministic route is mock/generated download, not production iCloudPD. The real authenticated route is `POST /api/runtime/download/real-run` and is guarded by NEW AUTH session proof. |

## Stage 2 — Index

| Aspect | Behavior |
| --- | --- |
| Primary route | `POST /api/runtime/index/run` |
| Backend path | `runStage2IndexRegister` → Python bridge `stage2_index_register`. |
| Inputs | Existing SQLite DB, `DOWNLOAD_DIR`, schema path, timestamp. |
| Main work | Ensures canonical schema, scans supported media files, computes file metadata/hash/asset key, inserts or updates `canonical_media_assets`, inserts original `media_asset_variants`, and seeds `parse_files_for_gps_queue`. |
| Output payload | `stage: stage2_index_register`, indexing counts, DB status, schema version, and indexed timestamp. |
| DB effects | Mutates `canonical_media_assets`, `media_asset_variants`, and `parse_files_for_gps_queue`. |
| Failure behavior | Fails if the DB is missing; wraps Python bridge/schema bootstrap failure as `index_schema_bootstrap_failed`. Empty media directory is a successful no-op with no supported files found. |
| Boundary | Stage 2 registers files and queues GPS work. It does not parse EXIF GPS, geocode, enqueue slideshow playback, or render media. |

## Stage 3 — GPS parser

| Aspect | Behavior |
| --- | --- |
| Primary route | `POST /api/runtime/gps/run` |
| Backend path | `runStage3ProcessGpsQueue` → Python bridge `stage3_process_gps_queue`. |
| Inputs | Pending/retry rows in `parse_files_for_gps_queue`, canonical media paths, schema path, timestamp. |
| Main work | Reads EXIF GPS from queued canonical files. Successful rows update coordinates and `GPS_FOUND`; unsuccessful rows become `GPS_NOT_FOUND` / `NO_GPS_FOUND` or capture extraction failure metadata. Successful GPS rows seed `geocode_queue`. |
| Output payload | `stage: stage3_process_gps_queue`, processed/success/failure counts, GPS summary object, DB status, schema version, and executed timestamp. |
| DB effects | Mutates `parse_files_for_gps_queue`, `canonical_media_assets`, and `geocode_queue`. |
| Failure behavior | Missing/no GPS rows are handled per asset; the stage can return warning when failures exist. No pending work is a successful no-op. Missing database is a 404. |
| Boundary | Stage 3 only extracts GPS coordinates. It does not resolve addresses and does not decide playback eligibility. |

## Stage 4 — Geocode

| Aspect | Behavior |
| --- | --- |
| Primary route | `POST /api/runtime/geocode/run` |
| Backend path | `runStage4ProcessGeocodeQueue` → Python bridge `stage4_process_geocode_queue`. |
| Inputs | Pending/retry rows in `geocode_queue`, GPS latitude/longitude, schema path, timestamp. |
| Main work | Uses the deterministic placeholder provider to build `Lat: ..., Lon: ...` address text, writes/uses `address_cache`, updates `canonical_media_assets.address_text`, and completes geocode queue rows. |
| Output payload | `stage: stage4_process_geocode_queue`, processed/success/failure counts, geocode summary object, DB status, schema version, and executed timestamp. |
| DB effects | Mutates `geocode_queue`, `address_cache`, and `canonical_media_assets`. |
| Failure behavior | Missing GPS coordinates lead to `GEOCODE_FAILED` and `RETRY_EXHAUSTED`; no pending work is a successful no-op. Missing database is a 404. |
| Boundary | This is not production reverse geocoding. The repo is explicit that the configured provider is deterministic placeholder-only. |

## Stage 5 — Queue

| Aspect | Behavior |
| --- | --- |
| Primary route | `POST /api/runtime/queue/prepare` |
| Backend path | `runStage5PrepareQueue` → Python bridge `stage5_prepare_queue` / `prepare_slideshow_queue`. |
| Inputs | Canonical asset rows, original/first media variants, geocode status/address text, existing slideshow queue rows, schema path, timestamp. |
| Main work | Inserts `READY` rows into `slideshow_queue` only for assets that have a usable variant path, are not already queued, and have `GEOCODE_FOUND` plus non-empty address text. |
| Output payload | `inserted_count`, `skipped_count`, `inserted_ids`, `skipped`, queue summary, DB status, schema version, and executed timestamp. |
| DB effects | Mutates `slideshow_queue`. |
| Failure / skip behavior | Per-asset skip reasons include `already_queued`, `geocode_not_ready`, `missing_file_path`, and `missing_variant`. Missing DB is a 404. A second run is idempotent for already queued assets. |
| Boundary | Stage 5 prepares playback eligibility. It does not select the current item, mark media shown, or render media. |

## Stage 6 — Playback Select

| Aspect | Behavior |
| --- | --- |
| Primary route | `POST /api/runtime/playback/select-current` |
| Backend path | `runtimePlaybackSelectCurrentHandler` → `selectCurrentPlayableItem` → `runStage6SelectCurrent` → Python bridge `stage6_select_current` / `select_current_item`. |
| Inputs | `READY` slideshow queue rows, canonical path, address text, repo root, timestamp. |
| Main work | Chooses the first playable READY row by unshown/oldest/least-viewed order, validates canonical path/address/file existence, increments `view_count`, sets `last_shown_datetime`, and persists `current_media_asset_id` in `runtime_state`. |
| Output payload | `stage: stage6_run_playback`, selection status/messages, playback payload, DB status, schema version, and executed timestamp. |
| DB effects | Mutates `slideshow_queue` and `runtime_state`. Invalid READY candidates are marked `FAILED` with failure reasons. |
| Failure / skip behavior | Returns route-level 409 for `no_ready_row` or `no_playable_ready_row`; invalid candidates can be failed while a later playable candidate is selected. |
| Boundary | Stage 6 selects the current playable item. It does not render media, run browser fullscreen, wake screens, run PIR/mouse/keyboard detection, or perform download/index/geocode work. |

## Orchestration

| Aspect | Behavior |
| --- | --- |
| Primary route | `POST /api/runtime/orchestration/run` |
| Status routes | `GET /api/runtime/orchestration/current`, `GET /api/runtime/orchestration/last` |
| Stage order | `download` → `index` → `gps` → `geocode` → `queue_prepare` → `playback_select`. |
| Main work | Runs each stage sequentially, persists `orchestration_current` and `orchestration_last` in `runtime_state`, records current stage, last successful stage, failures, and selected asset summary. |
| Failure behavior | Stops on first failure, marks the run `FAILED`, records `failed_stage` and `failure_reason`, and persists finished state. |
| Boundary | Orchestration coordinates stage execution. It does not add a restore/resume mutation contract for View C, and it does not bypass each stage's existing route behavior. |

## Behavior conclusion

The current repo implements a deterministic, testable media pipeline from file-copy download through backend playback selection. The pipeline is strongest in Test/Mock mode through Wave D/E coverage. Production gaps remain around real iCloudPD download hardening and real reverse geocoding, while playback display and fullscreen behavior are separate frontend/playback-view concerns built on top of the selected backend media contract.
