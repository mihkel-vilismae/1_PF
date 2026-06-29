// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState, WorkerStatus } from '../state/DemoTerminalState.js';
import { color, dimNotYetImplemented } from './ansi.js';
import { panel, row } from './terminalBox.js';

function workerStatus(value: WorkerStatus): string {
  if (value === 'Finished') return color.brightGreen(value);
  if (value === 'Started') return color.active(value);
  if (value === 'Disabled') return color.muted(value);
  if (value === 'Error') return color.red(value);
  return color.yellow(value);
}

function workerEvent(value: string): string {
  if (/not yet implemented/i.test(value)) return dimNotYetImplemented(value);
  if (/error|skipped|not eligible|invalid|missing/i.test(value)) return color.danger(value);
  if (value.includes('finished')) return color.brightGreen(value);
  return value;
}

export function renderRpiWorkers(state: DemoTerminalState, title: string, width?: number): string {
  const lines = [
    color.muted(state.runtimeBoundary.adapterMode === 'real-demo' ? `Source: DEMO truth at ${state.runtimeBoundary.workerTruthDir}` : 'Source: mock demo state now; future real terminal reads DEMO worker truth JSONL.'),
    '',
    ...state.rpiWorkers.map((worker) =>
      row([
        { value: color.stage(worker.name), width: 22 },
        { value: workerStatus(worker.status), width: 10 },
        { value: color.muted(`Last called: ${worker.lastCalled}`), width: 25 },
        { value: workerEvent(worker.lastEvent), width: 35 }
      ])
    )
  ];
  return panel(color.stage(title), lines, width);
}
