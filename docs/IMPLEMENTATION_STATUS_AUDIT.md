# Implementation Status Audit

## Purpose

This report summarises the state of the Photo Frame repository at the time of the audit.  Its goal is to clearly
distinguish between what is **actually implemented** in the code base and what exists only as plans or
documentation.  By cataloguing each critical backend area as *implemented*, *partially implemented*, *docs only*,
*stub only* or *missing*, the report provides a practical baseline for future development work.  It is
intended to be read alongside the existing `15_CURRENT_IMPLEMENTATION_STATUS.md` file; where that
document explains high‑level project scope, this audit dives into the code itself to verify each feature.

## Source of truth used

The audit is based solely on the contents of the uploaded repository snapshot (`1_P3F.zip`).  The analysis
inspected source files under `server/`, `scripts/`, `conf/`, `schema.sql`, and the documentation set in
`docs/OLD_DOCS/`.  No external repositories or web resources were consulted.  All claims below are backed by
concrete files in this snapshot.

## Step 1 hardening note (2026-04-21)

Step 1 verification hardening added isolated API tests for `/api/init/verify-env` and `/api/init/database/*`
without changing the public route set. The backend now also supports an optional `INIT_ENV_FILE` override for
test isolation; when unset, it still defaults to the repository `.env` file.

## Step 2 Wave A note (2026-04-21)

Wave A now has a minimal backend slice:

- `POST /api/runtime/queue/prepare` performs Stage 5 idempotent enqueueing into `slideshow_queue`.
- `POST /api/runtime/playback/select-current` performs Stage 6 selection, updates queue playback history fields,
  and commits `runtime_state.current_media_asset_id`.

This is a partial Stage 5/6 implementation only. Full playback worker/runtime orchestration remains unimplemented.

## Audit method

1. **Code and script inspection:**  The server code (`server/index.js`), helper scripts, and Python helpers
   were inspected for evidence of authentication, download pipelines, indexing, GPS parsing, geocoding, queue
   handling, playback logic, worker processes and cron integration.  Simple searches (e.g. `grep`) were
   performed for keywords such as `auth`, `icloud`, `index`, `parse`, `geocode`, `queue`, `worker`, and
   `cron`.
2. **Schema verification:**  The `schema.sql` file was reviewed to enumerate all proposed tables and
   indices.  Where tables existed only in the schema, the audit checked if any runtime code actually wrote
   to or read from them.
3. **Documentation cross‑check:**  Forward‑looking documents (e.g. `docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md`
   and `docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md`) were compared against the implemented code to
   identify mismatches between planned features and current reality.
4. **Runtime truth inspection:**  The `conf/runtime-truth.json` file and the `/api/runtime-truth` handlers in
   `server/index.js` were examined to understand how runtime state is persisted today.
5. **Scheduler and worker inspection:**  The scheduler host (`server/scheduler_host.js`) and Windows task
   scheduler script (`server/scripts/windows_task_scheduler.ps1`) were reviewed to determine whether any
   actual pipeline, playback or screen workers exist.

Throughout the audit, a feature was considered **implemented** only if there is runnable code that
performs the described behaviour.  Features described in comments, documentation or schemas without
corresponding runtime logic were classified as *docs only* or *missing*.

## Executive summary

The current repository is primarily a Vite‑based dashboard prototype with selective backend slices.  It
implements View A and View E backend paths for environment verification and database inspection, exposes a
mock runtime‑truth JSON file at `/api/runtime-truth`, and now includes synchronous runtime slices for Stage 1
download (`/api/runtime/download/run`), Stage 2 indexing (`/api/runtime/index/run`), Stage 5 queue preparation,
and Stage 6 current-item selection. Authentication and two-factor flows are absent, Stage 3/4 now exist as synchronous queue-processing routes, and the pipeline, playback, and screen workers remain stubs.  Cron scheduling support is partly
wired for Windows, while Raspberry Pi–specific scheduling is not yet implemented.  The documentation set still
describes a larger target architecture that the code base only partially realises.

## Status matrix by major system area

| Area | Status | Evidence / notes |
|---|---|---|
| **Authentication** | **Missing** | No server routes or scripts implement login or credential verification.  The only sensitive values referenced are `.env` keys checked for presence; there is no login handler or session management. |
| **2FA handling** | **Missing** | Two‑factor authentication is mentioned in documentation, but no code exists to prompt for or validate a second factor. |
| **Download backend** | **Partially implemented** | `POST /api/runtime/download/run` invokes `icloudpd`, ensures the download/cookie directories exist, and reports before/after supported-media counts. It is still a synchronous HTTP slice rather than the long-term worker model. |
| **Indexing backend** | **Partially implemented** | `POST /api/runtime/index/run` calls `server/scripts/sqlite_admin.py stage2_index_register`, scans the download directory, writes `canonical_media_assets`, `media_asset_variants`, and `parse_files_for_gps_queue`, and now bootstraps `schema.sql` automatically for a fresh repo-managed DB. |
| **GPS parsing backend** | **Partially implemented** | `POST /api/runtime/gps/run` now calls `server/scripts/sqlite_admin.py stage3_process_gps_queue`, reads `parse_files_for_gps_queue`, extracts EXIF GPS when available, updates `canonical_media_assets`, and seeds `geocode_queue` idempotently. |
| **Geocoding backend** | **Partially implemented** | `POST /api/runtime/geocode/run` now calls `server/scripts/sqlite_admin.py stage4_process_geocode_queue`, reads `geocode_queue`, writes deterministic placeholder addresses, updates `canonical_media_assets`, and populates `address_cache` idempotently. |
| **Address cache support** | **Partially implemented** | Stage 4 now inserts and reuses `address_cache` rows via a deterministic coordinate-based cache key. |
| **Enqueue‑for‑playback backend** | **Partially implemented** | `POST /api/runtime/queue/prepare` now inserts idempotent `READY` rows into `slideshow_queue` for eligible assets. |
| **Playback backend** | **Missing** | There is no playback service or worker consuming a queue.  Playback is simulated entirely on the frontend through mock state. |
| **Runtime state truth / persistence** | **Partially implemented** | `POST /api/runtime/playback/select-current` now writes `runtime_state.current_media_asset_id`; other runtime truth still relies on `conf/runtime-truth.json`. |
| **Required SQL schema / table support** | **Partially implemented** | Runtime code now reads/writes `slideshow_queue` and `runtime_state.current_media_asset_id`; most canonical/workflow tables remain unused by runtime workers. |
| **Worker model (regular/pipeline, playback, screen, recovery)** | **Stub only** | The repository includes `server/scheduler_host.js` and a Windows task scheduler script.  These wire up a heartbeat for a generic scheduler process but do not implement any pipeline, playback or screen workers.  Recovery logic is discussed in docs but absent in code. |
| **Cron / scheduler support (Raspberry Pi OS)** | **Partially implemented** | `server/index.js` exposes `/api/init/cron/install`, `/api/init/cron/status` and `/api/init/cron/print`.  The installation path primarily supports Windows via a PowerShell script, while Unix/Pi cron installation is left unimplemented. |
| **Windows scheduler support** | **Partially implemented** | A PowerShell script (`server/scripts/windows_task_scheduler.ps1`) can install and query a Windows Task Scheduler job, but it only launches the `scheduler_host.js` script and does not schedule real workers. |
| **Documentation alignment** | **Docs only** | The documentation accurately outlines a multi‑stage pipeline, but the implemented code covers only environment checks, an SQLite viewer and a mock runtime truth.  There is a wide gap between the planned architecture and current implementation. |

## Detailed findings by area

### Authentication and 2FA

No routes under `server/index.js` handle user credentials or sessions.  The only sensitive `.env` fields (`user` and
`pw`) are validated for presence by the `/api/init/verify-env` endpoint, but they are never used to authenticate
requests.  Two‑factor authentication is referenced in several documentation files, yet there is no logic to prompt
for a second factor or to handle a `WAITING_FOR_2FA` state.

### Download stage

The repository’s `.env` template defines `DOWNLOAD_DIR`, `ICLOUDPD_COOKIE_DIR` and `DOWNLOAD_RECENT` variables,
indicating intent to use the `icloudpd` utility.  However, no Node or Python module invokes `icloudpd`, and the
pipeline workers described in the docs are absent.  There are no scripts that copy or download media files into
the canonical asset directory.

### Indexing stage

Although `schema.sql` defines `canonical_media_assets` and `media_asset_variants`, there is no code to scan the
download directory, extract metadata or insert rows.  The only interactions with SQLite are in
`server/scripts/sqlite_admin.py`, which inspects and paginates arbitrary tables for the database viewer.  This helper
never writes data.

### GPS parsing stage

The schema includes a `parse_files_for_gps_queue` table and the runtime now exercises it through `POST /api/runtime/gps/run`. The Stage 3 slice is synchronous and queue-driven: it claims `PENDING` rows, attempts EXIF GPS extraction via Pillow, updates `canonical_media_assets`, marks queue rows as `COMPLETED` or `NO_GPS_FOUND`, and seeds `geocode_queue` idempotently for assets with real GPS coordinates. It is still not a long-running worker model.

### Geocoding stage and address cache

The `geocode_queue` and `address_cache` tables are now exercised by `POST /api/runtime/geocode/run`. The Stage 4 slice is synchronous and queue-driven: it processes queued assets that already have GPS coordinates, writes a deterministic placeholder address string, stores/reuses `address_cache` rows by rounded coordinate key, and updates `canonical_media_assets.geocode_status`. A real provider integration remains deferred.

### Enqueue for playback

`POST /api/runtime/queue/prepare` now inserts idempotent `READY` rows into `slideshow_queue` for assets that are
already geocoded with non-empty addresses.  This establishes the minimal Stage 5 backend slice.  Full worker
orchestration and queue replenishment from earlier pipeline stages are still missing.

### Playback backend

No playback worker or backend process exists.  Playback state is simulated on the frontend.  The backend does not
stream media or update play position, nor does it consume the queue.

### Runtime state

The repository still uses `conf/runtime-truth.json` for most runtime UI state surfaces via `/api/runtime-truth`.
Wave A now adds one durable runtime-state write path: `POST /api/runtime/playback/select-current` updates
`runtime_state.current_media_asset_id` together with slideshow playback history updates.  Broader runtime-state
migration to the database remains incomplete.

### Database schema

The `schema.sql` file defines twelve tables (`canonical_media_assets`, `media_asset_variants`, `address_cache`,
`parse_files_for_gps_queue`, `geocode_queue`, `slideshow_queue`, `runtime_state`, `action_runs`, `system_logs`,
and several indices).  These definitions match the target architecture described in the documentation.  Runtime
code now accesses `slideshow_queue` and `runtime_state` for Wave A, while most remaining tables are still unused.

### Workers and scheduler

The repository includes a scheduler host (`server/scheduler_host.js`) designed to run as a long‑lived process and
emit heartbeats.  A PowerShell script in `server/scripts/windows_task_scheduler.ps1` can install this host as a
Windows scheduled task.  The server also exposes `/api/init/cron/*` routes to check scheduler status.  Despite
these pieces, there are no worker scripts implementing pipeline stages (download, index, parse, geocode,
enqueue) or playback or screen control.  The scheduler host simply logs heartbeats and does not perform any
work.

### Cron/scheduler support

The `installCronHandler` in `server/index.js` acknowledges that Raspberry Pi OS support is deferred.  On Windows,
the script delegates to `windows_task_scheduler.ps1`, which can create and query a scheduled task.  The cron
status and print routes (`/api/init/cron/status` and `/api/init/cron/print`) return fixed JSON when running on
non‑Windows platforms.  Thus, scheduling support is partially implemented (Windows only) and does not install
any actual worker jobs.

### Documentation vs code conflicts

The architecture documents describe a complete multi‑stage pipeline with workers for downloading, indexing, GPS
parsing, geocoding, enqueueing, playback, screen control and recovery.  The current code base now implements a
minimal Wave A Stage 5/6 slice only; the remaining stages are still missing.  `runtime_state.current_media_asset_id`
is now persisted through Stage 6 selection, while broader runtime-state ownership remains unresolved.  The docs
still mention two‑factor authentication, but the server contains no authentication layer at all.

## Most critical missing or incomplete items

1. **Authentication and 2FA:**  Implement proper credential handling, session management, and two‑factor
   challenges before exposing a real download pipeline.
2. **Download worker:**  Integrate `icloudpd` or another download client to fetch media files into a staging
   directory and persist their metadata in `canonical_media_assets`.
3. **Indexing worker:**  Scan downloaded files, extract metadata (file size, capture time, GPS data) and insert
   rows into `canonical_media_assets` and `media_asset_variants`.
4. **GPS parsing worker:**  Populate `parse_files_for_gps_queue`, claim rows, extract GPS coordinates from
   EXIF/metadata and update the asset records.
5. **Geocoding worker:**  Use a geocoding API to convert GPS coordinates into human‑readable addresses, update
   `canonical_media_assets` and `address_cache` and mark rows in `geocode_queue` as complete.
6. **Enqueue worker hardening:**  Stage 5 queue insertion exists, but it still needs integration with Stage 2-4
   outputs and runtime execution orchestration.
7. **Playback worker:**  Stage 6 selection/pointer commit exists, but no actual playback worker loop, media
   rendering lifecycle, or scheduler ownership model is implemented.
8. **Persistent runtime state expansion:**  `runtime_state.current_media_asset_id` is now written, but most
   runtime truth still needs migration from JSON into `runtime_state`.
9. **Screen and recovery workers:**  Implement screen on/off state management and recovery/lease reclamation logic
   to enforce ownership and heartbeat semantics.

## Recommended next execution order

1. **Verify environment and database creation** (already implemented via `/api/init/verify-env` and `/api/init/database/*`).
2. **Build the download and indexing workers** (Wave B), enabling asset registration in `canonical_media_assets`.
3. **Implement GPS parsing and geocoding workers** (Wave C), integrating with the `parse_files_for_gps_queue`,
   `geocode_queue` and `address_cache` tables.
4. **Construct the playback worker** (Wave D) and migrate the remaining runtime truth from JSON to the database.
5. **Expand cron/scheduler support for Raspberry Pi OS** and unify worker scheduling across platforms.
6. **Implement authentication and 2FA** around the API endpoints before exposing any sensitive operations.

By following this order, each slice builds on the previous one, avoiding speculative complexity and ensuring
that features are added only when supporting infrastructure exists.

## Evidence basis

The classifications above derive from direct inspection of the following files and directories in the
repository snapshot:

- `server/index.js` — defines HTTP routes and now includes a minimal Wave A Stage 5/6 backend slice:
  `POST /api/runtime/queue/prepare` and `POST /api/runtime/playback/select-current`.
- `server/scripts/sqlite_admin.py` — now includes Stage 5/6 SQLite mutation operations in addition to
  inspect/recreate/rows helpers.
- `schema.sql` — declares canonical tables and indices for media assets, queues, runtime state, logs and action
  runs.  None of these tables are accessed by the server code.
- `conf/runtime-truth.json` — holds the current in‑memory runtime state used by `/api/runtime-truth`.
- `docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md` through
  `docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md` — describe planned pipeline stages, worker behaviour and
  locking semantics.  These documents highlight the gap between target architecture and implementation.
- `.env` and `server/index.js` — show environment keys expected for future features (`ICLOUDPD_COOKIE_DIR`,
  geocode batch size, worker heartbeats) but not yet used.

This audit was prepared without adding or modifying any code beyond documentation updates.
