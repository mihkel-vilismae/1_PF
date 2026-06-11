# Endpoint contract inventory OpenSpec

Version introduced: v0.8.36  
Status: OpenSpec + static inventory guard  
Runtime behavior changed by this document: none

## Purpose

This OpenSpec inventories the PF_login same-origin HTTP API surface that the dashboard, proof runners, and local operator tools may call. It is a contract map for other parties and future slices; it does not change route behavior.

The canonical implementation source remains `server/index.ts` plus the small route factory modules under `server/routes/`. The static inventory helper `npm run contract:endpoints` extracts `METHOD /api/...` route keys from those files, and `npm run contract:endpoints:check` verifies that this OpenSpec lists every currently registered route key.

## Architectural boundary

- The browser/dashboard talks to PF_login through the local same-origin API server.
- The server owns filesystem, provider-session, SQLite, native playback process, scheduler, runtime-truth, and proof-only operations.
- Real provider routes remain opt-in and must not be treated as proven by generated fixtures.
- Test/proof endpoints are local proof surfaces and must not be promoted to production behavior.
- Windows Task Scheduler is not part of PF_login scope.
- Raspberry OS runtime behavior remains unimplemented unless a later target proof explicitly says otherwise.
- Endpoint inventory is not endpoint authorization; it is a route-surface contract and drift guard.

## Status vocabulary

| Status | Meaning |
|---|---|
| `documented` | Route key is inventoried here and exists in source. |
| `proof_only` | Route exists for local proof/test mode and must not be used as production API. |
| `provider_gated` | Route may require local provider/session readiness or explicit operator opt-in. |
| `runtime_local` | Route mutates local repo/runtime state such as SQLite, runtime truth, playback, locks, or logs. |
| `read_only` | Route returns local status/projection data without intended mutation. |

## Route inventory command

```bash
npm run contract:endpoints
npm run contract:endpoints:check
```

## Current route inventory

| Endpoint | Surface | Source | Boundary |
|---|---|---|---|
| `POST /api/auth/2fa/submit` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/logout` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `GET /api/auth/new/artifacts` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/new/artifacts/generate` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/new/login` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/new/logout` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `GET /api/auth/new/session-files` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `GET /api/auth/new/status` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/new/submit-2fa` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/new/test-download` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/new/verify-icloudpd` | new auth/session/artifact surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/reset` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/resume` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/run` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `GET /api/auth/status` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/test-login-download-one` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/auth/verify-icloudpd` | legacy auth/iCloudPD surface | `server/index.ts` | May touch provider/session state; outputs must remain sanitized. |
| `POST /api/database-viewer/connect` | database viewer surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/database-viewer/logging/start` | database viewer surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/database-viewer/logging/stop` | database viewer surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/database-viewer/rows` | database viewer surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/database-viewer/tables` | database viewer surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/database-viewer/verify` | database viewer surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/init/cron/emulator/check` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `GET /api/init/cron/emulator/crontab` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `POST /api/init/cron/emulator/crontab` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `POST /api/init/cron/emulator/run` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `POST /api/init/cron/emulator/stop` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `POST /api/init/cron/install` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `GET /api/init/cron/print` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `GET /api/init/cron/run-log` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `GET /api/init/cron/status` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `GET /api/init/cron/target` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `POST /api/init/cron/target` | scheduler target/cron-emulator surface | `server/routes/schedulerRoutes.ts` | Scheduler target boundary; Windows Task Scheduler remains out of scope. |
| `POST /api/init/database/delete` | database setup surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/init/database/inspect` | database setup surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/init/database/recreate-empty` | database setup surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/init/database/status` | database setup surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/init/verify-env` | inspection/preflight surface | `server/routes/inspectionRoutes.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/native-playback/detect` | native playback control surface | `server/index.ts` | Project-owned native playback process boundary; must not kill arbitrary OS processes. |
| `POST /api/native-playback/start-current` | native playback control surface | `server/index.ts` | Project-owned native playback process boundary; must not kill arbitrary OS processes. |
| `GET /api/native-playback/status` | native playback control surface | `server/index.ts` | Project-owned native playback process boundary; must not kill arbitrary OS processes. |
| `POST /api/native-playback/stop` | native playback control surface | `server/index.ts` | Project-owned native playback process boundary; must not kill arbitrary OS processes. |
| `GET /api/runtime-truth` | runtime truth and pipeline maintenance surface | `server/routes/runtimeTruthRoutes.ts` | Local runtime truth/lock maintenance boundary. |
| `POST /api/runtime-truth` | runtime truth and pipeline maintenance surface | `server/routes/runtimeTruthRoutes.ts` | Local runtime truth/lock maintenance boundary. |
| `POST /api/runtime/download/real-run` | download pipeline surface | `server/index.ts` | Real provider route; requires authenticated/session readiness and explicit opt-in. |
| `POST /api/runtime/download/run` | download pipeline surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/geocode/run` | media pipeline stage surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/gps/run` | media pipeline stage surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/index/run` | media pipeline stage surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/runtime/orchestration/current` | runtime orchestration status/run surface | `server/routes/runtimeStatusRoutes.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/runtime/orchestration/last` | runtime orchestration status/run surface | `server/routes/runtimeStatusRoutes.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/orchestration/run` | runtime orchestration status/run surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/pipeline/issues/detect` | runtime truth and pipeline maintenance surface | `server/routes/runtimeTruthRoutes.ts` | Local runtime truth/lock maintenance boundary. |
| `POST /api/runtime/pipeline/stale-locks/clear` | runtime truth and pipeline maintenance surface | `server/routes/runtimeTruthRoutes.ts` | Local runtime truth/lock maintenance boundary. |
| `GET /api/runtime/playback/current` | playback contract/checkpoint surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/runtime/playback/observability` | playback contract/checkpoint surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/runtime/playback/queue` | playback contract/checkpoint surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/runtime/playback/resume-checkpoint` | playback contract/checkpoint surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/playback/resume-checkpoint` | playback contract/checkpoint surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/playback/resume-checkpoint/clear` | playback contract/checkpoint surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/playback/select-current` | playback contract/checkpoint surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/runtime/projection/live` | live runtime projection surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/queue/prepare` | media pipeline stage surface | `server/index.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/runtime/screen-simulation/configure` | screen simulation test surface | `server/routes/screenSimulationRoutes.ts` | Local same-origin dashboard/API boundary. |
| `GET /api/runtime/screen-simulation/state` | screen simulation test surface | `server/routes/screenSimulationRoutes.ts` | Local same-origin dashboard/API boundary. |
| `POST /api/testing/dirty-shutdown/plan` | test/proof-only surface | `server/index.ts` | Test Mode/proof-only boundary; do not use as production API. |
| `POST /api/testing/dirty-shutdown/simulate` | test/proof-only surface | `server/index.ts` | Test Mode/proof-only boundary; do not use as production API. |
| `POST /api/testing/live-windows-native-video/seed` | test/proof-only surface | `server/index.ts` | Test Mode/proof-only boundary; do not use as production API. |
| `POST /api/testing/whole-logic-emulator/control` | test/proof-only surface | `server/index.ts` | Test Mode/proof-only boundary; do not use as production API. |
| `POST /api/testing/whole-logic-emulator/start` | test/proof-only surface | `server/index.ts` | Test Mode/proof-only boundary; do not use as production API. |
| `GET /api/testing/whole-logic-emulator/status` | test/proof-only surface | `server/index.ts` | Test Mode/proof-only boundary; do not use as production API. |
| `GET /api/version` | inspection/preflight surface | `server/routes/inspectionRoutes.ts` | Local same-origin dashboard/API boundary. |

## Surface notes

### Auth and provider surfaces

`/api/auth/*` and `/api/auth/new/*` routes may verify `icloudpd`, create local auth artifacts, submit 2FA codes, inspect session files, test downloads, or clean local/provider session state. Proof artifacts and logs must remain sanitized.

### Runtime pipeline surfaces

Runtime download, index, GPS, geocode, queue, playback, and orchestration routes operate on local repository/runtime state. Generated fixture proofs can prove deterministic local behavior but do not prove production iCloud continuation.

### Native playback surfaces

Native playback routes are project-owned process boundaries. A PASS proof requires evidence that the project launched/stopped only the owned native playback process and did not kill arbitrary `mpv`, `node`, `vlc`, or OS processes by name.

### Scheduler surfaces

Scheduler endpoints support PF_login target selection, project-owned worker invocation, CronEmulator checks, and log inspection. Windows Task Scheduler remains explicitly out of scope.

### Test/proof-only surfaces

Routes under `/api/testing/*` are for proof runners and local Test Mode workflows. They are not production user-facing APIs.

### Runtime truth and lock maintenance surfaces

Runtime truth and stale-lock routes mutate local ignored runtime state. Evidence bundles should summarize outcomes without leaking private paths or provider/session material.

## Non-claims

This OpenSpec does not prove:

- Production provider/iCloud continuation.
- Raspberry OS runtime behavior.
- Native display pixels or monitor focus.
- Full OS reboot or power-loss recovery.
- Windows Task Scheduler behavior.
- Any endpoint security property beyond the route inventory and documented local boundaries.
