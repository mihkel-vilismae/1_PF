# Part 3 Slice 1 — Repo Evidence Index

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`  
Slice: 1 of 4  
Snapshot: `12_PF v0.3.24`  
Generated: 2026-04-26 17:26 EEST

## Purpose

This file indexes concrete repository evidence for later documentation truth classification. Slice 2 and Slice 3 should cite this evidence instead of relying only on documentation claims.

## Snapshot metadata

| Field | Value |
|---|---|
| VERSION | `0.3.24` |
| package.json version | `0.3.24` |
| Git HEAD | `7515eb6` |
| Documentation files inventoried | 88 |
| `server/index.js` LOC | 1869 |
| `server/scripts/sqlite_admin.py` LOC | 1280 |
| `schema.sql` LOC | 198 |
| Tests indexed | 29 |
| Dashboard candidate files indexed | 33 |

## Working tree status observed after ZIP extraction

|Status item|
|---|
|D server/scripts/__pycache__/sqlite_admin.cpython-313.pyc|
| D zip_ignore.json|

Note: these status entries were observed immediately after extracting the provided ZIP. Slice 1 did not stage unrelated deletions or modify production code.

## package.json scripts

|Script|Command|
|---|---|
|api|node server/index.js|
|dev|vite|
|test|node --test|
|build|vite build|
|preview|vite preview|
|task-docs:toc|node scripts/generate-task-docs-toc.mjs|
|task-docs:check|node scripts/generate-task-docs-toc.mjs --check|
|validate:view-e|node scripts/validate-view-e.mjs|

## API endpoints discovered in `server/index.js`

|#|Method|Path|
|---|---|---|
|1|GET|/api/auth/status|
|2|POST|/api/auth/verify-icloudpd|
|3|POST|/api/auth/run|
|4|POST|/api/auth/2fa/submit|
|5|POST|/api/auth/test-login-download-one|
|6|POST|/api/auth/reset|
|7|POST|/api/auth/logout|
|8|POST|/api/auth/resume|
|9|POST|/api/init/verify-env|
|10|GET|/api/init/database/status|
|11|POST|/api/init/database/inspect|
|12|POST|/api/init/database/delete|
|13|POST|/api/init/database/recreate-empty|
|14|POST|/api/init/cron/install|
|15|GET|/api/init/cron/status|
|16|GET|/api/init/cron/print|
|17|POST|/api/database-viewer/verify|
|18|POST|/api/database-viewer/connect|
|19|GET|/api/database-viewer/tables|
|20|POST|/api/database-viewer/rows|
|21|POST|/api/database-viewer/logging/start|
|22|POST|/api/database-viewer/logging/stop|
|23|POST|/api/runtime/download/run|
|24|POST|/api/runtime/index/run|
|25|POST|/api/runtime/gps/run|
|26|POST|/api/runtime/geocode/run|
|27|POST|/api/runtime/queue/prepare|
|28|POST|/api/runtime/playback/select-current|
|29|POST|/api/runtime/orchestration/run|
|30|GET|/api/runtime/orchestration/current|
|31|GET|/api/runtime/orchestration/last|
|32|GET|/api/runtime-truth|
|33|POST|/api/runtime-truth|

## Schema tables discovered in `schema.sql`

|#|Table|
|---|---|
|1|canonical_media_assets|
|2|media_asset_variants|
|3|address_cache|
|4|parse_files_for_gps_queue|
|5|geocode_queue|
|6|slideshow_queue|
|7|runtime_state|
|8|action_runs|
|9|system_logs|

## Python SQLite bridge functions discovered in `server/scripts/sqlite_admin.py`

|#|Function|
|---|---|
|1|connect_read_only|
|2|connect_read_write|
|3|quote_identifier|
|4|describe_columns|
|5|looks_like_timestamp_column|
|6|looks_like_integer_primary_key|
|7|choose_ordering|
|8|normalize_cell|
|9|inspect_database|
|10|fetch_table_rows|
|11|recreate_empty_database|
|12|classify_media_type|
|13|collect_media_files|
|14|compute_file_sha1|
|15|build_asset_key|
|16|ensure_canonical_schema|
|17|stage2_index_register|
|18|convert_gps_coordinate|
|19|extract_exif_gps|
|20|build_address_cache_key|
|21|build_placeholder_address|
|22|stage3_process_gps_queue|
|23|stage4_process_geocode_queue|
|24|prepare_slideshow_queue|
|25|resolve_canonical_path|
|26|select_current_item|
|27|runtime_state_get|
|28|runtime_state_set|
|29|main|

## Dashboard entrypoint and frontend candidate files

|#|Path|LOC|Type|
|---|---|---|---|
|1|dashboard/app.js|454|.js|
|2|dashboard/index.html|14|.html|
|3|dashboard/inspect/backendStatusMetadata.js|360|.js|
|4|dashboard/inspect/bindInspectModes.js|233|.js|
|5|dashboard/inspect/controlMetadata.js|276|.js|
|6|dashboard/inspect/guideCopy.js|14|.js|
|7|dashboard/inspect/guideUtils.js|47|.js|
|8|dashboard/inspect/realityMetadata.js|289|.js|
|9|dashboard/inspect/tooltipController.js|155|.js|
|10|dashboard/services/apiClient.js|215|.js|
|11|dashboard/services/authPreflightService.js|53|.js|
|12|dashboard/services/databaseViewerService.js|49|.js|
|13|dashboard/services/initService.js|75|.js|
|14|dashboard/services/renderers.js|325|.js|
|15|dashboard/services/runtimeExecutionService.js|43|.js|
|16|dashboard/services/runtimeTruth.js|281|.js|
|17|dashboard/services/runtimeTruth/runtimeTruthActionUtils.js|148|.js|
|18|dashboard/services/runtimeTruth/runtimeTruthAuthActions.js|151|.js|
|19|dashboard/services/runtimeTruth/runtimeTruthBehavior.js|158|.js|
|20|dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.js|424|.js|
|21|dashboard/services/runtimeTruth/runtimeTruthDemoActions.js|476|.js|
|22|dashboard/services/runtimeTruth/runtimeTruthGuards.js|118|.js|
|23|dashboard/services/runtimeTruth/runtimeTruthPersistence.js|112|.js|
|24|dashboard/services/runtimeTruth/runtimeTruthState.js|207|.js|
|25|dashboard/services/runtimeTruthPersistenceService.js|23|.js|
|26|dashboard/services/transitTerminal.js|73|.js|
|27|dashboard/shared/constants.js|24|.js|
|28|dashboard/styles.css|1423|.css|
|29|dashboard/views/databaseViewerView.js|280|.js|
|30|dashboard/views/initView.js|147|.js|
|31|dashboard/views/lastRunView.js|40|.js|
|32|dashboard/views/runningProcessView.js|75|.js|
|33|dashboard/views/testView.js|154|.js|

## Tests indexed

|#|Path|LOC|Purpose hint|
|---|---|---|---|
|1|tests/authApi.step1.test.js|243|Authentication / iCloud / 2FA documentation.|
|2|tests/authFrontendControls.test.js|53|Authentication / iCloud / 2FA documentation.|
|3|tests/authHardening.test.js|45|Authentication / iCloud / 2FA documentation.|
|4|tests/authIcloudpdProvider.test.js|234|Authentication / iCloud / 2FA documentation.|
|5|tests/authLogout.test.js|51|Authentication / iCloud / 2FA documentation.|
|6|tests/authPersistence.test.js|65|Authentication / iCloud / 2FA documentation.|
|7|tests/authProviderRegistry.test.js|37|Authentication / iCloud / 2FA documentation.|
|8|tests/authRuntimeTruth.test.js|17|Authentication / iCloud / 2FA documentation.|
|9|tests/authService.test.js|233|Authentication / iCloud / 2FA documentation.|
|10|tests/authSessionService.test.js|275|Authentication / iCloud / 2FA documentation.|
|11|tests/authState.test.js|66|Authentication / iCloud / 2FA documentation.|
|12|tests/authTwoFactor.test.js|0|Authentication / iCloud / 2FA documentation.|
|13|tests/initApi.step1.test.js|360|Surface purpose unclear from filename/headings.|
|14|tests/inspectMetadata.test.js|245|Surface purpose unclear from filename/headings.|
|15|tests/playbackLoop.test.js|162|Surface purpose unclear from filename/headings.|
|16|tests/projectLogger.test.js|39|Surface purpose unclear from filename/headings.|
|17|tests/runtimeExecutionService.test.js|11|Surface purpose unclear from filename/headings.|
|18|tests/runtimeTruthHelpers.test.js|77|Surface purpose unclear from filename/headings.|
|19|tests/transitGateway.test.js|105|Surface purpose unclear from filename/headings.|
|20|tests/viewA.2A.databaseButtons.buttonWorkflow.test.js|281|Button verification workflow/result documentation.|
|21|tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js|175|Button verification workflow/result documentation.|
|22|tests/viewA.verifyEnv.buttonWorkflow.test.js|116|Button verification workflow/result documentation.|
|23|tests/viewB.buttonWorkflow.test.js|551|Button verification workflow/result documentation.|
|24|tests/viewSourceBadges.test.js|24|Surface purpose unclear from filename/headings.|
|25|tests/waveA.step2.test.js|503|Surface purpose unclear from filename/headings.|
|26|tests/waveB.step3.test.js|404|Surface purpose unclear from filename/headings.|
|27|tests/waveC.step4.test.js|302|Surface purpose unclear from filename/headings.|
|28|tests/waveD.e2e.test.js|612|Surface purpose unclear from filename/headings.|
|29|tests/waveE.step5.test.js|254|Surface purpose unclear from filename/headings.|

## Scripts and tools indexed

|#|Path|LOC|
|---|---|---|
|1|scripts/append_button_verification_run.py|101|
|2|scripts/generate-task-docs-toc.mjs|297|
|3|scripts/install-githooks.ps1|5|
|4|scripts/install-githooks.sh|6|
|5|scripts/validate-view-e.mjs|137|
|6|scripts/version_guard.mjs|40|
|7|tools/all_views_separate_influenced_elements_tables.jsx|1075|
|8|tools/jsx_browser_viewer.html|683|
|9|tools/run_jsx_viewer.bat|61|

## Start/run scripts discovered

|#|Path|LOC|
|---|---|---|
|1|tools/run_jsx_viewer.bat|61|

## Evidence-use rules for Slice 2

- If a doc mentions an npm command, check it against the package script table above.
- If a doc mentions an API endpoint, check it against the endpoint table above.
- If a doc mentions a DB table, check it against the schema table list above.
- If a doc claims a test exists, check it against the tests table above.
- If a doc references dashboard entrypoints, check it against the dashboard candidate list above.
- If a doc claims runnable start scripts exist, check it against the start/run script discovery section above.
