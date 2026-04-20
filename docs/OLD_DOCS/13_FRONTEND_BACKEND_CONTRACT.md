# Frontend / Backend Contract

## Purpose

This document defines the API and service contract needed to support dashboard views A/B/C/D.

## General Rules

- Frontend reads authoritative data through backend APIs only.
- Frontend never writes database records directly.
- All write endpoints must be idempotent where practical or explicitly reject duplicates.
- In the current repo snapshot, that backend-authority rule is implemented for View A only; Views B, C, and D remain planned contracts.

## Shared Frontend Services

These are frontend abstractions only; they do not own business logic.

- `apiClient` — transport wrapper
- `runtimeService` — read current runtime state and last-run projections
- `cronService` — invoke the legacy `/api/init/cron/*` scheduler-management actions from view A
- `screenService` — invoke screen-related control and read state for views B/D
- `databaseService` — invoke database inspection/reset endpoints from view A
- `testService` — invoke simulation endpoints for view B

## View A Contract

Current error envelope for implemented A endpoints:

- `status: "error"`
- `error`
- `message`
- `details` when available

Known live error cases in the current repo include missing confirmation for destructive DB actions, missing DB path or database file conditions, and Windows Task Scheduler command failures when the helper script cannot install/read the task.

### 1A Verify `.env`
- `POST /api/init/verify-env`
- response: status, checks, messages

Current response schema:

- `status`: `ok` | `warning` | `error`
- `messages`: string array
- `checks`: array of:
  - `key`
  - `label`
  - `required`
  - `present`
  - `valid`
  - `severity`
  - `message`
  - `valuePreview`
  - `details`
- `schemaVersion`
- `verifiedAt`

### 2A Database controls
- `GET /api/init/database/status`
- `POST /api/init/database/inspect`
- `POST /api/init/database/delete`
- `POST /api/init/database/recreate-empty`

Current response schema:

- `GET /api/init/database/status`
  - `status`
  - `messages`
  - `database`
  - `schemaVersion`
- `POST /api/init/database/inspect`
  - `status`
  - `messages`
  - `database`
  - `inspection`
  - `schemaVersion`
- `POST /api/init/database/delete`
  - request body must include:
    - `confirm: true`
    - `action: "delete-db"`
  - response includes:
    - `status`
    - `messages`
    - `confirmed`
    - `database`
    - `removedPaths`
    - `schemaVersion`
- `POST /api/init/database/recreate-empty`
  - request body must include:
    - `confirm: true`
    - `action: "recreate-db"`
  - response includes:
    - `status`
    - `messages`
    - `confirmed`
    - `database`
    - `schemaVersion`

### 3A Scheduler controls
- `POST /api/init/cron/install`
- `GET /api/init/cron/status`
- `GET /api/init/cron/print`

Current response schema:

- top-level response:
  - `status`
  - `messages`
  - `scheduler`
  - `schemaVersion`
- `scheduler` includes:
  - `status`
  - `messages`
  - `routeCompatibility`
  - `platform`
  - `platformProfile`
  - `platformProfileLabel`
  - `schedulerTarget`
  - `schedulerMode`
  - `supportLevel`
  - `operation`
  - `operationSupportLevel`
  - `taskName`
  - `cadence`
  - `command`
  - `task`
  - `host`
  - `notes`
  - `capability`
- current implementation note:
  - the route names stay `/api/init/cron/*` for frontend compatibility
  - one shared scheduler capability profile is used by both backend response shaping and View A UI behavior
  - on Windows 11, install/status/print are `supported` and use an `AtLogOn` Task Scheduler bootstrap task that launches a repo-local scheduler host
  - on Raspberry Pi OS profile (`linux` runtime), install is currently `deferred` while status/print return informational capability payloads
  - unsupported platforms keep honest capability reporting with `unsupported` support levels rather than pretending install exists
  - the host preserves the documented `5s/5s/5s/15s` timing model because Task Scheduler repetition intervals have a documented 1-minute minimum
  - the host currently reports heartbeat/tick state only; it does not yet run the real runtime services

## View B Contract (test / simulation only)

These endpoints are planned only in the current repo snapshot; no `/api/test/*` handlers exist yet in `server/index.js`.

### B1 Login flow
- `POST /api/test/login/run`

### B2 Download 5 files
- `POST /api/test/download-five/run`

### B3 Pipeline stages
- `POST /api/test/pipeline/mock-download/run`
- `POST /api/test/pipeline/index/run`
- `POST /api/test/pipeline/parse-gps/run`
- `POST /api/test/pipeline/geocode/run`
- `POST /api/test/pipeline/enqueue-playback/run`
- `POST /api/test/pipeline/run-all`

### B4 Playback emulation
- `POST /api/test/playback/run`
- `GET /api/test/playback/state`

### B5 Screen on/off simulation
- `POST /api/test/screen/configure`
- `GET /api/test/screen/state`

## View C Contract

These endpoints are planned only in the current repo snapshot; no `/api/runtime/last-run` or restore handlers exist yet.

- `GET /api/runtime/last-run`
- returns one of:
  - no run yet
  - last run snapshot
  - error
- `POST /api/runtime/restore-last-known-state` (administrative placeholder endpoint)

## View D Contract

These endpoints are planned only in the current repo snapshot; no `/api/runtime/current`, `/api/runtime/workers`, `/api/runtime/start`, or `/api/runtime/stop` handlers exist yet.

- `GET /api/runtime/current`
- `GET /api/runtime/workers`
- `POST /api/runtime/start`
- `POST /api/runtime/stop`

## Projection Rule

`/api/runtime/current` should return a projection that already joins canonical runtime state with the most relevant latest worker heartbeat and queue summary, so the frontend does not reconstruct operational truth on its own.

## Evidence Basis

Derived from direct inspection of the current repo plus the target dashboard contract split, especially `dashboard/services/initService.js`, `server/index.js`, `server/scheduler_host.js`, `docs/09_CRON_AND_WATCHDOG.md`, and the current dashboard view docs.

## Frontend File Alignment

The current frontend implementation is organized as:

- `dashboard/app.js` — shell composition and event binding
- `dashboard/views/` — separate view renderers for A, B, C, and D
- `dashboard/services/runtimeTruth.js` — current frontend mock source of truth and action simulation
- `dashboard/services/renderers.js` — shared rendering helpers
- `dashboard/shared/constants.js` — frontend constants and view metadata

The future frontend service layer should preserve this separation and replace mock state transitions with backend-backed service calls without collapsing the view structure.
