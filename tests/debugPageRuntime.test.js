import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function read(path) {
  return readFileSync(path, 'utf8');
}

function readJson(path) {
  return JSON.parse(read(path));
}

test('debug runtime workflow starts from immutable v0.8.139 baseline', () => {
  const doc = read('docs/50_audits_and_migrations/DEBUG_RUNTIME_IMPLEMENTATION_3X2ACR_20260618.md');
  assert.match(doc, /Baseline: v0\.8\.139, HEAD `4842973`/);
  assert.match(doc, /All Debug runtime actions in this batch are browser-local, fake\/test-backed, or mock-only/);
});

test('debug runtime proof command is available without marking planned rows runnable', () => {
  const packageJson = readJson('package.json');
  const registry = readJson('docs/40_backlog_and_tasks/overall_project_goal_registry.json');
  assert.equal(packageJson.scripts['proof:debug-page-runtime'], 'tsx --test tests/debugPageRuntime.test.js');
  const plannedDebugRows = registry.goals.filter((goal) => goal.category === 'debug_page' && goal.proof_command_state === 'PLANNED_COMMAND');
  assert.ok(plannedDebugRows.length >= 1);
  for (const goal of plannedDebugRows) {
    assert.doesNotMatch(goal.proof_command ?? '', /npm\s+run\s+proof:/);
  }
});
