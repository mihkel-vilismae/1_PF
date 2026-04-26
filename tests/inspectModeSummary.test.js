import assert from 'node:assert/strict';
import test from 'node:test';

import { getActiveInspectMode, renderInspectModeSummary } from '../dashboard/inspect/inspectModeSummary.js';

const baseState = {
  activeView: 'A',
  inspectMode: false,
  valueInspectMode: false,
  realityInspectMode: false,
  backendStatusInspectMode: false,
};

test('inspect summary stays hidden when no inspect mode is active', () => {
  assert.equal(renderInspectModeSummary(baseState), '');
  assert.equal(getActiveInspectMode(baseState), null);
});

test('inspect summary renders page-aware control guidance for each A-E view', () => {
  for (const viewId of ['A', 'B', 'C', 'D', 'E']) {
    const html = renderInspectModeSummary({ ...baseState, activeView: viewId, inspectMode: true });
    assert.match(html, /data-inspect-summary-mode="controls"/);
    assert.match(html, new RegExp(`data-inspect-summary-view="${viewId}"`));
    assert.match(html, /Explain controls/);
    assert.match(html, /No explanation metadata available yet/);
  }
});

test('inspect summary identifies the active inspect mode exclusively', () => {
  assert.equal(getActiveInspectMode({ ...baseState, inspectMode: true }), 'controls');
  assert.equal(getActiveInspectMode({ ...baseState, valueInspectMode: true }), 'values');
  assert.equal(getActiveInspectMode({ ...baseState, realityInspectMode: true }), 'reality');
  assert.equal(getActiveInspectMode({ ...baseState, backendStatusInspectMode: true }), 'backend');
});

test('inspect summary renders the backend status mode with honest fallback language', () => {
  const html = renderInspectModeSummary({
    ...baseState,
    activeView: 'E',
    backendStatusInspectMode: true,
  });

  assert.match(html, /Show backend status/);
  assert.match(html, /Database Viewer/);
  assert.match(html, /Unknown or missing status is shown instead of inventing backend support/);
});
