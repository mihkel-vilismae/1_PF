import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { VIEW_ORDER } from '../dashboard/shared/constants.ts';
import { renderV2OperatorMenuView } from '../dashboard/views/v2OperatorMenuView.ts';

test('V2 Operator Menu is added as a visual-only dashboard view without replacing existing views', () => {
  const ids = VIEW_ORDER.map((view) => view.id);
  assert.deepEqual(ids.slice(0, 7), ['A', 'B', 'C', 'D', 'E', 'WIN', 'RPI']);
  assert.ok(ids.includes('V2'));
  assert.equal(ids.at(-1), 'DEBUG');

  const appSource = readFileSync('dashboard/app.ts', 'utf8');
  assert.match(appSource, /V2: renderV2OperatorMenuView\(\)/);
});

test('V2 Operator Menu renders planned Structure V1 roots and safety boundary', () => {
  const markup = renderV2OperatorMenuView();

  for (const expected of [
    'PhotoFrame v2 Operator Menu',
    'visual-only',
    'no backend mutation',
    'setup.sh',
    'authentication.sh',
    'startup.sh',
    'workers',
    'troubleshooting',
    'recovery',
    'backup DB',
    'current backup snapshot generation policy',
    'currently stored backup snapshots',
  ]) {
    assert.match(markup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(markup, /No real backend behavior yet/);
  assert.match(markup, /No secrets, no crontab writes, no DB mutation/);
});

test('V2 Operator Menu keeps v3 and multi-combo markers visible', () => {
  const markup = renderV2OperatorMenuView();

  assert.match(markup, /statistics page/);
  assert.match(markup, /v3/);
  assert.match(markup, /\*DEV/);
  assert.match(markup, /\*MK1, MultiComboRow/);
  assert.match(markup, /\*EX/);
  assert.match(markup, /time value: every day at 13:00:00 Estonian time/);
});
