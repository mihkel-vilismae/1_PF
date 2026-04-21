import assert from 'node:assert/strict';
import test from 'node:test';

import { describeInspectableElement, describeValueElement } from '../dashboard/inspect/controlMetadata.js';
import { createRealityMetadataHelpers } from '../dashboard/inspect/realityMetadata.js';
import { createBackendStatusMetadataHelpers } from '../dashboard/inspect/backendStatusMetadata.js';

function fakeNode({ textContent = '', query = {} } = {}) {
  return {
    textContent,
    querySelector(selector) {
      return query[selector] ?? null;
    },
  };
}

function fakeElement({ matches = [], dataset = {}, textContent = '', query = {}, closest = {}, attributes = [] } = {}) {
  const matchSet = new Set(matches);
  const attributeSet = new Set(attributes);

  return {
    dataset: { ...dataset },
    textContent,
    matches(selector) {
      return matchSet.has(selector);
    },
    querySelector(selector) {
      return query[selector] ?? null;
    },
    closest(selector) {
      return closest[selector] ?? null;
    },
    hasAttribute(name) {
      return attributeSet.has(name);
    },
  };
}

test('control inspect copy keeps Explain values button tooltip text stable', () => {
  const meta = describeInspectableElement(
    fakeElement({
      matches: ['[data-action]'],
      dataset: { action: 'toggle-value-inspect-mode' },
    }),
  );

  assert.deepEqual(meta, {
    label: 'Explain values mode',
    description: 'Highlights live values and shows a tooltip that explains where each value comes from.',
  });
});

test('control inspect copy keeps Explain controls button tooltip text stable', () => {
  const meta = describeInspectableElement(
    fakeElement({
      matches: ['[data-action]'],
      dataset: { action: 'toggle-inspect-mode' },
    }),
  );

  assert.deepEqual(meta, {
    label: 'Explain controls mode',
    description: 'Highlights every interactive control and shows a tooltip that explains what it does when you hover or focus it.',
  });
});

test('control inspect copy keeps Show real vs mock button tooltip text stable', () => {
  const meta = describeInspectableElement(
    fakeElement({
      matches: ['[data-action]'],
      dataset: { action: 'toggle-reality-inspect-mode' },
    }),
  );

  assert.deepEqual(meta, {
    label: 'Show real vs mock mode',
    description: 'Highlights the current view by implementation truth so real wiring, mock behavior, and mixed areas are easy to spot.',
  });
});

test('control inspect copy keeps Show backend status button tooltip text stable', () => {
  const meta = describeInspectableElement(
    fakeElement({
      matches: ['[data-action]'],
      dataset: { action: 'toggle-backend-status-inspect-mode' },
    }),
  );

  assert.deepEqual(meta, {
    label: 'Show backend status mode',
    description: 'Highlights whether a section is backed by a real backend, frontend-only mock behavior, or missing backend support.',
  });
});

test('value inspect copy keeps Current truth source descriptions stable', () => {
  const row = fakeNode({ query: { dt: fakeNode({ textContent: 'Source of truth' }) } });
  const sidePanel = fakeNode({ query: { '.side-panel__header h2': fakeNode({ textContent: 'Current truth' }) } });
  const meta = describeValueElement(
    fakeElement({
      matches: ['.definition-row dd'],
      textContent: 'conf/runtime-truth.json',
      closest: {
        '.definition-row': row,
        '.side-panel': sidePanel,
      },
    }),
  );

  assert.equal(meta.label, 'Source of truth: conf/runtime-truth.json');
  assert.match(meta.description, /state\.truth\.sourceOfTruth/);
});

test('reality inspect metadata still classifies View A navigation as mixed', () => {
  const { describeRealityElement } = createRealityMetadataHelpers({
    getState: () => ({ history: [], modal: null }),
    getTransitHasLiveTraffic: () => false,
  });
  const meta = describeRealityElement(
    fakeElement({
      matches: ['.nav-link'],
      dataset: { view: 'A' },
    }),
  );

  assert.equal(meta.state, 'mixed');
  assert.equal(meta.label, 'Mixed: Open A - Init');
});

test('reality inspect metadata still explains the hybrid A/E vs B-D shell pill', () => {
  const { describeRealityElement } = createRealityMetadataHelpers({
    getState: () => ({ history: [], modal: null }),
    getTransitHasLiveTraffic: () => false,
  });
  const meta = describeRealityElement(
    fakeElement({
      matches: ['.pill'],
      textContent: 'A and E wired, B-D simulated',
    }),
  );

  assert.equal(meta.state, 'mixed');
  assert.match(meta.description, /hybrid dashboard/i);
});

test('backend status inspect metadata keeps Verify .env mapped to real backend support', () => {
  const { describeBackendStatusElement } = createBackendStatusMetadataHelpers({
    getState: () => ({
      initResults: { '1A': null, '2A': null, '3A': null },
      databaseViewer: { results: {} },
      logs: {},
      history: [],
      modal: null,
    }),
    getTransitHasLiveTraffic: () => false,
  });
  const meta = describeBackendStatusElement(
    fakeElement({
      matches: ['.button, .db-object-button'],
      dataset: { action: 'verify-env' },
      textContent: 'Verify .env',
    }),
  );

  assert.equal(meta.state, 'real');
  assert.equal(meta.label, 'Real: Verify .env');
});

test('backend status inspect metadata keeps download action marked real', () => {
  const { describeBackendStatusElement } = createBackendStatusMetadataHelpers({
    getState: () => ({
      initResults: { '1A': null, '2A': null, '3A': null },
      databaseViewer: { results: {} },
      logs: {},
      history: [],
      modal: null,
    }),
    getTransitHasLiveTraffic: () => false,
  });
  const meta = describeBackendStatusElement(
    fakeElement({
      matches: ['.button, .db-object-button'],
      dataset: { action: 'run-b2' },
      textContent: 'Download 5 files',
    }),
  );

  assert.equal(meta.state, 'real');
  assert.equal(meta.label, 'Real: Download 5 files');
});

test('backend status inspect metadata still reports Current truth values as frontend-backed mock state', () => {
  const { describeBackendStatusElement } = createBackendStatusMetadataHelpers({
    getState: () => ({
      initResults: { '1A': null, '2A': null, '3A': null },
      databaseViewer: { results: {} },
      logs: {},
      history: [],
      modal: null,
    }),
    getTransitHasLiveTraffic: () => false,
  });
  const sidePanel = fakeNode({ query: { '.side-panel__header h2': fakeNode({ textContent: 'Current truth' }) } });
  const meta = describeBackendStatusElement(
    fakeElement({
      matches: ['.definition-row'],
      query: { dt: fakeNode({ textContent: 'Source of truth' }) },
      closest: {
        '.side-panel': sidePanel,
      },
    }),
  );

  assert.equal(meta.state, 'unknown');
  assert.equal(meta.label, 'Unknown: Source of truth value');
});
