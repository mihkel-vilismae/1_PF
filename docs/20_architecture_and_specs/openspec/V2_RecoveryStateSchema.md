# V2 Recovery State Schema — B11.1/B11.2

Status: B11.1 schema, B11.2 manual save/load endpoints, and B11.3 autosave/restart-check flow.

## Purpose

The V2 recovery state snapshot is a lightweight contract for restoring the same media/queue context after a rough shutdown, terminal close, reboot, or future power-loss recovery path. Exact video timestamp resume is not required for this phase; replaying the same media file from the beginning is acceptable.

## Required snapshot fields

| Field | Meaning |
|---|---|
| `schemaVersion` | Must be `1`. |
| `savedAtIso` | ISO timestamp for when the snapshot was created. |
| `reason` | `manual-save`, `autosave-stage-change`, `pre-shutdown`, or `restart-detected`. |
| `playback.currentMediaId` | Current durable media/queue identifier, or `null` when none is active. |
| `playback.currentFilename` | Human-readable current filename, or `null`. |
| `playback.mediaKind` | `image`, `video`, `other`, or `unknown`. |
| `playback.queueCursorIndex` | Queue cursor index, or `null` when no durable queue context exists. |
| `playback.queueLength` | Known queue length. |
| `playback.playbackPositionSeconds` | Optional position value; may be `null`. |
| `playback.exactTimestampRequired` | Must be `false` for this phase. |
| `queue.source` | `backend-playback-queue`, `v2-browser-local-bridge`, or `unknown`. |
| `queue.preparedMediaCount` | Number of media rows prepared for backend queue handling. |
| `queue.selectedQueueItemId` | Selected queue item identifier, or `null`. |
| `queue.selectedBackendQueueStatus` | Selected backend queue bridge status, or `null`. |
| `pipeline.activeStage` | One of `download`, `index`, `gps-parser`, `geocode`, `queue`, `playback`, `idle`, or `unknown`. |
| `pipeline.stageStatuses` | Stage status map keyed by stage/action id. |
| `pipeline.corruptOrPartialDownloadsExcluded` | Must be `true`; corrupt/incomplete downloads must not enter recovery or playback queue context. |
| `notes` | Human-readable non-secret notes. |

## B11.2 manual endpoint behavior

- Manual save endpoint: `POST /api/runtime/recovery/state/save`.
- Manual load endpoint: `POST /api/runtime/recovery/state/load`.
- Read-only status endpoint: `GET /api/runtime/recovery/state`.
- Save/load persists lightweight same-media/queue context only; it does not autoplay or force fullscreen.

## B11.3 autosave/restart behavior

- Autosave endpoint: `POST /api/runtime/recovery/autosave`.
- Restart check endpoint: `POST /api/runtime/recovery/restart-check`.
- V2 triggers autosave after queue-prepare bridge requests and during browser pre-shutdown.
- V2 entry runs a restart check against the backend boot marker and saved snapshot.

## Explicit non-goals until B12
- No exact video timestamp requirement.
- No credentials, cookies, session file contents, or other secret material in snapshots.

## Next implementation gates

1. B12: proof harness for abrupt stop/restart and final victory proof.
