/*
 * Tests the Test Mode whole-logic emulator controller service.
 * The service must configure cadence and max-item limits while controlling only
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

test('whole-logic start records requested cadences, max-5 item limit, and owned worker records', async () => {
  const result = await buildWholeLogicTestModeStartResult({
    runtimeMode: 'test',
    platform: 'win32',
    now: new Date('2026-06-02T01:00:00.000Z'),
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.loginRequired, false);
  assert.equal(result.workerStageItemLimit, WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT);
  assert.equal(result.config.workers.regularStage.cadenceSeconds, 60);
  assert.equal(result.config.workers.playback.cadenceSeconds, 30);
  assert.equal(result.config.workers.screenOnOff.cadenceSeconds, 120);
  assert.equal(result.config.workers.regularStage.includesMockDownloadLimit, true);
  assert.equal(result.controllerState.workers.playback.ownedByController, true);
  assert.equal(result.controllerState.workers.playback.osPid, null);
  assert.match(result.emulator.crontabText, /regular_stage_worker\.ps1/);
  assert.match(result.emulator.crontabText, /playback_worker\.ps1/);
  assert.match(result.emulator.crontabText, /screen_on_off_worker\.ps1/);
});

test('whole-logic start writes runtime config, CronEmulator crontab, and controller state', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'pf-whole-logic-'));
  try {
    const configPath = path.join(dir, 'scheduler', 'whole-logic-test-mode-config.json');
    const crontabPath = path.join(dir, 'cron', 'crontab_emulated.txt');
    const controllerPath = path.join(dir, 'scheduler', 'whole-logic-test-mode-controller.json');
    const result = await buildWholeLogicTestModeStartResult({
      runtimeMode: 'test',
      platform: 'win32',
      configFilePath: configPath,
      crontabFilePath: crontabPath,
      controllerStateFilePath: controllerPath,
    });

    assert.equal(result.status, 'ok');
    assert.equal(await readFile(crontabPath, 'utf8'), buildWholeLogicWindowsCronEmulatorCrontabText());
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    const controllerState = JSON.parse(await readFile(controllerPath, 'utf8'));
    assert.equal(config.workerStageItemLimit, WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT);
    assert.equal(config.workers.playback.cadenceSeconds, 30);
    assert.equal(controllerState.powerState, 'on');
    assert.equal(controllerState.cronjobsEnabled, true);
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
