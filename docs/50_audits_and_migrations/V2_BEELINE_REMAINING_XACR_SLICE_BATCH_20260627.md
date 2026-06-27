# V2 Beeline Remaining Slice XACR — 2026-06-27

## ACR read

The remaining sliceplan is still logical, but it has to stay safety-first. The correct order is not to jump straight into autonomous playback. The project first needs hard separation between TEST and REAL paths, then a single source-of-truth layer, then stage/result logging, then crontab and real playback proof.

## Implemented in this batch

### Slice 2 — verify.env hardening

`verify.env` now checks explicit TEST/REAL path pairs. Required pairs must be present. Required locations must exist. Identical or nested paths are blocked.

Checked pairs:

- `DOWNLOAD_DIR` / `TEST_DOWNLOAD_DIR`
- `LOG_DIR` / `TEST_LOG_DIR`
- `DB_PATH` / `TEST_DB_PATH`
- `FULL_LOG` / `TEST_FULL_LOG`
- `V2_WORKER_TRUTH_DIR` / `TEST_V2_WORKER_TRUTH_DIR`

DB and full-log checks require parent directories to exist. Directory checks require the directory itself to exist.

### Slice 5/6 — unified worker source-of-truth API

Added a backend-owned worker truth service and routes:

- `GET /api/v2/worker-truth?mode=test|real`
- `POST /api/v2/worker-truth/event`

The service reads three JSONL files per mode:

- `regular-worker.truth.jsonl`
- `playback-worker.truth.jsonl`
- `screen-worker.truth.jsonl`

The service returns a single time-sorted event stream and reports malformed JSONL lines without crashing.

### Slice 7/9 — pipeline truth events

The existing stage endpoints now write source-of-truth events around regular pipeline stage calls:

- download
- real download
- index
- GPS parser
- geocode
- queue prepare

Each stage writes a `started` event before the handler runs, a `finished` event on success, and an `error` event before rethrowing on failure. The event write is guarded so existing stage behavior is not silently replaced by the logging layer.

## Still remaining

The real autonomous playback engine is not complete yet. Remaining high-risk work:

1. Worker processes must write their own source-of-truth events directly.
2. The UI should poll `GET /api/v2/worker-truth` and replace placeholder RPI status with live combined status.
3. Crontab write-test still needs a real add/read/remove roundtrip.
4. Playback worker must prove real media display loop on Raspberry.
5. Screen on/off worker needs real hardware/fake-mode proof.
6. Recovery must connect worker restart checks to stored snapshots.

## Regression notes

Existing stage endpoints keep the same HTTP paths. Database commits still happen inside the existing database service stage functions. The new source-of-truth logging runs around those calls and does not replace database commit behavior.
