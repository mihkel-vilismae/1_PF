# V2 Recovery State Schema — canonical state, strategy engines

Status: implemented/proven locally through the v0.10.87 canonical recovery-strategy documentation completion pass.

## Purpose

The V2 recovery state snapshot is the project-owned durable contract for restoring PhotoFrame context after a rough shutdown, terminal close, restart, reboot, or later physical power-loss proof. It records enough state to choose a safe resume target without storing secrets and without requiring exact video timestamp recovery.

The recovery engine is **not** the owner of the durable state schema. Recovery engines are swappable strategies over this canonical state.

```text
project-owned recovery.snapshot.v1 state
        ↓
selected recovery strategy from PF_V2_RECOVERY_ENGINE
        ↓
restart-check / resume-target / diagnostics decision
```

## Canonical rule

| Rule | Requirement |
|---|---|
| State ownership | The project owns the recovery snapshot schema. |
| Engine ownership | Engines own recovery behavior/strategy, not private durable state formats. |
| Compatibility key | `schemaVersion` is the durable compatibility key. |
| Engine metadata | `metadata.createdByEngine` is informational provenance only. |
| Cross-engine restore | Any engine may read a snapshot whose `schemaVersion` it supports. |
| Engine-specific fields | Additive and namespaced only; older engines may ignore unknown metadata. |
| Physical power loss | Not proven in this slice; target physical proof remains deferred. |

## Canonical snapshot identity

| Field | Meaning |
|---|---|
| `schemaVersion` | Must be `recovery.snapshot.v1`. Engines validate compatibility from this field. |
| `snapshotId` | Durable unique snapshot id. |
| `createdAt` | ISO timestamp for when the snapshot was created. |
| `mode` | `real` or `test`. |
| `source` | Source of the save/checkpoint, such as manual, automatic, proof, worker, or emulated power-off. |
| `metadata.createdByEngine` | Informational engine provenance, for example `v1` or `v2-stub`. It must not be used as an ownership gate. |
| `metadata.createdByAppVersion` | Optional PhotoFrame version that produced the snapshot. |
| `metadata.engineMetadata` | Optional namespaced strategy metadata. It must be additive and non-secret. |
| `validation` | Structured validation result with `ok`, warnings, and errors. |

## Canonical recovery content

| Area | Required behavior |
|---|---|
| `playback.currentMediaId` | Current durable media/queue identifier, or `null` when none is active. |
| `playback.currentFilename` | Human-readable filename, or `null`. |
| `playback.currentMediaPath` | Safe local path/reference when known; no credentials or provider secrets. |
| `playback.mediaKind` | `image`, `video`, `other`, or `unknown`. |
| `playback.queueCursorIndex` | Queue cursor index, or `null` when no durable queue context exists. |
| `playback.queueLength` | Known queue length. |
| `playback.playbackPositionSeconds` | Optional position value; may be `null`. |
| `playback.exactTimestampRequired` | Must remain `false` for this phase. Starting the same video from the beginning is acceptable. |
| `queue.source` | Queue source such as backend playback queue, V2 browser bridge, recovery proof, or unknown. |
| `queue.preparedMediaCount` | Number of media rows prepared for backend queue handling. |
| `queue.selectedQueueItemId` | Selected queue item identifier, or `null`. |
| `queue.selectedBackendQueueStatus` | Selected backend queue bridge status, or `null`. |
| `regularWorker.activeStage` | Current or last active regular pipeline stage. |
| `regularWorker.lastCommittedStage` | Last durable committed stage when known. |
| `regularWorker.lastRunId` | Last worker/proof run id when known. |
| `screenWorker.screenState` | Screen state such as `on`, `off`, `fake-off`, or `unknown`. |
| `screenWorker.activitySource` | Activity source such as mouse, keyboard, PIR, timer, proof, or unknown. |
| `pipeline.activeStage` | Active pipeline stage: download, index, gps-parser, geocode, queue, playback, idle, or unknown. |
| `pipeline.stageStatuses` | Stage status map keyed by stage/action id. |
| `pipeline.corruptOrPartialDownloadsExcluded` | Must be `true`; corrupt/incomplete downloads must not enter recovery or playback context. |
| `notes` | Human-readable non-secret notes. |

## Engine strategy contract

Every recovery engine receives the same canonical inputs and must return the same operation-result shapes. Engines may differ in strategy:

| Strategy dimension | Examples |
|---|---|
| Resume strictness | Conservative same-media resume vs fallback-to-next-safe-media. |
| Corruption handling | Reject damaged state vs inspect older/backup snapshots. |
| Missing-media behavior | Refuse resume vs fall back to queue cursor or beginning. |
| Diagnostics | Minimal reason string vs richer confidence/fallback chain. |
| Future storage implementation | File-backed, DB-backed, event-log-backed, or cloud-backed, provided the canonical schema is preserved. |

Operation results may report the selected `recoveryEngine` because that identifies which strategy made the decision. Durable snapshots must remain canonical.

## Endpoint behavior

- Manual save endpoint: `POST /api/runtime/recovery/state/save`.
- Manual load endpoint: `POST /api/runtime/recovery/state/load`.
- Read-only status endpoint: `GET /api/runtime/recovery/state`.
- Autosave endpoint: `POST /api/runtime/recovery/autosave`.
- Restart check endpoint: `POST /api/runtime/recovery/restart-check`.
- Resume target endpoint: `POST /api/runtime/recovery/resume-target`.

The dashboard/server compatibility envelopes remain supported. New implementation should route through `recoveryService`, not directly through private engine classes or legacy file helpers.

## Validation and proofs

| Proof | Purpose |
|---|---|
| `proof:v2-recovery-engine-contract` | Static proof of service/registry/default-engine architecture. |
| `proof:v2-recovery-engine` | Runtime-safe proof of v1 strategy over canonical state. |
| `proof:v2-recovery-canonical-state-contract` | Proves durable snapshots are engine-neutral and schema-version compatible. |
| `proof:v2-recovery-cross-engine-strategy-contract` | Proves a v1-created canonical snapshot can be understood by another strategy. |
| `proof:v2-recovery-emulate-power-off` | Emulates dirty shutdown marker and checkpoint flow without physical power loss. |
| `proof:v2-recovery-restart-check` | Verifies restart-check decision behavior over saved state/markers. |

## Explicit non-goals for this slice

- No physical unplug/reboot/power-loss proof.
- No exact video timestamp requirement.
- No credentials, cookies, session file contents, or other secret material in snapshots.
- No claim that `v2-stub` is a production recovery implementation.

## Next implementation gate

The next physical-proof version must test this corrected architecture: canonical recovery state first, selected strategy second, physical evidence third.
