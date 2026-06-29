// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color, dimNotYetImplemented } from './ansi.js';
import { fit, panel } from './terminalBox.js';

export function renderPlayback(state: DemoTerminalState, title: string, width?: number): string {
  const runState = state.playback.runPlaybackEnabled ? color.brightGreen('enabled') : color.yellow('disabled');
  const fullscreenState = state.playback.fullScreenEnabled ? color.brightGreen('enabled') : color.yellow('disabled');
  const queuedRows = state.mediaRows.filter((mediaRow) => mediaRow.queue === 'enqueued');
  const firstQueued = queuedRows[0];
  const isRealDemo = state.runtimeBoundary.adapterMode === 'real-demo';
  const viewportLine = firstQueued
    ? `Viewport: next ${isRealDemo ? 'demo' : 'mock'} media ${fit(firstQueued.fileName, 24)} overlay: ${firstQueued.address}`
    : isRealDemo ? 'Viewport: real demo queue reader not wired yet.' : 'Viewport: no queued mock media yet.';

  return panel(color.magenta(title), [
    `${color.brightCyan('[P]')} Run Playback ${runState}`,
    `Info: ${state.playback.runPlaybackEnabled ? color.brightGreen(state.playback.info) : color.yellow(state.playback.info)}`,
    `Image duration: ${color.brightGreen(String(state.playback.imageDurationSeconds))} seconds`,
    `${color.brightCyan('[F]')} Start full screen playback ${fullscreenState}`,
    `Info: ${dimNotYetImplemented(state.playback.fullScreenInfo)}`,
    queuedRows.length > 0 ? color.queue(viewportLine) : color.muted(viewportLine)
  ], width);
}
