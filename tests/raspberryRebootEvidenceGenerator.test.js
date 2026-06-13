import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildRebootEvidence, buildRaspberryRebootEvidenceGeneratorProof } from '../tools/raspberry-reboot-evidence-generator-lib.mjs';

test('reboot evidence builder requires changed boot and app-running pass', () => {
  const evidence = buildRebootEvidence({
    marker: { timestamp: '2026-06-13T00:00:00Z', boot_info: { boot_id: 'before' } },
    currentBootInfo: { boot_id: 'after', booted_at: '2026-06-13T00:01:00Z' },
    appRunningPassEnvelope: { proof_status: 'PASSED', proof_kind: 'raspberry_app_running_pass_harness', evidence: { generated_evidence_file: '/tmp/evidence.json' } },
  });
  assert.equal(evidence.boot_detected, true);
  assert.equal(evidence.app_running_status_passed_after_reboot, true);
  assert.equal(evidence.all_three_workers_resumed, true);
});

test('reboot evidence prepare writes marker and remains blocked for manual reboot', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'reboot-prepare-'));
  try {
    const envelope = await buildRaspberryRebootEvidenceGeneratorProof({ metadata: { version: '0.8.53', gitCommit: 'test' }, env: { PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true' }, repoRoot, mode: 'prepare', bootInfo: { boot_id: 'before', booted_at: '2026-06-13T00:00:00Z' }, now: () => new Date('2026-06-13T00:00:00Z') });
    assert.equal(envelope.proof_status, 'BLOCKED');
    assert.match(envelope.evidence.manual_step_required, /Reboot/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('reboot evidence collect can pass with marker, changed boot, and app-running pass', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'reboot-collect-'));
  try {
    const marker = { timestamp: '2026-06-13T00:00:00Z', boot_info: { boot_id: 'before', booted_at: '2026-06-13T00:00:00Z' } };
    const envelope = await buildRaspberryRebootEvidenceGeneratorProof({ metadata: { version: '0.8.53', gitCommit: 'test' }, env: { PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET: 'true' }, repoRoot, mode: 'collect', marker, bootInfo: { boot_id: 'after', booted_at: '2026-06-13T00:01:00Z' }, appRunningPassEnvelope: { proof_status: 'PASSED', proof_kind: 'raspberry_app_running_pass_harness', evidence: { generated_evidence_file: '/tmp/app.json' } } });
    assert.equal(envelope.proof_status, 'PASSED');
    assert.match(envelope.evidence.reboot_recovery_env, /PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE=/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
