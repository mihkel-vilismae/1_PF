#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  check,
  emitProof,
  packageScripts,
  parseArgs,
  proofResult,
  readText,
} from './v2-final-proof-utils.mjs';
import { createRecoveryService } from '../server/services/recovery/recoveryService.ts';
import {
  DEFAULT_RECOVERY_ENGINE_ID,
  RECOVERY_ENGINE_ENV_NAME,
  RecoveryEngineSelectionError,
  listRecoveryEngineIds,
  resolveRecoveryEngineId,
} from '../server/services/recovery/recoveryEngineRegistry.ts';

const args = parseArgs();
const repoRoot = process.cwd();

if (args.contract) {
  const scripts = packageScripts();
  const checks = [];
  const contractPath = 'server/services/recovery/recoveryContract.ts';
  const servicePath = 'server/services/recovery/recoveryService.ts';
  const registryPath = 'server/services/recovery/recoveryEngineRegistry.ts';
  const v1Path = 'server/services/recovery/engines/recoveryV1FileEngine.ts';
  const v2Path = 'server/services/recovery/engines/recoveryV2StubEngine.ts';
  const serverIndex = readText('server/index.ts');
  const legacyFacade = readText('server/recovery/v2RecoveryStateService.ts');
  const finalBundle = readText('tools/run-v2-final-autonomous-proof-bundle.mjs');

  for (const filePath of [contractPath, servicePath, registryPath, v1Path, v2Path]) {
    check(checks, `file-${filePath}`, `${filePath} exists.`, existsSync(filePath));
  }
  const contractText = readText(contractPath);
  const serviceText = readText(servicePath);
  const registryText = readText(registryPath);
  const v1Text = readText(v1Path);
  const v2Text = readText(v2Path);
  check(checks, 'contract-public-methods', 'Recovery contract exposes stable service methods.', [
    'saveState',
    'loadLatestState',
    'markUncleanShutdown',
    'clearUncleanShutdown',
    'checkRestart',
    'getPlaybackResumeTarget',
    'recordWorkerCheckpoint',
  ].every((name) => contractText.includes(name)));
  check(checks, 'default-engine-v1', 'PF_V2_RECOVERY_ENGINE defaults to v1.', DEFAULT_RECOVERY_ENGINE_ID === 'v1' && resolveRecoveryEngineId({ env: {} }) === 'v1', { envName: RECOVERY_ENGINE_ENV_NAME });
  check(checks, 'registry-v1-v2-stub', 'Engine registry exposes v1 and v2-stub.', ['v1', 'v2-stub'].every((engineId) => listRecoveryEngineIds().includes(engineId)) && registryText.includes('createRecoveryV1FileEngine') && registryText.includes('createRecoveryV2StubEngine'));
  let unknownHandled = false;
  try {
    resolveRecoveryEngineId({ engineId: 'does-not-exist', env: {} });
  } catch (error) {
    unknownHandled = error instanceof RecoveryEngineSelectionError;
  }
  check(checks, 'unknown-engine-safe', 'Unknown recovery engine fails safely through RecoveryEngineSelectionError.', unknownHandled);
  const service = createRecoveryService({ repoRoot, engineId: 'v1', env: {} });
  check(checks, 'service-selects-v1', 'Recovery service selects v1 by explicit engine id.', service.getActiveEngine() === 'v1');
  const stub = createRecoveryService({ repoRoot, engineId: 'v2-stub', env: {} });
  check(checks, 'service-selects-v2-stub', 'Recovery service can select v2-stub without crashing.', stub.getActiveEngine() === 'v2-stub' && stub.getEngineInfo().implemented === false);
  check(checks, 'v1-file-engine-storage', 'V1 strategy uses filesystem recovery paths.', ['runtime_data', 'recovery', 'latest_recovery_snapshot.json', 'unclean_shutdown.flag', 'restart_check_latest.json'].every((needle) => v1Text.includes(needle)));
  check(checks, 'canonical-state-contract-helper', 'Shared canonical snapshot helper exists and is used by v1/v2 engines.', existsSync('server/services/recovery/recoverySnapshotContract.ts') && v1Text.includes('normalizeRecoverySnapshot') && v2Text.includes('normalizeRecoverySnapshot'));
  check(checks, 'snapshot-compatibility-by-schema', 'Recovery snapshot compatibility is schema-based, not active-engine-owned.', contractText.includes('metadata') && contractText.includes('createdByEngine') && !contractText.includes('recoveryEngine: RecoveryEngineId;\n  snapshotId'));
  check(checks, 'v2-stub-not-implemented', 'V2 stub advertises not_implemented behavior.', v2Text.includes('not_implemented'));
  check(checks, 'legacy-facade-routes-through-service', 'Existing recovery facade routes save/load/restart through recoveryService.', legacyFacade.includes('createRecoveryService') && legacyFacade.includes('recoveryService.saveState') && legacyFacade.includes('recoveryService.checkRestart'));
  check(checks, 'server-resume-route', 'Server exposes recovery resume-target route through recoveryService.', serverIndex.includes('/api/runtime/recovery/resume-target') && serverIndex.includes('getPlaybackResumeTarget'));
  check(checks, 'startup-hook-non-worker', 'Recovery startup hook is service/event based, not a fourth worker.', serverIndex.includes('server_startup') && !readFileSync('package.json', 'utf8').includes('recovery-worker'));
  check(checks, 'proof-scripts-registered', 'Recovery proof scripts are registered.', [
    'proof:v2-recovery-engine-contract',
    'proof:v2-recovery-engine',
    'proof:v2-recovery-canonical-state-contract',
    'proof:v2-recovery-cross-engine-strategy-contract',
    'proof:v2-recovery-emulate-power-off',
    'proof:v2-recovery-restart-check',
  ].every((scriptName) => Boolean(scripts[scriptName])));
  check(checks, 'final-bundle-recovery-layer', 'Final autonomous bundle reports recovery layer.', finalBundle.includes('recoveryEngineArchitecture') && finalBundle.includes('v2_recovery_engine'));
  check(checks, 'final-bundle-canonical-strategy-layers', 'Final autonomous bundle reports canonical-state and cross-engine strategy layers.', finalBundle.includes('recoveryCanonicalState') && finalBundle.includes('recoveryCrossEngineStrategy') && finalBundle.includes('v2_recovery_canonical_state_contract') && finalBundle.includes('v2_recovery_cross_engine_strategy_contract'));


  emitProof(proofResult({
    proof: 'v2_recovery_engine_contract',
    checks,
    evidenceMode: false,
    note: 'Static contract proof for the canonical-state v0.10.86 recovery service/strategy architecture. It does not attempt physical power-loss proof.',
  }), { write: args.write });
}

const checks = [];
const service = createRecoveryService({ repoRoot, engineId: process.env.PF_V2_RECOVERY_ENGINE ?? 'v1' });
const snapshot = await service.saveState({
  mode: 'test',
  source: 'proof',
  playback: {
    currentMediaId: 'proof-media-001',
    currentMediaPath: 'runtime_data/proof_media/proof-media-001.jpg',
    mediaKind: 'image',
    queueCursorIndex: 2,
    queueLength: 5,
    playbackPositionSeconds: 0,
    resumePolicy: 'same-media',
  },
  regularWorker: { activeStage: 'queue', lastCommittedStage: 'geocode', lastRunId: 'proof-run-001' },
  screenWorker: { lastScreenState: 'on', lastActivitySource: 'timer' },
});
const loaded = await service.loadLatestState({ mode: 'test' });
const marked = await service.markUncleanShutdown({ mode: 'test', source: 'emulate-power-off', snapshotId: snapshot.snapshotId, reason: 'v2 recovery runtime proof' });
const restartCheck = await service.checkRestart({ mode: 'test', source: 'v2-recovery-engine-proof' });
const remark = await service.markUncleanShutdown({ mode: 'test', source: 'proof', snapshotId: snapshot.snapshotId, reason: 'clear proof marker' });
const cleared = await service.clearUncleanShutdown({ mode: 'test', reason: 'v2 recovery runtime proof clear' });
const resumeTarget = await service.getPlaybackResumeTarget({ mode: 'test', snapshot: loaded });
const checkpoint = await service.recordWorkerCheckpoint({ mode: 'test', worker: 'playback-worker', event: 'media_started', stage: 'playback', runId: 'proof-run-001' });

const recoveryDir = path.join(repoRoot, 'runtime_data', 'recovery');
check(checks, 'active-engine-v1', 'Active recovery engine is v1.', service.getActiveEngine() === 'v1', { engineInfo: service.getEngineInfo() });
check(checks, 'save-state-valid', 'saveState writes a valid canonical snapshot.', snapshot.validation.ok && snapshot.schemaVersion === 'recovery.snapshot.v1' && snapshot.metadata?.createdByEngine === 'v1' && !Object.prototype.hasOwnProperty.call(snapshot, 'recoveryEngine'), { snapshotId: snapshot.snapshotId, metadata: snapshot.metadata });
check(checks, 'latest-snapshot-loads', 'loadLatestState returns the saved snapshot.', loaded?.snapshotId === snapshot.snapshotId);
check(checks, 'snapshot-files-exist', 'V1 snapshot and latest snapshot files exist.', existsSync(path.join(recoveryDir, 'latest_recovery_snapshot.json')) && existsSync(path.join(recoveryDir, 'snapshots')));
check(checks, 'unclean-flag-written', 'markUncleanShutdown writes the unclean shutdown flag.', marked.status === 'passed' && marked.filePath && marked.filePath.endsWith('unclean_shutdown.flag'), { marked });
check(checks, 'restart-detected', 'checkRestart detects flag plus valid snapshot.', restartCheck.status === 'passed' && restartCheck.possibleRestartDetected && restartCheck.snapshotValid, { restartCheck });
check(checks, 'restart-check-written', 'checkRestart writes restart_check_latest.json.', existsSync(path.join(recoveryDir, 'restart_check_latest.json')));
check(checks, 'clear-archives-flag', 'clearUncleanShutdown clears/archives an active flag.', remark.status === 'passed' && cleared.status === 'passed' && !existsSync(path.join(recoveryDir, 'unclean_shutdown.flag')), { cleared });
check(checks, 'resume-target-same-media', 'getPlaybackResumeTarget returns safe same-media resume decision.', resumeTarget.decision === 'resume-same-media' && resumeTarget.confidence === 'high', { resumeTarget });
check(checks, 'worker-checkpoint-recorded', 'recordWorkerCheckpoint writes recovery checkpoint evidence.', checkpoint.status === 'passed' && existsSync(path.join(recoveryDir, 'worker_checkpoints.jsonl')), { checkpoint });

emitProof(proofResult({
  proof: 'v2_recovery_engine',
  checks,
  evidenceMode: args.evidence,
  note: 'Runtime-safe filesystem proof for v0.10.86 recovery v1 strategy over canonical state. It emulates recovery state only and intentionally does not perform physical power-loss proof.',
}), { write: args.write });
