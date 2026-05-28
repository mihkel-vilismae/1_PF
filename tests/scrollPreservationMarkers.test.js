/*
 * Guards explicit scroll preservation markers on dashboard scrollable surfaces.
 * The static checks prevent the global scroll-jump fix from losing coverage later.
 * They cover app shell, modal, log, terminal, playback, and database surfaces.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('app shell marks global history, transit, and active view scroll containers', () => {
  const source = read('dashboard/app.ts');

  assert.match(source, /data-scroll-preserve="event-history-surface"/);
  assert.match(source, /data-scroll-preserve="transit-terminal-surface"/);
  assert.match(source, /data-scroll-preserve="main-view-\$\{state\.activeView\}"/);
});

test('modal renderer marks dialog and communication scroll containers', () => {
  const source = read('dashboard/services/renderers/modalRenderer.ts');

  assert.match(source, /data-scroll-preserve="\$\{escapeHtml\(modalScrollKey\)\}"/);
  assert.match(source, /data-scroll-preserve="new-auth-communication-panel"/);
  assert.match(source, /data-scroll-preserve="new-auth-communication-log"/);
});

test('view renderers mark log, scheduler, playback, and database scroll containers', () => {
  const combined = [
    read('dashboard/views/initView.ts'),
    read('dashboard/views/testView.ts'),
    read('dashboard/views/lastRunView.ts'),
    read('dashboard/views/runningProcessView.ts'),
    read('dashboard/views/osPlaybackView.ts'),
    read('dashboard/views/databaseViewerView.ts'),
  ].join('\n');

  assert.match(combined, /data-scroll-preserve="scheduler-endpoint-terminal-body"/);
  assert.match(combined, /data-scroll-preserve="log-B5"/);
  assert.match(combined, /data-scroll-preserve="log-B2-REAL_DOWNLOAD"/);
  assert.match(combined, /data-scroll-preserve="os-playback-\$\{escapeHtml\(platform\)\}-\$\{escapeHtml\(logKind\)\}-terminal"/);
  assert.match(combined, /data-scroll-preserve="database-object-grid"/);
  assert.match(combined, /data-scroll-preserve="database-table-shell"/);
  assert.match(combined, /data-scroll-preserve="database-activity-list"/);
});

test('result surface marks nested JSON payload blocks for scroll preservation', () => {
  const source = read('dashboard/services/renderers.ts');

  assert.match(source, /function buildResultPayloadScrollKey/);
  assert.match(source, /class="result-json-block" data-scroll-preserve=/);
  assert.match(source, /class="result-json" data-scroll-preserve=/);
});
