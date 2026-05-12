import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RUNTIME_PROJECTION_SOURCES,
  RUNTIME_NAMESPACES,
} from '../shared/runtimeProjectionContracts.ts';

test('runtimeProjection contracts export expected sources', () => {
  // Ensure all required source keys are present
  const keys = Object.keys(RUNTIME_PROJECTION_SOURCES).sort();
  assert.deepEqual(
    keys,
    ['computed', 'db', 'heartbeat', 'lock', 'log', 'projection', 'unknown'].sort(),
  );
  // Ensure values match keys
  for (const key of keys) {
    assert.equal(RUNTIME_PROJECTION_SOURCES[key], key);
  }
});

test('runtimeProjection contracts export expected namespaces', () => {
  const keys = Object.keys(RUNTIME_NAMESPACES).sort();
  assert.deepEqual(keys, ['demoRuntime', 'realRuntime', 'testRuntime'].sort());
  for (const key of keys) {
    assert.equal(RUNTIME_NAMESPACES[key], key);
  }
});
