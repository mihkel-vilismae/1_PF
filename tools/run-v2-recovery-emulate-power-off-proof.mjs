#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { check, emitProof, parseArgs, proofResult } from './v2-final-proof-utils.mjs';
import { createRecoveryService } from '../server/services/recovery/recoveryService.ts';

const args = parseArgs();
const repoRoot = process.cwd();
const service = createRecoveryService({ repoRoot, engineId: process.env.PF_V2_RECOVERY_ENGINE ?? 'v1' });
const checks = [];
const snapshot = await service.saveState({
  mode: 'test',
  source: 'emulate-power-off',
  playback: {
    currentMediaId: 'emulated-power-off-media',
    currentMediaPath: 'runtime_data/proof_media/emulated-power-off-media.jpg',
    mediaKind: 'image',
    queueCursorIndex: 0,
    queueLength: 1,
    resumePolicy: 'same-media',
  },
});
const marked = await service.markUncleanShutdown({
  mode: 'test',
  source: 'emulate-power-off',
  snapshotId: snapshot.snapshotId,
  reason: 'v0.10.87 emulated power-off proof marker; physical proof deferred to a later physical-proof release',
});
const flagPath = path.join(repoRoot, 'runtime_data', 'recovery', 'unclean_shutdown.flag');
check(checks, 'active-engine-v1', 'Active recovery engine is v1.', service.getActiveEngine() === 'v1');
check(checks, 'snapshot-saved', 'Emulate power-off proof saves a recovery snapshot.', snapshot.validation.ok && snapshot.source === 'emulate-power-off', { snapshotId: snapshot.snapshotId });
check(checks, 'unclean-flag-present', 'Emulate power-off proof writes an unclean-shutdown flag.', marked.status === 'passed' && existsSync(flagPath), { flagPath });
check(checks, 'physical-proof-deferred', 'Physical power-loss proof is explicitly deferred to a later physical-proof release.', true, { deferredTarget: 'later-physical-proof-release' });

emitProof(proofResult({
  proof: 'v2_recovery_emulate_power_off',
  checks,
  evidenceMode: args.evidence,
  note: 'Writes recovery snapshot plus unclean-shutdown marker only. This is not a physical power-loss proof.',
}), { write: args.write });
