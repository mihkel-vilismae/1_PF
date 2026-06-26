import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function render(route) {
  return renderV2StartupOperatorMenuView(route, [], 'copy all log', {
    runtimeState: createInitialState(),
    implementationStatusMode: true,
  });
}

test('V2 Startup renders Raspberry-targeted scheduler controls without selecting Windows CronEmulator', () => {
  const markup = render('startup');
  assert.match(markup, /data-v2-rpi-scheduler-controls/);
  for (const label of [
    'Check emulator scheduler',
    'Run emulator',
    'Stop emulator',
    'Install crontab',
    'Get active crontab',
  ]) {
    assert.match(markup, new RegExp(label));
  }
  assert.match(markup, /Target: Raspberry real crontab/);
  assert.match(markup, /data-scheduler-target="raspberry-real-crontab"/);
  assert.doesNotMatch(markup, /data-scheduler-target="windows-cron-emulator"/);
  assert.match(markup, /insert Raspberry crontab/);
  assert.match(markup, /active Raspberry crontab/);
});

test('V2 scheduler buttons pass their explicit target through the shared action pipeline', () => {
  const appSource = readFileSync('dashboard/app.ts', 'utf8');
  const schedulerActionsSource = readFileSync('dashboard/services/runtimeTruth/runtimeTruthSchedulerActions.ts', 'utf8');
  const behaviorSource = readFileSync('dashboard/services/runtimeTruth/runtimeTruthBehavior.ts', 'utf8');
  const initViewSource = readFileSync('dashboard/views/initView.ts', 'utf8');
  const sharedRowsSource = readFileSync('dashboard/views/schedulerActionRows.ts', 'utf8');

  assert.match(appSource, /button\.dataset\.schedulerTarget/);
  assert.match(appSource, /runAction\(action, schedulerTargetPayload\)/);
  assert.match(schedulerActionsSource, /resolveSchedulerTarget/);
  assert.match(schedulerActionsSource, /options:\s*\{ target\?: string \}/);
  assert.match(behaviorSource, /checkEmulatorSchedulerAction\(payload\)/);
  assert.match(initViewSource, /renderSchedulerActionButton/);
  assert.match(sharedRowsSource, /schedulerTarget/);
});


test('V2 renders the shared RPI-STAGES row on Startup, Workers, and Troubleshooting', () => {
  for (const route of ['startup', 'workers', 'troubleshooting']) {
    const markup = render(route);
    assert.match(markup, /data-v2-rpi-stages-row/);
    assert.match(markup, /DOWNLOAD → INDEX → GPS PARSER → GEOCODE → QUEUE/);
    for (const label of ['Download', 'Index', 'GPS parser', 'Geocode', 'Queue']) {
      assert.match(markup, new RegExp(label));
    }
  }
});


test('V2 renders the shared RPI-WORKERS row on Startup, Workers, Troubleshooting, PIR, and Playback', () => {
  for (const route of ['startup', 'workers', 'troubleshooting', 'pir', 'playback']) {
    const markup = render(route);
    assert.match(markup, /data-v2-rpi-workers-row/);
    assert.match(markup, /3 WORKERS/);
    for (const label of ['Regular state worker', 'Playback worker', 'On-off worker']) {
      assert.match(markup, new RegExp(label));
    }
    assert.match(markup, /Last called/);
    assert.match(markup, /Never/);
    assert.match(markup, /Since last call/);
    assert.match(markup, /No worker call observed yet/);
  }
});


test('V2 Workers renders B3.1-B3.5 worker cards with REAL endpoints and Run actions', () => {
  const markup = render('workers');
  const expected = [
    ['B3.1 Download', 'run-b3-1', 'POST /api/runtime/download/run'],
    ['B3.2 Index', 'run-b3-2', 'POST /api/runtime/index/run'],
    ['B3.3 Parse GPS', 'run-b3-3', 'POST /api/runtime/gps/run'],
    ['B3.4 Geocode', 'run-b3-4', 'POST /api/runtime/geocode/run'],
    ['B3.5 Enqueue playback', 'run-b3-5', 'POST /api/runtime/queue/prepare'],
  ];
  for (const [title, action, endpoint] of expected) {
    assert.match(markup, new RegExp(title));
    assert.match(markup, new RegExp(`data-action="${action}"`));
    assert.match(markup, new RegExp(`REAL · ${endpoint.replaceAll('/', '\\/')}`));
  }
  assert.match(markup, /status-badge--idle/);
  assert.match(markup, /Ready to call POST \/api\/runtime\/download\/run\./);
});
