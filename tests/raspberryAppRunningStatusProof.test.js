import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildAppRunningStatusNextSteps, summarizeAppRunningStatus, buildRaspberryAppRunningStatusProof } from '../tools/raspberry-app-running-status-proof-lib.mjs';
import { writeWorkerEvidenceFile, getLatestWorkerEvidencePaths } from '../tools/raspberry-worker-evidence-generator-lib.mjs';

test('app-running summary passes only when cron worker runtime passes all three workers', () => {
  const cronEnvelope = { proof_status: 'PASSED', evidence: { cron: { row_evidence: [{ present: true }, { present: true }, { present: true }] }, worker_evidence: [
    { name: 'regular_stage_worker', complete: true, invocation_observed: true, same_worker_singleton: true, duplicate_skip_observed: true, cross_worker_independence_observed: true, stale_lock_reclaim_observed: true },
    { name: 'playback_worker', complete: true, invocation_observed: true, same_worker_singleton: true, duplicate_skip_observed: true, cross_worker_independence_observed: true, stale_lock_reclaim_observed: true },
    { name: 'screen_on_off_worker', complete: true, invocation_observed: true, same_worker_singleton: true, duplicate_skip_observed: true, cross_worker_independence_observed: true, stale_lock_reclaim_observed: true },
  ] } };
  const summary = summarizeAppRunningStatus(cronEnvelope);
  assert.equal(summary.status, 'PASSED');
  assert.equal(summary.app_running, true);
});

test('app-running summary blocks when cron runtime is blocked', () => {
  const summary = summarizeAppRunningStatus({ proof_status: 'BLOCKED', evidence: { cron: { row_evidence: [] }, worker_evidence: [], status_reasons: { blockReasons: ['missing evidence'] } } });
  assert.equal(summary.status, 'BLOCKED');
  assert.equal(summary.app_running, false);
  assert.deepEqual(summary.blocking_reasons, ['missing evidence']);
});

test('app-running proof envelope preserves non-claims', async () => {
  const envelope = await buildRaspberryAppRunningStatusProof({ metadata: { version: '0.8.46', gitCommit: 'test' }, cronEnvelope: { proof_status: 'BLOCKED', proof_kind: 'raspberry_cron_worker_runtime', runtime_mode: 'test', evidence: { cron: { row_evidence: [] }, worker_evidence: [] } } });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.non_claims.join('\n'), /does not reboot/);
  assert.match(envelope.evidence.non_claims.join('\n'), /power-loss/);
});


test('app-running status next steps point to cron worker runtime evidence', () => {
  const summary = summarizeAppRunningStatus({ proof_status: 'BLOCKED', evidence: { worker_evidence: [], cron: { row_evidence: [] }, status_reasons: { blockReasons: ['missing managed cron rows for: playback_worker'], failedReasons: [] } } });
  const steps = buildAppRunningStatusNextSteps(summary);
  assert.match(steps.join('\n'), /cron-worker-runtime|cron worker runtime/);
  assert.match(steps.join('\n'), /missing managed cron rows/);
});

test('app-running status auto-loads the same latest worker evidence source as cron runtime', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-app-status-latest-evidence-'));
  try {
    const workerEvidence = {
      generated_at: '2026-06-17T00:00:00.000Z',
      source: 'app-status-shared-latest-test',
      worker_lanes: ['regular_stage_worker', 'playback_worker', 'screen_on_off_worker'].map((name) => ({
        name,
        last_invocation_at: '2026-06-17T00:00:00Z',
        same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
        cross_worker_independence: true,
        stale_lock: { reclaimed: true },
      })),
    };
    await writeWorkerEvidenceFile(workerEvidence, { outputDirectory: dir });
    const latest = getLatestWorkerEvidencePaths({ outputDirectory: dir });
    const currentCrontab = [
      '*/10 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler regular-stage-worker',
      '* * * * * cd "$HOME/1_PF" && npm run api -- --scheduler playback-worker',
      '*/3 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler screen-on-off-worker',
    ].join('\n');
    const envelope = await buildRaspberryAppRunningStatusProof({
      metadata: { version: '0.8.123', gitCommit: 'test' },
      env: {
        PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true',
        PF_RASPBERRY_CRON_WORKER_EVIDENCE_MANIFEST_FILE: latest.manifestPath,
      },
      currentCrontab,
    });
    assert.equal(envelope.proof_status, 'PASSED');
    assert.equal(envelope.evidence.app_running, true);
    assert.equal(envelope.evidence.cron_worker_runtime.operator_evidence.load_error, null);
    assert.equal(envelope.evidence.cron_worker_runtime.operator_evidence.resolution, 'absolute');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

