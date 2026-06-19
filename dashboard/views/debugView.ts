import {
  buildDefaultDebugPageState,
  DEBUG_CRONTAB_PENDING_WARNING,
  DEBUG_ROUTE,
  type DebugPageState,
  type DebugWorkerKey,
} from '../services/debugPageModel.ts';
import { buildRuntimeStatusProjectionFromState, type RuntimeStatusProjection } from '../services/runtimeStatusProjection.ts';
import { buildSchedulerHostMockStatus } from '../services/schedulerHostMock.ts';

export type DebugPageElementType = 'page' | 'pane' | 'button' | 'modal';

export type DebugPageElementEntry = {
  id: string;
  type: DebugPageElementType;
  label: string;
  section: string;
  action?: string;
  marker?: string;
  reality: string;
  nonClaim: string;
};

export const DEBUG_PAGE_ELEMENTS: DebugPageElementEntry[] = [
  { id: 'pf.debug.page', type: 'page', label: 'Debug Menu', section: 'Debug', marker: 'data-debug-page-route=/debug', reality: 'browser-local/planned-safe', nonClaim: 'Does not prove backend/provider/worker/crontab/media/database behavior.' },
  { id: 'pf.debug.visuals.toolbar', type: 'pane', label: 'TOGGLE VISUALS', section: 'Debug / Top bar', marker: 'data-debug-visuals-toolbar=true', reality: 'browser-local/visual state', nonClaim: 'Changes Debug page presentation only; does not change product/runtime behavior.' },
  { id: 'pf.debug.visuals.color_schema_button', type: 'button', label: 'CLICK TO CHANGE COLOR SCHEMA [1,2,3]', section: 'Debug / Top bar', action: 'cycle-color-schema', reality: 'browser-local/visual state', nonClaim: 'Changes Debug page color schema only.' },
  { id: 'pf.debug.visuals.major_visual_button', type: 'button', label: 'CLICK TO IMPROVE LOOK BY MAKING MAJOR VISUAL CHANGES [1,2,3]', section: 'Debug / Top bar', action: 'cycle-major-visual-mode', reality: 'browser-local/visual state', nonClaim: 'Changes Debug page visual mode only.' },
  { id: 'pf.debug.help.pane', type: 'pane', label: 'Help', section: 'Debug / Help', marker: 'data-debug-pane=help', reality: 'browser-local/help', nonClaim: 'Explains boundaries only; no production action.' },
  { id: 'pf.debug.stack_status.pane', type: 'pane', label: 'Stack / Status', section: 'Debug / Stack', marker: 'data-debug-pane=stack-status', reality: 'browser-local/status summary', nonClaim: 'Shows declared frontend/runtime proof context only.' },
  { id: 'pf.debug.elements_list.pane', type: 'pane', label: 'Elements / Buttons list', section: 'Debug / Element Inventory', marker: 'data-debug-pane=elements-list', reality: 'browser-local/keybook projection', nonClaim: 'Lists element IDs; does not prove real runtime behavior.' },
  { id: 'pf.debug.auth_session.pane', type: 'pane', label: 'Auth / Session', section: 'Debug / Auth', marker: 'data-debug-pane=auth-session', reality: 'planned-safe/auth bridge', nonClaim: 'Does not submit credentials or read session secrets.' },
  { id: 'pf.debug.auth_session.login_using_env_button', type: 'button', label: 'Login using .env values', section: 'Debug / Auth', action: 'planned:new-auth-login-using-env', reality: 'disabled/planned-safe', nonClaim: 'Shown as planned bridge only; does not trigger provider login from Debug page.' },
  { id: 'pf.debug.auth_session.check_login_button', type: 'button', label: 'Check login', section: 'Debug / Auth', action: 'planned:new-auth-check-login', reality: 'disabled/planned-safe', nonClaim: 'Shown as planned bridge only; does not inspect session contents.' },
  { id: 'pf.debug.auth_session.verify_provider_button', type: 'button', label: 'Verify provider session', section: 'Debug / Auth', action: 'planned:new-auth-verify-provider-session', reality: 'disabled/planned-safe', nonClaim: 'Shown as planned bridge only; does not copy cookies or tokens.' },
  { id: 'pf.debug.state.pane', type: 'pane', label: 'Store and restore state', section: 'Debug / State', marker: 'data-debug-pane=state', reality: 'browser-local/planned-safe', nonClaim: 'No production runtime state, media, database, or restore target is written.' },
  { id: 'pf.debug.state.save_button', type: 'button', label: 'Save state', section: 'Debug / State', action: 'save-state', reality: 'browser-local/fake snapshot preview', nonClaim: 'Does not create production recovery snapshot.' },
  { id: 'pf.debug.state.restore_button', type: 'button', label: 'Restore state', section: 'Debug / State', action: 'restore-state', reality: 'browser-local/blocked preview', nonClaim: 'Does not mutate production restore target.' },
  { id: 'pf.debug.playback_test.pane', type: 'pane', label: 'Test playback', section: 'Debug / Playback Test', marker: 'data-debug-pane=test-playback', reality: 'placeholder/local-ui', nonClaim: 'Does not start native playback or real workers.' },
  { id: 'pf.debug.playback_test.run_button', type: 'button', label: 'Run', section: 'Debug / Playback Test', action: 'test-playback-run', reality: 'placeholder/local-ui', nonClaim: 'Does not start native playback.' },
  { id: 'pf.debug.playback_test.pause_button', type: 'button', label: 'Pause', section: 'Debug / Playback Test', action: 'test-playback-pause', reality: 'placeholder/local-ui', nonClaim: 'Does not pause native playback.' },
  { id: 'pf.debug.playback_test.stop_button', type: 'button', label: 'Stop', section: 'Debug / Playback Test', action: 'test-playback-stop', reality: 'placeholder/local-ui', nonClaim: 'Does not stop native playback.' },
  { id: 'pf.debug.media_test.pane', type: 'pane', label: 'Add images / process testing', section: 'Debug / Media Test', marker: 'data-debug-pane=add-images', reality: 'browser-local isolated test records', nonClaim: 'Does not touch production media/database.' },
  { id: 'pf.debug.media_test.add_images_button', type: 'button', label: '+ Add images here', section: 'Debug / Media Test', action: 'add-test-image', reality: 'isolated-test-only local record', nonClaim: 'Does not upload/copy production media.' },
  { id: 'pf.debug.crontab.pane', type: 'pane', label: 'Crontab Setup', section: 'Debug / Crontab', marker: 'data-debug-pane=crontab', reality: 'fake/read-only local crontab surface', nonClaim: 'Does not read or write system crontab.' },
  { id: 'pf.debug.crontab.read_button', type: 'button', label: 'Read current crontab', section: 'Debug / Crontab', action: 'parse-crontab', reality: 'fake/read-only parser', nonClaim: 'Does not read system crontab.' },
  { id: 'pf.debug.crontab.pause_button', type: 'button', label: 'Pause app-owned entries', section: 'Debug / Crontab', action: 'pause-crontab', reality: 'fake/local crontab mutation', nonClaim: 'Does not write system crontab.' },
  { id: 'pf.debug.crontab.resume_button', type: 'button', label: 'Resume app-owned entries', section: 'Debug / Crontab', action: 'resume-crontab', reality: 'fake/local crontab mutation', nonClaim: 'Does not write system crontab.' },
  { id: 'pf.debug.crontab.install_button', type: 'button', label: 'Install worker crontab intervals', section: 'Debug / Crontab', action: 'install-crontab-pending', reality: 'fake/staged local install', nonClaim: 'Does not install a real crontab.' },
  { id: 'pf.debug.scheduler_host_mock.pane', type: 'pane', label: 'Scheduler Host Mock Status', section: 'Debug / Scheduler', marker: 'data-debug-pane=scheduler-host-mock', reality: 'mock-only scheduler host status', nonClaim: 'Does not start workers or write crontab.' },
  { id: 'pf.debug.worker_regular.pane', type: 'pane', label: 'Regular Worker Debug Pane', section: 'Debug / Workers', marker: 'data-debug-worker-pane=regular', reality: 'mock/local worker telemetry', nonClaim: 'Does not spawn regular worker process.' },
  { id: 'pf.debug.worker_regular.run_button', type: 'button', label: 'Run now', section: 'Debug / Workers / Regular', action: 'worker-regular-run-now', reality: 'mock/local run simulation', nonClaim: 'Does not spawn regular worker process.' },
  { id: 'pf.debug.worker_playback.pane', type: 'pane', label: 'Playback Worker Debug Pane', section: 'Debug / Workers', marker: 'data-debug-worker-pane=playback', reality: 'mock/local worker telemetry', nonClaim: 'Does not spawn playback worker process.' },
  { id: 'pf.debug.worker_playback.run_button', type: 'button', label: 'Run now', section: 'Debug / Workers / Playback', action: 'worker-playback-run-now', reality: 'mock/local run simulation', nonClaim: 'Does not spawn playback worker process.' },
  { id: 'pf.debug.worker_screen.pane', type: 'pane', label: 'On/off Worker Debug Pane', section: 'Debug / Workers', marker: 'data-debug-worker-pane=screen', reality: 'mock/local worker telemetry', nonClaim: 'Does not spawn screen/on-off worker process.' },
  { id: 'pf.debug.worker_screen.run_button', type: 'button', label: 'Run now', section: 'Debug / Workers / Screen', action: 'worker-screen-run-now', reality: 'mock/local run simulation', nonClaim: 'Does not spawn screen/on-off worker process.' },
  { id: 'pf.debug.element_id_modal', type: 'modal', label: 'Element ID modal', section: 'Debug / Element Inventory', marker: 'data-debug-element-modal', reality: 'browser-local inspector', nonClaim: 'Only displays metadata; does not trigger underlying element behavior.' },
];

const elementById = new Map(DEBUG_PAGE_ELEMENTS.map((entry) => [entry.id, entry]));

export function renderDebugView(state: Record<string, unknown>, frontendVersion: string): string {
  const debugState = normalizeDebugPageState(state.debugPage);
  const statusProjection = buildRuntimeStatusProjectionFromState(state);
  return `
    <section class="view-grid debug-page debug-page--schema-${debugState.visuals?.colorSchema ?? 1} debug-page--visual-${debugState.visuals?.majorVisualMode ?? 1}" data-debug-page-route="${DEBUG_ROUTE}" data-ui-element-id="pf.debug.page" data-debug-color-schema="${debugState.visuals?.colorSchema ?? 1}" data-debug-visual-mode="${debugState.visuals?.majorVisualMode ?? 1}" aria-label="Debug Menu">
      ${renderHeroPane(debugState, frontendVersion)}
      ${renderHelpPane()}
      ${renderStackStatusPane(frontendVersion, statusProjection)}
      ${renderElementsListPane()}
      ${renderAuthSessionPane()}
      ${renderStatePane(debugState)}
      ${renderPlaybackPane(debugState)}
      ${renderAddImagesPane(debugState)}
      ${renderCrontabPane(debugState)}
      ${renderSchedulerHostMockPane()}
      ${renderWorkerPane(debugState, 'regular', statusProjection)}
      ${renderWorkerPane(debugState, 'playback', statusProjection)}
      ${renderWorkerPane(debugState, 'screen', statusProjection)}
      ${renderElementMetadataModal(debugState)}
    </section>
  `;
}

function renderHeroPane(debugState: DebugPageState, frontendVersion: string): string {
  return `
    <article class="card card--feature debug-page__hero" data-ui-element-id="pf.debug.page.hero">
      <header class="card__header">
        <div>
          <p class="card__code">DEBUG</p>
          <h2>Debug Menu</h2>
        </div>
        <div class="debug-topbar">
          <span class="pill" data-debug-page-version>v${escapeHtml(frontendVersion)}</span>
          ${renderVisualToolbar(debugState)}
        </div>
      </header>
      <p class="card__copy">Debug route <code>${DEBUG_ROUTE}</code> is available as a lightweight operator surface. This page is browser-local until a later slice wires proof-backed backend actions.</p>
      <dl class="definition-list">
        <div><dt>Route</dt><dd>${DEBUG_ROUTE}</dd></div>
        <div data-debug-version-source><dt>Frontend version source</dt><dd>v${escapeHtml(frontendVersion)}</dd></div>
        <div><dt>Runtime claim</dt><dd>Debug route/sidebar only; no real crontab, production media/database, worker process, provider, or Raspberry proof.</dd></div>
        <div><dt>Opened</dt><dd>${escapeHtml(debugState.openedAt ?? 'Not recorded yet')}</dd></div>
      </dl>
    </article>
  `;
}


function renderVisualToolbar(debugState: DebugPageState): string {
  return `
    <div class="debug-visual-toolbar" data-debug-visuals-toolbar="true" data-ui-element-id="pf.debug.visuals.toolbar">
      <span class="debug-visual-toolbar__label">TOGGLE VISUALS</span>
      <span class="debug-button-with-marker">
        <button class="button button--secondary" type="button" data-debug-visual-action="cycle-color-schema" data-ui-element-id="pf.debug.visuals.color_schema_button" aria-label="CLICK TO CHANGE COLOR SCHEMA [1,2,3]" title="CLICK TO CHANGE COLOR SCHEMA [1,2,3]">CLICK TO CHANGE COLOR SCHEMA [${debugState.visuals?.colorSchema ?? 1},2,3]</button>
        ${renderElementMarker('pf.debug.visuals.color_schema_button')}
      </span>
      <span class="debug-button-with-marker">
        <button class="button button--secondary" type="button" data-debug-visual-action="cycle-major-visual-mode" data-ui-element-id="pf.debug.visuals.major_visual_button" aria-label="CLICK TO IMPROVE LOOK BY MAKING MAJOR VISUAL CHANGES [1,2,3]" title="CLICK TO IMPROVE LOOK BY MAKING MAJOR VISUAL CHANGES [1,2,3]">CLICK TO IMPROVE LOOK BY MAKING MAJOR VISUAL CHANGES [${debugState.visuals?.majorVisualMode ?? 1},2,3]</button>
        ${renderElementMarker('pf.debug.visuals.major_visual_button')}
      </span>
    </div>
  `;
}

function renderHelpPane(): string {
  return renderDebugPane({
    elementId: 'pf.debug.help.pane',
    code: 'HELP',
    title: 'Help',
    marker: 'data-debug-pane="help"',
    copy: 'Explains this Debug page, proof-status language, and the inspectable * element-ID marker before any deeper control panes.',
    body: `
      <ul class="debug-list">
        <li><strong>Purpose:</strong> inspect local Debug state, proof boundaries, element IDs, and safe mock controls.</li>
        <li><strong>Safety:</strong> this page must not mutate production media/database, write real crontab, leak secrets, or claim real provider/device proof.</li>
        <li><strong>PASS/BLOCKED/FAILED:</strong> PASS means the scoped proof passed; BLOCKED can be honest when real inputs are missing; FAILED means the command or contract failed.</li>
        <li><strong>* marker:</strong> hover to see a stable element ID; click to open a local metadata dialog.</li>
      </ul>
    `,
  });
}

function renderStackStatusPane(frontendVersion: string, statusProjection: RuntimeStatusProjection): string {
  return renderDebugPane({
    elementId: 'pf.debug.stack_status.pane',
    code: 'STACK',
    title: 'Stack / Status',
    marker: 'data-debug-pane="stack-status"',
    copy: 'Read-only stack snapshot for the Debug page. It shows declared frontend/runtime proof context before operator controls.',
    body: `
      <dl class="definition-list" data-debug-stack-status>
        <div><dt>Project</dt><dd>PF_login / PhotoFrame</dd></div>
        <div><dt>Frontend version</dt><dd>v${escapeHtml(frontendVersion)}</dd></div>
        <div><dt>Route</dt><dd>${DEBUG_ROUTE}</dd></div>
        <div><dt>Mode</dt><dd>debug / browser-local / proof-safe</dd></div>
        <div><dt>Runtime projection workers</dt><dd>${escapeHtml(Object.values(statusProjection.workers).map((worker) => `${worker.label}: ${worker.status}`).join(' | '))}</dd></div>
        <div><dt>Available pane count</dt><dd>${String(DEBUG_PAGE_ELEMENTS.filter((entry) => entry.type === 'pane').length)}</dd></div>
      </dl>
    `,
  });
}

function renderElementsListPane(): string {
  return renderDebugPane({
    elementId: 'pf.debug.elements_list.pane',
    code: 'ELIST',
    title: 'Elements / Buttons list',
    marker: 'data-debug-pane="elements-list"',
    copy: 'Repo-keybook-backed list of major Debug panes and buttons. IDs are intended to stay stable even when labels change.',
    body: `
      <div class="debug-elements-list" data-debug-elements-list>
        ${DEBUG_PAGE_ELEMENTS.filter((entry) => entry.type !== 'modal').map((entry) => `
          <div class="debug-elements-list__row" data-debug-element-row="${escapeHtml(entry.id)}">
            <code>${escapeHtml(entry.id)}</code>
            <span>${escapeHtml(entry.type)}</span>
            <strong>${escapeHtml(entry.label)}</strong>
            <small>${escapeHtml(entry.reality)}</small>
          </div>
        `).join('')}
      </div>
    `,
  });
}

function renderAuthSessionPane(): string {
  return renderDebugPane({
    elementId: 'pf.debug.auth_session.pane',
    code: 'AUTH',
    title: 'Auth / Session',
    marker: 'data-debug-pane="auth-session"',
    copy: 'Planned-safe bridge to existing NEW AUTH actions. Buttons are visible as Debug-page targets, but disabled here until a backend/session proof contract is wired.',
    body: `
      <div class="debug-controls debug-controls--auth">
        ${renderPlannedButton('Login using .env values', 'pf.debug.auth_session.login_using_env_button')}
        ${renderPlannedButton('Check login', 'pf.debug.auth_session.check_login_button')}
        ${renderPlannedButton('Verify provider session', 'pf.debug.auth_session.verify_provider_button')}
      </div>
      <p class="debug-proof-note">Secret boundary: Debug page must not print Apple ID, password, 2FA, cookies, tokens, or session file contents. Future proof should report sanitized session presence/usability only.</p>
    `,
  });
}

function renderStatePane(debugState: DebugPageState): string {
  return renderDebugPane({
    elementId: 'pf.debug.state.pane',
    code: 'STATE',
    title: 'Store and restore state',
    marker: 'data-debug-pane="state"',
    copy: 'Local planning surface for future recovery snapshots. Save/restore actions remain browser-local evidence until a later backend contract exists.',
    body: `
      <div class="debug-controls">
        ${renderDebugActionButton('Save state', 'save-state', 'pf.debug.state.save_button', 'button button--secondary')}
        ${renderDebugActionButton('Restore state', 'restore-state', 'pf.debug.state.restore_button', 'button button--secondary')}
      </div>
      ${renderActionResult(debugState.actionResults['save-state'] ?? debugState.actionResults['restore-state'])}
    `,
  });
}

function renderPlaybackPane(debugState: DebugPageState): string {
  return renderDebugPane({
    elementId: 'pf.debug.playback_test.pane',
    code: 'PLAY',
    title: 'Test playback',
    marker: 'data-debug-pane="test-playback"',
    copy: 'Local test playback controls for proofable UI behavior. These buttons do not start native playback or real workers.',
    body: `
      <div class="debug-playback-layout">
        <div class="debug-controls">
          ${renderDebugActionButton('Run', 'test-playback-run', 'pf.debug.playback_test.run_button', 'button button--secondary')}
          ${renderDebugActionButton('Pause', 'test-playback-pause', 'pf.debug.playback_test.pause_button', 'button button--secondary')}
          ${renderDebugActionButton('Stop', 'test-playback-stop', 'pf.debug.playback_test.stop_button', 'button button--secondary')}
        </div>
        <div class="debug-preview" data-debug-playback-preview>Preview/player placeholder — planned until a backend/native playback target is explicitly connected.</div>
      </div>
      ${renderActionResult(debugState.actionResults['test-playback'])}
    `,
  });
}

function renderAddImagesPane(debugState: DebugPageState): string {
  return renderDebugPane({
    elementId: 'pf.debug.media_test.pane',
    code: 'MEDIA',
    title: 'Add images / process testing',
    marker: 'data-debug-pane="add-images"',
    copy: 'Single test entry point for isolated process testing. Added items are local test records only.',
    body: `
      <div class="debug-controls">
        ${renderDebugActionButton('+ Add images here', 'add-test-image', 'pf.debug.media_test.add_images_button', 'button button--primary')}
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
    elementId: 'pf.debug.crontab.pane',
    code: 'CRON',
    title: 'Crontab Setup',
    marker: 'data-debug-pane="crontab"',
    copy: 'Fake/read-only crontab safety surface. Real Raspberry crontab mutation is not available from this page.',
    body: `
      <textarea class="debug-crontab-input" data-debug-crontab-input rows="7">${escapeHtml(debugState.crontab.editableContent)}</textarea>
      <div class="debug-controls">
        ${renderDebugActionButton('Read current crontab', 'parse-crontab', 'pf.debug.crontab.read_button', 'button button--secondary')}
        ${renderDebugActionButton('Pause app-owned entries', 'pause-crontab', 'pf.debug.crontab.pause_button', 'button button--secondary')}
        ${renderDebugActionButton('Resume app-owned entries', 'resume-crontab', 'pf.debug.crontab.resume_button', 'button button--secondary')}
        ${renderDebugActionButton('Install worker crontab intervals', 'install-crontab-pending', 'pf.debug.crontab.install_button', 'button button--secondary')}
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
    elementId: 'pf.debug.scheduler_host_mock.pane',
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
  const paneId = `pf.debug.worker_${key}.pane`;
  const runButtonId = `pf.debug.worker_${key}.run_button`;
  return renderDebugPane({
    elementId: paneId,
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
      <span class="debug-button-with-marker">
        <button class="button button--secondary" type="button" data-debug-worker-run-now="${key}" data-ui-element-id="${runButtonId}">Run now</button>
        ${renderElementMarker(runButtonId)}
      </span>
    `,
  });
}

function renderDebugPane({ elementId, code, title, marker, copy, body }: { elementId: string; code: string; title: string; marker: string; copy: string; body: string }): string {
  return `
    <article class="card card--feature debug-pane" ${marker} data-ui-element-id="${elementId}">
      <header class="card__header debug-pane__header">
        <div>
          <p class="card__code">${escapeHtml(code)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <div class="debug-pane__badges">
          <span class="pill">planned-safe</span>
          ${renderElementMarker(elementId)}
        </div>
      </header>
      <p class="card__copy">${escapeHtml(copy)}</p>
      ${body}
    </article>
  `;
}

function renderDebugActionButton(label: string, action: string, elementId: string, className: string): string {
  return `
    <span class="debug-button-with-marker">
      <button class="${escapeHtml(className)}" type="button" data-debug-action="${escapeHtml(action)}" data-ui-element-id="${escapeHtml(elementId)}">${escapeHtml(label)}</button>
      ${renderElementMarker(elementId)}
    </span>
  `;
}

function renderPlannedButton(label: string, elementId: string): string {
  return `
    <span class="debug-button-with-marker">
      <button class="button button--secondary" type="button" disabled aria-disabled="true" data-debug-auth-action="planned" data-ui-element-id="${escapeHtml(elementId)}">${escapeHtml(label)}</button>
      ${renderElementMarker(elementId)}
    </span>
  `;
}

function renderElementMarker(elementId: string): string {
  const entry = elementById.get(elementId);
  const title = entry ? `${entry.id} — ${entry.label}` : elementId;
  return `<button class="debug-element-marker" type="button" data-debug-element-marker="${escapeHtml(elementId)}" data-ui-element-id="${escapeHtml(elementId)}.marker" title="${escapeHtml(title)}" aria-label="Show element ID ${escapeHtml(elementId)}">*</button>`;
}

function renderElementMetadataModal(debugState: DebugPageState): string {
  const selectedId = debugState.selectedElementId;
  if (!selectedId) return '';
  const entry = elementById.get(selectedId);
  return `
    <div class="debug-element-modal" data-debug-element-modal data-ui-element-id="pf.debug.element_id_modal" role="dialog" aria-modal="true" aria-label="Debug element ID metadata">
      <div class="debug-element-modal__panel">
        <header class="card__header">
          <div>
            <p class="card__code">ELEMENT ID</p>
            <h3>${escapeHtml(entry?.label ?? selectedId)}</h3>
          </div>
          <button class="button button--secondary" type="button" data-debug-element-modal-close data-ui-element-id="pf.debug.element_id_modal.close_button">Close</button>
        </header>
        <dl class="definition-list">
          <div><dt>ID</dt><dd><code>${escapeHtml(selectedId)}</code></dd></div>
          <div><dt>Type</dt><dd>${escapeHtml(entry?.type ?? 'unknown')}</dd></div>
          <div><dt>Section</dt><dd>${escapeHtml(entry?.section ?? 'unknown')}</dd></div>
          <div><dt>Action</dt><dd>${escapeHtml(entry?.action ?? 'none')}</dd></div>
          <div><dt>Reality</dt><dd>${escapeHtml(entry?.reality ?? 'unknown')}</dd></div>
          <div><dt>Non-claim</dt><dd>${escapeHtml(entry?.nonClaim ?? 'No metadata entry found.')}</dd></div>
        </dl>
      </div>
    </div>
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
