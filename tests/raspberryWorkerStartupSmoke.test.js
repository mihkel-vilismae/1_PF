import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { evaluateWorkerStartupSmoke, parseRunnerStatus, resolveDatabasePathFromEnv, runWorkerStartupSmokeCommands, RASPBERRY_WORKER_STARTUP_LANES } from '../tools/raspberry-worker-startup-smoke-lib.mjs';

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
  assert.deepEqual(calls[2][1].slice(0, 3), ['server/scripts/sqlite_admin.py', 'recreate', path.normalize('/repo/runtime_data/photo_frame.sqlite')]);
  assert.equal(evidence.preflights[2].database_path.configured_from_env, false);
  assert.equal(evidence.preflights[2].database_path.source, 'fallback-runtime-data');
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


test('startup smoke resolves DB_PATH from env before database preflight', async () => {
  const root = await (await import('node:fs/promises')).mkdtemp(path.join((await import('node:os')).tmpdir(), 'pf-startup-dbpath-'));
  try {
    await (await import('node:fs/promises')).writeFile(path.join(root, '.env'), 'DB_PATH=custom/photo_frame.sqlite\n', 'utf8');
    const resolved = await resolveDatabasePathFromEnv({ repoRoot: root });
    assert.equal(resolved.configured_from_env, true);
    assert.equal(resolved.source, 'DB_PATH');
    assert.equal(resolved.db_path, path.join(root, 'custom', 'photo_frame.sqlite'));
  } finally {
    await (await import('node:fs/promises')).rm(root, { recursive: true, force: true });
  }
});
