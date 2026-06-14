import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_RUNNING_TARGET_PACK_STEPS, evaluateAppRunningTargetPack, runAppRunningTargetPackSteps } from '../tools/raspberry-app-running-target-pack-lib.mjs';

function commandResult({ command = 'npm', args = [], status = 'PASSED', exitCode = 0 } = {}) {
  return { command, args, exitCode, signal: null, timedOut: false, durationMs: 1, stdout: JSON.stringify({ status }), stderr: '' };
}

test('app-running target pack invokes required proof commands in order', async () => {
  const calls = [];
  const results = await runAppRunningTargetPackSteps({ repoRoot: '/repo', commandRunner: async (command, args) => { calls.push([command, args]); return commandResult({ command, args }); } });
  assert.deepEqual(calls.map((call) => call[1].join(' ')), APP_RUNNING_TARGET_PACK_STEPS.map((step) => step.args.join(' ')));
  assert.equal(results[0].reported_status, 'PASSED');
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
