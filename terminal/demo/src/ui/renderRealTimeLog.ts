// Renders the real-demo realtime log panel and keeps diagnostics out of the command plan.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { panel } from './terminalBox.js';

function isProblemLine(line: string): boolean {
  if (/failed_or_missing=0|Q action event written/i.test(line)) return false;
  if (/status:\s*(passed|finished)/i.test(line)) return false;
  return /error|failed|blocked|missing|invalid|warning|start-process failed|not configured/i.test(line);
}

function decorateLogLine(line: string): string {
  if (line.startsWith('Mouse hitbox:') || line.startsWith('Log panel:') || line.startsWith('Mouse wheel:')) return color.brightCyan(line);
  if (line.includes('Q action event written:')) return color.brightGreen(line);
  if (line.startsWith('Queue read: Real table verified:')) return color.brightGreen(line);
  if (isProblemLine(line)) return color.dangerDim(line);
  if (line.startsWith('Queue read:') || line.startsWith('Truth read:') || line.startsWith('Path check:')) return color.muted(line);
  return line;
}

function visibleLines(state: DemoTerminalState): string[] {
  const log = state.realTimeLog;
  if (log.collapsed) {
    return [
      color.muted('Log panel collapsed. Click [+] or press supported proof hitbox to expand.'),
      color.muted(`Buffered log lines: ${log.lines.length}`)
    ];
  }

  const rows = Math.max(1, log.visibleRows);
  const offset = Math.max(0, log.scrollOffset);
  const end = Math.max(0, log.lines.length - offset);
  const start = Math.max(0, end - rows);
  const selected = log.lines.slice(start, end);
  return selected.length > 0 ? selected.map(decorateLogLine) : [color.muted('No real-demo diagnostics yet.')];
}

export function renderRealTimeLog(state: DemoTerminalState, width?: number): string {
  const marker = state.realTimeLog.collapsed ? '[+]' : '[-]';
  const focus = state.realTimeLog.focused ? ' FOCUSED' : '';
  const scroll = state.realTimeLog.scrollOffset > 0 ? ` scroll=${state.realTimeLog.scrollOffset}` : '';
  const title = `${color.blue(state.realTimeLog.title)} ${color.brightCyan(marker)}${color.muted(focus + scroll)}`;
  return panel(title, visibleLines(state), width);
}
