// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { fit, panel, row } from './terminalBox.js';

export function renderPlaybackQueue(state: DemoTerminalState, title: string, width?: number): string {
  const queuedRows = state.mediaRows.filter((mediaRow) => mediaRow.queue === 'enqueued');
  const tableWidth = Math.max(42, width ?? 80);
  const innerWidth = tableWidth - 2;
  const numberWidth = 3;
  const typeWidth = 7;
  const addressWidth = Math.max(10, Math.floor(innerWidth * 0.28));
  const fileWidth = Math.max(14, innerWidth - numberWidth - typeWidth - addressWidth - 3);
  const isRealDemo = state.runtimeBoundary.adapterMode === 'real-demo';

  const lines: string[] = [
    color.muted(isRealDemo ? 'Real-demo scaffold: queue reader is planned for Group 5.' : 'Demo playback queue table. Q enqueues eligible rows with resolved addresses.'),
    row([
      { value: '#', width: numberWidth },
      { value: 'File', width: fileWidth },
      { value: 'Type', width: typeWidth },
      { value: 'Address', width: addressWidth }
    ]),
    color.muted('-'.repeat(Math.max(10, innerWidth)))
  ];

  if (queuedRows.length === 0) {
    lines.push(color.yellow(isRealDemo ? 'No real demo queue rows loaded yet.' : 'No queued mock media yet.'));
    lines.push(color.muted(isRealDemo ? `Future source: ${state.runtimeBoundary.queueOutputPath}` : 'Q has not enqueued eligible rows yet.'));
  } else {
    for (const mediaRow of queuedRows) {
      lines.push(
        row([
          { value: String(mediaRow.rowNumber), width: numberWidth },
          { value: fit(mediaRow.fileName, fileWidth), width: fileWidth },
          { value: mediaRow.type, width: typeWidth },
          { value: mediaRow.address || '-', width: addressWidth }
        ])
      );
    }
  }

  return panel(color.magenta(title), lines, tableWidth);
}
