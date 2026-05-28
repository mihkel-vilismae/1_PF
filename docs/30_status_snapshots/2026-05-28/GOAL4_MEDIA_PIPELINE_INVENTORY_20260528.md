# Goal 4 Media Pipeline Inventory — 2026-05-28 12:12 EEST

## ACR slice record

### Original instruction
Run Goal 4 workflow slice 1: create a repo-backed inventory for the media pipeline stages.

### Draft prompt
Inspect the current immutable PF_login baseline and list all files, routes, schema tables, tests, and docs involved in Download, Index, GPS parser, Geocode, Queue / Q, and Playback Select.

### Analyze
The slice must be read-only with respect to runtime behavior. It should map evidence from code/tests/docs and avoid claiming subjective PC-tested status.

### Critique
Do not rely on memory-only stage names. Do not treat older status snapshots as current truth without code/test verification. Include Stage 6 playback select because queue preparation is only useful when connected to playback selection.

### Refined prompt run
Create a repo-backed evidence inventory for Goal 4 covering Download, Index, GPS parser, Geocode, Queue / Q, and Playback Select. Record source files, HTTP routes, Python bridge commands, schema tables, dashboard entry points, tests, docs, and known authority level. Do not change runtime behavior.

## Route inventory

| Stage | Primary route | Handler / service evidence | Python bridge command or backend service |
| --- | --- | --- | --- |
| Download | `POST /api/runtime/download/run` | `server/index.ts` `runtimeDownloadRunHandler` | Copies files from `MOCK_DOWNLOAD_SOURCE_DIR` or `generated_test_data` into `DOWNLOAD_DIR`; no DB mutation in this route. |
| Real download | `POST /api/runtime/download/real-run` | `server/index.ts` `runtimeRealDownloadRunHandler`; `server/runtimeRealDownloadAuthBridge.ts` | Requires verified NEW AUTH/iCloudPD session and calls the auth download boundary. It is related to Stage 1 but not used by the deterministic Wave D/E mock pipeline. |
| Index | `POST /api/runtime/index/run` | `server/index.ts` `runtimeIndexRunHandler`; `server/database/databaseService.ts` `runStage2IndexRegister` | `server/scripts/sqlite_admin.py stage2_index_register` |
| GPS parser | `POST /api/runtime/gps/run` | `server/index.ts` `runtimeGpsRunHandler`; `server/database/databaseService.ts` `runStage3ProcessGpsQueue` | `server/scripts/sqlite_admin.py stage3_process_gps_queue` |
| Geocode | `POST /api/runtime/geocode/run` | `server/index.ts` `runtimeGeocodeRunHandler`; `server/database/databaseService.ts` `runStage4ProcessGeocodeQueue` | `server/scripts/sqlite_admin.py stage4_process_geocode_queue` |
| Queue / Q | `POST /api/runtime/queue/prepare` | `server/index.ts` `runtimeQueuePrepareHandler`; `server/database/databaseService.ts` `runStage5PrepareQueue` | `server/scripts/sqlite_admin.py stage5_prepare_queue` / `prepare_slideshow_queue` |
| Playback Select | `POST /api/runtime/playback/select-current` | `server/index.ts` `runtimePlaybackSelectCurrentHandler`; `server/playback/playbackSelectionService.ts`; `server/database/databaseService.ts` `runStage6SelectCurrent` | `server/scripts/sqlite_admin.py stage6_select_current` / `select_current_item` |
| Orchestration | `POST /api/runtime/orchestration/run` | `server/index.ts` `runtimeOrchestrationRunHandler`; `ORCHESTRATION_STAGE_PIPELINE` | Sequentially invokes Download, Index, GPS, Geocode, Queue, Playback Select. |
| Orchestration status | `GET /api/runtime/orchestration/current`, `GET /api/runtime/orchestration/last` | `server/routes/runtimeStatusRoutes.ts`; `server/index.ts` | Reads persisted `runtime_state` entries. |

## Schema / DB table inventory

| Table | Pipeline role |
| --- | --- |
| `canonical_media_assets` | Canonical indexed asset row; holds filename, canonical path, media type, GPS/geocode status, coordinates, and resolved address text. |
| `media_asset_variants` | Variant/original file-path rows used by queue preparation and playback media resolution. |
| `parse_files_for_gps_queue` | Stage 3 work queue seeded by Stage 2. |
| `geocode_queue` | Stage 4 work queue seeded by successful Stage 3 GPS extraction. |
| `address_cache` | Stage 4 deterministic placeholder geocode cache. |
| `slideshow_queue` | Stage 5 playback eligibility queue and Stage 6 selection source. |
| `runtime_state` | Stores `current_media_asset_id`, orchestration current/last state, and related runtime status values. |
| `action_runs` | Canonical schema table available for action/run persistence. |
| `system_logs` | Canonical schema table available for runtime/system logging. |

## Test inventory

| Test file | Evidence covered |
| --- | --- |
| `tests/waveD.e2e.test.js` | Deterministic Stage 1–6 flow with fixture download, index, GPS, geocode, queue blocking paths, idempotent queue preparation, and playback selection. |
| `tests/waveE.step5.test.js` | Backend orchestrator success/failure/inspection shape across Download → Index → GPS → Geocode → Queue → Playback Select. |
| `tests/viewB.buttonWorkflow.test.js` | Dashboard actions for B3.1–B3.5, B3 auto orchestration, and B4 playback selection call documented routes. |
| `tests/runtimeExecutionService.test.js` | Frontend runtime endpoint constants for individual stages and orchestration. |
| `tests/playbackApiContract.test.js` | Playback current/queue/media contract and Test/Real DB separation. |
| `tests/playbackWorker.test.js` | Playback worker selects current item without claiming rendering or other pipeline-stage work. |
| `tests/playbackLoop.test.js` | B4 playback selection auto-advance behavior. |
| `tests/runtimeStatusRoutesCompatibility.test.js` | Orchestration status route compatibility. |
| `tests/viewC.orchestrationWiringGuard.test.js` | View C reads `/api/runtime/orchestration/last` as a read-only last-run projection. |

## Dashboard entry points

| UI area | Evidence |
| --- | --- |
| View B / B3.1 | Download button copy and action target `POST /api/runtime/download/run`. |
| View B / B3.2 | Index button copy and action target `POST /api/runtime/index/run`. |
| View B / B3.3 | GPS parser button copy and action target `POST /api/runtime/gps/run`. |
| View B / B3.4 | Geocode button copy and action target `POST /api/runtime/geocode/run`; UI notes deterministic placeholder provider. |
| View B / B3.5 | Queue prepare button copy and action target `POST /api/runtime/queue/prepare`. |
| View B / B4 | Playback select action target `POST /api/runtime/playback/select-current`. |
| View C | Reads last orchestration state through `GET /api/runtime/orchestration/last`; resume remains local/disabled until a restore contract exists. |
| Windows/Raspberry playback views | Read playback contract, observability, worker/log surfaces; they do not mutate stage state. |

## Documentation inventory

| Document | Role / authority |
| --- | --- |
| `docs/30_status_snapshots/2026-05-12/code_verified_dashboard_implementation_status.md` | Older code-verified snapshot; useful but must be re-checked against current code/tests. |
| `docs/30_status_snapshots/2026-05-12/button_and_view_verification_status.md` | Older View B button/status snapshot. |
| `docs/30_status_snapshots/2026-05-12/b4_playback_flow_status.md` | Older B4 playback flow status snapshot. |
| `docs/OS_PLAYBACK_VIEWS_SLICE_*.md` | Recent Goal 1 playback-view docs; relevant to playback display and observability, not the core Stage 1–6 mutation pipeline. |
| `docs/SCROLL_PRESERVATION_ANALYSIS_2805.md` | Recent unrelated UI rendering analysis; relevant only to scroll behavior. |

## Inventory conclusion

The current repo has concrete code and tests for the deterministic mock/test media pipeline from Download through Playback Select. Real iCloudPD download exists as a separate authenticated Stage 1 variant and is not the same as the deterministic Wave D/E mock download path. Geocode is intentionally implemented as a deterministic placeholder, not as production reverse geocoding.
