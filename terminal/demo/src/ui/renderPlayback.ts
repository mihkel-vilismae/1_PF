// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState, PlaybackQueueRow } from '../state/DemoTerminalState.js';
import { color, dimNotYetImplemented } from './ansi.js';
import { fit, panel } from './terminalBox.js';

export function renderPlayback(state: DemoTerminalState, title: string, width?: number): string {
  const runState = state.playback.runPlaybackEnabled ? color.brightGreen('enabled') : color.yellow('disabled');
  const fullscreenState = state.playback.fullScreenEnabled ? color.brightGreen('enabled') : color.yellow('disabled');
  const isRealDemo = state.runtimeBoundary.adapterMode === 'real-demo';
  const queuedRows = isRealDemo ? state.playbackQueueRows : mockQueueRows(state);
  const selected = state.playback.selectedItem;
  const selectedLine = selected
    ? `Selected: ${fit(selected.fileName, 24)} type=${selected.type} status=${selected.status}`
    : isRealDemo ? `Selected: waiting (${state.playback.selectedStatus})` : 'Selected: no mock playback item yet.';
  const addressLine = selected
    ? `Overlay: ${selected.address || '-'} duration=${selected.durationSeconds ?? state.playback.imageDurationSeconds}s`
    : 'Overlay: -';
  const viewportLine = selected
    ? `Viewport: selected ${isRealDemo ? 'real demo' : 'mock'} media ${fit(selected.fileName, 24)} overlay: ${selected.address || '-'}`
    : buildNextQueuedLine(isRealDemo, queuedRows);

  return panel(color.magenta(title), [
    `${color.brightCyan('[P]')} Run Playback ${runState}`,
    `Info: ${state.playback.runPlaybackEnabled ? color.brightGreen(state.playback.info) : color.yellow(state.playback.info)}`,
    color.queue(selectedLine),
    selected ? color.queue(addressLine) : color.muted(addressLine),
    isRealDemo ? color.muted(`Status source: ${state.playback.selectedSourcePath || 'waiting for playback-worker-status.json'}`) : color.muted('Status source: mock state'),
    `Image duration: ${color.brightGreen(String(state.playback.imageDurationSeconds))} seconds`,
    `${color.brightCyan('[F]')} Start full screen playback ${fullscreenState}`,
    `Info: ${dimNotYetImplemented(state.playback.fullScreenInfo)}`,
    selected || queuedRows.length > 0 ? color.queue(viewportLine) : color.muted(viewportLine)
  ], width);
}

function buildNextQueuedLine(isRealDemo: boolean, queuedRows: PlaybackQueueRow[]): string {
  const firstQueued = queuedRows[0];
  if (!firstQueued) return isRealDemo ? 'Viewport: real demo queue empty or missing.' : 'Viewport: no queued mock media yet.';
  return `Viewport: next ${isRealDemo ? 'real demo' : 'mock'} media ${fit(firstQueued.fileName, 24)} overlay: ${firstQueued.address}`;
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
