/*
 * Tests the Test Mode whole-logic emulator start service.
 * The service must configure cadence and max-item limits without production auth
 * or broad process termination behavior.
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildWholeLogicTestModeStartResult } from '../server/testing_wholeLogicTestModeService.ts';
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

test('whole-logic start records requested cadences and max-5 item limit', async () => {
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
  assert.match(result.emulator.crontabText, /regular_stage_worker\.ps1/);
  assert.match(result.emulator.crontabText, /playback_worker\.ps1/);
  assert.match(result.emulator.crontabText, /screen_on_off_worker\.ps1/);
});

test('whole-logic start writes runtime config and CronEmulator crontab when paths are supplied', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'pf-whole-logic-'));
  try {
    const configPath = path.join(dir, 'scheduler', 'whole-logic-test-mode-config.json');
    const crontabPath = path.join(dir, 'cron', 'crontab_emulated.txt');
    const result = await buildWholeLogicTestModeStartResult({
      runtimeMode: 'test',
      platform: 'win32',
      configFilePath: configPath,
      crontabFilePath: crontabPath,
    });

    assert.equal(result.status, 'ok');
    assert.equal(await readFile(crontabPath, 'utf8'), buildWholeLogicWindowsCronEmulatorCrontabText());
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    assert.equal(config.workerStageItemLimit, WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT);
    assert.equal(config.workers.playback.cadenceSeconds, 30);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
