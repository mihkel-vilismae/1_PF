import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorkerStartupSmoke, parseRunnerStatus, runWorkerStartupSmokeCommands, RASPBERRY_WORKER_STARTUP_LANES } from '../tools/raspberry-worker-startup-smoke-lib.mjs';

function result({ command = 'npm', args = [], exitCode = 0, stdout = '{"status":"PASSED"}', timedOut = false } = {}) {
  return { command, args, exitCode, signal: null, timedOut, durationMs: 1, stdout, stderr: '' };
}

test('startup smoke invokes setup preflights and all three worker lanes', async () => {
  const calls = [];
  const commandRunner = async (command, args) => {
    calls.push([command, args]);
    return result({ command, args, stdout: '{"status":"PASSED"}' });
  };
  const evidence = await runWorkerStartupSmokeCommands({ repoRoot: '/repo', prepare: true, commandRunner });
  assert.equal(evidence.preflights.length, 3);
  assert.equal(evidence.workers.length, 3);
  assert.deepEqual(evidence.workers.map((entry) => entry.lane.name), RASPBERRY_WORKER_STARTUP_LANES.map((lane) => lane.name));
  assert.deepEqual(calls[0], ['npm', ['run', 'proof:raspberry-executable-permissions', '--', '--repair']]);
  assert.deepEqual(calls[1], ['npm', ['run', 'proof:raspberry-env-preflight', '--', '--create']]);
  assert.equal(calls[2][0], 'python3');
  assert.deepEqual(calls[2][1].slice(0, 3), ['server/scripts/sqlite_admin.py', 'recreate', '/repo/runtime_data/photo_frame.sqlite']);
});

test('startup smoke passes only on Raspberry target with passing preflights and workers', () => {
  const preflights = [
    { id: 'executable_permissions', exit_code: 0, timed_out: false, reported_status: 'PASSED' },
    { id: 'env_preflight', exit_code: 0, timed_out: false, reported_status: 'PASSED' },
    { id: 'database_preflight', exit_code: 0, timed_out: false, reported_status: null },
  ];
  const workers = RASPBERRY_WORKER_STARTUP_LANES.map((lane) => ({ lane, exit_code: 0, timed_out: false }));
  const evaluation = evaluateWorkerStartupSmoke({ target: { raspberry_like: true, explicit_override_used: false }, preflights, workers });
  assert.equal(evaluation.proofStatus, 'PASSED');
});

test('startup smoke blocks off-target even if commands exit cleanly', () => {
  const preflights = [
    { id: 'executable_permissions', exit_code: 0, timed_out: false, reported_status: 'PASSED' },
    { id: 'env_preflight', exit_code: 0, timed_out: false, reported_status: 'PASSED' },
    { id: 'database_preflight', exit_code: 0, timed_out: false, reported_status: null },
  ];
  const workers = RASPBERRY_WORKER_STARTUP_LANES.map((lane) => ({ lane, exit_code: 0, timed_out: false }));
  const evaluation = evaluateWorkerStartupSmoke({ target: { raspberry_like: false, explicit_override_used: false }, preflights, workers });
  assert.equal(evaluation.proofStatus, 'BLOCKED');
  assert.match(evaluation.blockReasons.join('\n'), /not detected as Raspberry/);
});

test('startup smoke fails on Raspberry when a worker exits nonzero', () => {
  const preflights = [
    { id: 'executable_permissions', exit_code: 0, timed_out: false, reported_status: 'PASSED' },
    { id: 'env_preflight', exit_code: 0, timed_out: false, reported_status: 'PASSED' },
    { id: 'database_preflight', exit_code: 0, timed_out: false, reported_status: null },
  ];
  const workers = RASPBERRY_WORKER_STARTUP_LANES.map((lane, index) => ({ lane, exit_code: index === 1 ? 1 : 0, timed_out: false }));
  const evaluation = evaluateWorkerStartupSmoke({ target: { raspberry_like: true, explicit_override_used: false }, preflights, workers });
  assert.equal(evaluation.proofStatus, 'FAILED');
  assert.match(evaluation.failureReasons.join('\n'), /playback_worker/);
});


test('startup smoke parses PASSED status from npm proof output even after path redaction', () => {
  const stdout = `
> photo-frame-dashboard-frontend@0.8.57 proof:raspberry-env-preflight
> node tools/run-raspberry-env-preflight.mjs --create
{
  "status": "PASSED",
  "mode": "raspberry_env_preflight_create",
  "outputPath": "[REDACTED]
}
`;
  assert.equal(parseRunnerStatus(stdout), 'PASSED');
});
