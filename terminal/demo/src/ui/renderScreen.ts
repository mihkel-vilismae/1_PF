// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import process from 'node:process';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { TerminalLayout } from '../layout/readTerminalLayout.js';
import { titleFor } from '../layout/readTerminalLayout.js';
import { color } from './ansi.js';
import { blank, joinColumns, stackBlocks } from './terminalBox.js';
import { renderActions } from './renderActions.js';
import { renderCurrentRun } from './renderCurrentRun.js';
import { renderHeader } from './renderHeader.js';
import { renderInspector } from './renderInspector.js';
import { renderMediaTable } from './renderMediaTable.js';
import { renderPlayback } from './renderPlayback.js';
import { renderPlaybackQueue } from './renderPlaybackQueue.js';
import { renderRealTimeLog } from './renderRealTimeLog.js';
import { renderRpiStages } from './renderRpiStages.js';
import { renderRpiWorkers } from './renderRpiWorkers.js';
import { renderScreenOnOff } from './renderScreenOnOff.js';

const WIDE_LAYOUT_MIN_COLUMNS = 180;
const DEFAULT_NON_TTY_COLUMNS = 220;

export function renderScreen(state: DemoTerminalState, layout: TerminalLayout, terminalWidth = resolveTerminalWidth()): string {
  if (terminalWidth >= WIDE_LAYOUT_MIN_COLUMNS) {
    return renderWideScreen(state, layout, terminalWidth);
  }

  return renderStackedScreen(state, layout);
}

function mediaTitle(state: DemoTerminalState): string {
  return state.runtimeBoundary.adapterMode === 'real-demo' ? 'GENERATED DEMO MEDIA' : 'MOCK DEMO MEDIA';
}

function stagesTitle(state: DemoTerminalState): string {
  return state.runtimeBoundary.adapterMode === 'real-demo' ? 'RPI-STAGES — DEMO TRUTH' : 'RPI-STAGES — MOCK DEMO STATE';
}

function workersTitle(state: DemoTerminalState): string {
  return state.runtimeBoundary.adapterMode === 'real-demo' ? 'RPI-WORKERS — DEMO TRUTH' : 'RPI-WORKERS — MOCK DEMO STATE';
}

function helpText(state: DemoTerminalState): string {
  return state.runtimeBoundary.adapterMode === 'real-demo'
    ? 'Help: Real-demo operator path. Area A=logs, Area B=command plan, Area C=playback/status. W toggles batch size. Q uses selected size. R refreshes. X exits. No cron.'
    : 'Help: Q auto-runs the storyboard. RIGHT/LEFT enters manual storyboard mode. R refreshes. X exits. Visual mock state only.';
}

function renderWideScreen(state: DemoTerminalState, layout: TerminalLayout, terminalWidth: number): string {
  const separatorWidth = 4;
  const available = Math.max(WIDE_LAYOUT_MIN_COLUMNS - separatorWidth, terminalWidth - separatorWidth);
  const panelAWidth = Math.max(62, Math.floor(available * 0.36));
  const panelBWidth = Math.max(60, Math.floor(available * 0.34));
  const panelCWidth = Math.max(46, available - panelAWidth - panelBWidth);

  const panelA = stackBlocks([
    renderHeader(state, state.banner, panelAWidth),
    renderMediaTable(state, mediaTitle(state), panelAWidth),
    renderActions(state, titleFor(layout, 'actions', 'ACTIONS'), panelAWidth)
  ]);

  const panelB = stackBlocks([
    renderCurrentRun(state, titleFor(layout, 'current_run', 'AREA B COMMAND PLAN'), panelBWidth),
    renderPlayback(state, titleFor(layout, 'playback', 'AREA C PLAYBACK / PREVIEW'), panelBWidth),
    renderScreenOnOff(state, titleFor(layout, 'screen_on_off', 'SCREEN ON/OFF WORKER'), panelBWidth),
    renderPlaybackQueue(state, 'PLAYBACK_QUEUE', panelBWidth)
  ]);

  const panelC = stackBlocks([
    renderRpiStages(state, stagesTitle(state), panelCWidth),
    renderRpiWorkers(state, workersTitle(state), panelCWidth),
    renderInspector(state, 'STORYBOARD / INSPECTOR', panelCWidth),
    renderRealTimeLog(state, panelCWidth)
  ]);

  return [
    joinColumns([
      { content: panelA, width: panelAWidth },
      { content: panelB, width: panelBWidth },
      { content: panelC, width: panelCWidth }
    ]),
    color.muted(helpText(state))
  ].join('\n');
}

function renderStackedScreen(state: DemoTerminalState, layout: TerminalLayout): string {
  return [
    renderHeader(state, state.banner),
    blank(),
    renderMediaTable(state, mediaTitle(state)),
    blank(),
    renderActions(state, titleFor(layout, 'actions', 'ACTIONS')),
    blank(),
    renderCurrentRun(state, titleFor(layout, 'current_run', 'AREA B COMMAND PLAN')),
    blank(),
    renderRpiStages(state, stagesTitle(state)),
    blank(),
    renderRpiWorkers(state, workersTitle(state)),
    blank(),
    renderPlayback(state, titleFor(layout, 'playback', 'AREA C PLAYBACK / PREVIEW')),
    blank(),
    renderScreenOnOff(state, titleFor(layout, 'screen_on_off', 'SCREEN ON/OFF WORKER')),
    blank(),
    renderPlaybackQueue(state, 'PLAYBACK_QUEUE'),
    blank(),
    renderInspector(state, 'STORYBOARD / INSPECTOR'),
    blank(),
    renderRealTimeLog(state),
    blank(),
    color.muted(helpText(state))
  ].join('\n');
}

function resolveTerminalWidth(): number {
  const override = Number.parseInt(process.env.TERMINAL_DEMO_COLUMNS ?? '', 10);
  if (Number.isFinite(override) && override > 0) return override;
  return process.stdout.columns ?? DEFAULT_NON_TTY_COLUMNS;
}
