// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color, dimNotYetImplemented } from './ansi.js';
import { panel } from './terminalBox.js';

export const PIR_BUTTON_LABEL = '[ PIR ]';

// Renders the simulation-only screen-worker monitor with stable clickable labels.
export function renderScreenOnOff(state: DemoTerminalState, title: string, width?: number): string {
  const monitor = state.screenOnOff.monitorEnabled ? color.brightGreen('ENABLED') : color.muted('DISABLED');
  const activity = state.screenOnOff.monitorActive ? color.brightGreen('ACTIVE') : color.muted('IDLE');
  const keyboard = state.screenOnOff.keyboardEnabled ? color.brightGreen('[x] Keyboard') : color.muted('[ ] Keyboard disabled');
  const mouse = state.screenOnOff.mouseEnabled ? color.brightGreen('[x] Mouse') : color.muted('[ ] Mouse disabled');
  const pir = state.screenOnOff.pirSensorEnabled ? color.brightGreen(PIR_BUTTON_LABEL) : color.muted('[ PIR disabled ]');
  return panel(color.yellow(title), [
    `Monitor: ${monitor}`,
    `State: ${activity}`,
    `${keyboard}   ${mouse}   ${pir}`,
    `Idle timer: ${state.screenOnOff.idleSeconds}s since last keyboard/mouse input`,
    `Last activity: ${state.screenOnOff.lastActivitySource} at ${state.screenOnOff.lastActivityAt}`,
    `Power state: ${state.screenOnOff.powerState}`,
    `Latest status: ${state.screenOnOff.latestStatus}`,
    `Guard: ${state.screenOnOff.actionGuard}`,
    `Info: ${dimNotYetImplemented(state.screenOnOff.info)}`
  ], width);
}
