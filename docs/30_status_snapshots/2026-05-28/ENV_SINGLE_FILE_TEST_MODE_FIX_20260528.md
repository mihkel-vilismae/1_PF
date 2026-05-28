# Env single-file Test Mode fix - 28.05.2026

## Summary

The dashboard should use one local runtime env file: `.env`. Operators may remove local or checked-in `test.env` files. Dashboard Test Mode still isolates runtime paths by projecting `.env` `TEST_*` values, or safe `test_runtime_data` defaults, into the active request context.

## Root cause

`verify-env` previously checked real/test path overlap after Test Mode projection. In Test Mode, `DB_PATH` is intentionally mapped to `TEST_DB_PATH` for the active request. That made the validator report a false overlap even when the original `.env` real path and test path were correctly separated.

## Fix

- Keep normal runtime env loading on `.env`.
- Ignore a literal `INIT_ENV_FILE=test.env` override and fall back to `.env`.
- Keep temporary `INIT_ENV_FILE` support for automated test harnesses that create their own isolated env files.
- Run overlap validation against original `.env` values, not the already projected Test Mode request values.
- Remove committed `test.env` as a runnable runtime source.

## Preserved behavior

- Real Mode keeps `DB_PATH`, `DOWNLOAD_DIR`, `LOG_DIR`, and auth paths from `.env`.
- Test Mode still uses `TEST_DB_PATH`, `TEST_DOWNLOAD_DIR`, `TEST_LOG_DIR`, and `TEST_ICLOUDPD_COOKIE_DIR` when those `.env` values are safe.
- Backend routes and Test/Real mode header behavior are unchanged.
