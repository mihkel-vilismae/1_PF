# Frontend / Backend Contract

## Purpose

This document defines the API and service contract needed to support dashboard views A/B/C/D.

## General Rules

- Frontend reads authoritative data through backend APIs only.
- Frontend never writes database records directly.
- All write endpoints must be idempotent where practical or explicitly reject duplicates.

## Shared Frontend Services

These are frontend abstractions only; they do not own business logic.

- `apiClient` — transport wrapper
- `runtimeService` — read current runtime state and last-run projections
- `cronService` — invoke cron-related API actions from view A
- `screenService` — invoke screen-related control and read state for views B/D
- `databaseService` — invoke database inspection/reset endpoints from view A
- `testService` — invoke simulation endpoints for view B

## View A Contract

### 1A Verify `.env`
- `POST /api/init/verify-env`
- response: status, checks, messages

### 2A Database controls
- `GET /api/init/database/status`
- `POST /api/init/database/inspect`
- `POST /api/init/database/delete`
- `POST /api/init/database/recreate-empty`

### 3A Cron controls
- `POST /api/init/cron/install`
- `GET /api/init/cron/status`
- `GET /api/init/cron/print`

## View B Contract (test / simulation only)

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

- `GET /api/runtime/last-run`
- returns one of:
  - no run yet
  - last run snapshot
  - error
- `POST /api/runtime/restore-last-known-state` (administrative placeholder endpoint)

## View D Contract

- `GET /api/runtime/current`
- `GET /api/runtime/workers`
- `POST /api/runtime/start`
- `POST /api/runtime/stop`

## Projection Rule

`/api/runtime/current` should return a projection that already joins canonical runtime state with the most relevant latest worker heartbeat and queue summary, so the frontend does not reconstruct operational truth on its own.

## Evidence Basis

Derived from the user's dashboard definition for views A/B/C/D, the request for shared frontend service layers for cron, screen, and database access, and the need to distinguish test simulation from real runtime.

## Frontend File Alignment

The current frontend implementation is organized as:

- `dashboard/app.js` — shell composition and event binding
- `dashboard/views/` — separate view renderers for A, B, C, and D
- `dashboard/services/runtimeTruth.js` — current frontend mock source of truth and action simulation
- `dashboard/services/renderers.js` — shared rendering helpers
- `dashboard/shared/constants.js` — frontend constants and view metadata

The future frontend service layer should preserve this separation and replace mock state transitions with backend-backed service calls without collapsing the view structure.

