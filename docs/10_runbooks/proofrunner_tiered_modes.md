# Proofrunner tiered modes

Status: active contract  
Introduced: v0.10.8

The full proofrunner is still available, but operators should not need to run the whole queue after every slice. Launchers may select a smaller queue with `PF_PROOF_MODE`.

## Modes

| Mode | Purpose | Typical size |
|---|---|---:|
| `quick` | Fast post-slice smoke: docs, queue, handoff/runtime/progress/packaging contracts | ~7 proofs |
| `changed` | Requested changed proofs plus quick-core safety proofs | usually 8-15 proofs |
| `blockers` | Current readiness blocker families: iCloud, worker pipeline, geocode, playback/display, readiness summaries | ~15-25 proofs |
| `failed-last` | Re-run proofs that failed in the previous launcher run; falls back to quick if no failure history exists | variable |
| `platform` | Platform/hardware/display/playback/cron/native proof family for the current launcher platform | ~40-50 proofs |
| `full` | Complete proof queue, equivalent to the historical all-proofs launcher | 140+ proofs |

Legacy modes remain accepted:

- `all` maps to `full`;
- `minimum` keeps the previous release-smoke minimum queue for compatibility.

## Environment variables

```bash
PF_PROOF_MODE=quick|changed|blockers|failed-last|platform|full
PF_PROOF_CHANGED_PROOFS="proof:a,proof:b"
PF_PROOF_LAST_FAILED_PATH=/path/to/proof_last_failed.json
```

Windows example:

```powershell
$env:PF_PROOF_MODE = "quick"
.\PROOF_WIN.PS1
```

RaspberryOS example:

```bash
export PF_PROOF_MODE="blockers"
./PROOF_RASPBERRYOS.SH
```

Changed-proofs example:

```bash
export PF_PROOF_MODE="changed"
export PF_PROOF_CHANGED_PROOFS="proof:regular-worker-product-contract,proof:proofrunner-tiered-queues"
./PROOF_RASPBERRYOS.SH
```

## Result artifacts

Launchers must record the selected mode in `repo_identity.json`, `last_run_stats.json` inputs, and `logs/proof_queue_plan.json`.

Launchers must also persist the last failed proof names at handoff root as `proof_last_failed.json` so `PF_PROOF_MODE=failed-last` can re-run only the previously failed commands. If no failed-history file is present, `failed-last` falls back to `quick`.

Timing history remains packaged:

- `logs/proof_timing_history.jsonl` — current run timing rows;
- `logs/proof_timing_history_handoff_root.jsonl` — cumulative handoff-root timing history when available.

## Non-claims

- `quick`, `changed`, `blockers`, `failed-last`, and `platform` are not full release certification.
- `full` is still required before major release candidates or when a complete regression sweep is needed.
- Raspberry/hardware/operator evidence still requires target-machine proof results.
