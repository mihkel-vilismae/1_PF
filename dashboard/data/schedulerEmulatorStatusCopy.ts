/*
 * Centralizes View A CronEmulator button labels, endpoint copy, and status text.
 * Scheduler circles reuse the auth button visual classes but get their status
 * meaning from this scheduler-specific authority.
 */

export const SCHEDULER_EMULATOR_BUTTON_KEYS = Object.freeze([
  'check-emulator-scheduler',
  'run-emulator',
  'stop-emulator',
  'install-crontab',
  'get-active-crontab',
] as const);

export type SchedulerEmulatorButtonKey = (typeof SCHEDULER_EMULATOR_BUTTON_KEYS)[number];
export type SchedulerEmulatorButtonStatus = 'neutral' | 'running' | 'success' | 'failed' | 'blocked' | 'pending' | 'error';

const SCHEDULER_EMULATOR_STATUS_LABELS = Object.freeze({
  neutral: 'Not checked',
  running: 'Running',
  success: 'Success',
  failed: 'Failed',
  blocked: 'Blocked',
  pending: 'Pending',
  error: 'Error',
});

const GENERIC_STATUS_COPY = Object.freeze({
  neutral: 'No backend result has been recorded for this scheduler action yet.',
  running: 'The scheduler backend request is running.',
  success: 'The scheduler backend response satisfied this action success rule.',
  failed: 'The scheduler backend response did not satisfy this action success rule.',
  blocked: 'The scheduler action was blocked by backend/platform guardrails.',
  pending: 'The scheduler action returned an incomplete state and needs follow-up.',
  error: 'The scheduler action failed or returned an error state.',
});

export const SCHEDULER_EMULATOR_BUTTON_COPY = Object.freeze({
  'check-emulator-scheduler': {
    label: 'Check emulator scheduler',
    endpoint: 'GET /api/init/cron/emulator/check',
    operationType: 'CronEmulator health check',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Reads CronEmulator API/process reachability without starting it.',
    realityReason: 'Calls a real backend endpoint that probes the local CronEmulator dashboard API.',
    backendReason: 'Targets GET /api/init/cron/emulator/check and reports observed/running state without frontend inference.',
    successCriteria: 'Green means the CronEmulator API responded and reported its scheduler loop state.',
    statuses: {
      neutral: 'Ready to check whether CronEmulator is reachable.',
      running: 'Checking the CronEmulator API and scheduler loop state.',
      success: 'CronEmulator responded and scheduler status was read.',
      failed: 'CronEmulator did not respond or returned an unclear status.',
      blocked: 'The scheduler target or platform blocked the check.',
      pending: 'CronEmulator status is still being resolved.',
      error: GENERIC_STATUS_COPY.error,
    },
  },
  'run-emulator': {
    label: 'Run emulator',
    endpoint: 'POST /api/init/cron/emulator/run',
    operationType: 'CronEmulator start',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Starts the repo-local CronEmulator process when needed and starts its scheduler loop.',
    realityReason: 'Calls a real backend process-control endpoint for the local CronEmulator target.',
    backendReason: 'Targets POST /api/init/cron/emulator/run and verifies scheduler_running through the emulator API.',
    successCriteria: 'Green means the backend started or reached CronEmulator and its scheduler loop is running.',
    statuses: {
      neutral: 'Ready to start CronEmulator and its scheduler loop.',
      running: 'Starting CronEmulator and requesting scheduler start.',
      success: 'CronEmulator scheduler loop is running.',
      failed: 'CronEmulator could not be started or did not report running.',
      blocked: 'The backend/platform blocked CronEmulator start.',
      pending: 'CronEmulator start was requested but running state is not proven yet.',
      error: GENERIC_STATUS_COPY.error,
    },
  },
  'stop-emulator': {
    label: 'Stop emulator',
    endpoint: 'POST /api/init/cron/emulator/stop',
    operationType: 'CronEmulator stop',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Stops the CronEmulator scheduler loop and stops the backend-owned process when present.',
    realityReason: 'Calls a real backend endpoint instead of toggling frontend scheduler state.',
    backendReason: 'Targets POST /api/init/cron/emulator/stop and reports the observed stopped state.',
    successCriteria: 'Green means the scheduler loop stopped and any backend-owned CronEmulator process was stopped.',
    statuses: {
      neutral: 'Ready to stop the CronEmulator scheduler loop.',
      running: 'Stopping the CronEmulator scheduler loop and owned process if present.',
      success: 'CronEmulator was stopped or is no longer reachable.',
      failed: 'CronEmulator stop was requested but the backend could not prove a stopped state.',
      blocked: 'The backend/platform blocked the stop request.',
      pending: 'CronEmulator stop is still being resolved.',
      error: GENERIC_STATUS_COPY.error,
    },
  },
  'install-crontab': {
    label: 'Install crontab',
    endpoint: 'POST /api/init/cron/emulator/crontab',
    operationType: 'CronEmulator crontab install',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Writes the submitted textarea content to the active CronEmulator crontab file.',
    realityReason: 'Calls a real backend endpoint that writes the repo-local CronEmulator crontab file.',
    backendReason: 'Targets POST /api/init/cron/emulator/crontab and returns the installed file text/path.',
    successCriteria: 'Green means the backend wrote the supplied text into the active CronEmulator crontab file.',
    statuses: {
      neutral: 'Ready to install the text from insert crontab.',
      running: 'Installing the supplied crontab text.',
      success: 'The supplied crontab text was installed for CronEmulator.',
      failed: 'The supplied crontab text was not installed.',
      blocked: 'The backend rejected or blocked the install request.',
      pending: 'Crontab installation is still being resolved.',
      error: GENERIC_STATUS_COPY.error,
    },
  },
  'get-active-crontab': {
    label: 'Get active crontab',
    endpoint: 'GET /api/init/cron/emulator/crontab',
    operationType: 'CronEmulator crontab read',
    realityState: 'real',
    backendState: 'real',
    mutates: 'Reads the active CronEmulator crontab and updates only the read-only textarea.',
    realityReason: 'Calls a real backend endpoint to read the active CronEmulator crontab source.',
    backendReason: 'Targets GET /api/init/cron/emulator/crontab and returns rawCrontab for the read-only display.',
    successCriteria: 'Green means the backend returned the active CronEmulator crontab text.',
    statuses: {
      neutral: 'Ready to read the active CronEmulator crontab.',
      running: 'Reading the active CronEmulator crontab.',
      success: 'The active CronEmulator crontab was loaded.',
      failed: 'The active CronEmulator crontab could not be loaded.',
      blocked: 'The backend/platform blocked the active crontab read.',
      pending: 'The active crontab read is still being resolved.',
      error: GENERIC_STATUS_COPY.error,
    },
  },
});

// Normalizes scheduler action statuses before they become CSS status classes.
export function normalizeSchedulerEmulatorButtonStatus(status: unknown): SchedulerEmulatorButtonStatus {
  return ['neutral', 'running', 'success', 'failed', 'blocked', 'pending', 'error'].includes(String(status))
    ? status as SchedulerEmulatorButtonStatus
    : 'neutral';
}

// Returns the central copy record for one scheduler emulator button.
export function getSchedulerEmulatorButtonCopy(buttonKey: string) {
  return SCHEDULER_EMULATOR_BUTTON_COPY[buttonKey as SchedulerEmulatorButtonKey] ?? null;
}

// Builds the tooltip/help text used by scheduler emulator status circles.
export function getSchedulerEmulatorButtonStatusHelp(buttonKey: string, status: unknown, backendMessage = ''): string {
  const copy = getSchedulerEmulatorButtonCopy(buttonKey);
  const normalizedStatus = normalizeSchedulerEmulatorButtonStatus(status);
  const statusCopy = copy?.statuses?.[normalizedStatus] ?? GENERIC_STATUS_COPY[normalizedStatus] ?? GENERIC_STATUS_COPY.neutral;
  const backendLine = backendMessage ? `Latest backend message: ${backendMessage}` : '';
  const endpointLine = copy?.endpoint ? `Endpoint: ${copy.endpoint}.` : '';
  const successLine = copy?.successCriteria ? `Success rule: ${copy.successCriteria}` : '';

  return [statusCopy, backendLine, endpointLine, successLine]
    .filter(Boolean)
    .join(' ');
}

// Returns the concise scheduler circle status label.
export function getSchedulerEmulatorButtonStatusLabel(status: unknown): string {
  const normalizedStatus = normalizeSchedulerEmulatorButtonStatus(status);
  return SCHEDULER_EMULATOR_STATUS_LABELS[normalizedStatus] ?? SCHEDULER_EMULATOR_STATUS_LABELS.neutral;
}

// Returns inspect-mode copy for one scheduler emulator button.
export function getSchedulerEmulatorButtonInspectCopy(buttonKey: string) {
  const copy = getSchedulerEmulatorButtonCopy(buttonKey);
  if (!copy) return null;
  return {
    label: copy.label,
    description: `${copy.operationType}. ${copy.mutates} Semantic success rule: ${copy.successCriteria}`,
  };
}

// Returns real/mock classification copy for one scheduler emulator button.
export function getSchedulerEmulatorButtonRealityCopy(buttonKey: string) {
  const copy = getSchedulerEmulatorButtonCopy(buttonKey);
  if (!copy) return null;
  return {
    state: copy.realityState,
    reason: copy.realityReason,
  };
}

// Returns backend-status classification copy for one scheduler emulator button.
export function getSchedulerEmulatorButtonBackendStatusCopy(buttonKey: string) {
  const copy = getSchedulerEmulatorButtonCopy(buttonKey);
  if (!copy) return null;
  return {
    state: copy.backendState,
    reason: `${copy.backendReason} ${copy.mutates} ${copy.successCriteria}`,
  };
}
