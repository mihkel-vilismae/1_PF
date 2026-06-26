/*
 * Shared scheduler action-row renderer for View A and V2.
 * Button labels/status copy stay centralized in schedulerEmulatorStatusCopy; callers
 * may pass a scheduler target so a reused button can operate against Raspberry real crontab.
 */
import {
  getSchedulerEmulatorButtonCopy,
  getSchedulerEmulatorButtonStatusHelp,
  getSchedulerEmulatorButtonStatusLabel,
  normalizeSchedulerEmulatorButtonStatus,
} from '../data/schedulerEmulatorStatusCopy.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';

export const SCHEDULER_EMULATOR_BUTTONS = Object.freeze([
  { action: 'check-emulator-scheduler', variant: 'secondary' },
  { action: 'run-emulator', variant: 'primary' },
  { action: 'stop-emulator', variant: 'secondary' },
  { action: 'install-crontab', variant: 'secondary' },
  { action: 'get-active-crontab', variant: 'secondary' },
] as const);

type SchedulerActionButton = (typeof SCHEDULER_EMULATOR_BUTTONS)[number];

type SchedulerActionButtonState = {
  status?: string | null;
  message?: string | null;
  endpoint?: string | null;
};

type SchedulerActionButtonOptions = {
  buttonStates?: Record<string, SchedulerActionButtonState> | null;
  disabled?: string;
  schedulerTarget?: string | null;
};

// Renders one scheduler action button with an auth-style status circle.
export function renderSchedulerActionButton(button: SchedulerActionButton, options: SchedulerActionButtonOptions = {}): string {
  const copy = getSchedulerEmulatorButtonCopy(button.action);
  const statusState = options.buttonStates?.[button.action] ?? {
    status: 'neutral',
    message: 'Not checked yet.',
    endpoint: null,
  };
  const status = normalizeSchedulerEmulatorButtonStatus(statusState.status);
  const label = copy?.label ?? button.action;
  const helpText = getSchedulerEmulatorButtonStatusHelp(
    button.action,
    status,
    statusState.message ?? '',
  );
  const statusLabelText = getSchedulerEmulatorButtonStatusLabel(status);
  const targetAttribute = options.schedulerTarget ? ` data-scheduler-target="${escapeHtml(options.schedulerTarget)}"` : '';
  const disabledAttribute = options.disabled ?? '';

  return `
    <span class="auth-button-shell auth-button-shell--${escapeHtml(status)} scheduler-emulator-button" data-scheduler-button-key="${escapeHtml(button.action)}" data-scheduler-button-status="${escapeHtml(status)}" data-scheduler-help-text="${escapeHtml(helpText)}" title="${escapeHtml(helpText)}">
      <span class="auth-button-status-dot" aria-label="${escapeHtml(`${label} status: ${statusLabelText}`)}" title="${escapeHtml(helpText)}"></span>
      <button class="button button--${escapeHtml(button.variant)}" data-action="${escapeHtml(button.action)}"${targetAttribute} title="${escapeHtml(helpText)}" aria-label="${escapeHtml(`${label}. ${helpText}`)}"${disabledAttribute}>${escapeHtml(label)}</button>
    </span>
  `;
}
