# Dashboard View A — Init Page OpenSpec

Status: documentation-only page-level OpenSpec for the existing View A Init page in Test Mode and Real Mode.

## Purpose

View A prepares and verifies the system before test or real runtime work. It contains environment checks, authentication/preflight surfaces, database controls, scheduler controls, and Test Mode-only whole-logic emulator controls.

This OpenSpec documents the existing page contract. It does not add new UI or backend behavior.

## Source files

```text
dashboard/views/initView.ts
dashboard/app.ts
dashboard/services/runtimeTruth.ts
dashboard/services/runtimeTruth/runtimeTruthAuthActions.ts
dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.ts
dashboard/services/runtimeTruth/runtimeTruthSchedulerActions.ts
dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts
dashboard/services/viewARefreshPlan.ts
```

Related existing OpenSpec:

```text
docs/20_architecture_and_specs/openspec/view_a_refresh_plan_openspec.md
docs/20_architecture_and_specs/openspec/auth_checkpoint_proof_openspec.md
docs/20_architecture_and_specs/openspec/auth_session_snapshot_contract_openspec.md
docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md
```

## Page identity

Visible identity:

```text
A — Init
Prepare the system before any test or real run.
```

Hero copy states that View A calls documented init endpoints for environment, database, and scheduler work while the rest of the dashboard may remain prototype-driven.

## Card/block inventory

### `1A-TEST-WHOLE-LOGIC` — Test Mode fast emulator

Mode visibility:

```text
Test Mode: visible
Real Mode: hidden
```

Purpose:

- owns only tracked Test Mode controller records;
- provides q/w/e/r/t power controls within a Test Mode safety boundary;
- provides manual cronjob call controls after the start button enables them;
- must not kill arbitrary dashboard, Node, Python, SQLite, system, or real-provider processes.

Safety boundary:

- Test Mode only;
- no real iCloud login;
- no real media-provider claim;
- no arbitrary process termination claim.

### `1A` — Verify `.env`

Mode visibility:

```text
Test Mode: visible
Real Mode: visible
```

Primary action:

```text
data-action="verify-env"
```

Expected backend contract:

```text
POST /api/init/verify-env
```

Purpose:

- validate required configuration keys;
- show the backend response payload inside the card;
- surface missing/invalid config safely.

Non-claims:

- does not authenticate iCloud;
- does not prove database or crontab readiness;
- does not expose secrets.

### `1A-AUTH` — Verify icloudpd legacy/preflight card

Mode visibility:

```text
Test Mode: visible
Real Mode: visible
```

Current implementation marker:

```text
marked-for-removal
```

Purpose:

- backend-owned icloudpd verification and login/preflight controls;
- checks executable/config readiness separately from authenticated provider state;
- may show 2FA control only when the public auth state requires it.

Boundary:

- this is the older/hybrid auth card;
- it must not be treated as the preferred future NEW AUTH flow unless the docs are updated;
- UI must not print raw secrets.

### `1A-STASH-OFF` — NEW AUTH

Mode visibility:

```text
Test Mode: visible but disabled
Real Mode: visible and enabled according to backend/auth state
```

Purpose:

- fresh real-auth UI boundary for iCloudPD;
- intentionally targets only `/api/auth/new/*` endpoints;
- does not reuse the older login card routes.

Visible Test Mode warning:

```text
NEW AUTH login is disabled in Test Mode. Switch to Real Mode to use iCloudPD login controls.
```

Current action list:

```text
Verify iCloudPD install
Verify with iCloudPD
Login using .env values
Check login
Log out and remove existing session
Show auth/session paths and files
Generate auth evidence pack
List auth evidence packs
```

Secret boundary:

- password and 2FA code must remain local to the operator flow;
- raw cookies/session secrets must not be displayed;
- evidence packs must be sanitized;
- status can show sanitized state and session-file presence only.

### `2A` — Database controls

Mode visibility:

```text
Test Mode: visible
Real Mode: visible
```

Current actions:

```text
check-db
inspect-db
delete-db
recreate-db
```

Expected backend surfaces include:

```text
GET /api/init/database/status
POST /api/database-viewer/verify
POST /api/init/database/recreate-empty
```

Classification:

| Action | Classification |
|---|---|
| Check DB | read/status |
| Inspect DB | read/status/deeper verification |
| Delete DB | destructive |
| Recreate DB | destructive/mutating |

Required safety behavior:

- destructive actions must be explicit operator actions;
- destructive actions must not run from startup mode selection;
- results must surface backend success/failure summaries;
- Real Mode destructive actions must not be conflated with Test Mode storage actions.

### `3A` — Scheduler controls

Mode visibility:

```text
Test Mode: visible
Real Mode: visible
```

Current structure:

```text
scheduler target tabs
├── WINDOWS (crontab emulator)
└── RASPBERRY (real crontab)

scheduler endpoint / row live log
result surface
card log surface
```

Windows target purpose:

- uses `tools/CronEmulator` as external Windows cron-job runner;
- source stays unchanged;
- backend launches/inspects it as an external process.

Raspberry target purpose:

- uses current user crontab on Raspberry Pi OS/Linux;
- manages only the project-owned marked crontab block.

Action classification:

| Area | Classification |
|---|---|
| Status/print/read active crontab | read/status |
| Run/stop emulator | test/runtime process control |
| Install crontab | mutating/scheduler install |
| Raspberry real crontab install | real target mutating action |

Required safety behavior:

- inactive scheduler target controls are disabled;
- crontab install must stay project-owned and marked;
- unknown/user/system crontab content must not be silently overwritten;
- terminal rows are diagnostic logs, not proof of target readiness by themselves.

## View A refresh/preload contract

The safe refresh plan is defined separately in `view_a_refresh_plan_openspec.md`.

Required summary:

- base refresh actions are `verify-env`, `check-db`, and `check-cron`;
- Real Mode may additionally refresh `new-auth-check-login` as a status read;
- Test Mode must not include NEW AUTH/provider login actions;
- refresh must not mutate production media/database/provider state.

## Safety and non-claims

View A does not by itself prove:

- real provider login success;
- real iCloud download success;
- Raspberry crontab runtime health;
- database correctness beyond endpoint results;
- worker pipeline readiness;
- recovery readiness.

Those require separate proofs/evidence.
