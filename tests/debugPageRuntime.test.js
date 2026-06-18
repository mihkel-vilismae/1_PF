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

test('debug runtime proof command is available without leaving stale planned debug runtime rows runnable', () => {
  const packageJson = readJson('package.json');
  const registry = readJson('docs/40_backlog_and_tasks/overall_project_goal_registry.json');
  assert.equal(packageJson.scripts['proof:debug-page-runtime'], 'tsx --test tests/debugPageRuntime.test.js');
  const stalePlannedDebugRows = registry.goals.filter((goal) => goal.category === 'debug_page'
    && goal.id !== 'DBG-GOAL-020'
    && goal.proof_command_state === 'PLANNED_COMMAND');
  assert.deepEqual(stalePlannedDebugRows, []);
  const docsOnlyRow = registry.goals.find((goal) => goal.id === 'DBG-GOAL-020');
  assert.equal(docsOnlyRow.proof_command_state, 'DOCS_AUDIT');
});

import { VIEW_ORDER } from '../dashboard/shared/constants.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderDebugView } from '../dashboard/views/debugView.ts';

test('debug route and sidebar navigation are wired without removing existing views', () => {
  const ids = VIEW_ORDER.map((view) => view.id);
  assert.deepEqual(ids.slice(0, 7), ['A', 'B', 'C', 'D', 'E', 'WIN', 'RPI']);
  assert.equal(ids.at(-1), 'DEBUG');
  const appSource = read('dashboard/app.ts');
  assert.match(appSource, /DEBUG: renderDebugView\(state, __APP_VERSION__\)/);
  assert.match(appSource, /data-view="\$\{view\.id\}"/);
});

test('debug page renders route and non-claim boundary', () => {
  const markup = renderDebugView(createInitialState(), '0.8.142');
  assert.match(markup, /Debug Menu/);
  assert.match(markup, /data-debug-page-route="\/debug"/);
  assert.match(markup, /no real crontab, production media\/database, worker process, provider, or Raspberry proof/);
});

test('debug version tracker reuses the app version source in sidebar and page markup', () => {
  const appSource = read('dashboard/app.ts');
  const markup = renderDebugView(createInitialState(), '0.8.143');
  assert.match(appSource, /data-debug-sidebar-version/);
  assert.match(appSource, /data-debug-sidebar-version-value>v\$\{escapeHtml\(__APP_VERSION__\)\}/);
  assert.match(markup, /data-debug-page-version>v0\.8\.143/);
  assert.match(markup, /data-debug-version-source/);
});

test('debug page renders required pane shell without backend side effects', () => {
  const markup = renderDebugView(createInitialState(), '0.8.144');
  for (const expected of [
    'data-debug-pane="state"',
    'Store and restore state',
    'data-debug-pane="test-playback"',
    'Test playback',
    'data-debug-pane="add-images"',
    '+ Add images here',
    'data-debug-pane="crontab"',
    'Crontab Setup',
    'data-debug-worker-pane="regular"',
    'data-debug-worker-pane="playback"',
    'data-debug-worker-pane="screen"',
  ]) {
    assert.match(markup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(markup, /Real Raspberry crontab mutation is not available/);
  assert.match(markup, /does not spawn a worker process/);
});

import { addIsolatedTestMediaItem, buildDefaultDebugPageState } from '../dashboard/services/debugPageModel.ts';

test('debug add-images process registers isolated test media only', () => {
  const next = addIsolatedTestMediaItem(buildDefaultDebugPageState(), 'operator-selected.jpg');
  assert.equal(next.testMedia.length, 1);
  assert.equal(next.testMedia[0].displayName, 'operator-selected.jpg');
  assert.equal(next.testMedia[0].storage, 'isolated-test-only');
  assert.match(next.actionResults['add-test-image'].message, /Production media\/database state was not touched/);
  const markup = renderDebugView({ debugPage: next }, '0.8.145');
  assert.match(markup, /operator-selected\.jpg/);
  assert.match(markup, /isolated-test-only/);
});

test('debug add-images event handler records no production mutation', () => {
  const appSource = read('dashboard/app.ts');
  assert.match(appSource, /data-debug-action/);
  assert.match(appSource, /addIsolatedTestMediaItem/);
  assert.match(appSource, /productionMutation: false/);
});

import { runMockDebugWorker } from '../dashboard/services/debugPageModel.ts';

test('debug worker telemetry updates from mock Run now without spawning workers', () => {
  const next = runMockDebugWorker(buildDefaultDebugPageState(), 'regular');
  assert.equal(next.workers.regular.calledCount, 1);
  assert.equal(next.workers.regular.currentStatus, 'mock-succeeded');
  assert.match(next.workers.regular.evidence, /mock-only/);
  assert.match(next.actionResults['worker-regular-run-now'].message, /No worker process was spawned/);
  const markup = renderDebugView({ debugPage: next }, '0.8.146');
  assert.match(markup, /Called count<\/dt><dd>1/);
  assert.match(markup, /mock-succeeded/);
});

test('debug worker Run now handler is marked mock-only in app source', () => {
  const appSource = read('dashboard/app.ts');
  assert.match(appSource, /data-debug-worker-run-now/);
  assert.match(appSource, /runMockDebugWorker/);
  assert.match(appSource, /spawnedProcess: false/);
});

import { parseDebugCrontab, readFakeDebugCrontab, setDebugCrontabContent } from '../dashboard/services/debugPageModel.ts';

test('debug fake crontab parser separates app-owned and unrelated rows read-only', () => {
  const parse = parseDebugCrontab(['# unrelated row', '# PF_LOGIN_DEBUG_FAKE_CRONTAB_BEGIN', '*/1 * * * * run # pf-login:regular', '# PF_LOGIN_DEBUG_FAKE_CRONTAB_END'].join('\n'));
  assert.equal(parse.status, 'active');
  assert.equal(parse.appOwnedLines.length, 3);
  assert.equal(parse.unrelatedLines.length, 1);
  assert.equal(parse.hasHighFrequencyInterval, true);
});

test('debug crontab read action records fake/read-only evidence', () => {
  const state = setDebugCrontabContent(buildDefaultDebugPageState(), '*/1 * * * * run # pf-login:regular');
  const next = readFakeDebugCrontab(state);
  assert.equal(next.crontab.parseResult.status, 'malformed');
  assert.match(next.actionResults['read-current-crontab'].message, /No system crontab was read or written/);
  const appSource = read('dashboard/app.ts');
  assert.match(appSource, /systemCrontabTouched: false/);
  assert.match(appSource, /data-debug-crontab-input/);
});


import { pauseFakeDebugCrontab, resumeFakeDebugCrontab, stageFakeDebugCrontabInstall } from '../dashboard/services/debugPageModel.ts';

test('debug fake crontab pause and resume mutate only app-owned rows', () => {
  const content = ['# unrelated row', '# PF_LOGIN_DEBUG_FAKE_CRONTAB_BEGIN', '*/1 * * * * run # pf-login:regular', '# PF_LOGIN_DEBUG_FAKE_CRONTAB_END'].join('\n');
  const state = setDebugCrontabContent(buildDefaultDebugPageState(), content);
  const paused = pauseFakeDebugCrontab(state);
  assert.match(paused.crontab.editableContent, /# \*\/1 \* \* \* \* run # pf-login:regular/);
  assert.match(paused.crontab.editableContent, /# unrelated row/);
  assert.equal(paused.crontab.parseResult.unrelatedLines.length, 1);
  assert.match(paused.actionResults['pause-app-owned-crontab'].message, /Unrelated crontab rows were preserved/);
  const resumed = resumeFakeDebugCrontab(paused);
  assert.match(resumed.crontab.editableContent, /\n\*\/1 \* \* \* \* run # pf-login:regular/);
  assert.match(resumed.actionResults['resume-app-owned-crontab'].message, /no system crontab was written/i);
});

test('debug fake crontab install is blocked until double confirmation for high-frequency rows', () => {
  const blocked = stageFakeDebugCrontabInstall(buildDefaultDebugPageState());
  assert.equal(blocked.actionResults['install-worker-crontab-intervals'].status, 'blocked');
  assert.match(blocked.crontab.pendingWarning ?? '', /Double confirmation required/);
  assert.match(blocked.actionResults['install-worker-crontab-intervals'].message, /No system crontab was written/);
  const confirmed = stageFakeDebugCrontabInstall(buildDefaultDebugPageState(), { doubleConfirmed: true });
  assert.equal(confirmed.actionResults['install-worker-crontab-intervals'].status, 'succeeded');
  assert.match(confirmed.actionResults['install-worker-crontab-intervals'].message, /local Debug state only/);
});

test('debug fake crontab mutation handlers are explicitly fake and safety-gated', () => {
  const appSource = read('dashboard/app.ts');
  assert.match(appSource, /pauseFakeDebugCrontab/);
  assert.match(appSource, /resumeFakeDebugCrontab/);
  assert.match(appSource, /stageFakeDebugCrontabInstall/);
  assert.match(appSource, /unrelatedEntriesPreserved: true/);
  assert.match(appSource, /requiresDoubleConfirmation: true/);
  assert.match(appSource, /systemCrontabTouched: false/);
});


test('debug registry rows are upgraded to implemented only through local safe runtime proof', () => {
  const registry = readJson('docs/40_backlog_and_tasks/overall_project_goal_registry.json');
  const debugRuntimeRows = registry.goals.filter((goal) => /^DBG-GOAL-0(0[1-9]|1[0-9])$/.test(goal.id));
  assert.equal(debugRuntimeRows.length, 19);
  for (const goal of debugRuntimeRows) {
    assert.equal(goal.status_enum, 'IMPLEMENTED');
    assert.equal(goal.proof_command_state, 'IMPLEMENTED_COMMAND');
    assert.equal(goal.proof_command, 'npm run proof:debug-page-runtime');
    assert.equal(goal.proof_status, 'PASSED');
    assert.equal(goal.runtime_implementation_claim, true);
    assert.match(goal.notes, /browser-local\/fake\/mock only/);
  }
});

test('debug manual Run now proof stays mock-only for all worker panes', () => {
  let state = buildDefaultDebugPageState();
  state = runMockDebugWorker(state, 'regular');
  state = runMockDebugWorker(state, 'playback');
  state = runMockDebugWorker(state, 'screen');
  for (const key of ['regular', 'playback', 'screen']) {
    assert.equal(state.workers[key].calledCount, 1);
    assert.match(state.workers[key].evidence, /mock-only/);
    assert.match(state.actionResults[`worker-${key}-run-now`].message, /No worker process was spawned/);
  }
  const markup = renderDebugView({ debugPage: state }, '0.8.149');
  assert.match(markup, /data-debug-worker-run-now="regular"/);
  assert.match(markup, /data-debug-worker-run-now="playback"/);
  assert.match(markup, /data-debug-worker-run-now="screen"/);
});


test('debug worker panes render status projection without spawning workers', () => {
  const state = buildDefaultDebugPageState();
  const markup = renderDebugView({
    debugPage: state,
    truth: { realRunActive: false },
    statusByKey: { D1: 'disabled', D2: 'disabled', D3: 'disabled' },
    runningProcess: {
      playbackWorker: { status: 'Inactive', heartbeat: 'Never', summary: 'No playback activity' },
      screenWorker: { status: 'Inactive', heartbeat: 'Never', summary: 'No screen activity' },
    },
  }, '0.8.152');
  assert.match(markup, /data-debug-worker-projection-status="regular"/);
  assert.match(markup, /Projection evidence/);
  assert.match(markup, /read-only runtime status projection/);
  assert.match(markup, /does not spawn a worker process/);
});
