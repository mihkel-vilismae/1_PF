# PF_login / PhotoFrame — TypeScript typecheck fix

## Fixed errors

```text
server/index.ts(804,79): Property 'key' does not exist on type 'never'
server/workers/regularStageWorker.ts(501,51): scannedMediaCount on unknown
server/workers/regularStageWorker.ts(502,62): insertedCanonicalCount on unknown
server/workers/regularStageWorker.ts(523,10): isNodeErrorWithCode not found
```

## Changes

### `server/index.ts`

Changed the regular-stage worker backend-stage default branch so it does not read `.key` from a `never` value. It now safely casts the unsupported branch before formatting the diagnostic message.

### `server/workers/regularStageWorker.ts`

Changed payload summarization so `payload.indexing` is narrowed to a JSON object before reading:

```text
scannedMediaCount
insertedCanonicalCount
```

Added missing helper:

```text
isNodeErrorWithCode(error, code)
```

for safe lock-file `EEXIST` handling.

## Validation

Passed:

```text
npm run typecheck
npm run build
npx tsx --test tests/v2OperatorMenuBackendContract.test.js tests/v2OperatorMenuView.test.js tests/debugPageRuntime.test.js tests/osPlaybackViews.test.js tests/regularStageWorkerB3StateMachine.test.ts tests/regularWorkerProductEvidenceProducerAutoManifest.test.js
```

Targeted tests: `38/38 passed`.
