# PC/runtime verification checklist — regular worker stages

Estonian timestamp: 2026-05-29 16:31 EEST

## Purpose

This runbook helps Mihkel verify the five regular media pipeline worker stages on the real PC runtime and then copy observed evidence back into the implementation-status documentation. It is intentionally operator-facing and documentation-only. It does not change runtime behavior, Test Mode behavior, Real Mode behavior, backend routes, database schema, or worker code.

The five regular worker stages are:

1. Download
2. Index
3. GPS parser
4. Geocode
5. Queue

## Authority and safety rules

| Rule | Meaning |
| --- | --- |
| Active baseline | This checklist was added after the v0.7.16 project-issues guide baseline and bumps the repository to v0.7.17. |
| Test Mode must stay deterministic | Mock/generated flows remain the safe regression baseline. Do not replace them with Real Mode behavior. |
| Real Mode must stay gated | Real download must still require the NEW AUTH / iCloudPD provider proof boundary. |
| Queue terminology | Use `Queue` only. |
| Subjective assessment | Fill the subjective column only after Mihkel has actually tested the stage on the PC. |
| Evidence discipline | Prefer exact UI output, backend logs, DB rows, endpoint responses, and test results over assumptions. |

## Recommended test order

Run the deterministic Test Mode flow first, then Real Mode download only after Test Mode still works.

| Order | Scope | Reason |
| ---: | --- | --- |
| 1 | Environment and mode confirmation | Prevents mixing Test Mode and Real Mode evidence. |
| 2 | Test Mode Download → Queue | Confirms the known deterministic pipeline still works. |
| 3 | Orchestration check | Confirms stage sequencing still matches View B/runtime expectations. |
| 4 | Real Mode download proof | Confirms real iCloudPD output can become Stage 1 input without weakening auth gates. |
| 5 | Real media Index/GPS/Geocode/Queue pass | Confirms real-world media can move through the regular stages. |
| 6 | Documentation update | Copies observed evidence into current-truth status tables. |

## Before testing

| Check | What to do | Expected result | Evidence to save |
| --- | --- | --- | --- |
| Baseline version | Open the UI/version indicator or read `VERSION`. | `0.7.17` after this documentation slice. | Screenshot or copied text. |
| Backend mode | Verify whether the app is in Test Mode or Real Mode before each run. | Mode is visible and consistent with the test being performed. | Screenshot of mode/status area. |
| Env source | Confirm `.env` is the only runtime env source. | No `test.env` runtime dependency. | `verify-env` output and/or startup log. |
| Logs visible | Open the relevant backend/runtime log panels. | Logs update without exposing secrets. | Log excerpt with secrets redacted. |
| Database path | Confirm whether the run uses the test DB or real DB. | Test Mode uses projected test paths; Real Mode uses real configured paths. | `verify-env` payload or backend log. |

## Stage checklist matrix

| Stage | Command/button/endpoint to run | Expected result | Verify in UI | Verify in backend/logs/database | Success evidence to copy | Failure evidence to copy | Subjective assessment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Download | View B Download control or `POST /api/runtime/download/run` for Test Mode. For Real Mode use the separate real download control/`POST /api/runtime/download/real-run` only after auth proof. | Test Mode copies/generated files into `DOWNLOAD_DIR`. Real Mode downloads via authenticated iCloudPD boundary. | View B stage result shows stage 1 payload, counts, and clear Test/Real wording. | Download directory file count changes; backend log shows source, target, count, and no secret leakage. | UI payload, copied endpoint response, before/after file counts, sanitized backend log. | Missing source, auth failure, wrong mode, no files copied, secret leakage, unexpected path overlap. | Pending Mihkel PC test. |
| Index | View B Index control or `POST /api/runtime/index/run`. | Media files in `DOWNLOAD_DIR` are registered as canonical assets/variants and GPS work is seeded. | View B result reports indexed/inserted/updated counts. | DB tables: `canonical_media_assets`, `media_asset_variants`, `parse_files_for_gps_queue`. Logs show index command success/failure. | Counts from UI, DB row counts, sample asset/variant row, log excerpt. | Zero assets when files exist, missing variants, unsupported format surprise, DB error, path mismatch. | Pending Mihkel PC test. |
| GPS parser | View B GPS parser control or `POST /api/runtime/gps/run`. | GPS queue rows are processed. Assets with GPS get coordinates and geocode work; no-GPS assets keep an explicit unknown/no-GPS enrichment state and remain playable if they are otherwise valid. | View B result shows processed/found/not-found/failure counts. | DB tables/fields: `parse_files_for_gps_queue`, GPS latitude/longitude/status on canonical assets, `geocode_queue` rows for GPS-found assets. | Counts, one GPS-found row, one no-GPS row if available, log excerpt. | Real photo GPS not detected, video/HEIC unsupported without clear reason, queue row stuck, failure status unclear. | Pending Mihkel PC test. |
| Geocode | View B Geocode control or `POST /api/runtime/geocode/run`. | Current baseline uses deterministic placeholder geocoding only. Usable address text/cache rows are written when available; missing or unresolved address stays honest and must not block otherwise playable media. | UI must make the placeholder/unknown boundary visible; do not treat it as production address proof. | DB tables/fields: `geocode_queue`, `address_cache`, `geocode_status`, `address_text`. Logs show provider `deterministic_placeholder` or equivalent bounded wording. | Placeholder provider label, sample address cache row, geocode status update, copied warning text. | UI implies production geocoding, no usable address for a playable asset is treated as a failure, stuck queue, unclear provider label. | Pending Mihkel PC test. |
| Queue | View B Queue control or `POST /api/runtime/queue/prepare`. | Eligible playable media enters `slideshow_queue`; address enrichment is carried only when available. Ineligible media is skipped for independent invalid states such as missing variant or missing file path. Re-running remains idempotent. | View B result shows inserted/skipped counts and skip reasons. | DB table: `slideshow_queue`. Check duplicate prevention and skip reasons such as `already_queued`, `missing_variant`, `missing_file_path`, or another independent invalid state. | Queue row count, sample queued item, second-run idempotency evidence, skip reason sample. | Duplicate rows, playable media not queued, unresolved address treated as a blocker, missing or unclear skip reasons. | Pending Mihkel PC test. |

## Detailed operator steps

### 1. Confirm mode and environment

1. Start the backend and frontend using the normal Windows run path.
2. Open the dashboard.
3. Confirm the UI version and backend version.
4. Run the environment verification card/control.
5. Save the result payload and note whether Test Mode or Real Mode is active.

Expected outcome: the app clearly shows which mode is active, `.env` is the runtime source, secrets are not displayed, and the database/download paths are understandable.

### 2. Test deterministic Test Mode pipeline

1. In Test Mode, run Download.
2. Run Index.
3. Run GPS parser.
4. Run Geocode.
5. Run Queue.
6. Copy each stage payload or screenshot each stage result.
7. Verify backend logs after each stage.
8. Verify DB state after Index, GPS parser, Geocode, and Queue.

Expected outcome: the regular pipeline works in order and the final Queue stage has eligible playable rows in `slideshow_queue`, with address enrichment present only when usable address data exists.

### 3. Test orchestration after individual stage checks

1. Reset or use a clean test runtime state if the project provides a safe reset path.
2. Run the orchestration control/endpoint.
3. Confirm the stage order is Download → Index → GPS parser → Geocode → Queue before playback selection.
4. Save the orchestration payload and any stage failure boundary if a controlled failure is being tested.

Expected outcome: orchestration preserves the same stage boundaries as individual worker controls.

### 4. Test Real Mode download only after auth proof

1. Confirm Real Mode is active.
2. Confirm NEW AUTH/iCloudPD provider proof is valid.
3. Run the real download control/endpoint.
4. Confirm downloaded files appear in the configured real download directory.
5. Save sanitized logs and file-count evidence.

Expected outcome: real iCloudPD download remains auth-gated and produces files that can become Index input. If auth proof is missing, the real download must fail safely and honestly.

### 5. Test real media through Index, GPS parser, Geocode, and Queue

1. With real downloaded files present, run Index.
2. Run GPS parser.
3. Run Geocode, remembering that address enrichment is optional and should not block otherwise playable media.
4. Run Queue.
5. Save one success example and one failure/skip example if available.

Expected outcome: real media either moves through the pipeline or fails/skips with clear, documented reasons.

## Evidence capture template

Copy this table into the current-truth implementation status doc after testing, or use it as the raw note source before updating that doc.

| Stage | Date/time tested | Mode | Input used | UI evidence | Backend/log evidence | DB/filesystem evidence | Result | Subjective assessment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Download |  |  |  |  |  |  |  |  |
| Index |  |  |  |  |  |  |  |  |
| GPS parser |  |  |  |  |  |  |  |  |
| Geocode |  |  |  |  |  |  |  |  |
| Queue |  |  |  |  |  |  |  |  |

## Failure triage guide

| Symptom | Likely area | First checks |
| --- | --- | --- |
| Download copies zero files in Test Mode | Download setup | `MOCK_DOWNLOAD_SOURCE_DIR`, generated test data, `DOWNLOAD_DIR`, logs. |
| Real download fails with auth/session message | Real download/auth boundary | Provider proof status, NEW AUTH status, iCloudPD output, sanitized auth logs. |
| Index sees no files | Download → Index handoff | Actual download directory, path projection, file extensions, mode-specific DB/path config. |
| GPS parser finds no GPS in expected GPS photos | GPS parser/provider breadth | EXIF availability, file format, HEIC/video support, parser logs, sample fixture. |
| Geocode produces only Lat/Lon text or no usable address | Expected current behavior | This is correct for the current placeholder baseline; missing address is optional enrichment and should not block otherwise playable media. |
| Queue inserts nothing for otherwise playable media | Queue / invalid-state check | `missing_variant`, `missing_file_path`, or another independent invalid-state reason. Do not treat unresolved address alone as a blocker. |
| UI says stage passed but DB/logs disagree | Observability mismatch | Compare endpoint response, backend log, DB state, and docs claim. Treat runtime evidence as stronger. |

## How to update the current-truth status table after PC testing

Update `docs/00_current_truth/MEDIA_PIPELINE_IMPLEMENTATION_STATUS_20260528.md` only with observed facts. Do not convert “Pending Mihkel PC test” into a positive assessment unless the PC test was actually performed.

For each row, fill the subjective assessment with a compact statement such as:

- `PC-tested in Test Mode on 2026-05-29; stage behaved as expected; evidence: View B payload + DB row count.`
- `PC-tested in Real Mode on 2026-05-29; real download auth gate worked, but no files were downloaded because provider proof failed. Missing address was treated as optional enrichment, not a blocker.`
- `Not yet PC-tested with real media; deterministic Test Mode only.`

## What this checklist does not prove

| Not proven | Reason |
| --- | --- |
| Production reverse geocoding | Current Geocode stage is still deterministic placeholder only. |
| Broad real-world GPS/video/HEIC support | Requires real media fixture expansion and/or provider design. |
| Queue prioritization/retention/requeue policy | Current Queue is strict eligibility preparation, not a full policy engine. |
| Raspberry/PIR playback behavior | This checklist targets regular media worker stages only. |
| Scheduler/cron durability | Orchestration can be checked, but scheduler durability needs a separate runbook. |

## Recommended evidence package to bring back into chat

After testing, paste or upload:

1. Stage result payloads for Download, Index, GPS parser, Geocode, and Queue.
2. Backend log excerpt for the same run.
3. DB row-count evidence or screenshots for relevant tables.
4. Real download auth/provider proof status if Real Mode was tested.
5. Notes for the subjective assessment column.

With that evidence, the implementation-status table can be updated without guessing.
