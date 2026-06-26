import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { V2_OPERATOR_SIDEBAR_ITEMS } from '../dashboard/data/v2OperatorSidebar.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

const statusRegistry = JSON.parse(readFileSync('dashboard/data/v2ImplementationStatus.json', 'utf8'));
const statusIds = new Set(statusRegistry.elements.map((element) => element.id));
const appSource = readFileSync('dashboard/app.ts', 'utf8');
const wrapperSource = readFileSync('dashboard/views/v2OperatorPageWrapper.ts', 'utf8');
const startupViewSource = readFileSync('dashboard/views/v2StartupOperatorMenuView.ts', 'utf8');
const stylesSource = readFileSync('dashboard/styles.v2.css', 'utf8');
const implementationStatusDoc = readFileSync('docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md', 'utf8');

function extractAttributes(markup, attributeName) {
  return [...markup.matchAll(new RegExp(`${attributeName}="([^"]+)"`, 'g'))].map((match) => match[1]);
}

test('V2 implementation-status registry has unique IDs and expected legend colors', () => {
  assert.equal(statusRegistry.scope, 'v2-only');
  assert.equal(statusRegistry.legend.done.color, 'green');
  assert.equal(statusRegistry.legend['in-progress'].color, 'yellow');
  assert.equal(statusRegistry.legend['not-implemented'].color, 'red');
  assert.equal(statusIds.size, statusRegistry.elements.length, 'registry IDs must be unique');
});

test('every rendered V2 status target resolves to a JSON registry element', () => {
  for (const item of V2_OPERATOR_SIDEBAR_ITEMS) {
    const markup = renderV2StartupOperatorMenuView(item.route, [], 'copy all log', {
      implementationStatusMode: true,
      inspectMode: true,
      valueInspectMode: true,
    });
    const renderedStatusIds = new Set(extractAttributes(markup, 'data-v2-status-id'));
    assert.ok(renderedStatusIds.size >= 4, `${item.route} should render multiple status targets`);
    for (const id of renderedStatusIds) {
      assert.ok(statusIds.has(id), `${item.route} rendered status ID ${id} missing from JSON registry`);
    }
  }
});

test('V2 toolbar exposes only the approved explanation/status controls', () => {
  const markup = renderV2StartupOperatorMenuView('setup', [], 'copy all log', {
    implementationStatusMode: false,
    inspectMode: false,
    valueInspectMode: false,
  });
  assert.match(markup, /data-action="toggle-inspect-mode"/);
  assert.match(markup, /Explain controls/);
  assert.match(markup, /data-action="toggle-value-inspect-mode"/);
  assert.match(markup, /Explain values/);
  assert.match(markup, /data-action="toggle-v2-implementation-status"/);
  assert.match(markup, /Implementation status/);
  assert.doesNotMatch(markup, /Show marked for removal/);
  assert.doesNotMatch(wrapperSource, /toggle-marked-for-removal/);
});

test('V2 status highlight and help UI are wired through frontend-only handlers', () => {
  assert.match(appSource, /v2ImplementationStatusMode/);
  assert.match(appSource, /toggleV2ImplementationStatusMode/);
  assert.match(appSource, /openV2StatusHelp/);
  assert.match(appSource, /show-v2-status-help/);
  assert.match(appSource, /getV2ImplementationStatusElement/);
  assert.match(stylesSource, /v2-implementation-status-mode/);
  assert.match(stylesSource, /data-v2-implementation-status="done"/);
  assert.match(stylesSource, /data-v2-implementation-status="not-implemented"/);
  assert.match(startupViewSource, /renderV2StatusHelpButton/);
  assert.match(wrapperSource, /renderV2StatusHelpButton/);
});

test('V2 implementation-status docs describe the delivered B3 controls', () => {
  for (const expected of [
    'Implementation status',
    'Explain controls',
    'Explain values',
    'per-section `?`',
    'dashboard/data/v2ImplementationStatus.json',
    'v0.10.39',
  ]) {
    assert.match(implementationStatusDoc, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
