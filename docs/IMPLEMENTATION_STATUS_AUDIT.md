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

The current repository is primarily a Vite‑based dashboard prototype with minimal backend support.  It
implements View A and View E backend slices for environment verification and database inspection, along with a
mock runtime‑truth JSON file served over `/api/runtime-truth`.  The canonical database schema exists as a
proposal in `schema.sql`, but none of the five core processing stages (download, indexing, GPS parsing,
geocoding, enqueueing, playback) have been built.  Authentication and two‑factor flows are absent, and the
pipeline, playback and screen workers remain stubs.  Cron scheduling support is partly wired for Windows,
while Raspberry Pi–specific scheduling is not yet implemented.  The documentation set describes an ambitious
future architecture, but the code base at this snapshot does not yet realise those plans.

## Status matrix by major system area

| Area | Status | Evidence / notes |
|---|---|---|
| **Authentication** | **Missing** | No server routes or scripts implement login or credential verification.  The only sensitive values referenced are `.env` keys checked for presence; there is no login handler or session management. |
| **2FA handling** | **Missing** | Two‑factor authentication is mentioned in documentation, but no code exists to prompt for or validate a second factor. |
| **Download backend** | **Missing** | The docs describe using `icloudpd` for downloads, but there is no Node or Python code that invokes it.  The `.env` file defines `ICLOUDPD_COOKIE_DIR` and other keys, but these values are never used at runtime. |
| **Indexing backend** | **Missing** | There are no modules or scripts that scan downloaded files and insert records into `canonical_media_assets`.  No indexing routes or functions exist. |
| **GPS parsing backend** | **Missing** | The schema defines `parse_files_for_gps_queue`, but no code reads from or writes to it.  No GPS extraction logic is present. |
| **Geocoding backend** | **Missing** | The schema defines `geocode_queue` and `address_cache`, but there is no code performing geocoding or populating these tables. |
| **Address cache support** | **Docs only** | The `address_cache` table exists in `schema.sql`, but no backend functions read from or insert into it. |
| **Enqueue‑for‑playback backend** | **Docs only** | The `slideshow_queue` table exists in the schema, yet no code enqueues assets or reads from this queue. |
| **Playback backend** | **Missing** | There is no playback service or worker consuming a queue.  Playback is simulated entirely on the frontend through mock state. |
| **Runtime state truth / persistence** | **Stub only** | Persistent state is represented by `conf/runtime-truth.json`, which is served and updated by `/api/runtime-truth` handlers.  The `runtime_state` table defined in `schema.sql` is unused. |
| **Required SQL schema / table support** | **Docs only** | `schema.sql` defines a comprehensive canonical schema (media assets, queues, logs, etc.), but none of these tables are used by the current runtime.  The only SQL operations performed are inspection queries via the `sqlite_admin.py` helper. |
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

The schema includes a `parse_files_for_gps_queue` table meant to track GPS extraction attempts, but no code
manipulates this queue.  There is no GPS parsing logic in either Node or Python, and no worker that claims or
updates queue rows.

### Geocoding stage and address cache

The `geocode_queue` and `address_cache` tables are defined in the schema, and `.env` exposes `GEOCODE_BATCH_SIZE` and
`GEOCODE_LANGUAGE`.  However, there is no geocoding client implemented.  The repository does not reference any
geocoding API, and no functions insert or read from `address_cache`.

### Enqueue for playback

The `slideshow_queue` table exists only in the schema.  There are no API routes, workers or scripts that insert
eligible media into this queue.  The frontend uses a mock queue length stored in `conf/runtime-truth.json` to
simulate playback readiness.

### Playback backend

No playback worker or backend process exists.  Playback state is simulated on the frontend.  The backend does not
stream media or update play position, nor does it consume the queue.

### Runtime state

The repository uses a JSON file (`conf/runtime-truth.json`) as its source of truth.  The `/api/runtime-truth`
endpoints read and write this file.  While the schema defines a `runtime_state` table and inserts default keys
into it, there is no code that reads or writes those entries.  As such, the durable runtime state defined in the
schema is unused, and the current implementation uses an in‑memory/JSON stub.

### Database schema

The `schema.sql` file defines twelve tables (`canonical_media_assets`, `media_asset_variants`, `address_cache`,
`parse_files_for_gps_queue`, `geocode_queue`, `slideshow_queue`, `runtime_state`, `action_runs`, `system_logs`,
and several indices).  These definitions match the target architecture described in the documentation.  However,
none of these tables are accessed by the runtime code except via the database viewer.

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
parsing, geocoding, enqueueing, playback, screen control and recovery.  The current code base implements none
of these stages.  The schema defines all required tables, but they are unused.  `runtime_state` keys described in
the documentation are not persisted in the DB.  While the docs mention two‑factor authentication, the server
contains no authentication layer at all.  The mismatch between target design and implemented code is stark.

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
6. **Enqueue worker:**  Select eligible assets and insert them into `slideshow_queue` with appropriate
   `eligible_since` timestamps and sort buckets.
7. **Playback worker:**  Consume entries from `slideshow_queue`, update `runtime_state.current_media_asset_id`,
   track viewing history and handle both images and videos.
8. **Persistent runtime state:**  Migrate runtime truth from JSON to the `runtime_state` table and implement
   row‑level updates via an API.
9. **Screen and recovery workers:**  Implement screen on/off state management and recovery/lease reclamation logic
   to enforce ownership and heartbeat semantics.

## Recommended next execution order

1. **Verify environment and database creation** (already implemented via `/api/init/verify-env` and `/api/init/database/*`).
2. **Implement the queue‑backed current‑item selection (Wave A)** as described in the sequential roadmap, to
   establish a minimal backend slice that writes to and reads from `slideshow_queue` and updates
   `runtime_state.current_media_asset_id`.
3. **Build the download and indexing workers** (Wave B), enabling asset registration in `canonical_media_assets`.
4. **Implement GPS parsing and geocoding workers** (Wave C), integrating with the `parse_files_for_gps_queue`,
   `geocode_queue` and `address_cache` tables.
5. **Construct the playback worker** (Wave D) and migrate the runtime truth from JSON to the database.
6. **Expand cron/scheduler support for Raspberry Pi OS** and unify worker scheduling across platforms.
7. **Implement authentication and 2FA** around the API endpoints before exposing any sensitive operations.

By following this order, each slice builds on the previous one, avoiding speculative complexity and ensuring
that features are added only when supporting infrastructure exists.

## Evidence basis

The classifications above derive from direct inspection of the following files and directories in the
repository snapshot:

- `server/index.js` — defines HTTP routes and confirms the lack of authentication, download, indexing, GPS parsing,
  geocoding, enqueue or playback handlers.  The only runtime truth handlers operate on `conf/runtime-truth.json`.
- `server/scripts/sqlite_admin.py` — provides read‑only inspection of SQLite files; no data‑mutation functions are
  present.
- `schema.sql` — declares canonical tables and indices for media assets, queues, runtime state, logs and action
  runs.  None of these tables are accessed by the server code.
- `conf/runtime-truth.json` — holds the current in‑memory runtime state used by `/api/runtime-truth`.
- `docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md` through
  `docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md` — describe planned pipeline stages, worker behaviour and
  locking semantics.  These documents highlight the gap between target architecture and implementation.
- `.env` and `server/index.js` — show environment keys expected for future features (`ICLOUDPD_COOKIE_DIR`,
  geocode batch size, worker heartbeats) but not yet used.

This audit was prepared without adding or modifying any code beyond documentation updates.