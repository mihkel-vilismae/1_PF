import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildRaspberryCronWorkerRuntimeProof } from '../tools/raspberry-cron-worker-runtime-proof-lib.mjs';
import { buildRaspberryAppRunningStatusProof } from '../tools/raspberry-app-running-status-proof-lib.mjs';
import { getLatestWorkerEvidencePaths, writeWorkerEvidenceFile } from '../tools/raspberry-worker-evidence-generator-lib.mjs';

const COMPLETE_CRONTAB = [
  '*/10 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler regular-stage-worker',
  '* * * * * cd "$HOME/1_PF" && npm run api -- --scheduler playback-worker',
  '*/3 * * * * cd "$HOME/1_PF" && npm run api -- --scheduler screen-on-off-worker',
].join('\n');

function completeWorkerEvidence(source = 'standalone-handoff-regression') {
  return {
    generated_at: '2026-06-17T00:00:00.000Z',
    source,
    worker_lanes: ['regular_stage_worker', 'playback_worker', 'screen_on_off_worker'].map((name) => ({
      name,
      last_invocation_at: '2026-06-17T00:00:00Z',
      same_worker_singleton: { first_acquired: true, duplicate_skipped: true },
      cross_worker_independence: true,
      stale_lock: { reclaimed: true },
    })),
  };
}

test('standalone cron and app-running proofs pass after worker evidence generation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-standalone-worker-handoff-'));
  try {
    await writeWorkerEvidenceFile(completeWorkerEvidence(), { outputDirectory: dir });
    const latest = getLatestWorkerEvidencePaths({ outputDirectory: dir });
    const env = {
      PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true',
      PF_RASPBERRY_CRON_WORKER_EVIDENCE_MANIFEST_FILE: latest.manifestPath,
    };

    const cronProof = await buildRaspberryCronWorkerRuntimeProof({
      metadata: { version: '0.8.124', gitCommit: 'test' },
      env,
      currentCrontab: COMPLETE_CRONTAB,
    });
    assert.equal(cronProof.proof_status, 'PASSED');
    assert.equal(cronProof.evidence.operator_evidence.auto_discovered, true);
    assert.equal(cronProof.evidence.operator_evidence.load_error, null);

    const appProof = await buildRaspberryAppRunningStatusProof({
      metadata: { version: '0.8.124', gitCommit: 'test' },
      env,
      currentCrontab: COMPLETE_CRONTAB,
    });
    assert.equal(appProof.proof_status, 'PASSED');
    assert.equal(appProof.evidence.app_running, true);
    assert.equal(appProof.evidence.cron_worker_runtime.operator_evidence.load_error, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('standalone cron proof blocks redacted latest handoff paths', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-standalone-redacted-handoff-'));
  try {
    const latestPath = join(dir, 'latest.json');
    await writeFile(latestPath, JSON.stringify({ schema_version: 1, evidence_file: '[REDACTED]' }), 'utf8');
    const cronProof = await buildRaspberryCronWorkerRuntimeProof({
      metadata: { version: '0.8.124', gitCommit: 'test' },
      env: {
        PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true',
        PF_RASPBERRY_CRON_WORKER_EVIDENCE_MANIFEST_FILE: latestPath,
      },
      currentCrontab: COMPLETE_CRONTAB,
    });
    assert.equal(cronProof.proof_status, 'BLOCKED');
    assert.match(cronProof.evidence.operator_evidence.load_error, /redacted evidence path/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
