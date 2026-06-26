import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');
const sidebarSource = read('dashboard/data/v2OperatorSidebar.ts');
const centerPanelSource = read('dashboard/data/v2OperatorCenterPanel.ts');
const viewSource = read('dashboard/views/v2StartupOperatorMenuView.ts');
const wrapperSource = read('dashboard/views/v2OperatorPageWrapper.ts');
const statusRegistry = JSON.parse(read('dashboard/data/v2ImplementationStatus.json'));
const statusSource = read('dashboard/data/v2ImplementationStatus.ts');
const appSource = read('dashboard/app.ts');
const stylesSource = read('dashboard/styles.v2.css');

const expectedItems = [
  ['01', 'setup.sh', 'setup'],
  ['02', 'authentication.sh', 'authentication'],
  ['03', 'startup.sh', 'startup'],
  ['04', 'workers', 'workers'],
  ['05', 'troubleshooting', 'troubleshooting'],
  ['06', 'recovery', 'recovery'],
  ['07', 'PIR', 'pir'],
  ['08', 'PLAYBACK', 'playback'],
  ['09', 'REAL PLAYBACK', 'real-playback'],
];

const expectedBlockTypes = [
  'infoPanel',
  'statusCard',
  'actionList',
  'sectionGroup',
  'toggleGroup',
  'multiComboRow',
  'stageTable',
  'snapshotViewer',
  'snapshotList',
  'futurePlaceholder',
  'exampleList',
];

test('V2 sidebar schema contains exactly nine top-level routes with separate order metadata', () => {
  const itemMatches = [...sidebarSource.matchAll(/\{ order: '([^']+)', label: '([^']+)', route: '([^']+)'/g)];
  assert.equal(itemMatches.length, 9);
  assert.deepEqual(itemMatches.map((match) => [match[1], match[2], match[3]]), expectedItems);
  assert.doesNotMatch(sidebarSource, /label: '0[1-9] /);
});

test('V2 center-panel schema covers all nine routes and allowed typed block kinds', () => {
  for (const [, label, route] of expectedItems) {
    const routeKey = route.includes('-') ? `'${route}'` : route;
        assert.match(centerPanelSource, new RegExp(`${routeKey}: \\{[\\s\\S]+title: '${label.replace('.', '\\.').replace('/', '\\/')}'`));
  }

  for (const blockType of expectedBlockTypes) {
    assert.match(centerPanelSource, new RegExp(`'${blockType}'`), `missing block type ${blockType}`);
    assert.match(viewSource, new RegExp(`data-v2-block-type=\\"\\$\\{escapeHtml\\(block\\.type\\)\\}|data-v2-block-type=\\"${blockType}\\"|case '${blockType}'`), `view does not render ${blockType}`);
  }
});

test('V2 startup shell renders sidebar routes plus center-panel typed blocks instead of recursive child navigation', () => {
  assert.match(viewSource, /data-v2-left-sidebar/);
  assert.match(viewSource, /data-v2-sidebar-count/);
  assert.match(viewSource, /data-v2-sidebar-order/);
  assert.match(viewSource, /data-v2-sidebar-label/);
  assert.match(viewSource, /V2_OPERATOR_CENTER_PANEL_PAGES\[activeItem\.route\]/);
  assert.match(viewSource, /renderV2OperatorPageWrapper/);
  assert.match(wrapperSource, /data-v2-page-wrapper/);
  assert.match(wrapperSource, /data-v2-center-panel/);
  assert.match(wrapperSource, /v2-topbar-actions/);
  assert.match(wrapperSource, /toggle-v2-implementation-status/);
  assert.match(wrapperSource, /Explain controls/);
  assert.match(wrapperSource, /Explain values/);
  assert.match(viewSource, /data-v2-child-item/);
  assert.match(viewSource, /data-v2-interaction/);
  assert.doesNotMatch(viewSource, /VIEW_ORDER\.map/);
});

test('V2 center-panel keeps risky and future items visual-only or guarded', () => {
  const guardedLabels = ['recreate DB', 'install default crontab', 'clear stale locks', 'clear current logs', 'restore state snapshot'];
  for (const label of guardedLabels) {
    assert.match(centerPanelSource, new RegExp(`label: '${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]+interaction: 'guardedAction'`));
  }

  assert.match(centerPanelSource, /show statistics|statistics page/);
  assert.match(centerPanelSource, /status: 'v3'/);
  assert.match(centerPanelSource, /Examples are scenario\/rule seeds, not executable actions/);
  assert.match(centerPanelSource, /interaction: 'disabledPlaceholder'/);
});

test('V2 mode uses the startup shell without setting a V2 backend runtime header', () => {
  assert.match(appSource, /renderV2StartupOperatorMenuView\(v2OperatorSidebarRoute, state\.history, getHistoryCopyButtonLabel\(\), \{/);
  assert.match(appSource, /setDashboardRuntimeMode\(selectedMode === 'v2' \? null : selectedMode\)/);
  assert.match(appSource, /data-v2-sidebar-route/);
});

test('V2 shared infrastructure renders event history and status metadata foundation', () => {
  assert.equal(statusRegistry.scope, 'v2-only');
  assert.equal(statusRegistry.legend.done.color, 'green');
  assert.equal(statusRegistry.legend['in-progress'].color, 'yellow');
  assert.equal(statusRegistry.legend['not-implemented'].color, 'red');
  assert.ok(statusRegistry.elements.some((element) => element.id === 'v2.shared.event-history'));
  assert.ok(statusRegistry.elements.some((element) => element.id === 'v2.shared.page-wrapper'));
  assert.match(statusSource, /getV2ImplementationStatusElement/);
  assert.match(wrapperSource, /<h2>Event history<\/h2>/);
  assert.match(wrapperSource, /data-action="copy-history"/);
  assert.match(wrapperSource, /data-action="clear-history"/);
  assert.match(wrapperSource, /renderHistory\(history\)/);

  assert.ok(statusRegistry.elements.some((element) => element.id === 'v2.page.pir' && element.status === 'in-progress'));
  assert.ok(statusRegistry.elements.some((element) => element.id === 'v2.page.playback' && element.status === 'in-progress'));
  assert.ok(statusRegistry.elements.some((element) => element.id === 'v2.page.real-playback' && element.status === 'in-progress'));
  assert.match(centerPanelSource, /B5 Screen on-off simulation/);
  assert.match(centerPanelSource, /08 PLAYBACK shell/);
  assert.match(centerPanelSource, /09 REAL PLAYBACK integrated goal/);
  assert.match(centerPanelSource, /integrated layout/);
  assert.match(viewSource, /data-v2-status-id/);
  assert.match(viewSource, /data-v2-implementation-status/);
});

test('V2 styling stays in the feature stylesheet', () => {
  assert.match(stylesSource, /V2 startup shell: nine left-sidebar rows only/);
  assert.match(stylesSource, /V2 center panel: original sub-item typed blocks/);
  assert.match(stylesSource, /\.v2-operator-shell/);
  assert.match(stylesSource, /\.v2-center-panel/);
  assert.match(stylesSource, /\.v2-stage-table/);
  assert.match(stylesSource, /V2 shared infrastructure: wrapper status metadata and event history/);
  assert.match(stylesSource, /\.v2-event-history-panel/);
  assert.match(stylesSource, /\.v2-implementation-pill--in-progress/);
});
