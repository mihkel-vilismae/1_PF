// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import process from 'node:process';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { TerminalLayout } from '../layout/readTerminalLayout.js';
import { titleFor } from '../layout/readTerminalLayout.js';
import { sectionTitle } from '../layout/sectionHeaderIds.js';
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
import { renderStartStageModal } from './renderStartStageModal.js';
import { renderEmptyView } from './renderEmptyView.js';
import { renderViewZero } from './renderViewZero.js';
import { renderIcloudAuthorization } from './renderIcloudAuthorization.js';
import { renderIcloudLoginView } from './renderIcloudLoginView.js';

const WIDE_LAYOUT_MIN_COLUMNS = 180;
const DEFAULT_NON_TTY_COLUMNS = 220;

export function renderScreen(state: DemoTerminalState, layout: TerminalLayout, terminalWidth = resolveTerminalWidth()): string {
  if (state.activeViewKey === '0') {
    return [renderViewZero(state, Math.min(terminalWidth, DEFAULT_NON_TTY_COLUMNS)), color.muted(helpText(state))].join('\n');
  }

  if (state.activeViewKey === 'I') {
    return [renderIcloudLoginView(state, Math.min(terminalWidth, DEFAULT_NON_TTY_COLUMNS)), color.muted(helpText(state))].join('\n');
  }

  if (state.activeViewKey !== 'D') {
    return [renderEmptyView(state, Math.min(terminalWidth, DEFAULT_NON_TTY_COLUMNS)), color.muted(helpText(state))].join('\n');
  }

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
    ? 'Help: View keys 0/D/L/I/1-6 switch view shells when no modal owns input. H toggles section header IDs. S opens start_stage_modal. W toggles Q batch size. Q/P keep existing behavior. R refreshes. X exits. No cron.'
    : 'Help: View keys 0/D/L/I/1-6 switch view shells when no modal owns input. H toggles section header IDs. S opens start_stage_modal. Q auto-runs the storyboard. R refreshes. X exits. Visual mock state only.';
}

function renderWideScreen(state: DemoTerminalState, layout: TerminalLayout, terminalWidth: number): string {
  const separatorWidth = 4;
  const available = Math.max(WIDE_LAYOUT_MIN_COLUMNS - separatorWidth, terminalWidth - separatorWidth);
  const panelAWidth = Math.max(62, Math.floor(available * 0.36));
  const panelBWidth = Math.max(60, Math.floor(available * 0.34));
  const panelCWidth = Math.max(46, available - panelAWidth - panelBWidth);
  const showIds = state.sectionHeaderIdsVisible;

  const panelA = stackBlocks([
    renderHeader(state, sectionTitle(showIds, 'banner', state.banner), panelAWidth),
    renderMediaTable(state, sectionTitle(showIds, 'media', mediaTitle(state)), panelAWidth),
    renderActions(state, sectionTitle(showIds, 'actions', titleFor(layout, 'actions', 'ACTIONS')), panelAWidth),
    renderIcloudAuthorization(sectionTitle(showIds, 'icloudAuthorization', 'ICLOUDPD AUTHORIZATION'), panelAWidth),
    renderStartStageModal(state, panelAWidth, sectionTitle(showIds, 'startStageModal', 'START STAGE MODAL'))
  ]);

  const panelB = stackBlocks([
    renderCurrentRun(state, sectionTitle(showIds, 'currentRun', titleFor(layout, 'current_run', 'AREA B COMMAND PLAN')), panelBWidth),
    renderPlayback(state, sectionTitle(showIds, 'playback', titleFor(layout, 'playback', 'AREA C PLAYBACK / PREVIEW')), panelBWidth),
    renderScreenOnOff(state, sectionTitle(showIds, 'screenOnOff', titleFor(layout, 'screen_on_off', 'SCREEN ON/OFF WORKER')), panelBWidth),
    renderPlaybackQueue(state, sectionTitle(showIds, 'playbackQueue', 'PLAYBACK_QUEUE'), panelBWidth)
  ]);

  const panelC = stackBlocks([
    renderRpiStages(state, sectionTitle(showIds, 'rpiStages', stagesTitle(state)), panelCWidth),
    renderRpiWorkers(state, sectionTitle(showIds, 'rpiWorkers', workersTitle(state)), panelCWidth),
    renderInspector(state, sectionTitle(showIds, 'inspector', 'STORYBOARD / INSPECTOR'), panelCWidth),
    renderRealTimeLog(state, panelCWidth, sectionTitle(showIds, 'realTimeLog', state.realTimeLog.title))
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
  const showIds = state.sectionHeaderIdsVisible;
  return [
    renderHeader(state, sectionTitle(showIds, 'banner', state.banner)),
    blank(),
    renderMediaTable(state, sectionTitle(showIds, 'media', mediaTitle(state))),
    blank(),
    renderActions(state, sectionTitle(showIds, 'actions', titleFor(layout, 'actions', 'ACTIONS'))),
    blank(),
    renderIcloudAuthorization(sectionTitle(showIds, 'icloudAuthorization', 'ICLOUDPD AUTHORIZATION')),
    ...(state.startStageModal.isOpen ? [blank(), renderStartStageModal(state, undefined, sectionTitle(showIds, 'startStageModal', 'START STAGE MODAL'))] : []),
    blank(),
    renderCurrentRun(state, sectionTitle(showIds, 'currentRun', titleFor(layout, 'current_run', 'AREA B COMMAND PLAN'))),
    blank(),
    renderRpiStages(state, sectionTitle(showIds, 'rpiStages', stagesTitle(state))),
    blank(),
    renderRpiWorkers(state, sectionTitle(showIds, 'rpiWorkers', workersTitle(state))),
    blank(),
    renderPlayback(state, sectionTitle(showIds, 'playback', titleFor(layout, 'playback', 'AREA C PLAYBACK / PREVIEW'))),
    blank(),
    renderScreenOnOff(state, sectionTitle(showIds, 'screenOnOff', titleFor(layout, 'screen_on_off', 'SCREEN ON/OFF WORKER'))),
    blank(),
    renderPlaybackQueue(state, sectionTitle(showIds, 'playbackQueue', 'PLAYBACK_QUEUE')),
    blank(),
    renderInspector(state, sectionTitle(showIds, 'inspector', 'STORYBOARD / INSPECTOR')),
    blank(),
    renderRealTimeLog(state, undefined, sectionTitle(showIds, 'realTimeLog', state.realTimeLog.title)),
    blank(),
    color.muted(helpText(state))
  ].join('\n');
}

function resolveTerminalWidth(): number {
  const override = Number.parseInt(process.env.TERMINAL_DEMO_COLUMNS ?? '', 10);
  if (Number.isFinite(override) && override > 0) return override;
  return process.stdout.columns ?? DEFAULT_NON_TTY_COLUMNS;
}
