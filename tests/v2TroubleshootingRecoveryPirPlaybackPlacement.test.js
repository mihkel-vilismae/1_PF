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

test('V2 Recovery renders B6.2 alert-only placeholder buttons with exact labels', () => {
  const markup = render('recovery');
  for (const label of ['SAVE STATE', 'LOAD STATE', 'EMULATE POWER OFF']) {
    assert.match(markup, new RegExp(`data-action="v2-placeholder-alert"[^>]+data-v2-alert-text="${esc(label)}"`));
    assert.match(markup, new RegExp(`>${esc(label)}<`));
  }
  assert.match(markup, /data-v2-recovery-placeholder-actions/);
  assert.match(markup, /data-v2-status-id="v2.block.06.placeholder-actions"/);
  const appSource = readFileSync('dashboard/app.ts', 'utf8');
  assert.match(appSource, /window\.alert\(alertText\)/);
  assert.match(appSource, /placeholderOnly: true/);
});

test('V2 PIR renders B7.1 visible B5 subset and PIR emulator', () => {
  const markup = render('pir');
  for (const expected of [
    'B5 activity detection test sources',
    'PIR sensor',
    'Mouse movement',
    'Keyboard activity',
    'Activity detection test',
    'Start Test',
    'Ready to start',
    'Activity detection results',
    'Waiting for test run.',
    'Inactivity timeout',
    'Current screen state',
    'Last activity source',
    'Shared timeout',
    'Playback checkpoint',
    'Screen simulation controls ready.',
    'data-action="emulate-pir-signal"',
    'data-v2-status-id="v2.block.07.activity-detection"',
  ]) {
    assert.match(markup, new RegExp(esc(expected)));
  }
  const appSource = readFileSync('dashboard/app.ts', 'utf8');
  assert.match(appSource, /markB5ActivityDetected\('pir'\)/);
});

test('V2 Playback renders B8.1 rendering target and mode subsection', () => {
  const markup = render('playback');
  for (const expected of [
    'Rendering target',
    'POST /api/runtime/playback/select-current',
    'Windows',
    'Raspberry OS (disabled)',
    'Rendering mode',
    'Browser native media renderer',
    'Playback without rendering',
    'Show real rendering in preview window',
    'Switch to fullscreen',
    'Run B4 successfully before changing rendering mode or target.',
    'data-v2-playback-rendering-controls',
    'data-v2-status-id="v2.block.08.rendering-controls"',
  ]) {
    assert.match(markup, new RegExp(esc(expected)));
  }
});
