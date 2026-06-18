import {
  buildDefaultDebugPageState,
  DEBUG_CRONTAB_PENDING_WARNING,
  DEBUG_ROUTE,
  type DebugPageState,
  type DebugWorkerKey,
} from '../services/debugPageModel.ts';
import { buildRuntimeStatusProjectionFromState, type RuntimeStatusProjection } from '../services/runtimeStatusProjection.ts';
import { buildSchedulerHostMockStatus } from '../services/schedulerHostMock.ts';

export function renderDebugView(state: Record<string, unknown>, frontendVersion: string): string {
  const debugState = normalizeDebugPageState(state.debugPage);
  const statusProjection = buildRuntimeStatusProjectionFromState(state);
  return `
    <section class="view-grid debug-page" data-debug-page-route="${DEBUG_ROUTE}" aria-label="Debug Menu">
      <article class="card card--feature debug-page__hero">
        <header class="card__header">
          <div>
            <p class="card__code">DEBUG</p>
            <h2>Debug Menu</h2>
          </div>
          <span class="pill" data-debug-page-version>v${escapeHtml(frontendVersion)}</span>
        </header>
        <p class="card__copy">Debug route <code>${DEBUG_ROUTE}</code> is available as a lightweight operator surface. This page is browser-local until a later slice wires proof-backed backend actions.</p>
        <dl class="definition-list">
          <div><dt>Route</dt><dd>${DEBUG_ROUTE}</dd></div>
          <div data-debug-version-source><dt>Frontend version source</dt><dd>v${escapeHtml(frontendVersion)}</dd></div>
          <div><dt>Runtime claim</dt><dd>Debug route/sidebar only; no real crontab, production media/database, worker process, provider, or Raspberry proof.</dd></div>
          <div><dt>Opened</dt><dd>${escapeHtml(debugState.openedAt ?? 'Not recorded yet')}</dd></div>
        </dl>
      </article>
      ${renderStatePane(debugState)}
      ${renderPlaybackPane(debugState)}
      ${renderAddImagesPane(debugState)}
      ${renderCrontabPane(debugState)}
      ${renderSchedulerHostMockPane()}
      ${renderWorkerPane(debugState, 'regular', statusProjection)}
      ${renderWorkerPane(debugState, 'playback', statusProjection)}
      ${renderWorkerPane(debugState, 'screen', statusProjection)}
    </section>
  `;
}

function renderStatePane(debugState: DebugPageState): string {
  return renderDebugPane({
    code: 'STATE',
    title: 'Store and restore state',
    marker: 'data-debug-pane="state"',
    copy: 'Local planning surface for future recovery snapshots. Save/restore actions remain browser-local evidence until a later backend contract exists.',
    body: `
      <div class="debug-controls">
        <button class="button button--secondary" type="button" data-debug-action="save-state">Save state</button>
        <button class="button button--secondary" type="button" data-debug-action="restore-state">Restore state</button>
      </div>
      ${renderActionResult(debugState.actionResults['save-state'] ?? debugState.actionResults['restore-state'])}
    `,
  });
}

function renderPlaybackPane(debugState: DebugPageState): string {
  return renderDebugPane({
    code: 'PLAY',
    title: 'Test playback',
    marker: 'data-debug-pane="test-playback"',
    copy: 'Local test playback controls for proofable UI behavior. These buttons do not start native playback or real workers.',
    body: `
      <div class="debug-playback-layout">
        <div class="debug-controls">
          <button class="button button--secondary" type="button" data-debug-action="test-playback-run">Run</button>
          <button class="button button--secondary" type="button" data-debug-action="test-playback-pause">Pause</button>
          <button class="button button--secondary" type="button" data-debug-action="test-playback-stop">Stop</button>
        </div>
        <div class="debug-preview" data-debug-playback-preview>Preview/player placeholder — planned until a backend/native playback target is explicitly connected.</div>
      </div>
      ${renderActionResult(debugState.actionResults['test-playback'])}
    `,
  });
}

function renderAddImagesPane(debugState: DebugPageState): string {
  return renderDebugPane({
    code: 'MEDIA',
    title: 'Add images / process testing',
    marker: 'data-debug-pane="add-images"',
    copy: 'Single test entry point for isolated process testing. Added items are local test records only.',
    body: `
      <div class="debug-controls">
        <button class="button button--primary" type="button" data-debug-action="add-test-image">+ Add images here</button>
      </div>
      <p class="debug-proof-note">Isolation: test records use <code>isolated-test-only</code> storage and do not touch production media/database.</p>
      <ul class="debug-list" data-debug-test-media-list>
        ${debugState.testMedia.length === 0 ? '<li>No isolated test images registered yet.</li>' : debugState.testMedia.map((item) => `<li>${escapeHtml(item.displayName)} — ${escapeHtml(item.storage)} — ${escapeHtml(item.addedAt)}</li>`).join('')}
      </ul>
    `,
  });
}

function renderCrontabPane(debugState: DebugPageState): string {
  const parse = debugState.crontab.parseResult;
  return renderDebugPane({
    code: 'CRON',
    title: 'Crontab Setup',
    marker: 'data-debug-pane="crontab"',
    copy: 'Fake/read-only crontab safety surface. Real Raspberry crontab mutation is not available from this page.',
    body: `
      <textarea class="debug-crontab-input" data-debug-crontab-input rows="7">${escapeHtml(debugState.crontab.editableContent)}</textarea>
      <div class="debug-controls">
        <button class="button button--secondary" type="button" data-debug-action="parse-crontab">Read current crontab</button>
        <button class="button button--secondary" type="button" data-debug-action="pause-crontab">Pause app-owned entries</button>
        <button class="button button--secondary" type="button" data-debug-action="resume-crontab">Resume app-owned entries</button>
        <button class="button button--secondary" type="button" data-debug-action="install-crontab-pending">Install worker crontab intervals</button>
      </div>
      <p class="debug-warning" data-debug-crontab-warning>${escapeHtml(debugState.crontab.pendingWarning ?? DEBUG_CRONTAB_PENDING_WARNING)}</p>
      <dl class="definition-list" data-debug-crontab-status>
        <div><dt>Status</dt><dd>${escapeHtml(parse.status)}</dd></div>
        <div><dt>App-owned rows</dt><dd>${String(parse.appOwnedLines.length)}</dd></div>
        <div><dt>Unrelated rows preserved</dt><dd>${String(parse.unrelatedLines.length)}</dd></div>
        <div><dt>High-frequency interval</dt><dd>${parse.hasHighFrequencyInterval ? 'requires double confirmation' : 'not detected'}</dd></div>
      </dl>
    `,
  });
}


function renderSchedulerHostMockPane(): string {
  const status = buildSchedulerHostMockStatus();
  return renderDebugPane({
    code: 'SCHED',
    title: 'Scheduler Host Mock Status',
    marker: 'data-debug-pane="scheduler-host-mock"',
    copy: 'Mock-only scheduler-host status surface for future non-blocking screen worker proof design. It does not start workers or write crontab.',
    body: `
      <dl class="definition-list" data-scheduler-host-mock-status>
        <div><dt>Status</dt><dd>${escapeHtml(status.status)}</dd></div>
        <div><dt>Evidence</dt><dd>${escapeHtml(status.evidence)}</dd></div>
        <div><dt>Non-claim</dt><dd>${escapeHtml(status.nonClaim)}</dd></div>
      </dl>
      <ul class="debug-list">
        ${status.lanes.map((lane) => `<li>${escapeHtml(lane.label)} — non-blocking=${String(lane.nonBlocking)} — processSpawned=${String(lane.processSpawned)}</li>`).join('')}
      </ul>
    `,
  });
}

function renderWorkerPane(debugState: DebugPageState, key: DebugWorkerKey, statusProjection: RuntimeStatusProjection): string {
  const worker = debugState.workers[key];
  const projectionWorker = statusProjection.workers[key];
  return renderDebugPane({
    code: key.toUpperCase(),
    title: worker.label,
    marker: `data-debug-worker-pane="${key}"`,
    copy: 'Worker telemetry combines local mock/test data with the read-only runtime status projection. Manual run uses a safe local simulation and does not spawn a worker process.',
    body: `
      <dl class="definition-list">
        <div><dt>First called</dt><dd>${escapeHtml(worker.firstCalledAt ?? 'Never')}</dd></div>
        <div><dt>Last called</dt><dd>${escapeHtml(worker.lastCalledAt ?? 'Never')}</dd></div>
        <div><dt>Called count</dt><dd>${String(worker.calledCount)}</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(worker.currentStatus)}</dd></div>
        <div><dt>Projection status</dt><dd data-debug-worker-projection-status="${key}">${escapeHtml(projectionWorker.status)}</dd></div>
        <div><dt>Projection evidence</dt><dd>${escapeHtml(projectionWorker.evidence)}</dd></div>
        <div><dt>Evidence</dt><dd>${escapeHtml(worker.evidence)}</dd></div>
      </dl>
      <button class="button button--secondary" type="button" data-debug-worker-run-now="${key}">Run now</button>
    `,
  });
}

function renderDebugPane({ code, title, marker, copy, body }: { code: string; title: string; marker: string; copy: string; body: string }): string {
  return `
    <article class="card card--feature debug-pane" ${marker}>
      <header class="card__header debug-pane__header">
        <div>
          <p class="card__code">${escapeHtml(code)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <span class="pill">planned-safe</span>
      </header>
      <p class="card__copy">${escapeHtml(copy)}</p>
      ${body}
    </article>
  `;
}

function renderActionResult(result: unknown): string {
  if (!result || typeof result !== 'object') {
    return '<p class="debug-proof-note">No local action evidence yet.</p>';
  }
  const record = result as Record<string, unknown>;
  return `
    <dl class="definition-list debug-action-result">
      <div><dt>Action</dt><dd>${escapeHtml(record.action)}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(record.status)}</dd></div>
      <div><dt>Timestamp</dt><dd>${escapeHtml(record.timestamp)}</dd></div>
      <div><dt>Evidence</dt><dd>${escapeHtml(record.evidence)}</dd></div>
      <div><dt>Message</dt><dd>${escapeHtml(record.message)}</dd></div>
    </dl>
  `;
}

function normalizeDebugPageState(value: unknown): DebugPageState {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DebugPageState;
  }
  return buildDefaultDebugPageState();
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
