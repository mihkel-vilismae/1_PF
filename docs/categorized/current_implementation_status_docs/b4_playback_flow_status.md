# B4 Playback Flow Status

Audit timestamp: 2026-05-10 17:38 EEST

This document is a code-verified closure note for the B4 playback flow after the v0.5.1 playback slices. It records what the current repository actually implements, how B3.5 queue preparation relates to `playback_worker`, and what remains planned.

## Summary

B4 is now a backend-wired playback selection surface with frontend rendering-mode controls and a backend scheduler worker entrypoint. In the worker cycle, B3.5 prepares/builds the playback queue first; `playback_worker` is the final worker-stage action that selects the current playable item from that already prepared queue/state before the overall loop can begin again. B4 still does not perform real media rendering, OS-level fullscreen display, Raspberry Pi display control, or B5 screen hardware control.

## Verified B4 flow

| Step | Current implementation | Status | Evidence |
|---|---|---|---|
| B4 Run button | The View B `run-b4` action calls the backend playback selection endpoint. | Real backend-wired selection | `dashboard/views/testView.ts`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts`; `dashboard/services/runtimeExecutionService.ts` |
| Backend endpoint | `POST /api/runtime/playback/select-current` routes to shared playback selection logic. | Real backend route | `server/index.ts`; `server/playback/playbackSelectionService.ts` |
| Selection behavior | The selection service reuses Stage 6 playback selection through the database service and returns selected, no-ready-row, or no-playable-ready-row outcomes. | Real selection with honest skipped states | `server/playback/playbackSelectionService.ts`; `server/database/databaseService.ts`; `tests/playbackWorker.test.js`; `tests/waveA.step2.test.js` |
| B4 rendering controls | View B renders playback without rendering, preview-window mode, and fullscreen mode controls. Preview/fullscreen are gated until playback is ready. | UI contract only | `dashboard/views/testView.ts`; `dashboard/services/playbackRenderer.ts`; `tests/viewB.buttonWorkflow.test.js`; `tests/playbackRenderer.test.js` |
| Rendering platform tabs | View B renders Windows and Raspberry OS rendering tabs. Raspberry OS remains disabled/planned. | UI contract only | `dashboard/views/testView.ts`; `dashboard/services/playbackRenderer.ts`; `tests/viewB.buttonWorkflow.test.js` |
| Backend playback worker | `playback_worker` can run from the backend CLI scheduler path as the final worker-stage action after B3.5 queue preparation/building. It selects the current playable item with lock/status evidence. | Real worker entrypoint for selection only | `server/index.ts`; `server/workers/playbackWorker.ts`; `tests/playbackWorker.test.js` |
| Scheduler command wiring | The shared playback-worker command is `npm run api -- --scheduler playback-worker`. Raspberry cron is classified as real; Windows CronEmulator wiring is classified as partial because it depends on the emulator launch context. | Real/partial, honestly classified | `shared/schedulerWorkerCommands.ts`; `dashboard/services/runtimeTruth/runtimeTruthState.ts`; `server/index.ts`; `tests/schedulerPlaybackWorkerCommand.test.js` |

## What is real now

- B4 Run calls `POST /api/runtime/playback/select-current`.
- The backend selection path is shared between the HTTP route and `playback_worker`.
- The backend worker writes status evidence under `runtime_data/scheduler/playback-worker-status.json` when executed.
- The worker uses a single-instance lock file under `runtime_data/scheduler/playback-worker-lock.json` during execution.
- The worker records selected item evidence, skipped reason evidence, or failure reason evidence.
- B3.5 owns queue preparation/building before playback selection.
- `playback_worker` is the final worker-stage action in the current loop and consumes prepared playback queue/state; it does not create that queue.
- Raspberry cron generation uses the shared playback-worker command.
- Windows CronEmulator default install text no longer points at `/path/to/playback_worker`.

## What remains planned or placeholder

- Preview-window rendering is not yet real media display.
- Fullscreen rendering is not yet real media display.
- Raspberry OS rendering remains disabled/planned in the B4 UI.
- No Raspberry Pi display or hardware fullscreen control is implemented in B4.
- B5 screen simulation/hardware behavior is separate and was not upgraded by the B4 playback slices.
- B3 pipeline stages remain separate from `playback_worker`; B3.5 owns queue preparation/building, and `playback_worker` does not download, index, parse GPS, geocode, prepare/build the queue, render media, enter fullscreen, or control screen hardware.
- Windows CronEmulator playback-worker command wiring is classified as partial because it reaches the backend worker only when launched from the expected `tools/CronEmulator` context. In v0.5.1 the CronEmulator files are vendored/tracked, but this does not by itself prove a live installed Windows CronEmulator runtime is running successfully.

## Current B4 boundaries

| Boundary | Owner | B4 status |
|---|---|---|
| Queue preparation/building | B3.5 / regular runtime pipeline | Outside B4; runs before `playback_worker` selection |
| Current playable item selection | B4 route and `playback_worker` | Implemented; final worker-stage action after B3.5 |
| Rendering mode choice | B4 frontend UI contract | Implemented as UI state/contract |
| Real preview media rendering | Future renderer implementation | Not implemented |
| Real fullscreen media rendering | Future renderer implementation | Not implemented |
| Raspberry display control | Future Raspberry/display worker or renderer contract | Not implemented |
| Screen on/off simulation or hardware | B5 / screen worker boundary | Outside B4 |

## Verification commands

The B4 closure audit expects these focused checks to pass:

```bash
npm test -- --test-reporter=spec tests/schedulerPlaybackWorkerCommand.test.js tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js tests/playbackWorker.test.js tests/viewB.buttonWorkflow.test.js tests/playbackRenderer.test.js tests/b4PlaybackFlowStatusDoc.test.js
node scripts/version_guard.mjs repo
npx tsx --test tests/inspectMetadataDriftGuard.test.js
```

TypeScript status is not clean repo-wide in the current workspace. Existing failures are in older inspect/auth/database/runtime typing areas and should be tracked separately from the B4 playback closure.
