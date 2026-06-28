#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { check, emitProof, parseArgs, proofResult } from './v2-final-proof-utils.mjs';
import { createRecoveryService } from '../server/services/recovery/recoveryService.ts';

const args = parseArgs();
const repoRoot = process.cwd();
const service = createRecoveryService({ repoRoot, engineId: process.env.PF_V2_RECOVERY_ENGINE ?? 'v1' });
const checks = [];
const recoveryDir = path.join(repoRoot, 'runtime_data', 'recovery');
const existingSnapshot = await service.loadLatestState({ mode: 'test' });
const snapshot = existingSnapshot ?? await service.saveState({
  mode: 'test',
  source: 'proof',
  playback: {
    currentMediaId: 'restart-check-media',
    currentMediaPath: 'runtime_data/proof_media/restart-check-media.jpg',
    mediaKind: 'image',
    queueCursorIndex: 1,
    queueLength: 3,
    resumePolicy: 'same-media',
  },
});
if (!existsSync(path.join(recoveryDir, 'unclean_shutdown.flag'))) {
  await service.markUncleanShutdown({ mode: 'test', source: 'proof', snapshotId: snapshot.snapshotId, reason: 'restart-check proof seed flag' });
}
const restartCheck = await service.checkRestart({ mode: 'test', source: 'v2-recovery-restart-check-proof' });
check(checks, 'active-engine-v1', 'Active recovery engine is v1.', service.getActiveEngine() === 'v1');
check(checks, 'snapshot-found', 'Restart check sees a valid recovery snapshot.', restartCheck.snapshotFound && restartCheck.snapshotValid, { restartCheck });
check(checks, 'restart-detected', 'Restart check detects seeded unclean-shutdown flag plus snapshot.', restartCheck.possibleRestartDetected, { restartCheck });
check(checks, 'restart-check-artifact', 'Restart check writes restart_check_latest.json.', existsSync(path.join(recoveryDir, 'restart_check_latest.json')));
check(checks, 'resume-target-present', 'Restart check reports a playback resume target.', Boolean(restartCheck.resumeTarget) && restartCheck.resumeTarget?.decision === 'resume-same-media', { resumeTarget: restartCheck.resumeTarget });
check(checks, 'flag-archived-not-silently-deleted', 'Active flag is cleared after archiving evidence.', !existsSync(path.join(recoveryDir, 'unclean_shutdown.flag')));

emitProof(proofResult({
  proof: 'v2_recovery_restart_check',
  checks,
  evidenceMode: args.evidence,
  note: 'Restart-check proof uses a seeded unclean-shutdown marker and does not require a physical reboot. Physical power-loss proof is deferred to v0.10.87.',
}), { write: args.write });
