import test from 'node:test';
import assert from 'node:assert/strict';
import { runCommand } from '../tools/proof-utils.mjs';

test('runCommand can feed stdin input to child process', async () => {
  const result = await runCommand(process.execPath, ['-e', 'process.stdin.pipe(process.stdout)'], {
    input: 'managed crontab text\n',
    detached: false,
    timeoutMs: 10000,
  });
  assert.equal(result.exitCode, 0);
  assert.equal(result.timedOut, false);
  assert.equal(result.stdout, 'managed crontab text\n');
});


test('runCommand can preserve unsanitized stdout for internal cron evaluators', async () => {
  const raw = '/home/mihkel/0.8.57-pf && npm run api -- --scheduler playback-worker\n';
  const result = await runCommand(process.execPath, ['-e', `process.stdout.write(${JSON.stringify(raw)})`], {
    detached: false,
    timeoutMs: 10000,
    sanitize: false,
  });
  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, raw);
  assert.match(result.stdout, /--scheduler playback-worker/);
});
