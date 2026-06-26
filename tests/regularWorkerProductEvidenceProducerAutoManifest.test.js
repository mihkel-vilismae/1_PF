import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRegularWorkerProductEvidenceProducer } from '../tools/regular-worker-product-evidence-producer-lib.mjs';

test('regular worker product evidence producer derives safe manifest from latest continuation proof', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'pf-regular-product-auto-manifest-'));
  await mkdir(path.join(cwd, 'runtime_data/proofs'), { recursive: true });
  await mkdir(path.join(cwd, 'runtime_data/scheduler'), { recursive: true });
  await writeFile(path.join(cwd, 'runtime_data/proofs/real_download_continuation_2026-06-22T00-00-00-000Z.json'), JSON.stringify({
    proof_kind: 'real_download_continuation',
    proof_status: 'PASSED',
    proof_timestamp: '2026-06-22T00:00:00.000Z',
    evidence: {
      comparison: {
        afterSecond: {
          fileSample: [
            { relativePath: 'IMG_0009.PNG', sizeBytes: 4697384, sha1: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
          ],
        },
      },
    },
  }, null, 2), 'utf8');
  await writeFile(path.join(cwd, 'runtime_data/scheduler/regular-stage-worker-status.json'), JSON.stringify({
    worker: 'regular_stage_worker',
    status: 'succeeded',
    implementationStatus: 'b3_stage_state_machine_v1',
    invocation_observed: true,
    finishedAt: '2026-06-22T00:01:00.000Z',
    productWork: { claimed: true, runId: 'run-1' },
  }, null, 2), 'utf8');

  const result = evaluateRegularWorkerProductEvidenceProducer({
    PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE: 'true',
  }, { cwd, now: '2026-06-22T00:02:00.000Z' });

  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.manifest_path, null);
  assert.match(result.manifest_auto_reason, /Derived safe manifest/);
  assert.equal(result.resolved_input.status, 'PASSED');
  assert.equal(result.structured_evaluation.complete, true);
});
