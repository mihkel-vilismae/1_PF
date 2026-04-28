import { statusBadge, renderLogEntries, renderResultSurface, renderStepList, renderSourceBadge } from '../services/renderers.js';
import { getAuthButtonCopy, getAuthButtonStatusHelp, getAuthButtonStatusLabel } from '../data/authButtonStatusCopy.ts';
import {
  getOperationSupportLevel,
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
} from '../../shared/schedulerPlatformCapabilities.js';

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

export function renderInitView(state) {
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

      <div class="section-grid section-grid--two">
        ${renderCard('1A', 'Verify .env', state, '1A', '<button class="button button--primary" data-action="verify-env">Run</button>', 'Validate required configuration keys and render the backend response payload directly in this card.')}
        ${renderAuthCard(state)}
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

      ${renderCard(
        '3A',
        'Scheduler controls',
        state,
        '3A',
          `
            <button class="button button--secondary" data-action="install-cron"${buildSchedulerButtonAttributes(installSupportLevel)}>Install scheduler</button>
            <button class="button button--secondary" data-action="check-cron"${buildSchedulerButtonAttributes(statusSupportLevel)}>Check scheduler</button>
            <button class="button button--secondary" data-action="print-cron"${buildSchedulerButtonAttributes(printSupportLevel)}>Print scheduler</button>
          `,
          renderSchedulerCopy(schedulerCapability, installSupportLevel),
      )}

    </section>
  `;
}

// Render the backend-owned icloudpd/authentication preflight card in View A.
function renderAuthCard(state) {
  const authState = state.authPreflight?.publicState ?? null;
  const latestResult = state.authPreflight?.latestResult ?? null;
  return `
    <article class="card card--hybrid">
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
      <div class="log-surface">${renderLogEntries(state.logs.B1, { sourceKey: 'B1' })}</div>
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
      <div class="log-surface">${renderLogEntries(state.logs[logKey], { sourceKey: logKey })}</div>
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
