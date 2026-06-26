# V2 Playback Drop Queue Bridge Contract

Checkpoint: `v0.10.56` / B8.3.

## Current truth after B8.3

The V2 `08 PLAYBACK` drag/drop queue still starts as browser-local. Dropped `File` objects are rendered in the queue table, classified as `image`, `video`, or `other`, and logged in Event history.

B8.3 adds a **safe backend queue-prepare adapter** for selected valid media rows. The adapter does not upload dropped files and does not trust browser file paths. It only sends provenance metadata to the existing `POST /api/runtime/queue/prepare` endpoint so the backend can refresh durable queue rows for media it already knows through the normal pipeline/database path.

## Required safe bridge rules

| Rule | Requirement |
|---|---|
| Media-only gate | Only rows classified as `image` or `video` may request backend queue preparation. |
| Non-media safety | Rows classified as `other` must fail locally with a visible, graceful message and no backend request. |
| Existing endpoint | The bridge uses `POST /api/runtime/queue/prepare`; no arbitrary browser file path may be trusted as a backend filesystem path. |
| Browser-local disclosure | The UI must continue to say the dropped queue is browser-local unless/until upload/import and durable DB insertion are proven. |
| Request provenance | Any backend bridge request must include source/provenance metadata identifying `v2-playback-drop-queue`. |
| No fake GPS/address | Missing GPS/address values must remain explicit; no fake address may be generated from a dropped row. |
| Real playback gate | `09 REAL PLAYBACK` may only consume this bridge after valid media and non-media behavior are proven. |

## Non-claim

This is not a browser file upload/import feature. Exact dropped-file ingestion into the backend database remains future work unless a dedicated upload/import endpoint and proof are added.
