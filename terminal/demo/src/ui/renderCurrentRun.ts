// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { panel } from './terminalBox.js';

function isProblemLine(line: string): boolean {
  if (/Expected not eligible from discovered fixture metadata:\s*none/i.test(line)) return false;
  if (/failed_or_missing=0/i.test(line)) return false;
  if (/status:\s*(passed|finished)/i.test(line)) return false;
  return /not eligible|skipped|invalid GPS|missing GPS|no address|Error logged|Error:|warning|failed|blocked|Start-Process failed|missing/i.test(line);
}

function decorateLine(line: string): string {
  if (line.startsWith('->')) {
    const withArrow = line.replace('->', color.arrow('->'));
    if (isProblemLine(line)) return withArrow.replace('[ACTIVE]', color.activeProblem('[ACTIVE]'));
    return withArrow.replace('[ACTIVE]', color.active('[ACTIVE]'));
  }
  if (line.includes('[DONE]')) {
    const cleanLine = line.replaceAll('**', '');
    return isProblemLine(cleanLine) ? color.doneProblem(cleanLine) : color.done(cleanLine);
  }
  if (isProblemLine(line)) return color.danger(line);
  if (line.startsWith('Address:')) return color.brightGreen(line);
  if (line.startsWith('Queue:')) return color.yellow(line);
  if (line.startsWith('Result:')) return color.brightGreen(line);
  if (line.startsWith('Action:')) return color.brightCyan(line);
  if (line.startsWith('Stage chain') || line.startsWith('Stage result') || line.startsWith('Expanded stage chain')) return color.magenta(line);
  return line;
}

export function renderCurrentRun(state: DemoTerminalState, title: string, width?: number): string {
  return panel(color.blue(title), state.currentRun.lines.map(decorateLine), width);
}
