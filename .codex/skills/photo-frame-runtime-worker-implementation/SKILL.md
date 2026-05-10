---
name: photo-frame-runtime-worker-implementation
description: Implement or change runtime workers in the 12_PF photo-frame repository. Use when Codex works on regular_stage_worker, playback_worker, screen_on_off_worker, worker locks, worker logs, worker status files, scheduled worker entrypoints, or backend services that scheduled workers call.
---

# Photo Frame Runtime Worker Implementation

## Operating Rule

Work in strict regression-safe mode. Keep worker changes small, backend-owned, lock-aware, and aligned with the existing scheduler/CronEmulator target split. Do not duplicate dashboard route logic or create a parallel runtime system.

## Worker Boundaries

- `regular_stage_worker`: B3.1-B3.5 only: download, index, parse GPS, geocode, enqueue playback.
- `playback_worker`: B4 playback selection/current-item selection.
- `screen_on_off_worker`: B5 screen simulation today, or real screen hardware later only after a separate hardware contract is approved.

Do not silently move Stage 6 playback selection into `regular_stage_worker`. Do not treat B5 simulation as real hardware control.

## Read First

- `AGENTS.md`
- `docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md`
- `docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md`
- `docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md`
- `placeholder_implementations.md`
- `server/index.ts`
- `server/scheduler_host.ts`
- `server/runtimePipelineLocks.ts`
- `server/database/databaseService.ts`
- `dashboard/services/runtimeExecutionService.ts`
- `tools/CronEmulator/crontab_emulated.txt`

Read narrower files first when the task names a specific worker.

## Workflow

1. Identify which worker is in scope and list the exact stage/API boundary it owns.
2. Locate existing backend service or route logic for that boundary.
3. Prefer extracting or reusing shared backend services over calling UI code or duplicating route internals.
4. Add or reuse single-instance protection for the worker type before executing side effects.
5. Record durable evidence: start time, finish time, stage/action result, skipped reason, failure reason, and status path.
6. Keep scheduled command wiring separate from worker business logic.
7. Update tests around the narrow worker behavior and any affected scheduler/CronEmulator wiring.
8. Update implementation-status docs only when behavior actually changes.

## Implementation Guardrails

- Workers must be callable without the dashboard UI.
- Workers must fail honestly when the backend API, DB, provider, or configured path is unavailable.
- Workers must not run concurrently for the same worker type.
- Workers must not delete unrelated lock/log/state files.
- Stage 1 remains mock/generated-data unless production provider work is explicitly requested.
- Geocode remains deterministic placeholder unless production geocoder work is explicitly requested.
- Screen behavior remains simulation-only unless the screen hardware contract skill applies.

## Verification

Choose the smallest relevant checks:

```powershell
npx tsx --test tests/initApi.step1.test.js
npx tsx --test tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js
npx tsx --test tests/viewB.buttonWorkflow.test.js
npx tsx --test tests/runtimePipelineLocks.test.js
npm run typecheck
```

For CronEmulator changes:

```powershell
cd tools/CronEmulator
$env:PYTHONPATH='src'; python -m pytest
```

Do not start long-running schedulers or live workers unless the user explicitly asks for a live smoke test.
