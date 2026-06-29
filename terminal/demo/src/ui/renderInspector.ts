// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { panel } from './terminalBox.js';

export function renderInspector(state: DemoTerminalState, title: string, width?: number): string {
  const activeAction = state.actions.find((action) => action.active);
  const doneActions = state.actions.filter((action) => action.done).map((action) => `[${action.key}]`).join(', ') || '-';
  const activeLine = state.currentRun.lines.find((line) => line.startsWith('->')) ?? '-';
  const latestStage = [...state.rpiStages].reverse().find((stage) => stage.status !== 'Idle');
  const latestWorker = state.rpiWorkers.find((worker) => worker.status === 'Started' || worker.status === 'Finished' || worker.status === 'Error');
  const manualMode = state.currentRun.lines.some((line) => /Manual storyboard mode/i.test(line));
  const queuedRows = state.mediaRows.filter((row) => row.queue === 'enqueued');
  const skippedRows = state.mediaRows.filter((row) => row.queue === 'not eligible');
  const finalAddress = queuedRows[0]?.address || state.mediaRows[0]?.address || '-';
  const isRealDemo = state.runtimeBoundary.adapterMode === 'real-demo';

  return panel(color.blue(title), [
    `${color.cyan('Layout:')} ${color.brightGreen('A/B/C wide dashboard')} when terminal width allows.`,
    `${color.cyan('Adapter:')} ${state.runtimeBoundary.adapterMode}     ${color.cyan('Readiness:')} ${state.runtimeBoundary.readinessStatus}`,
    `${color.cyan('Mode:')} ${manualMode ? color.yellow('manual storyboard') : color.brightCyan(isRealDemo ? 'real-demo scaffold idle' : 'auto/idle storyboard')}`,
    `${color.cyan('Active action:')} ${activeAction ? color.active(`[${activeAction.key}] ${activeAction.label}`) : color.muted('-')}`,
    `${color.cyan('Completed buttons:')} ${doneActions}`,
    '',
    color.magenta(isRealDemo ? 'Real-demo boundary' : 'Storyboard'),
    isRealDemo
      ? color.muted('Group 3A: real media/truth reads plus dry-run command planning; no DB writes, no worker calls.')
      : activeLine === '-' ? color.muted('No active storyboard step.') : activeLine.replace('->', color.arrow('->')).replace('[ACTIVE]', color.active('[ACTIVE]')),
    `${color.cyan('Current run title:')} ${state.currentRun.title}`,
    '',
    color.magenta(isRealDemo ? 'Latest scaffold state' : 'Latest mock event'),
    `${color.cyan('Stage:')} ${latestStage ? `${latestStage.name} ${latestStage.status} ${latestStage.details || ''}` : color.muted('none')}`,
    `${color.cyan('Worker:')} ${latestWorker ? `${latestWorker.name} ${latestWorker.status} ${latestWorker.lastEvent}` : color.muted('none')}`,
    `${color.cyan('Address:')} ${finalAddress === '-' ? color.muted('-') : color.brightGreen(finalAddress)}`,
    `${color.cyan('Queue policy:')} ${isRealDemo ? 'Future real-demo queue reader will decide from DEMO queue.' : `Q enqueues rows with valid GPS and resolved address. Queued=${queuedRows.length}; skipped=${skippedRows.length}.`}`,
    '',
    color.magenta('Controls'),
    isRealDemo ? color.muted('Q/W/P real execution disabled in Group 3A.') : `${color.brightCyan('Q')} auto-runs the full storyboard.` ,
    isRealDemo ? color.muted('R refreshes boundary; X exits.') : `${color.brightCyan('Right/Left')} manually steps the same path.`,
    isRealDemo ? color.muted('Later: W toggles batch size and Q runs real demo stages.') : `${color.brightCyan('R')} refreshes. ${color.brightCyan('X')} exits.`,
    '',
    color.magenta('Runner log area'),
    color.muted('[L]/[V] are Windows runner controls during install/build/verify.'),
    color.muted(isRealDemo ? 'Real-demo runtime logs will appear after later worker execution slices.' : 'Interactive terminal mock logs will appear here in a future slice.')
  ], width);
}
