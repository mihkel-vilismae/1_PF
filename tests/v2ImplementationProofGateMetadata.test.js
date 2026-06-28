import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const statusRegistry = JSON.parse(readFileSync('dashboard/data/v2ImplementationStatus.json', 'utf8'));
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const packageScripts = new Set(Object.keys(packageJson.scripts ?? {}));

function byId(id) {
  const element = statusRegistry.elements.find((candidate) => candidate.id === id);
  assert.ok(element, `expected status element ${id}`);
  return element;
}

test('V2 status registry defines the pre-proofrunner claim policy', () => {
  assert.equal(statusRegistry.schemaVersion, 2);
  assert.equal(statusRegistry.proofGatePolicy.defaultClaimAllowedBeforeProof, false);
  assert.match(statusRegistry.proofGatePolicy.meaning, /no element may be claimed done\/live-ready/i);
  assert.ok(statusRegistry.proofGatePolicy.allowedPreProofClaims.includes('static-contract-present'));
  assert.ok(statusRegistry.proofGatePolicy.allowedPreProofClaims.includes('ui-shell-visible'));
});

test('every V2 status element has proof-gate metadata backed by package scripts', () => {
  for (const element of statusRegistry.elements) {
    assert.equal(typeof element.requiresProofRunner, 'boolean', `${element.id} requiresProofRunner must be boolean`);
    assert.equal(typeof element.requiresLiveTarget, 'boolean', `${element.id} requiresLiveTarget must be boolean`);
    assert.equal(element.claimAllowedBeforeProof, false, `${element.id} must not allow done/live-ready claims before proof evidence`);
    assert.equal(typeof element.proofCommand, 'string', `${element.id} proofCommand must be a string`);
    assert.match(element.proofCommand, /^proof:/, `${element.id} proofCommand must be a proof script`);
    assert.ok(packageScripts.has(element.proofCommand), `${element.id} proofCommand ${element.proofCommand} missing from package.json scripts`);
  }
});

test('target-dependent V2 surfaces require live target proof metadata', () => {
  for (const id of [
    'v2.block.01.verify-env',
    'v2.block.01.database-controls',
    'v2.page.authentication',
    'v2.page.startup',
    'v2.page.workers',
    'v2.page.playback',
    'v2.page.real-playback',
    'v2.block.09.gated-future-controls',
  ]) {
    const element = byId(id);
    assert.equal(element.requiresProofRunner, true, `${id} must require proofrunner evidence`);
    assert.equal(element.requiresLiveTarget, true, `${id} must require live target evidence`);
    assert.equal(element.claimAllowedBeforeProof, false, `${id} must stay blocked before proof`);
  }
});

test('static V2 surfaces stay contract-gated without pretending to require live target hardware', () => {
  for (const id of [
    'v2.shared.event-history',
    'v2.shared.page-wrapper',
    'v2.shared.status-help-metadata',
  ]) {
    const element = byId(id);
    assert.equal(element.requiresProofRunner, true, `${id} must still require proof evidence before done claims`);
    assert.equal(element.requiresLiveTarget, false, `${id} should not imply hardware/live target is required`);
    assert.equal(element.claimAllowedBeforeProof, false, `${id} must not become green from prose alone`);
  }
});
