// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState, PlaybackQueueRow } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { fit, panel, row } from './terminalBox.js';

export function renderPlaybackQueue(state: DemoTerminalState, title: string, width?: number): string {
  const isRealDemo = state.runtimeBoundary.adapterMode === 'real-demo';
  const queuedRows = isRealDemo ? state.playbackQueueRows : mockQueueRows(state);
  const tableWidth = Math.max(42, width ?? 80);
  const innerWidth = tableWidth - 2;
  const numberWidth = 3;
  const typeWidth = 7;
  const statusWidth = isRealDemo ? 10 : 0;
  const addressWidth = Math.max(10, Math.floor(innerWidth * 0.25));
  const fileWidth = Math.max(14, innerWidth - numberWidth - typeWidth - addressWidth - statusWidth - (isRealDemo ? 4 : 3));

  const firstSource = queuedRows[0]?.source ?? '';
  const realSourceLabel = firstSource.startsWith('DEMO_DB_PATH')
    ? `DEMO DB queue source: ${state.runtimeBoundary.dbPath}#slideshow_queue`
    : `Real-demo queue source: ${state.runtimeBoundary.queueOutputPath}`;
  const lines: string[] = [
    color.muted(isRealDemo ? realSourceLabel : 'Demo playback queue table. Q enqueues eligible rows with resolved addresses.'),
    row([
      { value: '#', width: numberWidth },
      { value: 'File', width: fileWidth },
      { value: 'Type', width: typeWidth },
      ...(isRealDemo ? [{ value: 'Status', width: statusWidth }] : []),
      { value: 'Address', width: addressWidth }
    ]),
    color.muted('-'.repeat(Math.max(10, innerWidth)))
  ];

  if (queuedRows.length === 0) {
    lines.push(color.yellow(isRealDemo ? 'No real demo queue rows loaded yet.' : 'No queued mock media yet.'));
    if (isRealDemo) lines.push(color.yellow('No DEMO DB slideshow_queue rows loaded yet.'));
    lines.push(color.muted(isRealDemo ? 'Missing/empty DEMO DB queue disables playback safely.' : 'Q has not enqueued eligible rows yet.'));
  } else {
    for (const queueRow of queuedRows) {
      lines.push(row([
        { value: String(queueRow.rowNumber ?? '-'), width: numberWidth },
        { value: fit(queueRow.fileName, fileWidth), width: fileWidth },
        { value: queueRow.type, width: typeWidth },
        ...(isRealDemo ? [{ value: queueRow.status, width: statusWidth }] : []),
        { value: queueRow.address || '-', width: addressWidth }
      ]));
    }
  }

  return panel(color.magenta(title), lines, tableWidth);
}

function mockQueueRows(state: DemoTerminalState): PlaybackQueueRow[] {
  return state.mediaRows
    .filter((mediaRow) => mediaRow.queue === 'enqueued')
    .map((mediaRow) => ({
      queueId: `mock-${mediaRow.rowNumber}`,
      rowNumber: mediaRow.rowNumber,
      fileName: mediaRow.fileName,
      relativePath: mediaRow.relativePath ?? mediaRow.fileName,
      type: mediaRow.type,
      address: mediaRow.address,
      status: mediaRow.queue,
      source: 'mock-media-rows'
    }));
}
