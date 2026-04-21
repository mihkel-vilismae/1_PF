# Frontend / Backend Contract

## Purpose

This document defines the API contract for dashboard views A, B, C, D, and E.

## Current Implementation Truth

- `implemented`: View A init/database/scheduler routes, View E database-viewer routes, and `/api/runtime-truth` persistence routes in `server/index.js`.
- `implemented`: frontend View E wiring through `dashboard/services/databaseViewerService.js`, `dashboard/services/runtimeTruth.js`, `dashboard/views/databaseViewerView.js`, and `dashboard/app.js`.
- `planned`: `/api/runtime/*` and `/api/test/*` routes in this document.
- `implemented`: frontend runtime-truth hydration/persistence against `/api/runtime-truth`.
- `planned`: frontend `runtimeService`, `testService`, and `screenService` migration away from demo-only transitions in `dashboard/services/runtimeTruth.js`.

## Global Rules

- Frontend reads authoritative operational state through backend APIs only.
- Frontend never writes database records directly.
- Write endpoints must be idempotent or explicitly reject duplicates with a structured error.
- This contract keeps `implemented` behavior separate from `planned` behavior. Planned schemas are normative for upcoming implementation and must not be presented as already live.

## Shared Frontend Services

- `apiClient`: transport wrapper and error propagation.
- `runtimeService`: runtime read/control and restore endpoints.
- `cronService`: legacy `/api/init/cron/*` actions for View A.
- `databaseService`: View A database endpoints.
- `databaseViewerService`: `/api/database-viewer/*` verify/connect/browse/logging actions for View E.
- `testService`: `/api/test/*` stage and flow actions for View B.
- `screenService`: `/api/test/screen/*` read/configure calls for B5 and D screen-related surfaces.

## Shared Envelope Rules

### Implemented View A / View E Error Envelope

The currently implemented View A, View E, and `/api/runtime-truth` backend uses:

- `status: "error"`
- `error`
- `message`
- `details` (optional)

### Planned Runtime/Test Error Envelope (Normative)

All new `/api/runtime/*` and `/api/test/*` endpoints must use:

- `status`: must be `"error"`.
- `error`: machine-readable code string.
- `message`: operator-readable message string.
- `details`: structured object (optional).
- `schemaVersion`: integer.

Example:

```json
{
  "status": "error",
  "error": "missing_confirmation",
  "message": "Explicit restore confirmation is required.",
  "details": {
    "expected": {
      "confirm": true,
      "action": "restore-last-known-state",
      "confirmationPhrase": "RESTORE_LAST_KNOWN_STATE"
    }
  },
  "schemaVersion": 1
}
```

### Planned Write Idempotency Rule (Normative)

- `POST /api/runtime/start`, `POST /api/runtime/stop`, and `POST /api/runtime/restore-last-known-state` require `idempotencyKey` in request body.
- Reusing the same `idempotencyKey` for the same action returns `200` with outcome `duplicate-request` and the original effective result summary.
- Reusing the same `idempotencyKey` for a different action returns `409` with `error: "idempotency_conflict"`.

## View A Contract

Implementation status: `implemented`

### 1A Verify `.env`

- Endpoint: `POST /api/init/verify-env`
- Response schema:
  - `status`: `ok` | `warning` | `error`
  - `messages`: string[]
  - `checks`: object[]
  - `schemaVersion`: integer
  - `verifiedAt`: ISO-8601 datetime string

### 2A Database Controls

- Endpoints:
  - `GET /api/init/database/status`
  - `POST /api/init/database/inspect`
  - `POST /api/init/database/delete`
  - `POST /api/init/database/recreate-empty`
- Destructive action request requirements:
  - `confirm: true`
  - `action: "delete-db"` or `action: "recreate-db"`

### 3A Scheduler Controls

- Endpoints:
  - `POST /api/init/cron/install`
  - `GET /api/init/cron/status`
  - `GET /api/init/cron/print`
- Response includes:
  - `status`
  - `messages`
  - `scheduler`
  - `schemaVersion`
- Current host limitation:
  - scheduler host currently reports heartbeat/tick status and does not yet execute business runtime services.

## View E Contract

Implementation status: `implemented` for the repo-local backend endpoints

### Verify Database

- Endpoint: `POST /api/database-viewer/verify`
- Response schema:
  - `status`: `ok` | `error`
  - `messages`: string[]
  - `verificationPassed`: boolean
  - `database`: object with DB file path/status metadata
  - `requiredTables`: object with `sourcePath`, `sourceLabel`, `note`, `expected`, `present`, `missing`
  - `availableObjects`: object[] with `name`, `kind`, and `columnCount`
  - `loggingCoverage`: string
  - `schemaVersion`: integer
  - `verifiedAt`: ISO-8601 datetime string
- Current required-table source:
  - `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md`
  - This is a documented target truth-surface reference, not proof that the current repo runtime already contains the full table set.

### Connect to Database

- Endpoint: `POST /api/database-viewer/connect`
- Response includes:
  - `status`
  - `messages`
  - `connected`
  - `gate`: currently `"logical_backend_authorization"`
  - `database`
  - `requiredTables`
  - `loggingCoverage`
  - `schemaVersion`
  - `connectedAt`
- Current behavior:
  - this is a logical gate only
  - table and row requests still execute as fresh backend calls rather than reusing a durable DB session

### Show Tables

- Endpoint: `GET /api/database-viewer/tables`
- Response includes:
  - `status`
  - `messages`
  - `database`
  - `objects`
  - `sqlite`
  - `loggingCoverage`
  - `schemaVersion`
- Current failure mode:
  - returns `database_missing` if the DB file does not exist

### Inspect Rows

- Endpoint: `POST /api/database-viewer/rows`
- Request body schema:
  - `tableName`: required non-empty string
  - `page`: optional zero-based integer, default `0`
  - `pageSize`: optional integer, default `50`, max `100`
- Response includes:
  - `status`
  - `messages`
  - `database`
  - `table`
  - `loggingCoverage`
  - `schemaVersion`
- Backend-owned ordering rules:
  - descending preferred timestamp column when available
  - otherwise descending integer primary key
  - otherwise `rowid DESC` for tables
  - otherwise first-column descending as a best-effort fallback for views or rowid-less objects

### Logging Controls

- Endpoints:
  - `POST /api/database-viewer/logging/start`
  - `POST /api/database-viewer/logging/stop`
- `start` returns:
  - current `database` status
  - active `logging` state with `sessionId`, `startedAt`, `coverage`, `entryCount`, and `entries`
- `stop` returns:
  - stopped `logging` state with `sessionId`, `startedAt`, `endedAt`, `coverage`, `entryCount`, and `entries`
- Current scope limitation:
  - logging is in-memory and session-bounded for the current backend process
  - entries capture database-viewer requests and other repo-local backend DB actions observed through this server while active
  - it does not guarantee global SQL tracing or visibility into unrelated external processes

## Runtime API Contract (Views C and D)

All endpoints in this section are implementation status: `planned`.

### Shared Runtime Projection Types

`RuntimeTruthProjection` fields:

- `queueLength`: integer `>= 0`
- `currentMedia`: `null` or object with `name`, `type`, `position`, `overlay`
- `playbackStatus`: string
- `screenState`: `"ON"` | `"OFF"`
- `lastActivitySource`: string
- `inactivityTimeoutSeconds`: integer `> 0`
- `lastCheckpoint`: string
- `lastStageCompleted`: string
- `realRunActive`: boolean
- `stageLock`: string
- `playbackLock`: string
- `screenLock`: string
- `pipelineActiveKey`: `null` or string
- `playbackActive`: boolean
- `realRunStartCount`: integer `>= 0`
- `sourceOfTruth`: string path

`WorkerProjection` fields:

- `worker`: string (`pipeline`, `playback`, `screen`)
- `status`: `running` | `idle` | `stale` | `error` | `stopped`
- `heartbeatAt`: ISO-8601 datetime string or `null`
- `heartbeatAgeSeconds`: integer or `null`
- `stale`: boolean
- `lockState`: string
- `summary`: string
- `lastRun`: object or `null`

### GET `/api/runtime/current`

- Implementation status: `planned`
- Request body: none
- Success response schema:
  - `status`: `ok` | `warning`
  - `messages`: string[]
  - `runtime`:
    - `truth`: `RuntimeTruthProjection`
    - `queueSummary`: object with `queuedCount`, `headMediaName`, `updatedAt`
    - `recovery`: object with `canRestore`, `lastSnapshotId`, `lastSnapshotAt`
    - `updatedAt`: ISO-8601 datetime string
  - `schemaVersion`: integer
- Error response schema: shared runtime/test error envelope
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Runtime projection assembled from persisted truth and worker observations."
  ],
  "runtime": {
    "truth": {
      "queueLength": 3,
      "currentMedia": {
        "name": "same_gps_03.jpg",
        "type": "Image",
        "position": "2 of 3",
        "overlay": "Tallinn, Harjumaa, Estonia"
      },
      "playbackStatus": "Displaying media",
      "screenState": "ON",
      "lastActivitySource": "Mouse movement",
      "inactivityTimeoutSeconds": 5,
      "lastCheckpoint": "2026-04-21T09:14:23.000Z checkpoint saved",
      "lastStageCompleted": "B3.5",
      "realRunActive": true,
      "stageLock": "Pipeline lock held by B3.2",
      "playbackLock": "Playback worker lock held",
      "screenLock": "Screen worker lock held",
      "pipelineActiveKey": "B3.2",
      "playbackActive": true,
      "realRunStartCount": 2,
      "sourceOfTruth": "conf/runtime-truth.json"
    },
    "queueSummary": {
      "queuedCount": 3,
      "headMediaName": "same_gps_03.jpg",
      "updatedAt": "2026-04-21T09:14:23.000Z"
    },
    "recovery": {
      "canRestore": true,
      "lastSnapshotId": "snapshot-2026-04-21T09:13:59.000Z",
      "lastSnapshotAt": "2026-04-21T09:13:59.000Z"
    },
    "updatedAt": "2026-04-21T09:14:23.000Z"
  },
  "schemaVersion": 1
}
```

Assumptions/proposals note: worker and recovery sub-objects are planned contract fields inferred from View C/D needs; current backend does not yet expose this endpoint.

### GET `/api/runtime/workers`

- Implementation status: `planned`
- Request body: none
- Success response schema:
  - `status`: `ok` | `warning`
  - `messages`: string[]
  - `workers`:
    - `pipeline`: `WorkerProjection`
    - `playback`: `WorkerProjection`
    - `screen`: `WorkerProjection`
  - `observedAt`: ISO-8601 datetime string
  - `schemaVersion`: integer
- Error response schema: shared runtime/test error envelope
- Example success:

```json
{
  "status": "warning",
  "messages": [
    "Playback worker heartbeat is stale."
  ],
  "workers": {
    "pipeline": {
      "worker": "pipeline",
      "status": "running",
      "heartbeatAt": "2026-04-21T09:14:20.000Z",
      "heartbeatAgeSeconds": 3,
      "stale": false,
      "lockState": "Pipeline lock held by B3.2",
      "summary": "Index stage active.",
      "lastRun": {
        "stage": "index",
        "completedAt": "2026-04-21T09:13:55.000Z"
      }
    },
    "playback": {
      "worker": "playback",
      "status": "stale",
      "heartbeatAt": "2026-04-21T09:12:10.000Z",
      "heartbeatAgeSeconds": 133,
      "stale": true,
      "lockState": "Playback worker lock held",
      "summary": "No recent watchdog heartbeat.",
      "lastRun": null
    },
    "screen": {
      "worker": "screen",
      "status": "running",
      "heartbeatAt": "2026-04-21T09:14:18.000Z",
      "heartbeatAgeSeconds": 5,
      "stale": false,
      "lockState": "Screen worker lock held",
      "summary": "Screen state ON.",
      "lastRun": null
    }
  },
  "observedAt": "2026-04-21T09:14:23.000Z",
  "schemaVersion": 1
}
```

Assumptions/proposals note: staleness/status semantics are normative here for implementation; backend currently lacks worker route handlers.

### GET `/api/runtime/last-run`

- Implementation status: `planned`
- Request body: none
- Success response schema:
  - `status`: `ok` | `warning` | `error`
  - `messages`: string[]
  - `mode`: `no-run` | `snapshot` | `error`
  - `lastRun`: object or `null`
  - `schemaVersion`: integer
- `mode` semantics:
  - `no-run`: no authoritative last-run snapshot exists yet.
  - `snapshot`: snapshot object is present and can drive View C.
  - `error`: a last run exists but failed and carries recoverable failure evidence.
- Error response schema: shared runtime/test error envelope (transport or server failure).
- Example `no-run`:

```json
{
  "status": "warning",
  "messages": [
    "No runtime snapshot has been captured yet."
  ],
  "mode": "no-run",
  "lastRun": null,
  "schemaVersion": 1
}
```

- Example `snapshot`:

```json
{
  "status": "ok",
  "messages": [
    "Last runtime snapshot loaded."
  ],
  "mode": "snapshot",
  "lastRun": {
    "snapshotId": "snapshot-2026-04-21T09:13:59.000Z",
    "capturedAt": "2026-04-21T09:13:59.000Z",
    "media": {
      "file": "same_gps_03.jpg",
      "type": "Image",
      "queuePosition": "2 of 3",
      "checkpoint": "09:13:59 checkpoint saved"
    },
    "playback": {
      "status": "Paused by inactivity",
      "lastCheckpoint": "09:13:59",
      "resumeMarker": "same_gps_03.jpg :: display-start",
      "crashState": "Recovered after simulated power loss"
    },
    "stage": {
      "active": "Playback",
      "lastCompleted": "Queue Slideshow",
      "previousStage": "Geocode",
      "stageError": "None"
    },
    "screen": {
      "state": "OFF",
      "lastActivitySource": "PIR timeout elapsed",
      "timeout": "5 seconds",
      "transition": "screen_off_due_to_inactivity"
    }
  },
  "schemaVersion": 1
}
```

- Example `error`:

```json
{
  "status": "error",
  "messages": [
    "Last run ended with a recoverable stage failure."
  ],
  "mode": "error",
  "lastRun": {
    "snapshotId": "snapshot-2026-04-21T09:13:59.000Z",
    "capturedAt": "2026-04-21T09:13:59.000Z",
    "failure": {
      "stage": "geocode",
      "errorCode": "geocode_rate_limited",
      "message": "Rate limit reached while geocoding.",
      "recoverable": true
    }
  },
  "schemaVersion": 1
}
```

Assumptions/proposals note: `mode` is normative contract state for View C, even though the backend implementation is not present yet.

### POST `/api/runtime/start`

- Implementation status: `planned`
- Request body schema:
  - `confirm`: boolean; must be `true`
  - `action`: string; must be `"start-runtime"`
  - `idempotencyKey`: non-empty string
  - `requestedBy`: non-empty string
  - `reason`: non-empty string (optional)
- Success response schema:
  - `status`: `ok` | `warning`
  - `messages`: string[]
  - `transition`:
    - `action`: `"start-runtime"`
    - `outcome`: `started` | `already-running` | `duplicate-request`
    - `idempotencyKey`: string
    - `requestedBy`: string
    - `recordedAt`: ISO-8601 datetime string
  - `runtime`: object with at least `realRunActive` and `realRunStartCount`
  - `schemaVersion`: integer
- Error response schema: shared runtime/test error envelope
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Runtime start accepted."
  ],
  "transition": {
    "action": "start-runtime",
    "outcome": "started",
    "idempotencyKey": "d2be0eb8-6f8c-47df-bfe5-3194047bb66a",
    "requestedBy": "dashboard-operator",
    "recordedAt": "2026-04-21T09:16:00.000Z"
  },
  "runtime": {
    "realRunActive": true,
    "realRunStartCount": 3
  },
  "schemaVersion": 1
}
```

Assumptions/proposals note: confirmation and operator metadata are proposed guardrails to align with existing destructive-action patterns in View A.

### POST `/api/runtime/stop`

- Implementation status: `planned`
- Request body schema:
  - `confirm`: boolean; must be `true`
  - `action`: string; must be `"stop-runtime"`
  - `idempotencyKey`: non-empty string
  - `requestedBy`: non-empty string
  - `reason`: non-empty string (optional)
- Success response schema:
  - `status`: `ok` | `warning`
  - `messages`: string[]
  - `transition`:
    - `action`: `"stop-runtime"`
    - `outcome`: `stopped` | `already-stopped` | `duplicate-request`
    - `idempotencyKey`: string
    - `requestedBy`: string
    - `recordedAt`: ISO-8601 datetime string
  - `runtime`: object with at least `realRunActive`
  - `schemaVersion`: integer
- Error response schema: shared runtime/test error envelope
- Example success:

```json
{
  "status": "warning",
  "messages": [
    "Runtime was already stopped; no state transition was needed."
  ],
  "transition": {
    "action": "stop-runtime",
    "outcome": "already-stopped",
    "idempotencyKey": "93a8b2d5-d4ea-40ef-b2c4-5e77d4502c65",
    "requestedBy": "dashboard-operator",
    "recordedAt": "2026-04-21T09:16:45.000Z"
  },
  "runtime": {
    "realRunActive": false
  },
  "schemaVersion": 1
}
```

Assumptions/proposals note: idempotent no-op stop behavior is required so frontend stop controls can safely retry.

### POST `/api/runtime/restore-last-known-state`

- Implementation status: `planned`
- Request body schema:
  - `confirm`: boolean; must be `true`
  - `action`: string; must be `"restore-last-known-state"`
  - `confirmationPhrase`: string; must be `"RESTORE_LAST_KNOWN_STATE"`
  - `idempotencyKey`: non-empty string
  - `requestedBy`: non-empty string
  - `reason`: non-empty string
  - `snapshotId`: non-empty string (target snapshot)
- Success response schema:
  - `status`: `ok` | `warning`
  - `messages`: string[]
  - `restore`:
    - `outcome`: `restored` | `no-op-already-matching` | `duplicate-request`
    - `snapshotId`: string
    - `idempotencyKey`: string
    - `auditId`: string
    - `requestedBy`: string
    - `reason`: string
    - `recordedAt`: ISO-8601 datetime string
  - `runtime`: object with restored runtime projection summary
  - `schemaVersion`: integer
- Error response schema: shared runtime/test error envelope
- Required guarded failure cases:
  - `400 missing_confirmation`: confirm/action/phrase missing or invalid.
  - `404 snapshot_not_found`: requested snapshot does not exist.
  - `409 idempotency_conflict`: key reused for conflicting action/snapshot.
  - `409 restore_conflict`: restore rejected due to incompatible active state.
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Runtime restored from last known snapshot."
  ],
  "restore": {
    "outcome": "restored",
    "snapshotId": "snapshot-2026-04-21T09:13:59.000Z",
    "idempotencyKey": "4bbf5d5f-e38f-40f2-a2cf-87b89fd61f56",
    "auditId": "audit-restore-00042",
    "requestedBy": "dashboard-operator",
    "reason": "Recover from watchdog crash",
    "recordedAt": "2026-04-21T09:17:11.000Z"
  },
  "runtime": {
    "realRunActive": false,
    "playbackStatus": "Paused by inactivity",
    "lastCheckpoint": "09:13:59 checkpoint saved"
  },
  "schemaVersion": 1
}
```

Assumptions/proposals note: explicit phrase + operator metadata + audit ID are normative guardrails to prevent accidental or untraceable restore actions.

## Test API Contract (View B)

All endpoints in this section are implementation status: `planned`.

### Shared Test Response Shape

`POST /api/test/*` success responses:

- `status`: `ok` | `warning`
- `messages`: string[]
- `test`:
  - `flow`: endpoint-specific flow key
  - `outcome`: `started` | `completed` | `blocked` | `duplicate-request`
  - `recordedAt`: ISO-8601 datetime string
- `projection`: object with endpoint-relevant subset of:
  - `truth`
  - `runningProcess`
  - `lastRunMode`
  - `lastRunData`
  - `simulation`
  - `loginSteps`
- `schemaVersion`: integer

Error responses use the shared runtime/test error envelope.

### B1 Login Flow

#### POST `/api/test/login/run`

- Request body schema:
  - `idempotencyKey`: non-empty string (optional but recommended)
  - `twoFactorMode`: `"required"` | `"skip"` (optional; default `"required"`)
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Login flow completed."
  ],
  "test": {
    "flow": "B1",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:20:00.000Z"
  },
  "projection": {
    "loginSteps": [
      { "key": "login", "label": "Login", "status": "done" },
      { "key": "file", "label": "Required file", "status": "done" },
      { "key": "2fa", "label": "2FA", "status": "done" }
    ]
  },
  "schemaVersion": 1
}
```

### B2 Download Five Files

#### POST `/api/test/download-five/run`

- Request body schema:
  - `source`: string (optional; default `"generated_test_data"`)
  - `fileCount`: integer (optional; default `5`)
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Downloaded 5 files."
  ],
  "test": {
    "flow": "B2",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:20:30.000Z"
  },
  "projection": {
    "truth": {
      "queueLength": 5,
      "lastStageCompleted": "B2"
    }
  },
  "schemaVersion": 1
}
```

### B3 Pipeline Stage Endpoints

#### POST `/api/test/pipeline/mock-download/run`

- Request body schema: optional `batchLabel` string.
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Mock download copied files from generated test data."
  ],
  "test": {
    "flow": "B3.1",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:21:00.000Z"
  },
  "projection": {
    "truth": {
      "lastStageCompleted": "B3.1",
      "pipelineActiveKey": null
    }
  },
  "schemaVersion": 1
}
```

#### POST `/api/test/pipeline/index/run`

- Request body schema: optional `batchLabel` string.
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Index stage completed."
  ],
  "test": {
    "flow": "B3.2",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:21:30.000Z"
  },
  "projection": {
    "truth": {
      "lastStageCompleted": "B3.2"
    }
  },
  "schemaVersion": 1
}
```

#### POST `/api/test/pipeline/parse-gps/run`

- Request body schema: optional `batchLabel` string.
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "GPS parser completed."
  ],
  "test": {
    "flow": "B3.3",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:22:00.000Z"
  },
  "projection": {
    "truth": {
      "lastStageCompleted": "B3.3"
    }
  },
  "schemaVersion": 1
}
```

#### POST `/api/test/pipeline/geocode/run`

- Request body schema: optional `batchLabel` string.
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Geocode stage completed."
  ],
  "test": {
    "flow": "B3.4",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:22:30.000Z"
  },
  "projection": {
    "truth": {
      "lastStageCompleted": "B3.4"
    }
  },
  "schemaVersion": 1
}
```

#### POST `/api/test/pipeline/enqueue-playback/run`

- Request body schema: optional `enqueueCount` integer.
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Queue stage enqueued media for playback."
  ],
  "test": {
    "flow": "B3.5",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:23:00.000Z"
  },
  "projection": {
    "truth": {
      "queueLength": 1,
      "lastStageCompleted": "B3.5",
      "playbackStatus": "Ready for emulation"
    }
  },
  "schemaVersion": 1
}
```

#### POST `/api/test/pipeline/run-all`

- Request body schema:
  - `sequence`: optional array of stage keys, default `["B3.1","B3.2","B3.3","B3.4","B3.5"]`
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Auto pipeline completed."
  ],
  "test": {
    "flow": "B3",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:23:30.000Z"
  },
  "projection": {
    "truth": {
      "lastStageCompleted": "B3.5",
      "queueLength": 1
    },
    "runningProcess": {
      "pipelineStages": [
        { "key": "download", "status": "Success" },
        { "key": "index", "status": "Success" },
        { "key": "gps", "status": "Success" },
        { "key": "geocode", "status": "Success" },
        { "key": "queue", "status": "Success" }
      ]
    }
  },
  "schemaVersion": 1
}
```

### B4 Playback Emulation

#### POST `/api/test/playback/run`

- Request body schema:
  - `idempotencyKey`: non-empty string (optional but recommended)
  - `mediaName`: string (optional; defaults to queue head)
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Playback emulation completed."
  ],
  "test": {
    "flow": "B4",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:24:00.000Z"
  },
  "projection": {
    "truth": {
      "playbackStatus": "Displaying media",
      "lastCheckpoint": "09:24:00 image display checkpoint saved"
    },
    "runningProcess": {
      "playbackWorker": {
        "status": "Running",
        "currentMedia": "same_gps_03.jpg"
      }
    }
  },
  "schemaVersion": 1
}
```

#### GET `/api/test/playback/state`

- Request body: none
- Success response schema:
  - `status`: `ok` | `warning`
  - `messages`: string[]
  - `playback`: object containing current playback state projection
  - `schemaVersion`: integer
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Playback state read."
  ],
  "playback": {
    "playbackStatus": "Displaying media",
    "currentMedia": "same_gps_03.jpg",
    "lastCheckpoint": "09:24:00 image display checkpoint saved"
  },
  "schemaVersion": 1
}
```

### B5 Screen Simulation

#### POST `/api/test/screen/configure`

- Request body schema:
  - `executionMode`: string (`"auto"` recommended)
  - `inputMode`: string (`"single"` recommended)
  - `pirEnabled`: boolean
  - `mouseEnabled`: boolean
  - `keyboardEnabled`: boolean
  - `simulateAllEnabled`: boolean
  - `inactivityTimeoutSeconds`: integer `> 0`
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Screen simulation configuration applied."
  ],
  "test": {
    "flow": "B5",
    "outcome": "completed",
    "recordedAt": "2026-04-21T09:24:30.000Z"
  },
  "projection": {
    "simulation": {
      "executionMode": "auto",
      "inputMode": "single",
      "pirEnabled": true,
      "mouseEnabled": true,
      "keyboardEnabled": true,
      "simulateAllEnabled": true,
      "inactivityTimeoutSeconds": 5
    },
    "truth": {
      "screenState": "ON",
      "lastActivitySource": "All simulated activity sources enabled"
    }
  },
  "schemaVersion": 1
}
```

#### GET `/api/test/screen/state`

- Request body: none
- Success response schema:
  - `status`: `ok` | `warning`
  - `messages`: string[]
  - `screen`: object containing `screenState`, `lastActivitySource`, `inactivityTimeoutSeconds`
  - `schemaVersion`: integer
- Example success:

```json
{
  "status": "ok",
  "messages": [
    "Screen state read."
  ],
  "screen": {
    "screenState": "ON",
    "lastActivitySource": "Mouse movement enabled",
    "inactivityTimeoutSeconds": 5
  },
  "schemaVersion": 1
}
```

## Projection Ownership Rule

`GET /api/runtime/current` and `GET /api/runtime/workers` are backend-owned projections.

- Backend must join persisted runtime truth with worker heartbeat and queue summary data.
- Frontend must consume these projections directly and must not reconstruct operational truth by merging raw fragments in the browser.
- Frontend may cache or display projection data but may not redefine status semantics for stale/active workers.

## Assumptions and Proposal Boundaries

- All `/api/runtime/*` and `/api/test/*` schemas in this file are planned contract definitions, not claims of current implementation.
- Field naming intentionally aligns with existing keys in `conf/runtime-truth.json` and `dashboard/services/runtimeTruth.js` wherever practical.
- Restore-specific guardrails (confirmation phrase, idempotency key, audit metadata) are normative safety requirements for backend implementation.

## Evidence Basis

Derived from direct inspection of:

- `server/index.js`
- `server/scripts/sqlite_admin.py`
- `server/scheduler_host.js`
- `dashboard/services/apiClient.js`
- `dashboard/services/databaseViewerService.js`
- `dashboard/services/initService.js`
- `dashboard/services/runtimeTruth.js`
- `dashboard/services/runtimeTruthPersistenceService.js`
- `dashboard/views/databaseViewerView.js`
- `conf/runtime-truth.json`
