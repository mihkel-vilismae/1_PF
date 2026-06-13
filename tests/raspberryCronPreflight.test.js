import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManagedCronRows, replaceManagedCronBlock, evaluateManagedCronPreflight } from '../tools/raspberry-cron-preflight-lib.mjs';

test('managed cron block contains the three PF_login worker schedules for repo root', () => {
  const rows = buildManagedCronRows({ repoRoot: '/home/mihkel/1-pf' });
  const text = rows.join('\n');
  assert.match(text, /--scheduler regular-stage-worker/);
  assert.match(text, /--scheduler playback-worker/);
  assert.match(text, /--scheduler screen-on-off-worker/);
  assert.match(text, /\*\/10 \* \* \* \*/);
  assert.match(text, /\* \* \* \* \*/);
  assert.match(text, /\*\/3 \* \* \* \*/);
});

test('managed cron replacement preserves unrelated rows and replaces old managed block', () => {
  const old = ['# unrelated', '* * * * * echo keep', '# >>> PF_LOGIN_RASPBERRY_WORKERS >>>', 'old row', '# <<< PF_LOGIN_RASPBERRY_WORKERS <<<'].join('\n');
  const replaced = replaceManagedCronBlock(old, buildManagedCronRows({ repoRoot: '/repo' }));
  assert.match(replaced, /echo keep/);
  assert.doesNotMatch(replaced, /old row/);
  assert.match(replaced, /--scheduler regular-stage-worker/);
});

test('cron preflight reports passed only when all worker rows exist on Raspberry target', () => {
  const text = buildManagedCronRows({ repoRoot: '/repo' }).join('\n');
  assert.equal(evaluateManagedCronPreflight({ target: { raspberry_like: true }, crontabText: text }).proofStatus, 'PASSED');
  const blocked = evaluateManagedCronPreflight({ target: { raspberry_like: true }, crontabText: '* * * * * echo nope' });
  assert.equal(blocked.proofStatus, 'BLOCKED');
  assert.deepEqual(blocked.missingRows, ['regular_stage_worker', 'playback_worker', 'screen_on_off_worker']);
});
