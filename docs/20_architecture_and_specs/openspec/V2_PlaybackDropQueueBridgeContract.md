# V2 Playback Drop Queue Bridge Contract

Checkpoint: `v0.10.55` / B9.3.

## Current truth before B8.3

The V2 `08 PLAYBACK` drag/drop queue is browser-local. Dropped `File` objects are rendered in the queue table, classified as `image`, `video`, or `other`, and logged in Event history, but the browser-local queue does not upload files and does not write playback rows into the backend database by itself.

## Required safe bridge

The backend bridge must obey these rules before it can be treated as part of the real playback path:

| Rule | Requirement |
|---|---|
| Media-only gate | Only rows classified as `image` or `video` may request backend queue preparation. |
| Non-media safety | Rows classified as `other` must fail locally with a visible, graceful message and no backend request. |
| Existing endpoint | The first safe bridge must use `POST /api/runtime/queue/prepare`; no arbitrary browser file path may be trusted as a backend filesystem path. |
| Browser-local disclosure | The UI must continue to say the dropped queue is browser-local unless/until upload/import and durable DB insertion are proven. |
| Request provenance | Any backend bridge request must include source/provenance metadata identifying `v2-playback-drop-queue`. |
| No fake GPS/address | Missing GPS/address values must remain explicit; no fake address may be generated from a dropped row. |
| Real playback gate | `09 REAL PLAYBACK` may only consume this bridge after valid media and non-media behavior are proven. |

## B8.3 acceptance target

B8.3 should add a safe adapter/button for selected valid media rows that requests backend queue preparation while blocking non-media rows locally. It is not allowed to claim exact dropped-file upload or direct backend ingestion unless an upload/import endpoint and proof are added separately.
