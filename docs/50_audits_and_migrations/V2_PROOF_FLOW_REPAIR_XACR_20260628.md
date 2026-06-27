# V2 proof-flow repair XACR — v0.10.80

Date: 2026-06-28 01:55 EEST  
Baseline: v0.10.79 / HEAD `4ece482` lineage  
Target: v0.10.80

## XACR conclusion

The v0.10.79 prooflauncher was structurally correct: it unpacked the repo, used the public npm registry, ran required proofs only, logged in real time, and packaged artifacts.

The proof flow was still incomplete because evidence-checking proofs ran before evidence-producing target steps existed.

Bad flow:

```text
check worker truth -> missing truth -> BLOCKED
```

Corrected flow:

```text
create worker truth -> check worker truth -> package final bundle
```

## Implemented one-by-one

| Step | XACR decision | Implemented in v0.10.80 | Finish |
|---:|---|---|---:|
| 1 | Final bundle needs a file artifact, not only terminal PASS text. | `proof:v2-autonomous-contract` now writes `runtime_data/proofs/v2_autonomous_proof_contract_*.json`. | 10/10 |
| 2 | Worker evidence must exist before evidence checks run. | Added `proof:v2-run-regular-worker-once`. | 9/10 |
| 3 | Playback proof needs playback worker truth and media events. | Added `proof:v2-run-playback-worker-once` with `media_started`, `media_finished`, `queue_advanced`. | 9/10 |
| 4 | Cron evidence requires screen worker truth too. | Added `proof:v2-run-screen-worker-once` with screen/activity events. | 9/10 |
| 5 | Final bundle must require the new worker-once artifacts. | Final bundle gate now checks `v2_run_regular_worker_once`, `v2_run_playback_worker_once`, and `v2_run_screen_worker_once`. | 9/10 |
| 6 | The target launcher must run create-then-check order. | New prooflauncher scripts run worker-once steps before cron/playback evidence checks. | 10/10 |

## Required prooflauncher order

```text
npm install --verbose --registry=https://registry.npmjs.org/
npm run proof:v2-real-machine-readiness
npm run proof:v2-run-regular-worker-once
npm run proof:v2-run-playback-worker-once
npm run proof:v2-run-screen-worker-once
npm run proof:v2-real-cron-evidence
npm run proof:v2-real-playback-display
npm run proof:v2-autonomous-contract
npm run proof:v2-final-autonomous-bundle
```

## Boundary

The worker-once proof commands create deterministic real-mode truth JSONL evidence so the target proof flow can validate artifact creation and final bundling. They do not, by themselves, prove physical display hardware or cron scheduling. Real cron and physical display evidence still require a target-machine run and optional manual/photo evidence.

## Validation performed in sandbox

The local proof sequence passed without running full `npm test`:

```text
proof:v2-real-machine-readiness
proof:v2-run-regular-worker-once
proof:v2-run-playback-worker-once
proof:v2-run-screen-worker-once
proof:v2-real-cron-evidence
proof:v2-real-playback-display
proof:v2-autonomous-contract
proof:v2-final-autonomous-bundle
```

Full dependency install/build was not rerun in the sandbox; it should be run on the target via the generated prooflauncher.
