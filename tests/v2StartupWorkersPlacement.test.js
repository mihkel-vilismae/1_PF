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
