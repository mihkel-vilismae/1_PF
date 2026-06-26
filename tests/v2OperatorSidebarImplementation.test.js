import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(path, 'utf8');
const sidebarSource = read('dashboard/data/v2OperatorSidebar.ts');
const viewSource = read('dashboard/views/v2StartupOperatorMenuView.ts');
const appSource = read('dashboard/app.ts');
const stylesSource = read('dashboard/styles.v2.css');

const expectedItems = [
  ['01', 'setup.sh', 'setup'],
  ['02', 'authentication.sh', 'authentication'],
  ['03', 'startup.sh', 'startup'],
  ['04', 'workers', 'workers'],
  ['05', 'troubleshooting', 'troubleshooting'],
  ['06', 'recovery', 'recovery'],
];

test('V2 sidebar schema contains exactly six top-level routes with separate order metadata', () => {
  const itemMatches = [...sidebarSource.matchAll(/\{ order: '([^']+)', label: '([^']+)', route: '([^']+)'/g)];
  assert.equal(itemMatches.length, 6);
  assert.deepEqual(itemMatches.map((match) => [match[1], match[2], match[3]]), expectedItems);
  assert.doesNotMatch(sidebarSource, /label: '0[1-6] /);
});

test('V2 startup shell renders its own sidebar instead of recursive child navigation', () => {
  assert.match(viewSource, /data-v2-left-sidebar/);
  assert.match(viewSource, /data-v2-sidebar-count/);
  assert.match(viewSource, /data-v2-sidebar-order/);
  assert.match(viewSource, /data-v2-sidebar-label/);
  assert.match(viewSource, /intentionally blank until its center-panel contract is implemented/);
  assert.doesNotMatch(viewSource, /VIEW_ORDER\.map/);
});

test('V2 mode uses the startup shell without setting a V2 backend runtime header', () => {
  assert.match(appSource, /renderV2StartupOperatorMenuView\(v2OperatorSidebarRoute\)/);
  assert.match(appSource, /setDashboardRuntimeMode\(selectedMode === 'v2' \? null : selectedMode\)/);
  assert.match(appSource, /data-v2-sidebar-route/);
});

test('V2 styling stays in the feature stylesheet', () => {
  assert.match(stylesSource, /V2 startup shell: six left-sidebar rows only/);
  assert.match(stylesSource, /\.v2-operator-shell/);
  assert.match(stylesSource, /\.v2-operator-nav__item--active/);
});
