// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState, GeocodeStatus, GpsStatus, IndexedStatus, QueueStatus } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { panel, row } from './terminalBox.js';

function indexedStatus(value: IndexedStatus): string {
  return value === 'yes' ? color.brightGreen(value) : color.muted(value);
}

function gpsStatus(value: GpsStatus): string {
  if (value === 'valid') return color.brightGreen(value);
  if (value === 'missing' || value === 'invalid') return color.danger(value);
  return color.muted(value);
}

function geocodeStatus(value: GeocodeStatus): string {
  if (value === 'resolved') return color.brightGreen(value);
  if (value === 'failed') return color.red(value);
  if (value === 'skipped') return color.danger(value);
  return color.muted(value);
}

function queueStatus(value: QueueStatus): string {
  if (value === 'enqueued') return color.queue(value);
  if (value === 'not eligible') return color.danger(value);
  return color.muted(value);
}

export function renderMediaTable(state: DemoTerminalState, title: string, width?: number): string {
  const tableWidth = width ?? 100;
  const compact = tableWidth < 86;
  const lines = [
    color.muted(state.runtimeBoundary.adapterMode === 'real-demo' ? 'Real-demo read-only rows from generated_test_data. No DB/status/truth merge yet.' : 'Hardcoded mock rows. No add/import. No manual file selection.'),
    color.muted(state.runtimeBoundary.adapterMode === 'real-demo' ? `Source: ${state.runtimeBoundary.downloadDir}` : 'Actions use first-N rows; Q processes rows #1-#5 automatically.'),
    '',
    color.brightCyan(renderHeaderRow(compact)),
    color.muted(renderSeparatorRow(compact)),
    ...(state.mediaRows.length === 0 ? [color.yellow('No generated demo media rows discovered by this adapter yet.')] : state.mediaRows.map((mediaRow) => {
      const file = mediaRow.rowNumber === 1 && mediaRow.geocode === 'resolved' ? color.brightGreen(mediaRow.fileName) : mediaRow.fileName;
      return compact
        ? row([
            { value: color.yellow(String(mediaRow.rowNumber)), width: 2 },
            { value: file, width: 25 },
            { value: mediaRow.type === 'video' ? color.magenta(mediaRow.type) : color.cyan(mediaRow.type), width: 5 },
            { value: indexedStatus(mediaRow.indexed), width: 3 },
            { value: gpsStatus(mediaRow.gps), width: 10 },
            { value: geocodeStatus(mediaRow.geocode), width: 8 },
            { value: queueStatus(mediaRow.queue), width: 10 }
          ])
        : row([
            { value: color.yellow(String(mediaRow.rowNumber)), width: 3 },
            { value: file, width: 32 },
            { value: mediaRow.type === 'video' ? color.magenta(mediaRow.type) : color.cyan(mediaRow.type), width: 7 },
            { value: indexedStatus(mediaRow.indexed), width: 9 },
            { value: gpsStatus(mediaRow.gps), width: 12 },
            { value: geocodeStatus(mediaRow.geocode), width: 11 },
            { value: queueStatus(mediaRow.queue), width: 13 },
            { value: mediaRow.address ? color.brightGreen(mediaRow.address) : color.muted('-'), width: 12 }
          ]);
    }))
  ];
  return panel(color.brightCyan(title), lines, width);
}

function renderHeaderRow(compact: boolean): string {
  if (compact) {
    return row([
      { value: '#', width: 2 },
      { value: 'File', width: 25 },
      { value: 'Type', width: 5 },
      { value: 'Idx', width: 3 },
      { value: 'GPS', width: 10 },
      { value: 'Geo', width: 8 },
      { value: 'Queue', width: 10 }
    ]);
  }

  return row([
    { value: '#', width: 3 },
    { value: 'File', width: 32 },
    { value: 'Type', width: 7 },
    { value: 'Indexed', width: 9 },
    { value: 'GPS', width: 12 },
    { value: 'Geocode', width: 11 },
    { value: 'Queue', width: 13 },
    { value: 'Address', width: 12 }
  ]);
}

function renderSeparatorRow(compact: boolean): string {
  if (compact) {
    return row([
      { value: '--', width: 2 },
      { value: '-------------------------', width: 25 },
      { value: '-----', width: 5 },
      { value: '---', width: 3 },
      { value: '----------', width: 10 },
      { value: '--------', width: 8 },
      { value: '----------', width: 10 }
    ]);
  }

  return row([
    { value: '---', width: 3 },
    { value: '--------------------------------', width: 32 },
    { value: '-------', width: 7 },
    { value: '---------', width: 9 },
    { value: '------------', width: 12 },
    { value: '-----------', width: 11 },
    { value: '-------------', width: 13 },
    { value: '------------', width: 12 }
  ]);
}
