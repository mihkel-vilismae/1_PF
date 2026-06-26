import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function render(route, options = {}) {
  const state = { ...createInitialState(), ...(options.state ?? {}) };
  return renderV2StartupOperatorMenuView(route, state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
    v2PlaybackQueueItems: options.v2PlaybackQueueItems ?? [],
  });
}

function esc(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('V2 Troubleshooting renders B6.1 pipeline maintenance controls on existing action IDs', () => {
  const markup = render('troubleshooting');
  for (const expected of [
    'Pipeline maintenance',
    'Detect issues in pipeline',
    'Clear stale locks',
    'data-action="detect-pipeline-issues"',
    'data-action="clear-stale-pipeline-locks"',
    'PIPELINE MAINTENANCE',
    'Latest backend result',
    'data-v2-backend-card="05.pipeline-maintenance"',
    'data-v2-status-id="v2.block.05.pipeline-maintenance"',
  ]) {
    assert.match(markup, new RegExp(esc(expected)));
  }
  const behaviorSource = readFileSync('dashboard/services/runtimeTruth/runtimeTruthBehavior.ts', 'utf8');
  assert.match(behaviorSource, /detect-pipeline-issues/);
  assert.match(behaviorSource, /clear-stale-pipeline-locks/);
});
