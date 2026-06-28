# V2 Recovery Engine Strategy Contract

Status: current OpenSpec for the canonical recovery-state / interchangeable-strategy architecture.

## Intent

Recovery engines are interchangeable **strategies** over one project-owned recovery-state schema. The app chooses the active strategy with `PF_V2_RECOVERY_ENGINE`; the durable state remains canonical so a future strategy can read any schema version it explicitly supports.

## Architecture

```text
API routes / startup hook / worker checkpoints
        ↓
recoveryService
        ↓
recoveryEngineRegistry
        ↓
selected strategy engine
        ↓
canonical recovery.snapshot.v1 state + strategy-specific decision result
```

Recovery must remain a service/subsystem. It is not a fourth always-running worker and must not create a new autonomous loop.

## Required common engine capabilities

| Capability | Required behavior |
|---|---|
| Engine id | Stable id such as `v1` or `v2-stub`. |
| Supported schemas | Engine declares support for canonical snapshot schema versions. |
| Save state | Accept canonical input and write/return a canonical snapshot. |
| Load state | Return the latest canonical snapshot it can read, or `null`. |
| Mark unclean shutdown | Persist/retrieve an unclean-shutdown marker without secrets. |
| Clear unclean shutdown | Clear/archive marker safely. |
| Restart check | Evaluate marker + snapshot + validation and return a standard decision. |
| Resume target | Return a standard playback resume target. |
| Worker checkpoint | Accept regular/playback/screen checkpoints through the same input shape. |

## Inputs shared by all engines

All engines receive the same inputs:

| Input | Meaning |
|---|---|
| `mode` | `real` or `test`. |
| `source` | Manual/API/startup/proof/worker/emulated-power-off source. |
| `reason` | Non-secret explanation of why state is saved/checked. |
| `snapshot` | Optional existing canonical or legacy-compatible state to normalize. |
| `playback` | Current media/queue cursor/playback context. |
| `regularWorker` | Current regular pipeline/checkpoint context. |
| `screenWorker` | Screen state/activity context. |
| `queue` | Queue source/cursor/count/selected item context. |
| `pipeline` | Active stage and stage status context. |
| `notes` | Non-secret operator/proof notes. |

## Outputs shared by all engines

Operation results use standard result shapes so the rest of the app can remain engine-agnostic:

| Output | Meaning |
|---|---|
| `RecoverySnapshot` | Canonical project-owned state. |
| `RecoveryMutationResult` | Save/mark/clear/checkpoint result. |
| `RecoveryCheckResult` | Restart-check decision and warnings/errors. |
| `PlaybackResumeTarget` | Strategy decision for playback continuation. |

Result objects may include `recoveryEngine` to show which selected strategy made the decision. That field must not turn durable snapshots into engine-owned private state.

## Interchangeability rule

A strategy may read a snapshot when:

```text
snapshot.schemaVersion is in engine.supportedSnapshotSchemaVersions
```

A strategy must not require:

```text
snapshot.metadata.createdByEngine === activeEngine
```

`metadata.createdByEngine` is useful provenance for debugging and proofs, not a restore gate.

## Strategy differences allowed

| Difference | Allowed example |
|---|---|
| Error handling | v1 refuses corrupted latest state; future v2 may inspect previous snapshots. |
| Resume policy | v1 resumes same media from beginning; future v2 may choose next valid queue item. |
| Diagnostic richness | v1 returns concise reason; future v2 may return fallback chain/confidence metadata. |
| Storage implementation | v1 uses JSON files; future engines may use DB or append-only events if canonical schema is preserved. |

## Namespaced additions

If an engine needs extra metadata, it must be additive and namespaced, for example:

```json
{
  "metadata": {
    "engineMetadata": {
      "v2": {
        "confidenceScore": 0.92,
        "fallbackChain": ["latest", "previous", "queue"]
      }
    }
  }
}
```

Older engines may ignore unknown namespaced metadata.

## Current engine status

| Engine | Production status | Role |
|---|---|---|
| `v1` | active/default | File-backed strategy over canonical `recovery.snapshot.v1`. |
| `v2-stub` | non-production | Architecture proof strategy that can understand canonical state but does not claim production recovery. |

## Proof boundary

The current proof layer proves architecture, canonical state, and cross-engine strategy compatibility. It does not prove physical unplug/reboot behavior. Physical power-loss proof remains a later target-machine evidence slice.
