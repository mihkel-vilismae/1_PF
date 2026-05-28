# Test / Real Runtime Boundary Skill

Estonian timestamp: 2026-05-27 20:18 EEST

## Purpose

Keep Test Mode and Real Mode physically separated for database, downloads, logs, and runtime artifacts.

## Rules

| Mode | Database | Downloads | Logs | Runtime root |
|---|---|---|---|---|
| Test Mode | `test_runtime_data/test_photo_frame.sqlite` | `test_runtime_data/downloads/` | `test_runtime_data/logs/` | `test_runtime_data/` |
| Real Mode | `runtime_data/photo_frame.sqlite` | `runtime_data/downloads/` | `runtime_data/logs/` | `runtime_data/` |

## Backend boundary

Browser requests send `X-Dashboard-Runtime-Mode: test` or `X-Dashboard-Runtime-Mode: real` through the shared API client. Backend request context resolves this once and passes mode-adjusted env values to database/runtime functions.

Real Mode preserves the configured `.env` values. Test Mode overrides database, download, log, and auth-adjacent runtime paths into `test_runtime_data/`; unsafe legacy test paths under `runtime_data/test/` are ignored.

## Implementation checks

When changing database, runtime, or init endpoints, verify:

1. Test Mode recreate/inspect/status/delete use only `test_runtime_data/test_photo_frame.sqlite`.
2. Test Mode database viewer verify/connect/tables/rows use only the test database.
3. Test Mode mock download/index/GPS/geocode/queue/playback use `test_runtime_data` paths.
4. Real Mode keeps using the real `.env` paths.
5. No raw credentials are added to `.env`, `example.env`, or `test.example.env`; checked-in `test.env` is not used.
