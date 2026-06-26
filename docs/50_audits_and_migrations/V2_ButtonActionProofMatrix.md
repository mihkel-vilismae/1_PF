# V2 Button / Action Proof Matrix

Checkpoint: `v0.10.54` / B9.2.

This matrix records the V2 controls that already have visible buttons and the action/backend surface they must use. It is a proof aid, not a claim that live hardware or provider credentials were exercised. The V2 NEW AUTH boundary remains `/api/auth/new/*` only.

| V2 page | Control | Action ID | Endpoint / behavior | Proof status |
|---|---|---|---|---|
| `01 SETUP` | `1A Verify .env` | `verify-env` | `POST /api/init/verify-env` | Placement + success/error result surface covered by existing B4 tests and init workflow tests. |
| `01 SETUP` | `Check DB` | `check-db` | `GET /api/init/database/status` | Placement covered; live DB proof remains separate. |
| `01 SETUP` | `Inspect DB` | `inspect-db` | `POST /api/init/database/inspect` | Placement covered; live DB proof remains separate. |
| `01 SETUP` | `Delete DB` | `delete-db` | `POST /api/init/database/delete` | Guarded by confirmation before request. |
| `01 SETUP` | `Recreate DB` | `recreate-db` | `POST /api/init/database/recreate-empty` | Guarded by confirmation before request. |
| `02 AUTHENTICATION` | `Verify iCloudPD install` | `new-auth-verify-icloudpd` | `POST /api/auth/new/verify-icloudpd` | Placement covered and legacy login action IDs excluded from V2 NEW AUTH. |
| `02 AUTHENTICATION` | `Verify with iCloudPD` | `new-auth-verify-provider-session` | `GET /api/auth/new/status` | Placement covered and legacy login action IDs excluded from V2 NEW AUTH. |
| `02 AUTHENTICATION` | `Login using .env values` | `new-auth-login-using-env` | `POST /api/auth/new/login` | Placement covered and Test Mode disabled guard preserved. |
| `02 AUTHENTICATION` | `Check login` | `new-auth-check-login` | `GET /api/auth/new/status?mode=passive` | Placement covered and legacy login action IDs excluded from V2 NEW AUTH. |
| `02 AUTHENTICATION` | `Log out and remove existing session` | `new-auth-logout-session` | `POST /api/auth/new/logout` | Guarded by confirmation before session-file removal. |
| `02 AUTHENTICATION` | `Show auth/session paths and files` | `new-auth-session-files` | `GET /api/auth/new/session-files` | Sanitized session path/file visibility only. |
| `02 AUTHENTICATION` | `Generate auth evidence pack` | `new-auth-generate-artifact-pack` | `POST /api/auth/new/artifacts/generate` | Evidence pack generation uses existing sanitized backend surface. |
| `02 AUTHENTICATION` | `List auth evidence packs` | `new-auth-list-artifact-packs` | `GET /api/auth/new/artifacts` | Evidence pack list uses existing sanitized backend surface. |
| `03 STARTUP` | `Check emulator scheduler` | `check-emulator-scheduler` | Existing scheduler action pipeline with `raspberry-real-crontab` target payload | Placement and target proof covered; hardware crontab proof remains separate. |
| `03 STARTUP` | `Run emulator` | `run-emulator` | Existing scheduler action pipeline with `raspberry-real-crontab` target payload | Label retained, V2 target remains Raspberry crontab rather than Windows CronEmulator. |
| `03 STARTUP` | `Stop emulator` | `stop-emulator` | Existing scheduler action pipeline with `raspberry-real-crontab` target payload | Label retained, V2 target remains Raspberry crontab rather than Windows CronEmulator. |
| `03 STARTUP` | `Install crontab` | `install-crontab` | Existing scheduler action pipeline with `raspberry-real-crontab` target payload | Placement and target proof covered; hardware crontab proof remains separate. |
| `03 STARTUP` | `Get active crontab` | `get-active-crontab` | Existing scheduler action pipeline with `raspberry-real-crontab` target payload | Placement and target proof covered; hardware crontab proof remains separate. |
| `04 WORKERS` | `B3.1 Download` | `run-b3-1` | `POST /api/runtime/download/run` | B9.2 covers success rendering from the V2 worker card. |
| `04 WORKERS` | `B3.2 Index` | `run-b3-2` | `POST /api/runtime/index/run` | B9.2 covers error rendering from the V2 worker card. |
| `04 WORKERS` | `B3.3 Parse GPS` | `run-b3-3` | `POST /api/runtime/gps/run` | Placement covered; live GPS proof remains separate. |
| `04 WORKERS` | `B3.4 Geocode` | `run-b3-4` | `POST /api/runtime/geocode/run` | Placement covered; deterministic placeholder geocoder only. |
| `04 WORKERS` | `B3.5 Enqueue playback` | `run-b3-5` | `POST /api/runtime/queue/prepare` | Placement covered; backend queue bridge work starts in B8.3. |
| `05 TROUBLESHOOTING` | `Detect issues in pipeline` | `detect-pipeline-issues` | `POST /api/runtime/pipeline/issues/detect` | B9.1 covers success rendering. |
| `05 TROUBLESHOOTING` | `Clear stale locks` | `clear-stale-pipeline-locks` | `POST /api/runtime/pipeline/stale-locks/clear` | B9.1 covers error rendering. |
| `06 RECOVERY` | `SAVE STATE` | `v2-recovery-save-state` | `POST /api/runtime/recovery/state/save` | Manual recovery snapshot save. |
| `06 RECOVERY` | `LOAD STATE` | `v2-recovery-load-state` | `POST /api/runtime/recovery/state/load` | Manual recovery snapshot load; no autoplay. |
| `06 RECOVERY` | `EMULATE POWER OFF` | `v2-recovery-emulate-power-off` | `POST /api/runtime/recovery/state/save` | Records pre-shutdown snapshot; no actual power-off. |
