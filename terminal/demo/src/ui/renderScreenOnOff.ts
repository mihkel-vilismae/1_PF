// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color, dimNotYetImplemented } from './ansi.js';
import { panel } from './terminalBox.js';

export function renderScreenOnOff(state: DemoTerminalState, title: string, width?: number): string {
  const keyboard = state.screenOnOff.keyboardEnabled ? color.brightGreen('[x] Keyboard') : color.muted('[ ] Keyboard disabled');
  const mouse = state.screenOnOff.mouseEnabled ? color.brightGreen('[x] Mouse') : color.muted('[ ] Mouse disabled');
  const pir = state.screenOnOff.pirSensorEnabled ? color.brightGreen('[x] PIR sensor') : color.muted('[ ] PIR sensor disabled');
  return panel(color.yellow(title), [
    `${keyboard}   ${mouse}   ${pir}`,
    `Idle timer: ${state.screenOnOff.idleSeconds}s since last keyboard/mouse input`,
    `Power state: ${state.screenOnOff.powerState}`,
    `Latest status: ${state.screenOnOff.latestStatus}`,
    `Guard: ${state.screenOnOff.actionGuard}`,
    `Info: ${dimNotYetImplemented(state.screenOnOff.info)}`
  ], width);
}
