import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { collectLatestProofArtifacts, evaluateRaspberryV1Readiness, RASPBERRY_V1_RELEASE_GATES } from '../tools/raspberry-v1-readiness-lib.mjs';

function passArtifact(kind, timestamp = '2026-06-14T00:00:00.000Z') {
  return { proof_kind: kind, proof_status: 'PASSED', proof_timestamp: timestamp, runtime_mode: 'test' };
}

function latestPassedIndexForRequiredGates() {
  const latestByKind = {};
  for (const gate of RASPBERRY_V1_RELEASE_GATES) {
    if (!gate.requiredForV1) continue;
    for (const kind of gate.proofKinds) latestByKind[kind] = passArtifact(kind);
  }
  return latestByKind;
}

test('readiness can pass when all required gate proof kinds are passed', () => {
  const readiness = evaluateRaspberryV1Readiness({ latestByKind: latestPassedIndexForRequiredGates() });
  assert.equal(readiness.proofStatus, 'PASSED');
  assert.equal(readiness.blocking_gate_ids.length, 0);
});

test('non-v1 reboot and power-loss proofs do not block readiness when absent', () => {
  const latestByKind = latestPassedIndexForRequiredGates();
  delete latestByKind.raspberry_reboot_recovery;
  delete latestByKind.raspberry_power_loss_recovery_v2;
  const readiness = evaluateRaspberryV1Readiness({ latestByKind });
  assert.equal(readiness.proofStatus, 'PASSED');
});

test('latest proof artifact collector keeps newest artifact per proof kind', async () => {
  const root = await (await import('node:fs/promises')).mkdtemp(path.join(os.tmpdir(), 'pf-v1-readiness-'));
  try {
    await mkdir(path.join(root, 'runtime_data', 'proofs'), { recursive: true });
    await writeFile(path.join(root, 'runtime_data', 'proofs', 'one.json'), JSON.stringify(passArtifact('raspberry_tool_checker', '2026-06-14T00:00:00.000Z')), 'utf8');
    await writeFile(path.join(root, 'runtime_data', 'proofs', 'two.json'), JSON.stringify({ ...passArtifact('raspberry_tool_checker', '2026-06-14T01:00:00.000Z'), proof_status: 'BLOCKED' }), 'utf8');
    const index = await collectLatestProofArtifacts({ repoRoot: root });
    assert.equal(index.filesRead, 2);
    assert.equal(index.latestByKind.raspberry_tool_checker.proof_status, 'BLOCKED');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
