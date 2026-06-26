# PF_login / PhotoFrame — V2 Operator Menu backend contract test-first slice

## User request

First implement the test, then use existing backend functionality for the functionality mentioned in the V2 spec-light/menu plan.

## OpenSpec status

Before this slice, there was a visual-only V2 menu documentation file, but no formal OpenSpec for the V2 Operator Menu backend contract.

This slice adds:

```text
docs/20_architecture_and_specs/openspec/v2_operator_menu_backend_contract_openspec.md
```

## Test-first implementation

Added:

```text
dashboard/services/v2OperatorMenuBackendContract.ts
tests/v2OperatorMenuBackendContract.test.js
```

The contract classifies each V2 menu row as:

```text
existing-backend
planned-v2
v3
visual-only
```

The test proves:

1. every backend contract row has explicit support classification and non-claim text,
2. existing-backend rows list concrete backend endpoints,
3. endpoint mappings point to routes already present in `server/index.ts` or the endpoint inventory OpenSpec,
4. missing features remain `planned-v2` and are not falsely wired,
5. the OpenSpec documents the test-first/non-implementation boundary.

## Existing backend surfaces identified

The contract maps existing backend functionality for:

```text
authentication status/login/2FA/session-file presence
env verification
DB status/verify/recreate
crontab status/print/install
regular worker B3 stage endpoints
playback current/select/resume checkpoint
runtime projection/playback/native status
```

## Still planned-v2, not falsely implemented

```text
open .env in text editor
backup DB as SQL dump
backup current logs
clear current logs with recent-backup guard
error pipeline DB table/folder/fatal bundle
dedicated recovery worker / race-safe recovery flag
```

## Validation

Passed:

```text
npx tsx --test tests/v2OperatorMenuBackendContract.test.js tests/v2OperatorMenuView.test.js tests/debugPageRuntime.test.js tests/osPlaybackViews.test.js
```

Result:

```text
35/35 tests passed
```

Passed:

```text
npm run build
```

Typecheck note:

```text
npm run typecheck
```

still fails on existing server-side TypeScript issues outside this V2 visual/backend-contract slice:

```text
server/index.ts(804,79): Property 'key' does not exist on type 'never'.
server/workers/regularStageWorker.ts(501,51): Property 'scannedMediaCount' does not exist on type 'unknown'.
server/workers/regularStageWorker.ts(502,62): Property 'insertedCanonicalCount' does not exist on type 'unknown'.
server/workers/regularStageWorker.ts(523,10): Cannot find name 'isNodeErrorWithCode'.
```

## Non-claims

This slice still does not wire the V2 Operator Menu buttons to execute backend actions. It creates the test-first contract and OpenSpec that says which actions can later use existing backend endpoints and which must remain planned.
