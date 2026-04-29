import assert from 'node:assert/strict';
import test from 'node:test';

import { renderTestView } from '../dashboard/views/testView.ts';
import { renderLastRunView } from '../dashboard/views/lastRunView.ts';
import { renderRunningProcessView } from '../dashboard/views/runningProcessView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('test view renders explicit real, hybrid, and mock source treatments', () => {
  const html = renderTestView(createInitialState());
  assert.match(html, /MIXED VIEW/);
  assert.match(html, /source-badge--real/);
  assert.match(html, /source-badge--mock/);
  assert.match(html, /POST \/api\/runtime\/download\/run/);
  assert.match(html, /POST \/api\/runtime\/playback\/select-current/);
});

test('last-run and running-process views remain loudly marked as mock', () => {
  const state = createInitialState();
  assert.match(renderLastRunView(state), /MOCK VIEW/);
  assert.match(renderLastRunView(state), /card--mock/);
  assert.match(renderRunningProcessView(state), /MOCK VIEW/);
  assert.match(renderRunningProcessView(state), /worker-row--mock/);
});
