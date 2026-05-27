# OS Playback Views — Slice 2 Playback API Contract

## Status

Implemented in `0.6.8` on 2026-05-27 23:25 EEST.

Slice 2 wires the additive Windows/Raspberry playback view shells to a backend-owned read-only playback contract. It does not change Stage 6 selection behavior, scheduler behavior, auth/iCloudPD behavior, or existing Views A-E.

## API contract

| Endpoint | Purpose | Mutates state |
|---|---|---:|
| `GET /api/runtime/playback/current` | Returns current item, next READY item, queue summary, and safe media display URLs. | No |
| `GET /api/runtime/playback/queue` | Returns compact queue rows and queue counts for the playback views. | No |
| `GET /api/runtime/playback/media?assetId=<id>` | Streams media through the backend by database asset id. | No |
| `GET /api/runtime/playback/media?path=<path>` | Preserved compatibility route for already-selected safe local paths. | No |

## Playback item shape

The dashboard-facing playback item intentionally hides raw local filesystem paths. The frontend receives:

| Field | Meaning |
|---|---|
| `mediaAssetId` | Canonical media asset id. |
| `slideshowQueueId` | Queue row id. |
| `displayName` | Human-readable filename/name. |
| `mediaType` | `image`, `video`, or a fallback media type. |
| `queueStatus` | Queue row status such as `READY` or `FAILED`. |
| `resolvedAddress` | Geocoded address text, or an honest pending-address fallback. |
| `hasResolvedAddress` | Whether the address came from geocode data. |
| `displayUrl` | Backend media route such as `/api/runtime/playback/media?assetId=7`. |

## Test/Real boundary

Playback contract endpoints use the same `X-Dashboard-Runtime-Mode` boundary as database/runtime actions:

| Mode | Database/media source |
|---|---|
| Test Mode | `test_runtime_data/test_photo_frame.sqlite` and test runtime paths. |
| Real Mode | Real configured `.env` database and runtime paths. |

The frontend does not choose SQLite paths directly. It sends the selected dashboard mode through the central API client, and the backend resolves the correct runtime context.

## Preserved behavior

- Existing Views A, B, C, D, and E remain present.
- The View B B2 split remains unchanged: Test Mode uses mock download and Real Mode uses real iCloudPD download.
- Stage 6 selection remains backend-owned through `POST /api/runtime/playback/select-current`.
- The new current/queue endpoints are read-only and do not increment view counts or move queue pointers.
- Existing path-based media streaming remains available for compatibility but the new UI contract prefers asset-id media URLs.

## Still intentionally deferred

- Real automatic rotation timing is not implemented in this slice.
- Fullscreen lifecycle and kiosk/autostart behavior are not implemented in this slice.
- Real worker status and cron/crontab log streams still need a later status/log source slice.
- View B PIR/mouse/keyboard detection reuse in fullscreen remains a later dependency.
