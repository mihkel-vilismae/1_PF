/*
 * Guards the frontend-only Test Mode / Real Mode startup gate implementation.
 * The checks keep the mode selector visible in source while preserving backend boundaries.
 * This test is static so it cannot trigger auth, downloads, scheduler, or playback behavior.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync('dashboard/app.ts', 'utf8');
const indexSource = readFileSync('dashboard/index.html', 'utf8');
const stylesSource = readFileSync('dashboard/styles.css', 'utf8');
const testModeStylesSource = readFileSync('dashboard/styles.test.css', 'utf8');
const realModeStylesSource = readFileSync('dashboard/styles.real.css', 'utf8');

test('dashboard startup gate exposes Test Mode and Real Mode as frontend-only choices', () => {
  assert.match(appSource, /type DashboardVisualMode = 'test' \| 'real'/);
  assert.match(appSource, /let dashboardVisualMode: DashboardVisualMode \| null = null/);
  assert.match(appSource, /data-dashboard-visual-mode="test"/);
  assert.match(appSource, /data-dashboard-visual-mode="real"/);
  assert.match(appSource, /does not trigger real auth, downloads, scheduler actions, playback, or backend behavior changes/);
});

test('dashboard startup gate uses shared dashboard markup instead of duplicated dashboards', () => {
  assert.doesNotMatch(appSource, /TestDashboard/);
  assert.doesNotMatch(appSource, /RealDashboard/);
  assert.match(appSource, /renderInitView\(state\)/);
  assert.match(appSource, /renderTestView\(state, dashboardVisualMode\)/);
  assert.match(appSource, /renderLastRunView\(state\)/);
  assert.match(appSource, /renderRunningProcessView\(state\)/);
  assert.match(appSource, /renderDatabaseViewerView\(state\)/);
});

test('dashboard visual mode CSS keeps mode styling presentation-only', () => {
  assert.match(indexSource, /href="\.\/styles\.css"/);
  assert.match(indexSource, /href="\.\/styles\.test\.css"/);
  assert.match(indexSource, /href="\.\/styles\.real\.css"/);
  assert.match(testModeStylesSource, /body\[data-dashboard-visual-mode="test"\]/);
  assert.match(realModeStylesSource, /Real Mode intentionally has no overrides at this time/);
  assert.match(stylesSource, /\.shell--mode-gated/);
  assert.match(stylesSource, /\.mode-gate/);
  assert.match(stylesSource, /Mode styles do not change backend calls, runtime actions, or dashboard behavior/);
});
