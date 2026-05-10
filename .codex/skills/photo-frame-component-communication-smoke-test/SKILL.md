---
name: photo-frame-component-communication-smoke-test
description: Smoke-test runtime communication between 12_PF photo-frame components. Use when Codex needs to verify frontend-to-backend API reachability, backend config/SQLite access, backend-to-CronEmulator communication, CronEmulator-to-backend runtime calls, scheduler/worker command reachability, or dashboard action communication paths.
---

# Photo Frame Component Communication Smoke Test

## Operating Rule

Treat live communication tests as side-effectful. Start with read-only or low-risk endpoints, isolate env/DB paths when possible, and do not start CronEmulator schedulers or worker loops unless the user explicitly approves the exact commands that will run.

## Scope

Verify runtime links:

- frontend dev server or built UI to backend `/api/*`
- backend `/api/version`, env verification, and safe status endpoints
- backend to SQLite status/inspect paths
- backend to CronEmulator local API when CronEmulator is already running
- CronEmulator command rows to backend runtime endpoints when a live scheduler test is approved
- dashboard action buttons to backend responses
- worker commands to their intended backend route or service entrypoint

## Classification

- `communicates`: request reaches the expected target and returns the expected safe response.
- `blocked`: target exists but dependency, auth, config, DB, provider, or platform condition blocks success honestly.
- `missing-target`: process, route, endpoint, file, or executable is absent.
- `wrong-port/path`: command is syntactically present but points to the wrong target.
- `mock-only`: communication works but reaches generated-data, deterministic placeholder, or simulation-only behavior.
- `unsafe-to-live-test`: test would execute scheduler/worker/provider/destructive behavior without explicit approval or isolation.

## Read First

- `server/index.ts`
- `vite.config.ts`
- `dashboard/services/*Service.ts`
- `dashboard/services/runtimeExecutionService.ts`
- `tools/CronEmulator/crontab_emulated.txt`
- `tools/CronEmulator/src/cronemulator/executor.py`
- `server/scheduler_host.ts`
- `server/runtimePipelineLocks.ts`
- `docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md`
- `placeholder_implementations.md`

Use `photo-frame-worker-verification` when the question is specifically whether a worker or crontab row actually executes.

## Safety Ladder

1. Static route/path check.
2. Read-only live endpoint check.
3. Low-risk POST with isolated temp env/DB, if supported.
4. Existing-process check, such as CronEmulator `/api/state`, without starting it.
5. Live scheduler/worker execution only after explicit approval and command review.

## Workflow

1. State the communication link being tested.
2. Identify expected source, target, port, route, method, and payload.
3. Confirm the target exists statically.
4. Choose the lowest-risk live check from the safety ladder.
5. Run the check and capture status code, payload status, and key message.
6. Classify the link using the classification list.
7. Stop any process started for the test before finishing.
8. Report links not tested because they are unsafe or need user-side setup.

## Suggested Safe Checks

When the backend is already running:

```powershell
Invoke-RestMethod http://127.0.0.1:4301/api/version
Invoke-RestMethod http://127.0.0.1:4301/api/init/database/status
Invoke-RestMethod http://127.0.0.1:4301/api/init/cron/status
Invoke-RestMethod http://127.0.0.1:4301/api/runtime/orchestration/current
```

When CronEmulator is already running:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/api/state
```

Do not call `/api/init/cron/emulator/run`, `/api/scheduler/start`, or live crontab rows unless approved.

## Output

Report:

- link map tested
- result classification per link
- commands run
- exact response evidence summary
- skipped/unsafe links
- next smallest fix for failed communication
