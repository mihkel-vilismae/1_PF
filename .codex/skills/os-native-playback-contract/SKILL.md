---
name: os-native-playback-contract
description: Define, audit, or implement native OS media playback behavior in the 12_PF photo-frame repository. Use when Codex works on launching or supervising an external/native player, Windows process lifecycle, fullscreen or monitor targeting, player executable selection, path quoting, native playback status/log evidence, fallback behavior, or integration between native playback and the existing playback worker, dashboard, or launcher.
---

# OS Native Playback Contract

## Operating Rule

Use this skill before treating OS-native playback as implemented, production-ready, or equivalent to browser/mock playback. Keep native playback as a contracted extension of the existing playback path, not a duplicate playback system.

## Boundary

- `playback_worker` owns playback selection/current-item work unless current code proves a narrower or newer boundary.
- Dedicated launchers should stay thin and delegate to existing playback runtime/window entrypoints.
- Native playback launch and process supervision must be backend/runtime-owned, not hidden in frontend rendering.
- Screen power, PIR, display hardware, and OS idle behavior belong to the screen hardware contract unless the task explicitly connects them to native player pause/resume.
- Mock, demo, browser, and native playback labels must remain visibly and semantically distinct.

## Read First

Read only the relevant files for the named task. Use `rg --files` if a path has moved.

- `AGENTS.md`
- `scripts/playback_runtime.py`
- `scripts/playback_window.py`
- dedicated playback launcher scripts, if present
- `server/nativePlayback/nativePlaybackController.ts`
- `server/workers/playbackWorker.ts`
- `server/index.ts`
- `server/scheduler_host.ts`
- `server/runtimePipelineLocks.ts`
- `dashboard/views/osPlaybackView.ts`
- `dashboard/services/osPlaybackViewModel.ts`
- dashboard runtime/playback services and views found with `rg "playback"`
- tests covering playback workers, dashboard playback buttons, launchers, or scheduler rows
- `docs/20_architecture_and_specs/native_playback_runner_spec.md`
- `docs/10_runbooks/native_playback_runner_setup.md`
- `placeholder_implementations.md`
- current implementation-status docs only after checking code paths

## Contract Questions

Resolve these before implementation:

- Which native player is used, and how is its executable discovered or configured?
- Which process owns launch, stop, restart, health checks, and stale-process cleanup?
- What media path, playlist, or current-item source is passed to the player?
- What fullscreen, window placement, monitor targeting, and focus behavior is required?
- What happens when the player executable is missing, media is missing, the process exits early, or quoting fails?
- What durable status/log evidence proves launch attempts, current player PID, exit code, skipped reason, and failure reason?
- What fallback path is allowed: fail honestly, browser playback, mock playback, or no-op?
- What operator-visible labels distinguish native playback from browser/mock/simulation playback?

## Implementation Guardrails

- Do not create a second playback selection pipeline.
- Do not move playback selection out of the existing worker/runtime boundary unless explicitly requested.
- Do not start native playback on dashboard render, frontend startup, visual mode selection, or status polling.
- Do not infer native playback readiness from UI labels, docs, or configured paths alone.
- Preserve existing mock/browser/test playback behavior unless the task explicitly changes it.
- Keep command construction explicit and test quoting for paths with spaces.
- Prefer dry-run, mocked process, or command-building tests before live native player execution.
- Redact user paths only when they contain secrets; otherwise keep logs useful enough to diagnose executable and media path issues.
- Record failure honestly instead of silently falling back unless fallback behavior is explicitly contracted.

## Workflow

1. State whether the task is contract-only, implementation, verification, or documentation reconciliation.
2. Trace the current playback path from dashboard/scheduler/worker entrypoint to media selection and launch boundary.
3. Classify current native playback support as `implemented`, `partial`, `mock/browser-only`, `placeholder`, `broken`, or `unknown`.
4. Identify the smallest boundary that must change: configuration, command building, process launch, status evidence, launcher routing, UI label, test, or docs.
5. Implement locally inside the existing owner module or nearest current entrypoint.
6. Add focused tests for command construction, missing executable/media behavior, process result handling, and preserved fallback semantics.
7. Update status docs or placeholder ledgers only when direct code or runtime evidence changed.

## Verification

Choose the smallest relevant checks:

```powershell
npx tsx --test tests/nativePlaybackController.test.js
npx tsx --test tests/osPlaybackViews.test.js
npx tsx --test tests/osPlaybackObservability.test.js
npx tsx --test tests/playbackWorker.test.js
npx tsx --test tests/viewB.buttonWorkflow.test.js
npx tsx --test tests/runtimePipelineLocks.test.js
npm run typecheck
```

For Python playback scripts, prefer focused `pytest` or `unittest` checks around argument routing and process supervision. Do not run a live native player, long-running scheduler, or fullscreen smoke test unless the user explicitly asks for live validation.

## Output

Report:

- native playback claim or change checked
- classification and verified evidence
- preserved playback/dashboard/worker behavior
- exact changed files, if any
- tests or commands run and results
- any live OS/player validation still requiring user-side confirmation
