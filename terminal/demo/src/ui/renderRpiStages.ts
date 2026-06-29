// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState, StageStatus } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { panel, row } from './terminalBox.js';

function isProblemDetail(value: string): boolean {
  return /not_eligible|not eligible|skipped|invalid|missing|error/i.test(value);
}

function stageStatus(value: StageStatus, details = ''): string {
  if (value === 'Finished') return isProblemDetail(details) ? color.doneProblem(value) : color.brightGreen(value);
  if (value === 'Started') return color.active(value);
  if (value === 'Error') return color.danger(value);
  return color.muted(value);
}

export function renderRpiStages(state: DemoTerminalState, title: string, width?: number): string {
  const lines = [
    color.muted(state.runtimeBoundary.adapterMode === 'real-demo' ? `Source: DEMO truth at ${state.runtimeBoundary.workerTruthDir}` : 'Source: mock demo state now; future real terminal reads DEMO worker truth JSONL.'),
    '',
    ...state.rpiStages.map((stage) =>
      row([
        { value: color.stage(stage.name), width: 15 },
        { value: stageStatus(stage.status, stage.details), width: 10 },
        { value: stage.details ? (isProblemDetail(stage.details) ? color.danger(stage.details) : color.yellow(stage.details)) : color.muted('-'), width: 65 }
      ])
    )
  ];
  return panel(color.stage(title), lines, width);
}
