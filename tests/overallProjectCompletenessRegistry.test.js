import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(path) {
  return readFileSync(path, 'utf8');
}

function readJson(path) {
  return JSON.parse(read(path));
}

test('overall project goal registry exists and uses normalized proof-safe statuses', () => {
  const registry = readJson('docs/40_backlog_and_tasks/overall_project_goal_registry.json');
  const enumDoc = read('docs/20_architecture_and_specs/reference/project_status_enum_registry.md');

  assert.equal(registry.schema_version, '1.0.0');
  assert.ok(registry.allowed_status_enums.includes('PROVEN'));
  assert.ok(registry.allowed_status_enums.includes('DOCS_ONLY'));
  assert.ok(registry.allowed_status_enums.includes('PLANNED'));
  assert.ok(enumDoc.includes('Do not convert `SPECIFIED`, `CONTRACTED`, `SCAFFOLDED`, `PLANNED`, or `DOCS_ONLY` into runtime implementation.'));

  for (const goal of registry.goals) {
    assert.ok(registry.allowed_status_enums.includes(goal.status_enum), `${goal.id} uses unknown status ${goal.status_enum}`);
    assert.ok(registry.allowed_proof_command_states.includes(goal.proof_command_state), `${goal.id} uses unknown proof state ${goal.proof_command_state}`);
  }
});

test('overall project goal registry keeps active source paths resolvable', () => {
  const registry = readJson('docs/40_backlog_and_tasks/overall_project_goal_registry.json');

  assert.ok(registry.goals.length >= 40, 'registry should include v1 gates, Debug page goals, and active backlog items');
  for (const goal of registry.goals) {
    assert.ok(Array.isArray(goal.source_paths) && goal.source_paths.length > 0, `${goal.id} must name source paths`);
    for (const sourcePath of goal.source_paths) {
      assert.ok(existsSync(sourcePath), `${goal.id} has missing source ${sourcePath}`);
    }
  }
});

test('non-implemented proof command rows do not masquerade as runnable proof commands', () => {
  const registry = readJson('docs/40_backlog_and_tasks/overall_project_goal_registry.json');
  const nonImplemented = registry.goals.filter((goal) => !['IMPLEMENTED_COMMAND', 'DOCS_AUDIT'].includes(goal.proof_command_state));

  assert.ok(nonImplemented.length > 0, 'registry should keep non-implemented/no-command rows explicit');
  for (const goal of nonImplemented) {
    assert.doesNotMatch(goal.proof_command, /npm\s+run\s+proof:/, `${goal.id} non-implemented command must not look runnable`);
  }
});

test('Debug page goals separate planned rows from implemented runtime claims', () => {
  const registry = readJson('docs/40_backlog_and_tasks/overall_project_goal_registry.json');
  const debugGoals = registry.goals.filter((goal) => goal.category === 'debug_page');

  assert.equal(debugGoals.length, 20);
  for (const goal of debugGoals) {
    if (goal.id === 'DBG-GOAL-020') continue;
    if (goal.runtime_implementation_claim) {
      assert.ok(['IMPLEMENTED', 'PROVEN'].includes(goal.status_enum), `${goal.id} runtime claim must be implemented/proven`);
      assert.equal(goal.proof_command_state, 'IMPLEMENTED_COMMAND', `${goal.id} runtime claim must use a runnable proof command`);
      assert.equal(goal.proof_status, 'PASSED', `${goal.id} runtime claim must have a passed proof`);
    } else {
      assert.notEqual(goal.status_enum, 'PROVEN', `${goal.id} must not claim proven runtime behavior without runtime implementation`);
    }
  }
});

test('project completeness OpenSpec covers all known data-gap contracts', () => {
  const doc = read('docs/20_architecture_and_specs/openspec/project_completeness_reporting_openspec.md');

  for (const expected of [
    'No single canonical overall goal registry',
    'Runtime proof artifacts may be absent from ZIP',
    'Older snapshots can conflict with active OpenSpec',
    'Debug page is docs-only',
    'Some proof commands are planned, not implemented',
    'Partial statuses are not machine-normalized',
    'NOT_ENOUGH_LIVE_PROOF_DATA',
    'PLANNED_COMMAND',
    'Strict proof completeness',
  ]) {
    assert.ok(doc.includes(expected), `missing expected contract text: ${expected}`);
  }
});
