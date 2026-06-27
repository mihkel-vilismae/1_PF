# V2 Beeline XACR Slice Batch — Worker Truth UI and Manual Test Guard

Date: 2026-06-27
Base: v0.10.74
Next version: v0.10.75

## XACR conclusion

The remaining slice plan is still coherent, but the next safe implementation step is not the final autonomous display loop yet. The next blocker is that the V2 UI must consume the worker truth API that was added in v0.10.74 and must stop showing static RPI rows when real/test source-of-truth data exists.

This batch therefore implements the next safety slice:

1. Add a browser client for `/api/v2/worker-truth`.
2. Poll worker truth while V2 is visible.
3. Store the combined worker truth payload in runtime state.
4. Render live truth summaries in every RPI stages/workers row.
5. Pass batch-size settings from V2 manual stage rows into backend stage action payloads.
6. Block manual TEST stage execution when REAL mode is active.

## What changed

### Frontend worker truth API client

Added `dashboard/services/v2WorkerTruthClient.ts` as the only browser-side access path for worker truth data. This preserves the rule that the UI must not read worker files directly.

### Runtime state projection

Added `refreshV2WorkerTruth(mode)` in `dashboard/services/runtimeTruth.ts`. It reads combined worker truth from the backend and stores it under `state.v2WorkerTruth.test` or `state.v2WorkerTruth.real`.

### V2 polling

`dashboard/app.ts` now polls worker truth every five seconds while the V2 operator shell is visible. The real playback page forces `REAL` truth; other pages use the selected V2 mode.

### RPI rows now display live truth

`dashboard/views/v2StartupOperatorMenuView.ts` now renders event counts, malformed-line warnings, last stage/worker status, counts, and messages from the combined truth payload.

### Manual stage guard and batch size

V2 `run-b3-*` actions now include the selected batch size in their backend payload. Manual test runs from the `04 workers` page are blocked when the selected V2 mode is `REAL`.

## Preserved

- Existing backend endpoint paths are preserved.
- Existing worker truth API is preserved.
- Existing V2 route structure is preserved.
- Existing playback drag/drop queue behavior is preserved.
- Existing recovery snapshot behavior is preserved.

## Still remaining

- Real crontab add/read/remove write test.
- Full autonomous playback display loop.
- Real screen on/off worker proof.
- 07 PIR real/fake wake behavior completion.
- 08 pseudo queue fullscreen playback controls.
- 09 fullscreen and non-fullscreen real playback proof.
- Automatic recovery tied to worker restart.
- Full build/test run on a machine with project dependencies installed.
