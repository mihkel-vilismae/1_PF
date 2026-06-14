# Raspberry env preflight proof

`npm run proof:raspberry-env-preflight` checks that a Raspberry runtime `.env` exists and contains the minimum keys needed before scheduler workers such as `playback_worker` can build their request context.

## Commands

Check only:

```bash
npm run proof:raspberry-env-preflight
```

Create `.env` from `example.env` if missing, then check it:

```bash
npm run proof:raspberry-env-preflight -- --create
```

`--create-from-example` is accepted as an alias for `--create`.

## Scope

The proof addresses the v0.8.54 Raspberry evidence blocker where `playback_worker` failed with `env_file_read_failed` because `/home/mihkel/0.8.54-pf/.env` did not exist. The preflight is intentionally separate from real provider verification.

## PASS criteria

The proof can return `PASSED` when `.env` exists, is parseable, and includes the minimum runtime keys: `DOWNLOAD_DIR`, `DB_PATH`, `LOG_DIR`, `FULL_LOG`, `PLAYBACK_LEASE_SECONDS`, and `NATIVE_PLAYBACK_ENABLED`.

## BLOCKED criteria

The proof returns `BLOCKED` when `.env` is missing and creation was not requested, `example.env` is missing, `.env` cannot be read, minimum keys are absent, or malformed env lines are found.

## Non-claims

This proof does not validate iCloud credentials, API keys, network geocode providers, playback product work, app-running status, reboot recovery, or power-loss recovery. Real-provider fields still require operator configuration before production-provider proof can pass.
