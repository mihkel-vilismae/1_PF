#!/usr/bin/env node
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { check, emitProof, parseArgs, proofResult } from './v2-final-proof-utils.mjs';
import { createRecoveryService } from '../server/services/recovery/recoveryService.ts';
import { RECOVERY_SNAPSHOT_SCHEMA_VERSION } from '../server/services/recovery/recoverySnapshotContract.ts';

const args = parseArgs();
const repoRoot = process.cwd();
const checks = [];
const scratchRoot = path.join(repoRoot, 'runtime_data', 'proof_scratch', 'recovery_cross_engine_strategy_contract');
rmSync(scratchRoot, { recursive: true, force: true });

const v1 = createRecoveryService({ repoRoot: scratchRoot, engineId: 'v1', env: {} });
const v2 = createRecoveryService({ repoRoot: scratchRoot, engineId: 'v2-stub', env: {} });

const v1Snapshot = await v1.saveState({
  mode: 'test',
  source: 'proof',
  playback: {
    currentMediaId: 'cross-engine-v1-created-media',
    currentMediaPath: 'runtime_data/proof_media/cross-engine-v1-created-media.jpg',
    mediaKind: 'image',
    queueCursorIndex: 4,
    queueLength: 8,
    resumePolicy: 'same-media',
  },
  regularWorker: { activeStage: 'queue', lastCommittedStage: 'geocode', lastRunId: 'cross-engine-run-001' },
  screenWorker: { lastScreenState: 'on', lastActivitySource: 'timer' },
});

const v1Resume = await v1.getPlaybackResumeTarget({ mode: 'test', snapshot: v1Snapshot });
const v2Resume = await v2.getPlaybackResumeTarget({ mode: 'test', snapshot: v1Snapshot });
const v2Normalized = await v2.saveState({ mode: 'test', source: 'proof', snapshot: v1Snapshot });

check(checks, 'v1-active', 'V1 strategy is selectable.', v1.getActiveEngine() === 'v1');
check(checks, 'v2-active', 'V2 stub strategy is selectable.', v2.getActiveEngine() === 'v2-stub');
check(
  checks,
  'v1-created-canonical-snapshot',
  'V1 creates a canonical snapshot whose durable schema is not engine-owned.',
  v1Snapshot.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION
    && v1Snapshot.metadata?.createdByEngine === 'v1'
    && !Object.prototype.hasOwnProperty.call(v1Snapshot, 'recoveryEngine')
    && v1Snapshot.validation.ok,
  { snapshotId: v1Snapshot.snapshotId, metadata: v1Snapshot.metadata },
);
check(
  checks,
  'v1-strategy-resumes-same-media',
  'V1 strategy applies conservative same-media recovery behavior to the canonical snapshot.',
  v1Resume.recoveryEngine === 'v1'
    && v1Resume.decision === 'resume-same-media'
    && v1Resume.mediaId === v1Snapshot.playback?.currentMediaId
    && v1Resume.confidence === 'high',
  { v1Resume },
);
check(
  checks,
  'v2-understands-v1-created-canonical-state',
  'V2 stub strategy can read/understand a v1-created canonical snapshot without requiring ownership.',
  v2Resume.recoveryEngine === 'v2-stub'
    && v2Resume.decision === 'none'
    && v2Resume.reason.includes('understood the canonical snapshot schema'),
  { v2Resume },
);
check(
  checks,
  'v2-normalizes-v1-created-state-with-created-by-preserved',
  'V2 stub normalization preserves createdByEngine metadata as informational provenance.',
  v2Normalized.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION
    && v2Normalized.metadata?.createdByEngine === 'v1'
    && !Object.prototype.hasOwnProperty.call(v2Normalized, 'recoveryEngine')
    && v2Normalized.validation.ok,
  { metadata: v2Normalized.metadata, validation: v2Normalized.validation },
);
check(
  checks,
  'same-schema-different-strategies',
  'The same canonical state produces strategy-specific operation results.',
  v1Resume.schemaVersion === v2Resume.schemaVersion
    && v1Resume.recoveryEngine !== v2Resume.recoveryEngine
    && v1Resume.decision !== v2Resume.decision,
  { v1Decision: v1Resume.decision, v2Decision: v2Resume.decision },
);
check(
  checks,
  'v2-does-not-persist-production-state',
  'V2 stub remains non-production and does not create a durable latest snapshot file.',
  !existsSync(path.join(scratchRoot, 'runtime_data', 'recovery', 'v2_latest_recovery_snapshot.json')),
);
check(
  checks,
  'physical-proof-not-attempted',
  'This proof does not perform physical power-loss recovery.',
  true,
  { deferredPhysicalProof: 'v0.10.87-or-later' },
);

emitProof(proofResult({
  proof: 'v2_recovery_cross_engine_strategy_contract',
  checks,
  evidenceMode: args.evidence,
  note: 'Proof that recovery engines are interchangeable strategies over one canonical recovery.snapshot.v1 state schema; v2-stub understands v1-created state but intentionally does not implement production recovery yet.',
}), { write: args.write });
