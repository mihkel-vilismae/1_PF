---
name: photo-frame-worker-verification
description: Verify 12_PF photo-frame worker execution. Use when Codex needs to answer whether regular_stage_worker, playback_worker, screen_on_off_worker, CronEmulator rows, scheduler commands, worker locks, logs, status files, or backend worker routes actually run anything.
---

# Photo Frame Worker Verification

## Operating Rule

Classify worker behavior from evidence. Do not infer real execution from labels, comments, frontend status badges, or target-spec docs alone.

## Classification

- `real`: command reaches implemented backend/service logic and produces durable side effects or observable no-op success for valid conditions.
- `partial`: command reaches implemented logic but one or more required production pieces are mock, placeholder, simulation-only, provider-dependent, or undocumented.
- `mock/simulation`: behavior is intentionally test-only, generated-data, deterministic placeholder, or screen simulation.
- `placeholder`: command/name/UI exists but no real worker/service execution exists.
- `broken`: command is wired but fails due to bad path, bad quoting, missing executable, missing API, or contract mismatch.

## Trace Pattern

Trace this chain end to end:

```text
crontab row -> shell command -> process/API call -> backend route/service -> lock/log/status evidence
```

When the task involves Windows, include the CronEmulator process boundary:

```text
tools/CronEmulator/crontab_emulated.txt -> cronemulator scheduler -> subprocess.run(shell=True) -> command result log
```

## Read First

- `tools/CronEmulator/crontab_emulated.txt`
- `tools/CronEmulator/src/cronemulator/scheduler.py`
- `tools/CronEmulator/src/cronemulator/state.py`
- `tools/CronEmulator/src/cronemulator/executor.py`
- `server/index.ts`
- `server/scheduler_host.ts`
- `server/runtimePipelineLocks.ts`
- `runtime_data/scheduler/**` when local runtime evidence matters
- `docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md`
- `placeholder_implementations.md`

## Workflow

1. State the worker or command being verified.
2. Identify the configured scheduler target and active crontab row.
3. Parse the command exactly, including quoting and target port.
4. Verify the target process, API route, script, or executable exists.
5. Verify whether execution reaches backend-owned logic.
6. Check for lock/status/log evidence, including prior `cron_calls.jsonl` entries when relevant.
7. Classify the result using the classification list.
8. Separate code-verified behavior from runtime evidence and docs.

## Safety

Do not start CronEmulator or live scheduler hosts unless the user asks for a live smoke test. If live execution is requested, first display the exact command rows that will run and identify expected side effects.

## Output

Report:

- worker/command checked
- classification
- verified execution path
- latest runtime evidence, if inspected
- broken or placeholder segment, if any
- minimum next fix
- commands run and results
