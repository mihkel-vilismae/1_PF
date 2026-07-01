// Applies the terminal screen-worker monitor state to the shared demo state.
// This remains simulation-only and never claims real hardware control.

import type { ActionItemState, DemoTerminalState, ScreenOnOffState, WorkerPanelRow } from '../state/DemoTerminalState.js';

const SCREEN_MONITOR_LOG_LIMIT = 4;

export interface ScreenMonitorBridgeStatus {
  status: 'disabled' | 'passed' | 'failed';
  message: string;
}

export interface ScreenMonitorActivityInput {
  source: 'keyboard' | 'mouse' | 'pir';
  detail: string;
  bridge?: ScreenMonitorBridgeStatus | null;
  occurredAt?: string;
}

// Builds the initial simulation-only screen-worker monitor state for terminal Demo Mode.
export function createInitialScreenOnOffState(): ScreenOnOffState {
  return {
    monitorEnabled: false,
    monitorActive: false,
    keyboardEnabled: false,
    mouseEnabled: false,
    pirSensorEnabled: true,
    lastActivitySource: 'none',
    lastActivityAt: 'Never',
    activityLog: [],
    idleSeconds: 0,
    powerState: 'guarded',
    latestStatus: 'screen-worker monitor local simulation idle',
    actionGuard: 'local monitor only; no real screen power command',
    info: 'Simulation-only screen-worker monitor is disabled. Press F to arm it. PIR stays emulated in this slice.',
  };
}

// Toggles the simulation-only terminal screen-worker monitor and records a local panel log line.
export function toggleScreenOnOffState(current: ScreenOnOffState, now = new Date().toISOString()): ScreenOnOffState {
  const monitorEnabled = !current.monitorEnabled;
  return {
    ...current,
    monitorEnabled,
    monitorActive: monitorEnabled,
    info: monitorEnabled
      ? 'Simulation-only screen-worker monitor is enabled. PIR is emulated here; keyboard and mouse inputs are now watched locally.'
      : 'Simulation-only screen-worker monitor is disabled. Press F to arm it. PIR stays emulated in this slice.',
    activityLog: appendLogLine(
      current.activityLog,
      `${now} ${monitorEnabled ? 'SCREEN WORKER MONITOR ENABLED' : 'SCREEN WORKER MONITOR DISABLED'}`,
    ),
  };
}

// Records one simulation-only activity input for the local terminal screen-worker monitor.
export function recordScreenOnOffActivity(
  current: ScreenOnOffState,
  input: ScreenMonitorActivityInput,
): ScreenOnOffState {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  if (!current.monitorEnabled) {
    return {
      ...current,
      monitorActive: false,
      info: 'Simulation-only screen-worker monitor is disabled. Press F to arm it. PIR stays emulated in this slice.',
      activityLog: appendLogLine(current.activityLog, `${occurredAt} ${input.source.toUpperCase()} ignored while monitor disabled`),
    };
  }

  const bridgeSuffix = input.bridge && input.bridge.status !== 'disabled' ? ` bridge=${input.bridge.status}` : '';
  return {
    ...current,
    monitorActive: true,
    keyboardEnabled: current.keyboardEnabled || input.source === 'keyboard',
    mouseEnabled: current.mouseEnabled || input.source === 'mouse',
    pirSensorEnabled: true,
    lastActivitySource: input.source,
    lastActivityAt: occurredAt,
    info: buildActivityInfo(input, input.bridge),
    activityLog: appendLogLine(current.activityLog, `${occurredAt} ${input.detail}${bridgeSuffix}`),
  };
}

// Overlays the local screen-worker monitor state without changing backend/runtime truth sources.
export function applyScreenOnOffState(state: DemoTerminalState, screenOnOff: ScreenOnOffState): DemoTerminalState {
  return {
    ...state,
    actions: state.actions.map((action) => (action.key === 'F' ? buildScreenMonitorToggleAction(action, screenOnOff) : { ...action })),
    rpiWorkers: state.rpiWorkers.map((worker) => (worker.name === 'On-off worker' ? buildScreenWorkerProjection(worker, screenOnOff) : { ...worker })),
    screenOnOff: {
      ...screenOnOff,
      activityLog: [...screenOnOff.activityLog],
    },
  };
}

// Builds the current F action text from the local screen-worker monitor state.
function buildScreenMonitorToggleAction(action: ActionItemState, screenOnOff: ScreenOnOffState): ActionItemState {
  return {
    ...action,
    label: screenOnOff.monitorEnabled ? 'Disable screen worker monitor' : 'Enable screen worker monitor',
    enabled: true,
    info: screenOnOff.monitorEnabled
      ? 'Simulation-only screen-worker monitor is armed. Click or press PIR, or move mouse/type to log local activity.'
      : 'Arms the simulation-only terminal screen-worker monitor.',
    active: screenOnOff.monitorEnabled,
    done: false,
  };
}

// Projects the local monitor state onto the terminal worker row without claiming backend execution.
function buildScreenWorkerProjection(worker: WorkerPanelRow, screenOnOff: ScreenOnOffState): WorkerPanelRow {
  return {
    ...worker,
    status: screenOnOff.monitorEnabled ? 'Started' : 'Disabled',
    lastCalled: screenOnOff.lastActivityAt,
    lastEvent: screenOnOff.activityLog.at(-1) ?? (screenOnOff.monitorEnabled ? 'Monitor armed locally; waiting for activity.' : 'Monitor disabled.'),
  };
}

// Builds a short operator-facing summary of the latest local screen-worker activity.
function buildActivityInfo(input: ScreenMonitorActivityInput, bridge?: ScreenMonitorBridgeStatus | null): string {
  const base = input.source === 'pir'
    ? 'Emulated PIR input recorded locally.'
    : input.source === 'mouse'
      ? 'Local mouse activity recorded by the terminal screen-worker monitor.'
      : 'Local keyboard activity recorded by the terminal screen-worker monitor.';
  if (!bridge || bridge.status === 'disabled') return base;
  return `${base} Screen-simulation bridge ${bridge.status === 'passed' ? 'updated backend simulation.' : 'failed and stayed local only.'}`;
}

// Appends one local monitor line while keeping the panel log bounded and readable.
function appendLogLine(lines: string[], line: string): string[] {
  return [...lines, line].slice(-SCREEN_MONITOR_LOG_LIMIT);
}
