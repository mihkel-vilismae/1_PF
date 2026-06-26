import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

const staleCurrentPhrases = [
  'Existing visual-only V2 page. Requested NEW AUTH card is not moved in this batch.',
  'Existing visual-only V2 page. Requested real setup cards are not moved in this batch.',
  'Visual-only in this slice. No backend action is wired from V2.',
  'Save/restore are visual-only.',
  'planned but not implemented in this route-shell batch',
];

test('V2 implementation-status JSON page summaries match current wired status', () => {
  const status = JSON.parse(read('dashboard/data/v2ImplementationStatus.json'));
  const summaries = status.elements.map((element) => element.summary || '').join('\n');

  for (const phrase of staleCurrentPhrases) {
    assert.doesNotMatch(summaries, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(summaries, /V2 Setup has wired Verify \.env and Database controls/);
  assert.match(summaries, /NEW AUTH card wired to the \/api\/auth\/new\/\*/);
  assert.match(summaries, /manual save\/load state endpoints plus autosave\/restart-check/);
  assert.match(summaries, /does not upload browser files or fabricate addresses/);
});

test('current V2 docs describe v0.10.64 implementation reality and live-proof boundary', () => {
  const implementation = read('docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md');
  const pages = read('docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md');
  const inventory = read('docs/20_architecture_and_specs/openspec/V2_ComponentInventory.md');
  const plan = read('docs/40_backlog_and_tasks/V2_NEXT_IMPLEMENTATION_PLAN_20260626.md');

  assert.match(implementation, /v0\.10\.65 DOCS\.2 status reconciliation/);
  assert.match(pages, /B12 proof gate is implemented but not live-passed/);
  assert.match(inventory, /The remaining boundary is live target-machine proof/);
  assert.match(plan, /LIVE\.1/);
  assert.match(plan, /LIVE\.2/);
});
