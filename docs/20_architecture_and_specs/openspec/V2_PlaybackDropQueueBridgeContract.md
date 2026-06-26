# V2 Playback Drop Queue Bridge Contract

Checkpoint: `v0.10.57` / B8.4.

## Current truth after B8.4

The V2 `08 PLAYBACK` drag/drop queue still starts as browser-local. Dropped `File` objects are rendered in the queue table, classified as `image`, `video`, or `other`, and logged in Event history.

B8.3 adds a **safe backend queue-prepare adapter** for selected valid media rows. B8.4 adds a metadata bridge contract for GPS/address fields. The adapter does not upload dropped files and does not trust browser file paths. It only sends provenance metadata to the existing `POST /api/runtime/queue/prepare` endpoint so the backend can refresh durable queue rows for media it already knows through the normal pipeline/database path.

## Required safe bridge rules

| Rule | Requirement |
|---|---|
| Media-only gate | Only rows classified as `image` or `video` may request backend queue preparation. |
| Non-media safety | Rows classified as `other` must fail locally with a visible, graceful message and no backend request. |
| Existing endpoint | The bridge uses `POST /api/runtime/queue/prepare`; no arbitrary browser file path may be trusted as a backend filesystem path. |
| Browser-local disclosure | The UI must continue to say the dropped queue is browser-local unless/until upload/import and durable DB insertion are proven. |
| Request provenance | Any backend bridge request must include source/provenance metadata identifying `v2-playback-drop-queue`. |
| No fake GPS/address | Missing GPS/address values must remain explicit; no fake address may be generated from a dropped row. |
| Metadata presence flags | Queue rows and bridge payloads must distinguish `gpsStatus` / `addressStatus` as `present` or `missing`. |
| Browser File API boundary | Browser-local dropped files default to `GPS missing — no browser EXIF extraction` and `Address missing — no fake address`; real values must come from pipeline metadata or a trusted sidecar contract. |
| Real playback gate | `09 REAL PLAYBACK` may only consume this bridge after valid media and non-media behavior are proven. |

## Non-claim

This is not a browser file upload/import feature. Exact dropped-file ingestion into the backend database remains future work unless a dedicated upload/import endpoint and proof are added.

## B8.4 metadata bridge

The metadata bridge has two valid states for each media row field:

| Field | Present | Missing |
|---|---|---|
| GPS | Explicit coordinates supplied by pipeline metadata or trusted sidecar metadata. | `GPS missing — no browser EXIF extraction`. |
| Address | Explicit address string supplied by pipeline/geocode metadata or trusted sidecar metadata. | `Address missing — no fake address`. |

The bridge must never reverse-geocode or invent address text in the browser-local drop queue. Address creation remains owned by the pipeline/geocode stages.
