import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APP_RUNNING_TARGET_PACK_STEPS, buildAppRunningTargetPackEvidenceBundle, evaluateAppRunningTargetPack, runAppRunningTargetPackSteps } from '../tools/raspberry-app-running-target-pack-lib.mjs';

function commandResult({ command = 'npm', args = [], status = 'PASSED', exitCode = 0 } = {}) {
  return { command, args, exitCode, signal: null, timedOut: false, durationMs: 1, stdout: JSON.stringify({ status }), stderr: '' };
}

test('app-running target pack invokes required proof commands in order', async () => {
  const calls = [];
  const results = await runAppRunningTargetPackSteps({ repoRoot: '/repo', commandRunner: async (command, args) => { calls.push([command, args]); return commandResult({ command, args }); } });
  assert.deepEqual(calls.map((call) => call[1].join(' ')), APP_RUNNING_TARGET_PACK_STEPS.map((step) => step.args.join(' ')));
  assert.equal(results[0].reported_status, 'PASSED');
});


test('app-running target pack passes latest worker evidence env to dependent proof steps', async () => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'pf-target-pack-env-'));
  const evidenceDir = join(repoRoot, 'runtime_data', 'raspberry_worker_evidence');
  await (await import('node:fs/promises')).mkdir(evidenceDir, { recursive: true });
  const evidencePath = join(evidenceDir, 'raspberry_cron_worker_evidence_2026-06-14T00-00-00-000Z.json');
  await writeFile(evidencePath, '{}');
  const envSeen = [];
  await runAppRunningTargetPackSteps({
    repoRoot,
    commandRunner: async (command, args, options) => {
      if (['proof:raspberry-cron-worker-runtime', 'proof:raspberry-app-running-status', 'proof:raspberry-app-running-chain'].some((script) => args.join(' ').includes(script))) {
        envSeen.push(options.env?.PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE ?? null);
      }
      return commandResult({ command, args });
    },
  });
  assert.deepEqual(envSeen, [evidencePath, evidencePath, evidencePath]);
});

test('app-running target pack passes only on Raspberry when required steps pass', () => {
  const stepResults = APP_RUNNING_TARGET_PACK_STEPS.map((step) => ({ id: step.id, required_status: step.requiredStatus, reported_status: step.requiredStatus ?? 'BLOCKED', exit_code: 0, timed_out: false, passed_required_status: true }));
  assert.equal(evaluateAppRunningTargetPack({ target: { raspberry_like: true, explicit_override_used: false }, stepResults }).proofStatus, 'PASSED');
  assert.equal(evaluateAppRunningTargetPack({ target: { raspberry_like: false, explicit_override_used: false }, stepResults }).proofStatus, 'BLOCKED');
});

test('app-running target pack blocks when a required proof remains blocked', () => {
  const stepResults = APP_RUNNING_TARGET_PACK_STEPS.map((step) => ({ id: step.id, required_status: step.requiredStatus, reported_status: step.id === 'app_running_pass' ? 'BLOCKED' : (step.requiredStatus ?? 'BLOCKED'), exit_code: 0, timed_out: false, passed_required_status: step.id !== 'app_running_pass' }));
  const evaluation = evaluateAppRunningTargetPack({ target: { raspberry_like: true, explicit_override_used: false }, stepResults });
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.match(evaluation.blockReasons.join('\n'), /app_running_pass/);
});


test('app-running target pack builds an uploadable evidence bundle manifest and zip path', async () => {
  const repoRoot = await mkdtemp(join(tmpdir(), 'pf-target-pack-'));
  await writeFile(join(repoRoot, 'dummy.txt'), 'x');
  await writeFile(join(repoRoot, 'target-proof.json'), '{"proof_status":"BLOCKED"}');
  const envelope = { proof_kind: 'raspberry_app_running_target_pack', proof_status: 'BLOCKED', evidence: { step_results: [{ id: 'app_running_pass', reported_status: 'BLOCKED', exit_code: 0, timed_out: false }] } };
  const commandRunner = async (command, args) => {
    assert.equal(command, 'python3');
    await writeFile(args[3], 'zip-placeholder');
    return commandResult({ command, args, status: 'PASSED' });
  };
  const bundle = await buildAppRunningTargetPackEvidenceBundle({ repoRoot, envelope, proofPath: join(repoRoot, 'target-proof.json'), commandRunner, now: new Date('2026-06-14T00:00:00.000Z') });
  assert.ok(existsSync(bundle.manifestPath));
  assert.ok(existsSync(bundle.zipPath));
  assert.match(bundle.zipPath, /raspberry_app_running_target_pack_/);
});
