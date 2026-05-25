# Slice 8 and Slice 9 Route Selection

## Slice 8 — Inspection route family

Selected endpoints:

- `GET /api/version`
- `POST /api/init/verify-env`

These endpoints expose version/configuration inspection only. They do not call auth services, database internals, provider/session code, playback workers, scheduler workers, or runtime mutation services.

## Slice 9 — Runtime status route family

Selected endpoints:

- `GET /api/runtime/orchestration/current`
- `GET /api/runtime/orchestration/last`

These endpoints report orchestration status only. They do not start pipeline work, change scheduler state, alter playback worker behavior, or modify database schema/state progression logic.

## Non-overlap confirmation

Slice 8 owns version and `.env` inspection routes. Slice 9 owns runtime orchestration status routes. No endpoint belongs to both slices.

## Compatibility rule

The extraction keeps the original handlers in `server/index.ts` and only moves route-key wiring into small route modules. Endpoint paths, HTTP methods, response shapes, status codes, and existing handler behavior are preserved.
