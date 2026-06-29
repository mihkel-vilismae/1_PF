# Mock vs Real Runtime Adapter Boundary

Category: implementation guardrail

## Purpose

This document preserves the strongest architecture rule for the mock-demo terminal:

```text
The terminal UI is reusable.
Only the runtime adapter is mock.
```

The current project generates a mock-demo terminal, not the real Demo Mode runtime. The code should still be shaped so the same UI can later be reused for real Demo Mode.

## Current mock adapter

`MockDemoRuntimeAdapter` is allowed to:

- hold hardcoded media rows,
- produce scripted mock state,
- simulate Q button presses,
- simulate index/GPS/geocode progress,
- update mock RPI-STAGES and RPI-WORKERS panels,
- update row #1 when Q completes.

It must not:

- call real workers,
- write a real database,
- read real source-of-truth files,
- use cron/crontab,
- claim that mock state is runtime proof.

## Future real adapter

`RealDemoRuntimeAdapter` must later replace mock state with real Demo Mode state.

The future real adapter must use:

- demo runtime path resolver,
- demo-owned SQLite DB,
- demo media/source data,
- demo worker truth JSONL,
- demo scheduler/status/lock files where useful,
- existing workers/stages,
- manual worker/stage calls, not cron.

It must not invent fake logic for the real Demo Mode path.

## Correct future swap

```text
Terminal UI
  -> DemoRuntimeAdapter interface
     -> MockDemoRuntimeAdapter now
     -> RealDemoRuntimeAdapter later
```

The terminal UI should not need to know whether the state came from mock state or real Demo Mode truth.

## Forbidden shortcut

Do not do this later:

```text
Real terminal Demo Mode
  -> copy mock row updates
  -> fake RPI-STAGES
  -> fake RPI-WORKERS
  -> skip workers/stages
```

That would make the real demo misleading.

## Safe real-demo behavior later

```text
Key press
  -> real adapter resolves runtimeMode=demo
  -> calls existing stage/worker logic manually
  -> worker/stage writes demo DB/truth/status
  -> adapter reads demo DB/truth/status
  -> terminal UI renders DemoTerminalState
```
