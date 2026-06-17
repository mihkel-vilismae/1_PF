import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('debug page openspec documents route, version, panes, crontab, worker, and proof boundaries', () => {
  const doc = read('docs/20_architecture_and_specs/openspec/debug_page_openspec.md');

  for (const expected of [
    '# Debug Page OpenSpec',
    '/debug',
    'Debug Menu',
    'Sidebar version tracker',
    'Top-right version tracker',
    'Store and restore state',
    'Test playback',
    '+ Add images here',
    'Crontab Setup',
    'Setting is not applied yet. Press Install into crontab.',
    'less than 10 seconds',
    'Regular Worker Debug Pane',
    'Playback Worker Debug Pane',
    'On/off Worker Debug Pane',
    'Estonian date/time formatting',
    'Run now',
    'TEST MODE FAST EMULATOR STATUS',
    'Real Raspberry crontab',
    'NOT CLAIMED'
  ]) {
    assert.ok(doc.includes(expected), `missing expected text: ${expected}`);
  }
});

test('debug page runbook explains operator safety and required controls', () => {
  const doc = read('docs/10_runbooks/debug_page_runbook.md');

  for (const expected of [
    '# Debug Page Runbook',
    'Debug',
    'Store and restore state',
    'Test playback',
    '+ Add images here',
    'Crontab Setup',
    'Pause app-owned crontab entries',
    'double confirmation',
    'Regular Worker Debug Pane',
    'Manual run',
    'Proof-honesty checklist'
  ]) {
    assert.ok(doc.includes(expected), `missing expected text: ${expected}`);
  }
});

test('debug page goal registry tracks stable goals and proof-risk status', () => {
  const doc = read('docs/40_backlog_and_tasks/debug_page_goal_registry.md');

  for (const expected of [
    '# Debug Page Goal Registry',
    'DBG-GOAL-001',
    'DBG-GOAL-020',
    'Add Crontab Setup pane',
    'Require double confirmation under 10 seconds',
    'Add worker manual Run now buttons',
    'proof',
    'Risk notes'
  ]) {
    assert.ok(doc.includes(expected), `missing expected text: ${expected}`);
  }
});

test('debug page docs are linked from navigation documents', () => {
  const openspecReadme = read('docs/20_architecture_and_specs/openspec/README.md');
  const runbookReadme = read('docs/10_runbooks/README.md');
  const toc = read('docs/table_of_contents.md');
  const rootReadme = read('README.md');

  assert.match(openspecReadme, /debug_page_openspec\.md/);
  assert.match(runbookReadme, /debug_page_runbook\.md/);
  assert.match(toc, /debug_page_openspec\.md/);
  assert.match(toc, /debug_page_runbook\.md/);
  assert.match(toc, /debug_page_goal_registry\.md/);
  assert.match(rootReadme, /v0\.8\.132 Debug Page docs coverage/);
});

test('debug page 2ACR review records non-claims and slice guidance', () => {
  const doc = read('docs/50_audits_and_migrations/DEBUG_PAGE_DOCS_2ACR_REVIEW_20260617.md');

  for (const expected of [
    '# Debug Page Documentation 2ACR Review',
    'Pass 1',
    'Pass 2',
    'no Debug page route implemented',
    'no crontab mutation implemented',
    'no Raspberry proof generated',
    'Fake-crontab parser/preview',
    'Real Raspberry crontab proof gate'
  ]) {
    assert.ok(doc.includes(expected), `missing expected text: ${expected}`);
  }
});
