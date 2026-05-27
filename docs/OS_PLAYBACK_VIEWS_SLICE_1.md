# OS Playback Views — Slice 1

## Purpose

Slice 1 adds the additive Windows and Raspberry OS playback view shells. The views are designed as the future operator entry points for photo-frame playback, but this slice does not change backend runtime behavior, scheduler execution, database paths, or existing Views A-E.

## Preserved behavior

- Existing Views A, B, C, D, and E remain present and keep their current card/action behavior.
- Test Mode / Real Mode runtime routing from v0.6.6 remains unchanged.
- Backend playback selection remains owned by `POST /api/runtime/playback/select-current`.
- Existing B4 preview/fullscreen rendering controls remain unchanged.
- Windows CronEmulator and Raspberry crontab endpoints are not changed by this slice.

## New views

| View | Purpose | Current slice status |
|---|---|---|
| Windows Playback | Windows-only development playback surface. | UI shell and contract placeholders added. |
| Raspberry Playback | Raspberry OS deployment playback surface. | UI shell and contract placeholders added. |

## View structure

Each new playback view contains:

| Area | Notes |
|---|---|
| Playback surface | Large queue-backed preview area with resolved-address text. |
| Playback controls | Includes `Switch to Full Screen`, Previous, Next, Pause rotation, and Refresh queue. Only fullscreen is wired to browser fullscreen in this slice. |
| Stage row | Compact `Download -> Index -> GPS parser -> Geocode -> Queue / Q` status row. |
| Worker row | Regular state worker, playback worker, and on-off worker status cards. |
| Scheduler terminal | Windows labels CronEmulator activity; Raspberry labels crontab activity. |
| Error-only terminal | Reserved for error-level rows only. |
| Main runtime terminal | Reserved for general playback/runtime rows. |

## Known limitations

- Playback rotation is not implemented in this slice.
- Real queue media serving is not implemented in this slice.
- Raspberry OS kiosk/autostart behavior is not implemented in this slice.
- Log terminals expose required controls visually, but copy/clear/expand behavior is intentionally not wired until real log-tail endpoints exist.
- The worker cards show available dashboard state and placeholder timing text until worker status endpoints provide authoritative `lastCalled` and `sinceLastCall` values.
