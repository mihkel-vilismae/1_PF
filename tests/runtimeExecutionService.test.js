import assert from 'node:assert/strict';
import test from 'node:test';

import { RUNTIME_EXECUTION_ENDPOINTS } from '../dashboard/services/runtimeExecutionService.ts';

test('runtime execution endpoints stay aligned with implemented backend routes', () => {
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.downloadRun, { method: 'POST', path: '/api/runtime/download/run' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.indexRun, { method: 'POST', path: '/api/runtime/index/run' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.queuePrepare, { method: 'POST', path: '/api/runtime/queue/prepare' });
  assert.deepEqual(RUNTIME_EXECUTION_ENDPOINTS.playbackSelectCurrent, { method: 'POST', path: '/api/runtime/playback/select-current' });
});
