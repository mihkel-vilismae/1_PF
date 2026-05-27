/*
 * Ensures the browser API gateway propagates the selected runtime mode.
 * Database and runtime calls use this header so backend handlers can choose
 * real runtime_data or isolated test_runtime_data paths.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('api client provides a centralized runtime mode header setter', () => {
  /**
   * Protects the architecture boundary: services keep using requestJson while
   * the shared API client adds the runtime mode header in one place.
   */
  const source = readFileSync('dashboard/services/apiClient.ts', 'utf8');

  assert.match(source, /const RUNTIME_MODE_HEADER = 'X-Dashboard-Runtime-Mode'/);
  assert.match(source, /export function setDashboardRuntimeMode/);
  assert.match(source, /requestHeaders\[RUNTIME_MODE_HEADER\] = dashboardRuntimeMode/);
});

test('mode gate selection updates backend runtime mode for future requests', () => {
  /**
   * Prevents the startup gate from becoming visual-only again. Choosing Test
   * Mode or Real Mode must update the API client before actions are run.
   */
  const source = readFileSync('dashboard/app.ts', 'utf8');

  assert.match(source, /setDashboardRuntimeMode\(selectedMode\)/);
  assert.match(source, /Test Mode routes runtime\/database\/log actions to isolated test storage/);
  assert.match(source, /Real Mode uses the real configured runtime storage/);
});
