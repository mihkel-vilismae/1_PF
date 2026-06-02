/*
 * Renders View A initialization cards for env, auth, database, and scheduler.
 * Scheduler UI stays backend-backed and keeps Windows CronEmulator controls local
 * to the selected scheduler target.
 */
import { statusBadge, renderLogEntries, renderResultSurface, renderStepList, renderSourceBadge } from '../services/renderers.ts';
import { getAuthButtonCopy, getAuthButtonStatusHelp, getAuthButtonStatusLabel } from '../data/authButtonStatusCopy.ts';
import {
  getSchedulerEmulatorButtonCopy,
  getSchedulerEmulatorButtonStatusHelp,
  getSchedulerEmulatorButtonStatusLabel,
  normalizeSchedulerEmulatorButtonStatus,
} from '../data/schedulerEmulatorStatusCopy.ts';
import {
  getOperationSupportLevel,
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
  SCHEDULER_TARGETS,
} from '../../shared/schedulerPlatformCapabilities.ts';

// View A owns this card as 1A-AUTH. Some data-action values still contain "b1" because
// they are compatibility action IDs used by existing tests/runtime wiring from the old B1 auth card.
// Do not add new B1-named actions; route new auth-preflight behavior through this adapter list first.
const AUTH_BUTTONS = Object.freeze([
  { action: 'verify-icloudpd', label: 'Verify icloudpd', variant: 'secondary' },
  { action: 'check-login', label: 'Check login', variant: 'secondary' },
  { action: 'login-using-env', label: 'Login using .env values', variant: 'primary' },
  { action: 'logout-b1-auth', label: 'Logout', variant: 'danger' },
  { action: 'refresh-b1-auth-status', label: 'Refresh status', variant: 'secondary' },
  { action: 'reset-b1-auth', label: 'Reset local attempt', variant: 'secondary' },
  { action: 'test-b1-login-download-one', label: 'TEST LOGIN BY DOWNLOADING A SINGLE FILE', variant: 'secondary' },
]);

const AUTH_2FA_BUTTON = Object.freeze({ action: 'submit-b1-2fa', label: 'Submit 2FA', variant: 'primary' });

const SCHEDULER_EMULATOR_BUTTONS = Object.freeze([
  { action: 'check-emulator-scheduler', variant: 'secondary' },
  { action: 'run-emulator', variant: 'primary' },
  { action: 'stop-emulator', variant: 'secondary' },
  { action: 'install-crontab', variant: 'secondary' },
  { action: 'get-active-crontab', variant: 'secondary' },
]);

const NEW_AUTH_BUTTONS = Object.freeze([
  { action: 'new-auth-verify-icloudpd', label: 'Verify iCloudPD install', variant: 'secondary' },
  { action: 'new-auth-verify-provider-session', label: 'Verify with iCloudPD', variant: 'primary' },
  { action: 'new-auth-login-using-env', label: 'Login using .env values', variant: 'primary' },
  { action: 'new-auth-check-login', label: 'Check login', variant: 'secondary' },
  { action: 'new-auth-logout-session', label: 'Log out and remove existing session', variant: 'danger' },
  { action: 'new-auth-session-files', label: 'Show auth/session paths and files', variant: 'secondary' },
  { action: 'new-auth-generate-artifact-pack', label: 'Generate auth evidence pack', variant: 'secondary' },
  { action: 'new-auth-list-artifact-packs', label: 'List auth evidence packs', variant: 'secondary' },
]);

const WHOLE_LOGIC_TEST_MODE_BUTTON_LABEL = 'INSTALL CRONTAB/EMULATOR, CALLING REGULAR WORKER EVERY 1 MINUTES, PLAYBACK WORKER EVERY 30sec, screen on-off worker EVERY 2 MINUTES, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD)';

const WHOLE_LOGIC_TEST_MODE_RUNTIME_KEYS = Object.freeze([
  'PRESS [q] to shut down regular worker process.',
  'PRESS [w] to shut down playback worker process.',
  'PRESS [e] to shut down screen-on-off worker process.',
  'PRESS [r] to stop all cronjobs - so that the processes would not autorun',
  'PRESS [t] to stop all running processes related to the photoframe app (but not the photoframe dashboard itself!) - the database, playaback, everything. this also stops cronjobs. kill them using a signal that imitates a sudden power-outage. they can leave unfisinshed state etc, it must imitate sudden poweroff',
  'PRESS [t] again to imitate a power on and enable all the cronjobs',
]);

const WHOLE_LOGIC_TEST_MODE_SAFETY_LIMITS = Object.freeze([
  'Only stop/terminate worker processes spawned and tracked by this TEST mode controller.',
  'Do not kill the dashboard process.',
  'Do not kill arbitrary Node/Python/SQLite/system processes.',
]);

// Renders the full View A page from runtime-truth state and selected dashboard mode.
export function renderInitView(state, dashboardVisualMode = null) {
  const schedulerCapability = state.initCapabilities?.scheduler ?? null;
  const installSupportLevel = getOperationSupportLevel(schedulerCapability, SCHEDULER_OPERATION_SUPPORT.install);
  const statusSupportLevel = getOperationSupportLevel(schedulerCapability, SCHEDULER_OPERATION_SUPPORT.status);
  const printSupportLevel = getOperationSupportLevel(schedulerCapability, SCHEDULER_OPERATION_SUPPORT.print);

  return `
    <section class="view-page">
      <div class="view-hero">
        <div>
          <p class="eyebrow">A — Init</p>
          <h2>Prepare the system before any test or real run.</h2>
          <p class="hero-copy">This view now calls the documented init endpoints for environment, database, and scheduler work, while the rest of the dashboard remains prototype-driven.</p>
        </div>
        <div class="hero-pill-group">
          <span class="hero-pill hero-pill--success">Backend contract wired</span>
          <span class="hero-pill">Backend still required</span>
        </div>
      </div>

      ${renderWholeLogicWithoutLoginPanel(dashboardVisualMode)}

      <div class="section-grid section-grid--two">
        ${renderCard('1A', 'Verify .env', state, '1A', '<button class="button button--primary" data-action="verify-env">Run</button>', 'Validate required configuration keys and render the backend response payload directly in this card.')}
        ${renderAuthCard(state)}
      ${renderNewAuthCard(state, dashboardVisualMode)}
        ${renderCard(
          '2A',
          'Database controls',
          state,
          '2A',
          `
            <button class="button button--secondary" data-action="check-db">Check DB</button>
            <button class="button button--secondary" data-action="inspect-db">Inspect DB</button>
            <button class="button button--danger" data-action="delete-db">Delete DB</button>
            <button class="button button--secondary" data-action="recreate-db">Recreate DB</button>
          `,
          'Database actions now target the documented init endpoints and should surface backend summaries or failures here.',
        )}
      </div>

      ${renderSchedulerCard(state, schedulerCapability, { installSupportLevel, statusSupportLevel, printSupportLevel })}

    </section>
  `;
}

// Renders the Group 1 Test Mode contract panel without starting worker or cron behavior.
function renderWholeLogicWithoutLoginPanel(dashboardVisualMode) {
  if (dashboardVisualMode !== 'test') {
    return '';
  }

  const runtimeKeyRows = WHOLE_LOGIC_TEST_MODE_RUNTIME_KEYS
    .map((entry) => `<li><code>${escapeHtml(entry)}</code></li>`)
    .join('');
  const safetyRows = WHOLE_LOGIC_TEST_MODE_SAFETY_LIMITS
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join('');

  return `
    <article class="card card--feature card--mock card--pending" aria-label="RUN whole logic without logging in">
      <header class="card__header">
        <div>
          <p class="card__code">1A-TEST-WHOLE-LOGIC</p>
          <h3>RUN whole logic without logging in</h3>
        </div>
        <div class="card__header-tags">${renderSourceBadge('mock', 'TEST MODE ONLY')}</div>
        ${statusBadge('disabled')}
      </header>
      <p class="card__copy">Group 1 adds the operator-visible contract only. Group 2 will wire the safe Test Mode scheduler/emulator boundary without changing production backend behavior or real iCloudPD login.</p>
      <div class="button-row">
        <button class="button button--secondary" data-action="run-whole-logic-test-mode" disabled aria-disabled="true" title="Planned for Group 2 backend wiring">${escapeHtml(WHOLE_LOGIC_TEST_MODE_BUTTON_LABEL)}</button>
      </div>
      <section class="selector-card selector-card--mock" aria-label="Native fullscreen power control instructions">
        <p class="selector-card__label">Native fullscreen control text</p>
        <ul class="stage-list">${runtimeKeyRows}</ul>
      </section>
      <section class="selector-card selector-card--mock" aria-label="Safe process termination boundary">
        <p class="selector-card__label">Safe power-outage simulation boundary</p>
        <ul class="stage-list">${safetyRows}</ul>
      </section>
    </article>
  `;
}

// Renders scheduler target selection and the active target control panel.
function renderSchedulerCard(state, schedulerCapability, supportLevels) {
  const selectedTarget = state.selectedSchedulerTarget ?? schedulerCapability?.schedulerTarget ?? SCHEDULER_TARGETS.windowsCronEmulator;
  return `
    <article class="card card--scheduler-targets">
      <header class="card__header">
        <div>
          <p class="card__code">3A</p>
          <h3>Scheduler controls</h3>
        </div>
        ${statusBadge(state.statusByKey['3A'])}
      </header>
      <p class="card__copy">${renderSchedulerCopy(schedulerCapability, supportLevels.installSupportLevel)}</p>
      <div class="scheduler-tabs" role="tablist" aria-label="Scheduler target">
        ${renderSchedulerTabButton('WINDOWS (crontab emulator)', SCHEDULER_TARGETS.windowsCronEmulator, selectedTarget, 'select-scheduler-target-windows')}
        ${renderSchedulerTabButton('RASPBERRY (real crontab)', SCHEDULER_TARGETS.raspberryRealCrontab, selectedTarget, 'select-scheduler-target-raspberry')}
      </div>
      <div class="scheduler-target-grid">
        ${renderSchedulerTargetPanel({
          title: 'WINDOWS',
          subtitle: 'crontab emulator',
          target: SCHEDULER_TARGETS.windowsCronEmulator,
          selectedTarget,
          supportLevels,
          state,
          copy: 'Uses tools/CronEmulator as the Windows cron job runner. The emulator source stays unchanged; the backend launches and inspects it as an external process.',
        })}
        ${renderSchedulerTargetPanel({
          title: 'RASPBERRY',
          subtitle: 'real crontab',
          target: SCHEDULER_TARGETS.raspberryRealCrontab,
          selectedTarget,
          supportLevels,
          state,
          copy: 'Uses the current user crontab on Raspberry Pi OS/Linux and manages only the project-owned marked block.',
        })}
      </div>
      ${renderSchedulerEndpointTerminal(state.schedulerEmulator?.endpointLog ?? [])}
      ${renderResultSurface(state.initResults['3A'])}
      <div class="log-surface" data-scroll-preserve="log-3A">${renderLogEntries(state.logs['3A'], { sourceKey: '3A' })}</div>
    </article>
  `;
}

// Renders one scheduler target tab button.
function renderSchedulerTabButton(label, target, selectedTarget, action) {
  const selected = target === selectedTarget;
  return `<button class="scheduler-tab ${selected ? 'scheduler-tab--active' : ''}" type="button" role="tab" aria-selected="${selected ? 'true' : 'false'}" data-action="${escapeAttribute(action)}">${escapeHtml(label)}</button>`;
}

// Renders a terminal-style live endpoint log for Windows CronEmulator calls.
function renderSchedulerEndpointTerminal(entries = []) {
  const rows = entries.length
    ? entries.map((entry) => renderSchedulerEndpointTerminalRow(entry)).join('')
    : '<div class="scheduler-endpoint-terminal__empty">No cron endpoint calls yet.</div>';
  return `
    <section class="scheduler-endpoint-terminal" aria-label="Live cron endpoint call log">
      <div class="scheduler-endpoint-terminal__header">
        <h4>cron endpoint / row live log</h4>
        <div class="scheduler-endpoint-terminal__header-actions">
          <span>${escapeHtml(String(entries.length))} entries</span>
          <button class="button button--ghost scheduler-endpoint-terminal__control" type="button" data-scheduler-endpoint-copy-all>copy all</button>
          <button class="button button--ghost scheduler-endpoint-terminal__control" type="button" data-scheduler-endpoint-clear-all>clear</button>
        </div>
      </div>
      <div class="scheduler-endpoint-terminal__body" role="log" aria-live="polite" data-scroll-preserve="scheduler-endpoint-terminal-body">
        ${rows}
      </div>
    </section>
  `;
}

// Renders one compact terminal row for endpoint traffic or actual cron row execution.
function renderSchedulerEndpointTerminalRow(entry) {
  const rowId = String(entry.id ?? '');
  const isCronRowCall = entry.actualCronRowCall === true || String(entry.type ?? '').startsWith('cron-run');
  const statusText = isCronRowCall
    ? (entry.type === 'cron-run-failed' ? 'ROW FAIL' : 'ROW OK')
    : (typeof entry.status === 'number' ? `HTTP ${entry.status}` : entry.type.toUpperCase());
  const title = isCronRowCall && entry.rawCronRow ? ` title="${escapeAttribute(entry.rawCronRow)}"` : '';
  return `
    <div class="scheduler-endpoint-terminal__row scheduler-endpoint-terminal__row--${escapeAttribute(entry.type ?? 'request')}"${title}>
      <span class="scheduler-endpoint-terminal__time">${escapeHtml(entry.at ?? '')}</span>
      <span class="scheduler-endpoint-terminal__status">${escapeHtml(statusText)}</span>
      <span class="scheduler-endpoint-terminal__method">${escapeHtml(entry.method ?? '')}</span>
      <span class="scheduler-endpoint-terminal__endpoint">${escapeHtml(entry.endpoint ?? '')}</span>
      <span class="scheduler-endpoint-terminal__message">${escapeHtml(entry.message ?? '')}</span>
      <button class="button button--ghost scheduler-endpoint-terminal__expand" type="button" data-scheduler-endpoint-row-expand="${escapeAttribute(rowId)}">expand row</button>
    </div>
  `;
}

// Renders one scheduler target panel, using CronEmulator controls for Windows.
function renderSchedulerTargetPanel({ title, subtitle, target, selectedTarget, supportLevels, copy, state }) {
  const active = target === selectedTarget;
  const disabled = active ? '' : ' disabled aria-disabled="true"';
  const inactiveNote = active ? '' : '<p class="scheduler-target-panel__note">Inactive target. Controls are disabled until this tab is selected.</p>';
  const controls = target === SCHEDULER_TARGETS.windowsCronEmulator
    ? renderWindowsSchedulerControls(state, disabled)
    : renderLegacySchedulerControls(supportLevels, disabled);
  return `
    <section class="scheduler-target-panel ${active ? 'scheduler-target-panel--active' : 'scheduler-target-panel--inactive'}" data-scheduler-target="${escapeAttribute(target)}">
      <div class="scheduler-target-panel__header">
        <div>
          <p class="card__code">${escapeHtml(title)}</p>
          <h4>${escapeHtml(subtitle)}</h4>
        </div>
        <span class="status-badge status-badge--${active ? 'info' : 'disabled'}">${active ? 'Active' : 'Disabled'}</span>
      </div>
      <p class="card__copy">${escapeHtml(copy)}</p>
      ${controls}
      ${inactiveNote}
    </section>
  `;
}

// Renders the Windows 11 CronEmulator button row and crontab textareas.
function renderWindowsSchedulerControls(state, disabled) {
  const schedulerState = state.schedulerEmulator ?? {};
  return `
    <div class="scheduler-emulator-controls">
      <div class="button-row scheduler-emulator-button-row">
        ${SCHEDULER_EMULATOR_BUTTONS.map((button) => renderSchedulerEmulatorActionButton(button, schedulerState.buttonStates ?? {}, disabled)).join('')}
      </div>
      <div class="scheduler-crontab-grid">
        <label class="scheduler-crontab-field">
          <span>insert crontab</span>
          <textarea class="terminal-textarea" data-scheduler-crontab-input spellcheck="false"${disabled}>${escapeHtml(schedulerState.editableCrontab ?? '')}</textarea>
        </label>
        <label class="scheduler-crontab-field">
          <span>crontab from CronEmulator</span>
          <textarea class="terminal-textarea" data-scheduler-active-crontab readonly spellcheck="false">${escapeHtml(schedulerState.activeCrontab ?? "not checked, press 'Get active crontab'")}</textarea>
        </label>
      </div>
    </div>
  `;
}

// Renders one CronEmulator action button with an auth-style status circle.
function renderSchedulerEmulatorActionButton(button, buttonStates, disabled) {
  const copy = getSchedulerEmulatorButtonCopy(button.action);
  const statusState = buttonStates?.[button.action] ?? { status: 'neutral', message: 'Not checked yet.', endpoint: null };
  const status = normalizeSchedulerEmulatorButtonStatus(statusState.status);
  const label = copy?.label ?? button.action;
  const helpText = getSchedulerEmulatorButtonStatusHelp(button.action, status, statusState.message);
  const statusLabelText = getSchedulerEmulatorButtonStatusLabel(status);
  const title = escapeAttribute(helpText);
  const disabledAttribute = disabled || '';

  return `
    <span class="auth-button-shell auth-button-shell--${escapeAttribute(status)} scheduler-emulator-button" data-scheduler-button-key="${escapeAttribute(button.action)}" data-scheduler-button-status="${escapeAttribute(status)}" data-scheduler-help-text="${title}" title="${title}">
      <span class="auth-button-status-dot" aria-label="${escapeAttribute(`${label} status: ${statusLabelText}`)}" title="${title}"></span>
      <button class="button button--${escapeAttribute(button.variant)}" data-action="${escapeAttribute(button.action)}" title="${title}" aria-label="${escapeAttribute(`${label}. ${helpText}`)}"${disabledAttribute}>${escapeHtml(label)}</button>
    </span>
  `;
}

// Keeps legacy non-Windows scheduler controls available for compatibility.
function renderLegacySchedulerControls(supportLevels, disabled) {
  return `
    <div class="button-row">
      <button class="button button--secondary" data-action="install-cron"${disabled || buildSchedulerButtonAttributes(supportLevels.installSupportLevel)}>Install scheduler</button>
      <button class="button button--secondary" data-action="check-cron"${disabled || buildSchedulerButtonAttributes(supportLevels.statusSupportLevel)}>Check scheduler</button>
      <button class="button button--secondary" data-action="print-cron"${disabled || buildSchedulerButtonAttributes(supportLevels.printSupportLevel)}>Print scheduler</button>
    </div>
  `;
}


// Renders the NEW AUTH card, with real login controls disabled in Test Mode.
function renderNewAuthCard(state, dashboardVisualMode = null) {
  const newAuth = state.newAuth ?? {};
  const disabledInTestMode = dashboardVisualMode === 'test';
  const disabledNotice = disabledInTestMode
    ? '<p class="notice notice--warning new-auth-disabled-notice">NEW AUTH login is disabled in Test Mode. Switch to Real Mode to use iCloudPD login controls.</p>'
    : '';
  return `
    <article class="card card--hybrid ${disabledInTestMode ? 'card--new-auth-disabled' : ''}" data-new-auth-card="1A-STASH-OFF"${disabledInTestMode ? ' data-new-auth-disabled="test-mode" aria-disabled="true"' : ''}>
      <header class="card__header">
        <div><p class="card__code">1A-STASH-OFF</p><h3>NEW AUTH</h3></div>
        <div class="card__header-tags">${renderSourceBadge('real', disabledInTestMode ? 'DISABLED IN TEST MODE' : 'NEW ENDPOINTS')}</div>
        ${statusBadge(state.statusByKey['1A-STASH-OFF'])}
      </header>
      <p class="card__copy">Fresh real-auth UI boundary for iCloudPD. These controls intentionally target only <code>/api/auth/new/*</code> endpoints and do not reuse the existing login card routes.</p>
      ${disabledNotice}
      <div class="new-auth-action-list">
        ${NEW_AUTH_BUTTONS.map((button) => renderNewAuthActionRow(button, newAuth.buttonStates ?? {}, disabledInTestMode)).join('')}
      </div>
      ${renderResultSurface(newAuth.latestResult)}
      ${newAuth.sessionFilesResult ? renderResultSurface(newAuth.sessionFilesResult) : ''}
      ${newAuth.artifactPackResult ? renderResultSurface(newAuth.artifactPackResult) : ''}
      ${newAuth.artifactPackListResult ? renderResultSurface(newAuth.artifactPackListResult) : ''}
      <div class="log-surface" data-scroll-preserve="log-1A-STASH-OFF">${renderLogEntries(state.logs['1A-STASH-OFF'], { sourceKey: '1A-STASH-OFF' })}</div>
    </article>
  `;
}

// Renders one NEW AUTH action row and applies Test Mode disabled attributes.
function renderNewAuthActionRow(button, buttonStates = {}, disabledInTestMode = false) {
  const statusState = buttonStates?.[button.action] ?? { status: 'neutral', message: 'Not checked yet.', endpoint: null };
  const status = disabledInTestMode ? 'blocked' : normalizeAuthButtonStatus(statusState.status);
  const copy = getAuthButtonCopy(button.action);
  const rawLabel = copy?.label ?? button.label;
  const label = escapeHtml(rawLabel);
  const disabledMessage = 'Disabled in Test Mode. Switch to Real Mode to use iCloudPD login controls.';
  const message = disabledInTestMode ? disabledMessage : statusState.message || copy?.statuses?.[status] || 'Not checked yet.';
  const endpoint = disabledInTestMode ? '' : statusState.endpoint || copy?.endpoint || '';
  const helpText = disabledInTestMode ? disabledMessage : getAuthButtonStatusHelp(button.action, status, statusState.message);
  const statusLabelText = getAuthButtonStatusLabel(status);
  const title = escapeAttribute(helpText);
  const disabledAttributes = disabledInTestMode
    ? ' disabled aria-disabled="true" data-disabled-reason="test-mode-new-auth-login-disabled"'
    : '';

  return `
    <div class="new-auth-action-row ${disabledInTestMode ? 'new-auth-action-row--disabled' : ''}" data-new-auth-action-row="${escapeAttribute(button.action)}"${disabledInTestMode ? ' data-new-auth-action-disabled="test-mode"' : ''}>
      <span class="auth-button-shell auth-button-shell--${escapeAttribute(status)}" data-auth-button-key="${escapeAttribute(button.action)}" data-auth-button-status="${escapeAttribute(status)}" data-auth-help-text="${title}" title="${title}">
        <span class="auth-button-status-dot" aria-label="${escapeAttribute(`${rawLabel} status: ${statusLabelText}`)}" title="${title}"></span>
        <button class="button button--${escapeAttribute(button.variant)}" data-action="${escapeAttribute(button.action)}" title="${title}" aria-label="${escapeAttribute(`${rawLabel}. ${helpText}`)}"${disabledAttributes}>${label}</button>
      </span>
      <p class="new-auth-action-row__status"><strong>${escapeHtml(statusLabelText)}.</strong> ${escapeHtml(message)}${endpoint ? ` <span>${escapeHtml(endpoint)}</span>` : ''}</p>
    </div>
  `;
}

// Render the backend-owned icloudpd/authentication preflight card in View A.
function renderAuthCard(state) {
  const authState = state.authPreflight?.publicState ?? null;
  const latestResult = state.authPreflight?.latestResult ?? null;
  return `
    <article class="card card--hybrid marked-for-removal" data-marked-for-removal="true">
      <header class="card__header">
        <div><p class="card__code">1A-AUTH</p><h3>Verify icloudpd</h3></div>
        <div class="card__header-tags">${renderSourceBadge('real', 'BACKEND')}</div>
        ${statusBadge(state.statusByKey.B1)}
      </header>
      <p class="card__copy">Backend-owned icloudpd verification and login controls. This card checks executable/config readiness separately from authenticated provider state.</p>
      ${renderStepList(state.loginSteps)}
      ${renderAuthStateSummary(authState, state.authPreflight?.loaded)}
      ${renderAuthOperatorControls(authState, state.authPreflight?.buttonStates)}
      ${renderResultSurface(latestResult)}
      <div class="log-surface" data-scroll-preserve="log-B1">${renderLogEntries(state.logs.B1, { sourceKey: 'B1' })}</div>
    </article>
  `;
}

function renderAuthOperatorControls(authState, buttonStates = {}) {
  const showTwoFactor = authState?.requires_2fa === true && authState?.two_factor_status === 'required';
  const twoFactorControl = showTwoFactor ? '<label class="field-label" for="auth-preflight-2fa-code">2FA code</label><input id="auth-preflight-2fa-code" class="input" type="text" inputmode="numeric" autocomplete="one-time-code" data-auth-2fa-code aria-label="2FA code" />' : '';
  const renderedButtons = AUTH_BUTTONS.map((button) => renderAuthActionButton(button, buttonStates)).join('');
  const twoFactorButton = showTwoFactor ? renderAuthActionButton(AUTH_2FA_BUTTON, buttonStates) : '';
  return `${twoFactorControl}<div class="button-row button-row--auth">${renderedButtons}${twoFactorButton}</div>`;
}

function renderAuthActionButton(button, buttonStates) {
  const statusState = buttonStates?.[button.action] ?? { status: 'neutral', message: '', endpoint: null };
  const status = normalizeAuthButtonStatus(statusState.status);
  const copy = getAuthButtonCopy(button.action);
  const rawLabel = copy?.label ?? button.label;
  const label = escapeHtml(rawLabel);
  const helpText = getAuthButtonStatusHelp(button.action, status, statusState.message);
  const title = escapeAttribute(helpText);
  const statusLabelText = getAuthButtonStatusLabel(status);
  const statusLabel = `${rawLabel} status: ${statusLabelText}`;
  const buttonAriaLabel = `${rawLabel}. ${helpText}`;

  return `
    <span class="auth-button-shell auth-button-shell--${status}" data-auth-button-key="${escapeAttribute(button.action)}" data-auth-button-status="${escapeAttribute(status)}" data-auth-help-text="${title}" title="${title}">
      <span class="auth-button-status-dot" aria-label="${escapeAttribute(statusLabel)}" title="${title}"></span>
      <button class="button button--${escapeAttribute(button.variant)}" data-action="${escapeAttribute(button.action)}" title="${title}" aria-label="${escapeAttribute(buttonAriaLabel)}">${label}</button>
    </span>
  `;
}


function normalizeAuthButtonStatus(status) {
  return ['neutral', 'running', 'success', 'failed', 'blocked', 'pending'].includes(status) ? status : 'neutral';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function renderAuthStateSummary(authState, loaded) {
  if (!loaded || !authState) {
    return '<p class="card__copy">Backend auth status has not been loaded yet.</p>';
  }

  return renderResultSurface({
    operation: 'Current safe auth state',
    method: 'GET',
    endpoint: '/api/auth/status',
    receivedAt: authState.updatedAt ?? 'Not attempted yet',
    outcome: authState.status === 'preflight_failed' ? 'error' : 'success',
    message: `Check login: ${authState.status === 'authenticated' ? 'TRUE' : authState.status === 'unknown' ? 'UNKNOWN' : 'FALSE'}; status: ${authState.status ?? 'unknown'}; next action: ${authState.next_action ?? 'unknown'}.`,
    payload: authState,
  });
}

function renderCard(code, title, state, logKey, actions, copy) {
  return `
    <article class="card">
      <header class="card__header">
        <div>
          <p class="card__code">${code}</p>
          <h3>${title}</h3>
        </div>
        ${statusBadge(state.statusByKey[code])}
      </header>
      <p class="card__copy">${copy}</p>
      <div class="button-row">${actions}</div>
      ${renderResultSurface(state.initResults[code])}
      <div class="log-surface" data-scroll-preserve="log-${escapeAttribute(logKey)}">${renderLogEntries(state.logs[logKey], { sourceKey: logKey })}</div>
    </article>
  `;
}

function buildSchedulerButtonAttributes(supportLevel) {
  if (supportLevel === SCHEDULER_SUPPORT_LEVELS.supported) {
    return '';
  }
  return ' disabled aria-disabled="true"';
}

function renderSchedulerCopy(capability, installSupportLevel) {
  if (!capability) {
    return 'The legacy cron routes manage scheduler behavior through a platform-aware backend capability model.';
  }

  const profile = capability.platformProfileLabel ?? capability.profileLabel ?? 'current platform';
  const target = capability.schedulerTarget ?? 'unknown';
  const mode = capability.schedulerMode ?? 'unknown';
  const support = capability.supportLevel ?? 'unknown';
  const installLine =
    installSupportLevel === SCHEDULER_SUPPORT_LEVELS.supported
      ? 'Install scheduler is enabled for this platform profile.'
      : `Install scheduler is ${installSupportLevel} for this platform profile and is intentionally disabled in the UI.`;

  return `Legacy /api/init/cron/* routes stay compatible while the backend advertises the real platform target (${profile} -> ${target}, mode ${mode}, support ${support}). ${installLine}`;
}
