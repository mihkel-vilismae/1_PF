/*
 * Tests the Test Mode whole-logic emulator controller service.
 * The service must configure cadence, status, and logs while controlling only
 * owned Test Mode records, never arbitrary OS/dashboard processes.
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildWholeLogicTestModeControlResult,
  buildWholeLogicTestModeStartResult,
  buildWholeLogicTestModeStatusResult,
} from '../server/testing_wholeLogicTestModeService.ts';
import {
  WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
  buildWholeLogicWindowsCronEmulatorCrontabText,
} from '../shared/testModeWholeLogicContract.ts';

test('whole-logic start is blocked outside Test Mode', async () => {
  const result = await buildWholeLogicTestModeStartResult({ runtimeMode: 'real', platform: 'win32' });

  assert.equal(result.status, 'blocked');
  assert.equal(result.destructiveActionAttempted, false);
  assert.equal(result.productionBehaviorChanged, false);
  assert.match(result.message, /blocked outside Test Mode/);
});

test('whole-logic start records requested cadences, max-5 limit, disabled button, and owned records', async () => {
  const result = await buildWholeLogicTestModeStartResult({
    runtimeMode: 'test',
    platform: 'win32',
    now: new Date('2026-06-02T01:00:00.000Z'),
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.loginRequired, false);
  assert.equal(result.workerStageItemLimit, WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT);
  assert.equal(result.config.workers.regularStage.cadenceSeconds, 6);
  assert.equal(result.config.workers.playback.cadenceSeconds, 3);
  assert.equal(result.config.workers.screenOnOff.cadenceSeconds, 12);
  assert.equal(result.config.workers.regularStage.includesMockDownloadLimit, true);

  assert.equal(result.config.statusRows[0].state, 'blank');
  assert.equal(result.config.statusRows[0].calledCount, 0);
  assert.equal(result.controllerState.startButton.disabled, true);
  assert.equal(result.controllerState.runActive, true);
  assert.equal(result.controllerState.workers.playback.ownedByController, true);
  assert.equal(result.controllerState.workers.playback.osPid, null);
  assert.equal(result.controllerState.statusRows.find((row) => row.id === 'crontab_working').state, 'passed');
  assert.equal(result.controllerState.statusRows.find((row) => row.id === 'native_playback_started').state, 'pending');
  assert.match(result.controllerState.focusedLog.at(-1).message, /Native playback/);
  assert.match(result.emulator.crontabText, /regular_stage_worker\.ps1/);
  assert.match(result.emulator.crontabText, /playback_worker\.ps1/);
  assert.match(result.emulator.crontabText, /screen_on_off_worker\.ps1/);
});

test('whole-logic start writes runtime config, CronEmulator crontab, controller state, and end2end_test.log', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'pf-whole-logic-'));
  try {
    const configPath = path.join(dir, 'scheduler', 'whole-logic-test-mode-config.json');
    const crontabPath = path.join(dir, 'cron', 'crontab_emulated.txt');
    const controllerPath = path.join(dir, 'scheduler', 'whole-logic-test-mode-controller.json');
    const logPath = path.join(dir, 'logs', 'end2end_test.log');
    const result = await buildWholeLogicTestModeStartResult({
      runtimeMode: 'test',
      platform: 'win32',
      configFilePath: configPath,
      crontabFilePath: crontabPath,
      controllerStateFilePath: controllerPath,
      end2endLogFilePath: logPath,
    });

    assert.equal(result.status, 'ok');
    assert.equal(await readFile(crontabPath, 'utf8'), buildWholeLogicWindowsCronEmulatorCrontabText());
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const controllerState = JSON.parse(await readFile(controllerPath, 'utf8'));
    const logText = await readFile(logPath, 'utf8');
    assert.equal(config.workerStageItemLimit, WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT);
    assert.equal(config.workers.playback.cadenceSeconds, 3);
    assert.equal(controllerState.powerState, 'on');
    assert.equal(controllerState.cronjobsEnabled, true);
    assert.match(logText, /Large TEST MODE FAST EMULATOR start button clicked/);
    assert.match(logText, /Owned regular, playback, and screen-on-off worker records were started without login/);
    assert.doesNotMatch(logText, /password=|token=|secret=|cookie=/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('duplicate start is blocked after the first click and preserves disabled state', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'pf-whole-logic-duplicate-'));
  try {
    const controllerPath = path.join(dir, 'controller.json');
    const logPath = path.join(dir, 'logs', 'end2end_test.log');
    const first = await buildWholeLogicTestModeStartResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, end2endLogFilePath: logPath });
    const second = await buildWholeLogicTestModeStartResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, end2endLogFilePath: logPath });
    const logText = await readFile(logPath, 'utf8');

    assert.equal(first.status, 'ok');
    assert.equal(second.status, 'blocked');
    assert.equal(second.duplicateStartBlocked, true);
    assert.equal(second.controllerState.startButton.disabled, true);
    assert.match(logText, /Duplicate TEST MODE FAST EMULATOR start click was blocked/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('q/w/e controls terminate only the matching owned worker state', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'pf-whole-logic-control-'));
  try {
    const controllerPath = path.join(dir, 'controller.json');
    await buildWholeLogicTestModeStartResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath });

    const qResult = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, key: 'q' });
    assert.equal(qResult.controllerState.workers.regularStage.processState, 'terminated');
    assert.equal(qResult.controllerState.workers.playback.processState, 'running');
    assert.equal(qResult.controllerState.workers.screenOnOff.processState, 'running');
    assert.equal(qResult.destructiveActionAttempted, false);

    const wResult = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, key: 'w' });
    assert.equal(wResult.controllerState.workers.playback.processState, 'terminated');
    assert.equal(wResult.controllerState.workers.screenOnOff.processState, 'running');

    const eResult = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, key: 'e' });
    assert.equal(eResult.controllerState.workers.screenOnOff.processState, 'terminated');
    assert.equal(eResult.controllerState.workers.screenOnOff.lastSignal, 'SIGKILL_SIMULATED_POWER_LOSS');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('r stops cronjobs and t toggles power-off then power-on without killing dashboard/system processes', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'pf-whole-logic-power-'));
  try {
    const controllerPath = path.join(dir, 'controller.json');
    await buildWholeLogicTestModeStartResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath });

    const rResult = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, key: 'r' });
    assert.equal(rResult.controllerState.cronjobsEnabled, false);
    assert.equal(rResult.controllerState.powerState, 'on');

    const offResult = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, key: 't' });
    assert.equal(offResult.controllerState.powerState, 'off');
    assert.equal(offResult.controllerState.cronjobsEnabled, false);
    assert.equal(offResult.controllerState.databaseState, 'abruptly_interrupted');
    assert.equal(offResult.controllerState.playbackState, 'abruptly_interrupted');
    assert.ok(offResult.controllerState.safeTerminationBoundary.includes('Do not kill the dashboard process.'));
    assert.ok(offResult.controllerState.safeTerminationBoundary.includes('Do not kill arbitrary Node/Python/SQLite/system processes.'));

    const onResult = await buildWholeLogicTestModeControlResult({ runtimeMode: 'test', controllerStateFilePath: controllerPath, key: 't' });
    assert.equal(onResult.controllerState.powerState, 'on');
    assert.equal(onResult.controllerState.cronjobsEnabled, true);
    assert.equal(onResult.controllerState.workers.regularStage.processState, 'running');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('whole-logic controls and status are blocked outside Test Mode', async () => {
  const controlResult = await buildWholeLogicTestModeControlResult({ runtimeMode: 'real', key: 'q' });
  const statusResult = await buildWholeLogicTestModeStatusResult({ runtimeMode: 'real' });

  assert.equal(controlResult.status, 'blocked');
  assert.equal(statusResult.status, 'blocked');
  assert.equal(controlResult.productionBehaviorChanged, false);
  assert.equal(statusResult.destructiveActionAttempted, false);
});
