/*
 * Verifies frontend runtime endpoint constants against backend route paths.
 * These tests catch dashboard action wiring drift before browser execution.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { RUNTIME_EXECUTION_ENDPOINTS } from '../dashboard/services/runtimeExecutionService.ts';

test('runtime execution endpoints stay aligned with implemented backend routes', () => {
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.downloadRun, { method: 'POST', path: '/api/runtime/download/run' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.realDownloadRun, { method: 'POST', path: '/api/runtime/download/real-run' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.indexRun, { method: 'POST', path: '/api/runtime/index/run' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.queuePrepare, { method: 'POST', path: '/api/runtime/queue/prepare' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.playbackSelectCurrent, { method: 'POST', path: '/api/runtime/playback/select-current' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.orchestrationRun, { method: 'POST', path: '/api/runtime/orchestration/run' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.orchestrationLast, { method: 'GET', path: '/api/runtime/orchestration/last' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.screenSimulationState, { method: 'GET', path: '/api/runtime/screen-simulation/state' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.screenSimulationConfigure, { method: 'POST', path: '/api/runtime/screen-simulation/configure' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.pipelineIssuesDetect, { method: 'POST', path: '/api/runtime/pipeline/issues/detect' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.pipelineStaleLocksClear, { method: 'POST', path: '/api/runtime/pipeline/stale-locks/clear' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.wholeLogicTestModeStart, { method: 'POST', path: '/api/testing/whole-logic-emulator/start' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.wholeLogicTestModeStatus, { method: 'GET', path: '/api/testing/whole-logic-emulator/status' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.wholeLogicTestModeControl, { method: 'POST', path: '/api/testing/whole-logic-emulator/control' });
});
