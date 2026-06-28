# Prooflauncher GUI selection

Status: active launcher UX contract for generated `2proofrunner 1repo` handoffs.

When the operator starts `PROOF_WIN.PS1` or `PROOF_RASPBERRYOS.SH`, the launcher should show a simple terminal GUI/menu after baseline verification and before proof discovery.

## Options

| Option | Mode | Meaning | Recommended use |
|---:|---|---|---|
| 1 | `quick` | Fast post-slice smoke queue for docs, queue, handoff/runtime/progress/packaging contracts. | First local confidence pass after a code slice. |
| 2 | `blockers` | Current readiness blocker families: iCloud/auth, real media, geocode, worker bridge, playback/display, and readiness summaries. | First Raspberry target pass after `quick` succeeds. |
| 3 | `platform` | Platform/hardware/native/display/playback/cron proof family for the current launcher platform. | Use after blockers to check host-specific behavior. |
| 4 | `failed-last` | Re-run proofs that failed in the previous launcher run; falls back to quick when no failed-history exists. | Triage loop after a failed proofrunner run. |
| 5 | `minimum` | Legacy minimum smoke/readiness queue retained for compatibility. | Safe non-interactive default. |
| 6 | `full` | Complete repo-ordered proof queue; legacy `all` maps here. | Final sweep, not the first run. |

The launcher may also accept environment overrides for automation:

```text
PF_PROOF_MODE=quick
PF_PROOF_MODE=blockers
PF_PROOF_MODE=platform
PF_PROOF_MODE=failed-last
PF_PROOF_MODE=minimum
PF_PROOF_MODE=full
PF_PROOF_MODE=changed
```

Legacy compatibility remains accepted:

```text
PF_PROOF_LAUNCHER_MODE=all      # maps to full
PF_PROOF_LAUNCHER_MODE=minimum  # maps to minimum
```

`PF_PROOF_MODE` is the preferred queue-selection variable. `PF_PROOF_LAUNCHER_MODE` is kept for old handoffs and should only be used as a compatibility alias.

## Recommended run order

```text
quick -> blockers -> platform -> failed-last when needed -> full
```

`full` is still required before a major release candidate or complete regression sweep, but it should not be the first thing an operator runs on a fresh target machine.

## Minimum proof set

The minimum proof set is owned by `tools/proof-runner-queue-lib.mjs` as `MINIMUM_PROOF_RUNNER_PROOFS`. It must keep final summary proofs last.

## Happy-path proofs

`npm run proof:prooflauncher-gui-selection` proves that launcher mode selection exposes every documented operator mode and that final summary proofs remain last when the selected queue includes them.

## Timing UX

Launcher output should show elapsed time, estimated finish time, estimated time remaining, per-command duration, and a final timing table. When historical duration data is available from prior runs, future launchers should use exact command timing first, category timing second, platform average third, and global average last.

## Non-claims

The menu does not prove real provider login, real download, real geocode, product pipeline, display/hardware behavior, or final v1 readiness. It only selects which proof commands are run.

## Timing history evidence contract

Every generated prooflauncher iteration should write machine-readable timing observations with:

- `started_at`
- `ended_at`
- `duration_seconds`
- `category`
- `estimate_seconds`
- `estimate_source`

The estimate priority is exact command history, then category history, then platform average, then global average. Launchers should also print elapsed time, estimated finish time, estimated time remaining, green PASS rows, red FAIL/TIMEOUT rows, and a final timing table.
