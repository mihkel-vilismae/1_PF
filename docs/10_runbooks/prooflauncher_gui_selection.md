# Prooflauncher GUI selection

Status: active launcher UX contract for generated `2proofrunner 1repo` handoffs.

When the operator starts `PROOF_WIN.PS1` or `PROOF_RASPBERRYOS.SH`, the launcher should show a simple terminal GUI/menu after baseline verification and before proof discovery.

## Options

| Option | Mode | Meaning |
|---:|---|---|
| 1 | `all` | Run the full repo-ordered proof queue. |
| 2 | `minimum` | Run only the minimum smoke/readiness proofs needed to check launcher health, docs/OpenSpec/registry consistency, full-test stability, v1 readiness summary, blocker summary, and final proofrunner summary. |

The launcher may also accept an environment override for automation:

```text
PF_PROOF_LAUNCHER_MODE=all
PF_PROOF_LAUNCHER_MODE=minimum
```

## Minimum proof set

The minimum proof set is owned by `tools/proof-runner-queue-lib.mjs` as `MINIMUM_PROOF_RUNNER_PROOFS`. It must keep final summary proofs last.

## Happy-path proofs

`npm run proof:prooflauncher-gui-selection` proves both happy paths:

1. `all` mode returns the full ordered proof queue.
2. `minimum` mode returns a shorter queue with no missing required minimum proofs and final summary proofs last.

## Timing UX

Launcher output should show elapsed time, estimated finish time, estimated time remaining, per-command duration, and a final timing table. When historical duration data is available from prior runs, future launchers should use exact command timing first, category timing second, platform average third, and global average last.

## Non-claims

The menu does not prove real provider login, real download, real geocode, product pipeline, display/hardware behavior, or final v1 readiness. It only selects which proof commands are run.
