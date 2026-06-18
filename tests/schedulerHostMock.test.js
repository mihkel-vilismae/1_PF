import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSchedulerHostMockIsNonBlocking, buildSchedulerHostMockStatus } from '../dashboard/services/schedulerHostMock.ts';
import { renderDebugView } from '../dashboard/views/debugView.ts';

test('scheduler host mock status is non-blocking and process-free', () => {
  const status = buildSchedulerHostMockStatus();
  assert.equal(status.status, 'mock-ready');
  assert.equal(status.lanes.length, 4);
  assert.equal(assertSchedulerHostMockIsNonBlocking(status), true);
  assert.match(status.nonClaim, /no scheduler process/);
  assert.match(status.nonClaim, /no .*worker process/);
});

test('Debug renders scheduler host mock status without real worker/crontab claim', () => {
  const markup = renderDebugView({}, '0.8.159');
  assert.match(markup, /data-debug-pane="scheduler-host-mock"/);
  assert.match(markup, /Scheduler Host Mock Status/);
  assert.match(markup, /scheduler-host-mock-status-only/);
  assert.match(markup, /processSpawned=false/);
  assert.match(markup, /does not start workers or write crontab/);
});
