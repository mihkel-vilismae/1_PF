// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { ActionItemState, DemoTerminalState } from '../state/DemoTerminalState.js';
import { color, dimNotYetImplemented } from './ansi.js';
import { panel } from './terminalBox.js';

function renderActionLine(action: ActionItemState): string {
  const disabled = action.enabled ? '' : color.muted(' disabled');
  const marker = action.active ? `${color.arrow('->')} ` : '  ';
  const done = action.done ? `${color.done('[DONE]')} ` : '';
  const key = action.active ? color.active(`[${action.key}]`) : action.done ? color.done(`[${action.key}]`) : color.brightCyan(`[${action.key}]`);
  const active = action.active ? `${color.active('[ACTIVE]')} ` : '';
  const label = action.active ? color.active(action.label) : action.done ? color.done(action.label) : action.label;
  return `${marker}${done}${key} ${active}${label}${disabled}`;
}

function renderInfo(action: ActionItemState): string {
  const value = dimNotYetImplemented(action.info);
  if (action.enabled) return color.muted(value);
  if (/not yet implemented/i.test(action.info)) return value;
  return color.yellow(value);
}

export function renderActions(state: DemoTerminalState, title: string, width?: number): string {
  const lines = state.actions.flatMap((action) => [
    renderActionLine(action),
    `      ${renderInfo(action)}`,
    ''
  ]);
  return panel(color.magenta(title), lines.slice(0, -1), width);
}
