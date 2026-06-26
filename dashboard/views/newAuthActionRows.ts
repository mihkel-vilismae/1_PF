/*
 * Shared NEW AUTH action-row renderer.
 * View A and V2 use this one implementation so /api/auth/new/* controls do not drift.
 */
import {
  getAuthButtonCopy,
  getAuthButtonStatusHelp,
  getAuthButtonStatusLabel,
} from '../data/authButtonStatusCopy.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';

export type NewAuthActionButton = {
  action: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
};

export const NEW_AUTH_BUTTONS: readonly NewAuthActionButton[] = Object.freeze([
  {
    action: 'new-auth-verify-icloudpd',
    label: 'Verify iCloudPD install',
    variant: 'secondary',
  },
  {
    action: 'new-auth-verify-provider-session',
    label: 'Verify with iCloudPD',
    variant: 'primary',
  },
  {
    action: 'new-auth-login-using-env',
    label: 'Login using .env values',
    variant: 'primary',
  },
  {
    action: 'new-auth-check-login',
    label: 'Check login',
    variant: 'secondary',
  },
  {
    action: 'new-auth-logout-session',
    label: 'Log out and remove existing session',
    variant: 'danger',
  },
  {
    action: 'new-auth-session-files',
    label: 'Show auth/session paths and files',
    variant: 'secondary',
  },
  {
    action: 'new-auth-generate-artifact-pack',
    label: 'Generate auth evidence pack',
    variant: 'secondary',
  },
  {
    action: 'new-auth-list-artifact-packs',
    label: 'List auth evidence packs',
    variant: 'secondary',
  },
]);

// Renders one NEW AUTH action row and applies Test Mode disabled attributes.
export function renderNewAuthActionRow(
  button: NewAuthActionButton,
  buttonStates: Record<string, any> = {},
  disabledInTestMode = false,
): string {
  const statusState = buttonStates?.[button.action] ?? {
    status: 'neutral',
    message: 'Not checked yet.',
    endpoint: null,
  };
  const status = disabledInTestMode
    ? 'blocked'
    : normalizeNewAuthButtonStatus(statusState.status);
  const copy = getAuthButtonCopy(button.action);
  const rawLabel = copy?.label ?? button.label;
  const label = escapeHtml(rawLabel);
  const disabledMessage =
    'Disabled in Test Mode. Switch to Real Mode to use iCloudPD login controls.';
  const message = disabledInTestMode
    ? disabledMessage
    : statusState.message || copy?.statuses?.[status] || 'Not checked yet.';
  const endpoint = disabledInTestMode
    ? ''
    : statusState.endpoint || copy?.endpoint || '';
  const helpText = disabledInTestMode
    ? disabledMessage
    : getAuthButtonStatusHelp(button.action, status, statusState.message);
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

function normalizeNewAuthButtonStatus(status: string): string {
  return [
    'neutral',
    'running',
    'success',
    'failed',
    'blocked',
    'pending',
  ].includes(status)
    ? status
    : 'neutral';
}

function escapeAttribute(value: unknown): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
