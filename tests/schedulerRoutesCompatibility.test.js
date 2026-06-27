/*
 * Verifies the extracted scheduler route table keeps legacy route keys unchanged.
 * This protects View A scheduler and CronEmulator endpoint compatibility.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createSchedulerRoutes } from '../server/routes/schedulerRoutes.ts';

function makeHandler(name) {
  // Creates a sentinel route handler so route-key wiring can be compared by identity.
  return () => ({ statusCode: 200, payload: { name } });
}

test('scheduler route extraction preserves cron and emulator route keys', () => {
  const handlers = {
    cronTargetStatusHandler: makeHandler('cronTargetStatusHandler'),
    selectCronTargetHandler: makeHandler('selectCronTargetHandler'),
    installCronHandler: makeHandler('installCronHandler'),
    cronStatusHandler: makeHandler('cronStatusHandler'),
    printCronHandler: makeHandler('printCronHandler'),
    checkEmulatorSchedulerHandler: makeHandler('checkEmulatorSchedulerHandler'),
    runEmulatorHandler: makeHandler('runEmulatorHandler'),
    stopEmulatorHandler: makeHandler('stopEmulatorHandler'),
    installEmulatorCrontabHandler: makeHandler('installEmulatorCrontabHandler'),
    activeEmulatorCrontabHandler: makeHandler('activeEmulatorCrontabHandler'),
    testCrontabWritingHandler: makeHandler('testCrontabWritingHandler'),
    schedulerRunLogHandler: makeHandler('schedulerRunLogHandler'),
  };

  const routes = createSchedulerRoutes(handlers);

  assert.deepEqual(Object.keys(routes), [
    'GET /api/init/cron/target',
    'POST /api/init/cron/target',
    'POST /api/init/cron/install',
    'GET /api/init/cron/status',
    'GET /api/init/cron/print',
    'GET /api/init/cron/emulator/check',
    'POST /api/init/cron/emulator/run',
    'POST /api/init/cron/emulator/stop',
    'POST /api/init/cron/emulator/crontab',
    'GET /api/init/cron/emulator/crontab',
    'POST /api/init/cron/emulator/crontab/write-test',
    'GET /api/init/cron/run-log',
  ]);
  assert.equal(routes['GET /api/init/cron/target'], handlers.cronTargetStatusHandler);
  assert.equal(routes['POST /api/init/cron/target'], handlers.selectCronTargetHandler);
  assert.equal(routes['POST /api/init/cron/install'], handlers.installCronHandler);
  assert.equal(routes['GET /api/init/cron/status'], handlers.cronStatusHandler);
  assert.equal(routes['GET /api/init/cron/print'], handlers.printCronHandler);
  assert.equal(routes['GET /api/init/cron/emulator/check'], handlers.checkEmulatorSchedulerHandler);
  assert.equal(routes['POST /api/init/cron/emulator/run'], handlers.runEmulatorHandler);
  assert.equal(routes['POST /api/init/cron/emulator/stop'], handlers.stopEmulatorHandler);
  assert.equal(routes['POST /api/init/cron/emulator/crontab'], handlers.installEmulatorCrontabHandler);
  assert.equal(routes['GET /api/init/cron/emulator/crontab'], handlers.activeEmulatorCrontabHandler);
  assert.equal(routes['POST /api/init/cron/emulator/crontab/write-test'], handlers.testCrontabWritingHandler);
  assert.equal(routes['GET /api/init/cron/run-log'], handlers.schedulerRunLogHandler);
});
