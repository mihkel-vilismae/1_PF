# OS Playback Views — Slice 3 Rotation and Fullscreen Flow

## Status

Implemented in `0.6.9` on 2026-05-28 01:15 EEST.

Slice 3 adds browser-side queue rotation and a stronger fullscreen playback overlay for the Windows and Raspberry OS playback views. It uses the read-only playback contract from Slice 2 and does not change backend playback selection, scheduler execution, cron/crontab behavior, or existing Views A-E.

## What changed

| Area | Behavior |
|---|---|
| Queue rotation | Windows/Raspberry playback views can rotate through loaded playback queue items from `GET /api/runtime/playback/current`. |
| Manual controls | Previous, Next, and Start/Pause rotation buttons are active when more than one queue item is available. |
| Fullscreen flow | `Switch to Full Screen` opens a dedicated playback overlay and requests browser fullscreen when supported. |
| Shared renderer | Preview and fullscreen both render the same backend-served `displayUrl` media from the playback contract. |
| Address display | Fullscreen keeps showing the resolved address for the currently displayed queue item. |

## Safety boundary

| Preserved behavior | Notes |
|---|---|
| Backend Stage 6 selection | Still owned by `POST /api/runtime/playback/select-current`; browser rotation is read-only presentation state. |
| Test/Real storage separation | Playback data still comes through the central API client and selected runtime mode header. |
| Existing A-E views | No existing view or action was removed. |
| Scheduler/cron behavior | CronEmulator and Raspberry crontab integration remain unchanged. |
| View B input detection | PIR/mouse/keyboard detection reuse remains a later task after View B testing is implemented. |

## Remaining deferred work

- Real worker status and scheduler/log streams are still deferred to a later status/log source slice.
- Raspberry kiosk/autostart setup remains a later deployment slice.
- Fullscreen wake/keep-on behavior should reuse the future proven View B detection test code later.
