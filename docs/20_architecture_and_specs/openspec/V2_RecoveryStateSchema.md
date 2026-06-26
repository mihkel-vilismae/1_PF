# V2 Recovery State Schema — B11.1

Status: schema-only, no save/load runtime behavior yet.

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

## Explicit non-goals for B11.1

- No real save endpoint.
- No real load endpoint.
- No autosave loop.
- No restart detector.
- No exact video timestamp requirement.
- No credentials, cookies, session file contents, or other secret material in snapshots.

## Next implementation gates

1. B11.2: manual save/load endpoints and V2 wiring.
2. B11.3: autosave/restart recovery flow.
3. B9.5/B12: proof harness for abrupt stop/restart and final victory proof.
