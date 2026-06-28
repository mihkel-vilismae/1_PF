# V2 Recovery Engine Decoupling XACR — 2026-06-28

## Baseline

- Input baseline: `PF_login_v0.10.85_production_cron_split_full_git.zip`
- Output target: `v0.10.86`
- Rule preserved: prooflauncher logs ZIPs stay logs/evidence-only and must not include `workspace/`, extracted repo files, `node_modules/`, `.git/`, `package.json`, or `package-lock.json`.

## Architectural decision

Recovery is implemented as a service/subsystem, not a fourth always-running worker.

```text
regular worker / playback worker / screen worker / startup / UI / proof commands
        |
        v
server/services/recovery/recoveryService.ts
        |
        v
engine registry -> v1 file engine or v2 stub engine
```

Workers, UI routes, startup checks, and proof commands call the stable recovery service contract instead of directly manipulating recovery files.

## Implemented files

| Area | Files | Status | Completion |
|---|---|---:|---:|
| Contract | `server/services/recovery/recoveryContract.ts` | implemented | 10/10 |
| Registry | `server/services/recovery/recoveryEngineRegistry.ts` | implemented | 10/10 |
| Service | `server/services/recovery/recoveryService.ts` | implemented | 10/10 |
| V1 engine | `server/services/recovery/engines/recoveryV1FileEngine.ts` | implemented | 10/10 |
| V2 stub | `server/services/recovery/engines/recoveryV2StubEngine.ts` | implemented as selectable stub | 9/10 |
| Existing API facade | `server/recovery/v2RecoveryStateService.ts` | routed through recovery service | 9/10 |
| Server routing | `server/index.ts` | startup hook and resume-target route added | 9/10 |
| Proofs | `tools/run-v2-recovery-*.mjs` | implemented | 10/10 |
| Final bundle | `tools/run-v2-final-autonomous-proof-bundle.mjs` | reports recovery layer | 10/10 |
| Prooflauncher | `start_scripts/prooflauncher_raspberry.sh` | recovery proofs added before existing cron chain | 9/10 |

## Engine selector

`PF_V2_RECOVERY_ENGINE` selects the active engine.

| Value | Behavior | Default | Completion |
|---|---|---:|---:|
| missing | selects `v1` | yes | 10/10 |
| `v1` | file-backed recovery engine | yes | 10/10 |
| `v2-stub` | selectable not-implemented stub for future engine swap | no | 9/10 |
| unknown | fails safely with `RecoveryEngineSelectionError` | no | 10/10 |

`example.env` and `test.example.env` include:

```text
PF_V2_RECOVERY_ENGINE=v1
```

## V1 file engine behavior

The v1 engine writes lightweight, non-secret recovery artifacts under:

```text
runtime_data/recovery/
  active_engine.json
  latest_recovery_snapshot.json
  unclean_shutdown.flag
  restart_check_latest.json
  worker_checkpoints.jsonl
  snapshots/recovery_snapshot_<timestamp>_<id>.json
```

Restart checks archive the active unclean-shutdown flag instead of silently deleting it:

```text
runtime_data/recovery/unclean_shutdown_<timestamp>_<reason>.flag.json
```

## Proof commands

| Command | Purpose | Hardware required | Completion |
|---|---|---:|---:|
| `proof:v2-recovery-engine-contract` | static service/registry/engine/API/final-bundle contract | no | 10/10 |
| `proof:v2-recovery-engine` | runtime-safe v1 filesystem proof | no | 10/10 |
| `proof:v2-recovery-emulate-power-off` | save snapshot and write unclean-shutdown marker | no | 10/10 |
| `proof:v2-recovery-restart-check` | seeded restart-check proof with resume target | no | 10/10 |

## Final bundle behavior

The final autonomous bundle now reports recovery separately via `recoveryEngineArchitecture` and recovery proof statuses. This preserves existing proof-cron, production-cron, playback, and visual physical evidence layers while adding recovery architecture visibility.

## What is intentionally not claimed

| Boundary | v0.10.86 status | Future target | Completion |
|---|---|---|---:|
| Physical power-loss proof | not attempted | v0.10.87 | 0/10 |
| Exact video timestamp resume | not required | later recovery engine | 0/10 |
| Production recovery algorithm perfection | not claimed | v2/v3 engine work | 4/10 |

## Regression preservation

| Existing behavior | Preservation status | Completion |
|---|---:|---:|
| v0.10.85 production cron split scripts remain registered | preserved | 10/10 |
| prooflauncher still avoids full `npm test` | preserved | 10/10 |
| logs-only prooflauncher ZIP hygiene remains enforced | preserved | 10/10 |
| dashboard-compatible recovery API envelopes remain available | preserved with new `recoveryService` metadata | 9/10 |
| recovery is not scheduled as a cron worker | preserved | 10/10 |

## Validation

Validated locally on the implementation machine:

```text
npm run typecheck
npm run proof:v2-recovery-engine-contract
npm run proof:v2-recovery-engine
npm run proof:v2-recovery-emulate-power-off
npm run proof:v2-recovery-restart-check
npm run proof:v2-final-autonomous-bundle-contract
```

Physical Raspberry power-loss proof is deferred to `v0.10.87` by design.
