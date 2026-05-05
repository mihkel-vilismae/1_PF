import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { describeInspectableElement } from '../dashboard/inspect/controlMetadata.ts';
import { createBackendStatusMetadataHelpers } from '../dashboard/inspect/backendStatusMetadata.ts';
import { createRealityMetadataHelpers } from '../dashboard/inspect/realityMetadata.ts';
import { FALLBACK_INSPECT_DESCRIPTION } from '../dashboard/inspect/guideCopy.ts';
import { renderDatabaseViewerView } from '../dashboard/views/databaseViewerView.ts';
import { renderInitView } from '../dashboard/views/initView.ts';
import { renderLastRunView } from '../dashboard/views/lastRunView.ts';
import { renderRunningProcessView } from '../dashboard/views/runningProcessView.ts';
import { renderTestView } from '../dashboard/views/testView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localBackendUnknownActions = new Set([
  'clear-history',
  'toggle-inspect-mode',
  'toggle-value-inspect-mode',
  'toggle-reality-inspect-mode',
  'toggle-backend-status-inspect-mode',
]);

test('rendered dashboard data-action controls have inspect, reality, and backend-status metadata', () => {
  const actions = collectDashboardActions();
  assert.ok(actions.length > 0);

  const state = createInitialState();
  const { describeRealityElement } = createRealityMetadataHelpers({
    getState: () => state,
    getTransitHasLiveTraffic: () => false,
  });
  const { describeBackendStatusElement } = createBackendStatusMetadataHelpers({
    getState: () => state,
    getTransitHasLiveTraffic: () => false,
  });

  for (const { action, label } of actions) {
    const element = fakeButton({ action, label });

    const inspectMeta = describeInspectableElement(element);
    assert.ok(inspectMeta, `${action} should have inspect metadata`);
    assert.notEqual(inspectMeta.description, FALLBACK_INSPECT_DESCRIPTION, `${action} should not fall back to generic inspect copy`);

    const realityMeta = describeRealityElement(element);
    assert.ok(realityMeta, `${action} should have reality metadata`);
    assert.notEqual(realityMeta.state, 'unknown', `${action} should have explicit reality classification`);

    const backendMeta = describeBackendStatusElement(element);
    assert.ok(backendMeta, `${action} should have backend-status metadata`);
    if (!localBackendUnknownActions.has(action)) {
      assert.notEqual(backendMeta.state, 'unknown', `${action} should have explicit backend-status classification`);
    }
  }
});

function collectDashboardActions() {
  const state = createInitialState();
  state.lastRunMode = 'ready';

  const renderedMarkup = [
    renderInitView(state),
    renderTestView(state),
    renderLastRunView(state),
    renderRunningProcessView(state),
    renderDatabaseViewerView(state),
    extractAppShellActionMarkup(),
  ].join('\n');

  const actions = new Map();
  const buttonPattern = /<button\b[^>]*\bdata-action="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g;
  for (const match of renderedMarkup.matchAll(buttonPattern)) {
    const action = match[1];
    const label = stripMarkup(match[2]);
    actions.set(action, label || action);
  }

  return [...actions.entries()]
    .map(([action, label]) => ({ action, label }))
    .sort((left, right) => left.action.localeCompare(right.action));
}

function extractAppShellActionMarkup() {
  const appSource = fs.readFileSync(path.join(repoRoot, 'dashboard', 'app.ts'), 'utf8');
  const actionPattern = /<button\b[^>]*\bdata-action="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g;
  return [...appSource.matchAll(actionPattern)].map((match) => match[0]).join('\n');
}

function stripMarkup(value) {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$\{[^}]+\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fakeButton({ action, label }) {
  return {
    dataset: { action },
    textContent: label,
    matches(selector) {
      return selector === '[data-action]' || selector === '.button, .db-object-button';
    },
    querySelector() {
      return null;
    },
    closest() {
      return null;
    },
    hasAttribute() {
      return false;
    },
  };
}
