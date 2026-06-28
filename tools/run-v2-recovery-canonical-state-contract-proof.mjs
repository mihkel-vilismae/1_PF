#!/usr/bin/env node
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { check, emitProof, parseArgs, proofResult, readText } from './v2-final-proof-utils.mjs';
import { createRecoveryService } from '../server/services/recovery/recoveryService.ts';
import {
  RECOVERY_SNAPSHOT_SCHEMA_VERSION,
  normalizeRecoverySnapshot,
  recoverySnapshotSupportsCanonicalState,
  validateRecoverySnapshotInPlace,
} from '../server/services/recovery/recoverySnapshotContract.ts';

const args = parseArgs();
const repoRoot = process.cwd();
const checks = [];
const contractPath = 'server/services/recovery/recoveryContract.ts';
const snapshotContractPath = 'server/services/recovery/recoverySnapshotContract.ts';
const v1Path = 'server/services/recovery/engines/recoveryV1FileEngine.ts';
const v2Path = 'server/services/recovery/engines/recoveryV2StubEngine.ts';

const scratchRoot = path.join(repoRoot, 'runtime_data', 'proof_scratch', 'recovery_canonical_state_contract');
rmSync(scratchRoot, { recursive: true, force: true });

const contractText = readText(contractPath);
const snapshotContractText = readText(snapshotContractPath);
const v1Text = readText(v1Path);
const v2Text = readText(v2Path);

check(checks, 'canonical-helper-file-exists', 'Shared canonical recovery snapshot helper exists.', existsSync(snapshotContractPath));
check(
  checks,
  'canonical-schema-constant',
  'Canonical snapshot schema version is defined in the shared contract helper.',
  RECOVERY_SNAPSHOT_SCHEMA_VERSION === 'recovery.snapshot.v1' && snapshotContractText.includes('RECOVERY_SNAPSHOT_SCHEMA_VERSION'),
  { schemaVersion: RECOVERY_SNAPSHOT_SCHEMA_VERSION },
);
check(
  checks,
  'snapshot-type-engine-neutral',
  'RecoverySnapshot durable state is engine-neutral: no top-level recoveryEngine ownership field.',
  contractText.includes('interface RecoverySnapshot')
    && contractText.includes('schemaVersion')
    && contractText.includes('metadata')
    && contractText.includes('createdByEngine')
    && !contractText.includes('recoveryEngine: RecoveryEngineId;\n  snapshotId'),
);
check(
  checks,
  'created-by-engine-metadata-only',
  'createdByEngine is retained only as metadata for observability.',
  contractText.includes('createdByEngine?: RecoveryEngineId') && !contractText.includes('recoveryEngine?: RecoveryEngineId'),
);
check(
  checks,
  'validation-schema-based',
  'Shared validation checks schemaVersion and does not require active engine equality.',
  snapshotContractText.includes('snapshot.schemaVersion !== RECOVERY_SNAPSHOT_SCHEMA_VERSION')
    && !snapshotContractText.includes('snapshot.recoveryEngine')
    && !snapshotContractText.includes('createdByEngine ==='),
);
check(
  checks,
  'engines-use-shared-helper',
  'V1 and v2-stub both use shared canonical snapshot normalization.',
  v1Text.includes('normalizeRecoverySnapshot') && v2Text.includes('normalizeRecoverySnapshot'),
);

const legacyEngineMarkedSnapshot = {
  schemaVersion: 'legacy-ish',
  recoveryEngine: 'v1',
  createdAt: new Date().toISOString(),
  mode: 'test',
  source: 'proof',
  playback: {
    currentMediaId: 'legacy-media-001',
    currentMediaPath: 'runtime_data/proof_media/legacy-media-001.jpg',
    queueCursorIndex: 3,
    queueLength: 9,
    resumePolicy: 'same-media',
  },
};
const normalizedLegacy = normalizeRecoverySnapshot({ mode: 'test', source: 'proof', snapshot: legacyEngineMarkedSnapshot });
validateRecoverySnapshotInPlace(normalizedLegacy);
check(
  checks,
  'legacy-engine-field-normalizes-to-metadata',
  'Legacy/older engine-marked input normalizes to canonical state with metadata, not top-level recoveryEngine.',
  normalizedLegacy.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION
    && normalizedLegacy.metadata.createdByEngine === 'v1'
    && !Object.prototype.hasOwnProperty.call(normalizedLegacy, 'recoveryEngine')
    && normalizedLegacy.validation.ok,
  { metadata: normalizedLegacy.metadata, validation: normalizedLegacy.validation },
);
check(
  checks,
  'canonical-support-helper-accepts-schema',
  'Canonical support helper accepts supported schemaVersion regardless of createdByEngine.',
  recoverySnapshotSupportsCanonicalState(normalizedLegacy),
);

const v1Service = createRecoveryService({ repoRoot: scratchRoot, engineId: 'v1', env: {} });
const v1Snapshot = await v1Service.saveState({
  mode: 'test',
  source: 'proof',
  playback: {
    currentMediaId: 'canonical-state-media-v1',
    currentMediaPath: 'runtime_data/proof_media/canonical-state-media-v1.jpg',
    mediaKind: 'image',
    queueCursorIndex: 1,
    queueLength: 4,
    resumePolicy: 'same-media',
  },
});
const v2Service = createRecoveryService({ repoRoot: scratchRoot, engineId: 'v2-stub', env: {} });
const v2Snapshot = await v2Service.saveState({
  mode: 'test',
  source: 'proof',
  playback: {
    currentMediaId: 'canonical-state-media-v2',
    currentMediaPath: 'runtime_data/proof_media/canonical-state-media-v2.jpg',
    mediaKind: 'image',
    queueCursorIndex: 2,
    queueLength: 4,
    resumePolicy: 'same-media',
  },
});

check(
  checks,
  'v1-writes-canonical-state',
  'V1 file strategy writes canonical recovery.snapshot.v1 state.',
  v1Snapshot.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION
    && v1Snapshot.metadata.createdByEngine === 'v1'
    && !Object.prototype.hasOwnProperty.call(v1Snapshot, 'recoveryEngine')
    && v1Snapshot.validation.ok,
  { snapshotId: v1Snapshot.snapshotId, metadata: v1Snapshot.metadata },
);
check(
  checks,
  'v2-normalizes-canonical-state',
  'V2 stub strategy normalizes the same canonical state schema.',
  v2Snapshot.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION
    && v2Snapshot.metadata.createdByEngine === 'v2-stub'
    && !Object.prototype.hasOwnProperty.call(v2Snapshot, 'recoveryEngine')
    && v2Snapshot.validation.ok,
  { snapshotId: v2Snapshot.snapshotId, metadata: v2Snapshot.metadata },
);
check(
  checks,
  'engine-info-declares-supported-schema',
  'Both strategies declare support for the canonical schema version.',
  v1Service.getEngineInfo().supportedSnapshotSchemaVersions.includes(RECOVERY_SNAPSHOT_SCHEMA_VERSION)
    && v2Service.getEngineInfo().supportedSnapshotSchemaVersions.includes(RECOVERY_SNAPSHOT_SCHEMA_VERSION),
  { v1: v1Service.getEngineInfo(), v2: v2Service.getEngineInfo() },
);

const latestPath = path.join(scratchRoot, 'runtime_data', 'recovery', 'latest_recovery_snapshot.json');
const latest = JSON.parse(readFileSync(latestPath, 'utf8'));
check(
  checks,
  'durable-v1-file-canonical',
  'Durable latest recovery file stores the canonical snapshot without top-level engine ownership.',
  latest.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION
    && latest.metadata?.createdByEngine === 'v1'
    && !Object.prototype.hasOwnProperty.call(latest, 'recoveryEngine'),
  { latestPath, metadata: latest.metadata },
);

emitProof(proofResult({
  proof: 'v2_recovery_canonical_state_contract',
  checks,
  evidenceMode: args.evidence,
  note: 'Static/runtime proof that recovery snapshots are canonical project-owned state, while createdByEngine is informational metadata only.',
}), { write: args.write });
