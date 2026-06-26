# V2 Operator Menu backend contract OpenSpec

Status: test-first contract for wiring the visual-only V2 Operator Menu to existing backend functionality where safe.

## Purpose

The V2 Operator Menu started as a visual-only Structure V1 surface. This OpenSpec defines how each visible/planned V2 menu row is classified before backend behavior is wired.

Each row must be one of:

```text
existing-backend
planned-v2
v3
visual-only
```

## Test-first rule

Before the V2 menu is wired to real behavior, a contract test must prove that:

1. every mapped row has an explicit support classification,
2. existing-backend rows list concrete backend endpoints,
3. endpoint mappings point to routes already present in `server/index.ts` or the endpoint inventory OpenSpec,
4. missing features stay `planned-v2` instead of pretending to be implemented,
5. v3 deferrals stay marked as `v3`.

The first implementation test is:

```text
tests/v2OperatorMenuBackendContract.test.js
```

The contract source is:

```text
dashboard/services/v2OperatorMenuBackendContract.ts
```

## Initial existing-backend candidates

The current repo already exposes backend surfaces for:

```text
POST /api/init/verify-env
GET /api/init/database/status
POST /api/init/database/recreate-empty
POST /api/database-viewer/verify
GET /api/init/cron/status
GET /api/init/cron/print
POST /api/init/cron/install
GET /api/auth/new/status
POST /api/auth/new/login
POST /api/auth/new/submit-2fa
GET /api/auth/new/session-files
POST /api/runtime/download/run
POST /api/runtime/index/run
POST /api/runtime/gps/run
POST /api/runtime/geocode/run
POST /api/runtime/queue/prepare
GET /api/runtime/playback/current
POST /api/runtime/playback/select-current
GET /api/runtime/playback/resume-checkpoint
POST /api/runtime/playback/resume-checkpoint
GET /api/runtime/projection/live
GET /api/runtime/playback/observability
GET /api/native-playback/status
```

## Planned-v2 rows that must not be falsely wired yet

```text
open .env in text editor
backup DB as SQL dump
backup current logs
clear current logs with recent-backup guard
error pipeline DB table/folder/fatal bundle
dedicated recovery worker / race-safe recovery flag
```

## V3 rows

```text
statistics page rich UI
full dependency installer
advanced snapshot protocol/version compatibility
```

## Secret and safety boundary

V2 auth wiring must not expose Apple ID, password, 2FA, cookies, or session secrets.

The V2 dashboard menu may show sanitized status and session-file presence only.

## Non-claims

This OpenSpec does not implement the real backend actions. It only defines the contract for safely identifying what already exists and what remains planned.
