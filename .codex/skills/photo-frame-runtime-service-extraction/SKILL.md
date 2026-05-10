---
name: photo-frame-runtime-service-extraction
description: Extract reusable backend runtime services in the 12_PF photo-frame repository. Use when Codex needs dashboard routes and runtime workers to share pipeline, playback, screen, lock, log, or orchestration logic without duplicating code from server/index.ts.
---

# Photo Frame Runtime Service Extraction

## Operating Rule

Extract only when a real second caller exists or is being implemented. Keep behavior identical unless the user explicitly requests a behavior change.

## Goal

Move backend-owned runtime business logic behind a shared service boundary so both HTTP routes and scheduled workers can call the same implementation.

## Read First

- `AGENTS.md`
- `server/index.ts`
- `server/database/databaseService.ts`
- `server/runtimePipelineLocks.ts`
- `tests/waveB.step3.test.js`
- `tests/waveC.step4.test.js`
- `tests/waveD.e2e.test.js`
- `tests/waveE.step5.test.js`
- `tests/viewB.buttonWorkflow.test.js`

Use `source-of-truth` as well when extraction changes implementation-status claims.

## Extraction Workflow

1. Identify the route handler and the new non-route caller.
2. Document the current route payload, status codes, errors, and side effects before editing.
3. Move only route-independent logic into a focused backend service.
4. Keep HTTP request parsing, status-code mapping, and route envelopes in `server/index.ts` unless an existing pattern says otherwise.
5. Keep database work inside `server/database/databaseService.ts` or existing database helpers.
6. Have route handlers and workers call the shared service, not each other.
7. Preserve existing tests first, then add focused coverage for the new worker/service caller.

## Guardrails

- Do not turn `server/index.ts` cleanup into a broad refactor.
- Do not create new service layers for one-off logic.
- Do not change route response shapes as part of extraction unless required and documented.
- Do not duplicate SQL or pipeline stage logic in worker files.
- Do not promote mock/generated download or placeholder geocode to production behavior by moving code.

## Verification

Run the tests covering the extracted behavior:

```powershell
npx tsx --test tests/viewB.buttonWorkflow.test.js
npx tsx --test tests/waveB.step3.test.js
npx tsx --test tests/waveC.step4.test.js
npx tsx --test tests/waveD.e2e.test.js
npx tsx --test tests/waveE.step5.test.js
npm run typecheck
```

If only one stage is touched, run the narrowest matching test subset and state what remains unverified.
