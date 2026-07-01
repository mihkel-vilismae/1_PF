// Renders the terminal start-stage modal.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { StartStageModalRow } from '../startStageModal/StartStageModalState.js';
import { color } from './ansi.js';
import { panel } from './terminalBox.js';

export function renderStartStageModal(state: DemoTerminalState, width?: number, title = 'START STAGE MODAL'): string {
  const modal = state.startStageModal;
  if (!modal.isOpen) return '';
  const lines = [
    `${color.brightCyan(modal.elementId)} — manual stage starts`,
    color.muted('Batch 1 shell: key 1 is disabled; keys 2-5 do not call workers until shared-path wiring lands.'),
    '',
    ...modal.rows.map(renderRow),
    '',
    color.muted(`Status: ${modal.lastMessage}`)
  ];
  return panel(color.magenta(title), lines, width);
}

function renderRow(row: StartStageModalRow): string {
  const key = row.enabled ? color.brightCyan(`[${row.key}]`) : color.yellow(`[${row.key}]`);
  const status = row.enabled ? row.status : 'disabled';
  const disabled = row.enabled ? '' : color.yellow(' disabled');
  return `${key} ${row.label.padEnd(20)} batch_size=${row.batchSize} status=${status}${disabled} — ${row.action}`;
}
