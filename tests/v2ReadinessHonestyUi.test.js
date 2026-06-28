import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { getV2ReadinessGateDefinitions, getV2ReadinessGateViewModel } from '../dashboard/services/v2ReadinessService.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function renderRoute(route) {
  return renderV2StartupOperatorMenuView(route, [], 'copy all log', {
    runtimeState: createInitialState(),
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
  });
}

function esc(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('V2 readiness gate definitions keep all global rings blank until proof evidence exists', () => {
  const gates = getV2ReadinessGateDefinitions();
  assert.deepEqual(gates.map((gate) => gate.key), ['env', 'db', 'login']);

  for (const gate of gates) {
    const viewModel = getV2ReadinessGateViewModel(gate.key);
    assert.equal(viewModel.status, 'unknown');
    assert.equal(viewModel.displayStatus, 'blank');
    assert.equal(viewModel.stateLabel, 'not proven');
    assert.equal(viewModel.requiresProofRunner, true);
    assert.equal(viewModel.requiresLiveTarget, true);
    assert.equal(viewModel.claimAllowedBeforeProof, false);
    assert.match(viewModel.proofCommand, /^proof:/);
    assert.match(viewModel.reason, /ring stays blank/i);
  }
});

test('V2 page topbar renders proof-mapped blank readiness rings without complete claims', () => {
  const markup = renderRoute('setup');

  for (const gate of getV2ReadinessGateDefinitions()) {
    assert.match(markup, new RegExp(`data-readiness-type="${esc(gate.key)}"`));
    assert.match(markup, new RegExp(`data-v2-readiness-proof-command="${esc(gate.proofCommand)}"`));
  }

  assert.match(markup, /readiness-ring--blank/);
  assert.match(markup, /data-v2-readiness-status="unknown"/);
  assert.match(markup, /data-v2-readiness-claim-allowed-before-proof="false"/);
  assert.doesNotMatch(markup, /readiness-ring--complete/);
});

test('SETUP and REAL PLAYBACK render pre-proof readiness checklists mapped to proof commands', () => {
  for (const route of ['setup', 'real-playback']) {
    const markup = renderRoute(route);
    assert.match(markup, /data-v2-readiness-checklist/);
    assert.match(markup, /pre-proof readiness checklist/);
    assert.match(markup, /proof:v2-real-machine-readiness/);
    assert.match(markup, /proof:real-icloudpd-readiness/);
    assert.match(markup, /data-v2-readiness-claim-allowed-before-proof="false"/);
  }
});

test('09 REAL PLAYBACK disabled future controls explain why they are blocked', () => {
  const markup = renderRoute('real-playback');

  for (const expected of [
    'Disabled until recovery state, restart-check, and physical recovery evidence are current for this target.',
    'Disabled until PIR hardware input is proven on the Raspberry target; emulator signals do not unlock this control.',
    'Disabled until proof:v2-final-autonomous-bundle and physical evidence prove the final autonomous path.',
  ]) {
    assert.match(markup, new RegExp(esc(expected)));
  }

  assert.match(markup, /data-v2-disabled-reason=/);
  assert.match(markup, /data-v2-interaction="disabledPlaceholder"/);
  assert.doesNotMatch(markup, /data-v2-alert-text="SAVE STATE"/);
  assert.doesNotMatch(markup, /data-action="emulate-pir-signal"/);
});

test('V2 readiness honesty docs and status registry stay conservative', () => {
  const statusRegistry = JSON.parse(readFileSync('dashboard/data/v2ImplementationStatus.json', 'utf8'));
  const docs = readFileSync('docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md', 'utf8');
  const ids = new Set(statusRegistry.elements.map((element) => element.id));

  assert.ok(ids.has('v2.block.01.readiness-checklist'));
  assert.ok(ids.has('v2.block.09.readiness-checklist'));
  assert.equal(statusRegistry.elements.filter((element) => element.status === 'done').length, 0);
  assert.match(docs, /readiness rings/i);
  assert.match(docs, /proof:v2-real-machine-readiness/);
  assert.match(docs, /proof:real-icloudpd-readiness/);
});
