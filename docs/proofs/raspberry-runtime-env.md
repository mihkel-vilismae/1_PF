# Raspberry runtime `.env` readiness

`npm run proof:raspberry-env-preflight` checks whether the repository root has a parseable `.env` with the minimum keys needed before Raspberry worker startup and app-running proofs can be honest.

The proof records key names, counts, missing-key lists, and sanitized guidance only. It must not log `.env` values, iCloud credentials, provider tokens, cookies, passwords, or private operator paths.

## Minimum runtime keys

| Key | Purpose | Example value |
|---|---|---|
| `DOWNLOAD_DIR` | Directory where downloaded iCloud/media files are staged on the Raspberry target. | `runtime_data/downloads` |
| `DB_PATH` | SQLite database path used by worker commands before database actions can run. | `runtime_data/photo_frame.sqlite` |
| `LOG_DIR` | Directory for worker/proof logs generated on the Raspberry target. | `runtime_data/logs` |
| `FULL_LOG` | Main full-log file path for scheduler and worker diagnostics. | `runtime_data/logs/full_log.log` |
| `PLAYBACK_LEASE_SECONDS` | Lease duration used by playback/app-running logic to decide whether playback state is fresh. | `45` |
| `NATIVE_PLAYBACK_ENABLED` | Boolean switch that allows native Raspberry playback commands after operator setup. | `false` |

`--create` may copy `example.env` into `.env` when `.env` is missing, but the operator still owns real values. A copied template is not proof of iCloud, geocode, playback, cron, or v1 readiness.

## Recommended order before app-running proofs

```bash
npm run proof:raspberry-executable-permissions -- --repair
npm run proof:raspberry-env-preflight -- --create
npm run proof:raspberry-worker-startup-smoke -- --prepare
```

If the env preflight reports missing keys, edit `.env` and rerun the preflight before retrying worker startup. The playback worker is expected to fail honestly when `DB_PATH` is missing.
