# Nested payload scroll verification

Estonian timestamp: 2026-05-28 13:04 EEST

## Targeted tests

Command:

```bash
npm test -- tests/scrollPreservationMarkers.test.js tests/newAuthSlice4TwoFactorDiagnostics.test.js
```

Result:

```text
tests 8
pass 8
fail 0
```

## Build

Command:

```bash
npm run build
```

Result: passed.

## Full suite

Command:

```bash
npm test
```

Result: attempted in the Linux tool environment and timed out before completion. No failing assertion was captured before the timeout.

## Verification meaning

The targeted tests cover the nested payload scroll regression by verifying that `renderResultSurface()` emits stable `data-scroll-preserve` markers for both the payload block and the inner `.result-json` scroll surface. The existing new-auth prompt rendering test also confirms that the result surface still renders provider-proof prompts outside the JSON payload.
