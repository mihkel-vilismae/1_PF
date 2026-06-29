// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { panel } from './terminalBox.js';

export function renderHeader(state: DemoTerminalState, title: string, width?: number): string {
  const boundary = state.runtimeBoundary;
  const statusColor = boundary.readinessStatus === 'ready'
    ? color.brightGreen
    : boundary.readinessStatus === 'mock'
      ? color.yellow
      : color.danger;

  return panel(color.brightGreen(title), [
    `${color.cyan('Runtime:')} ${color.brightCyan(boundary.runtimeMode.toUpperCase())}     ${color.cyan('Adapter:')} ${color.magenta(boundary.adapterMode)}     ${color.cyan('Version:')} ${color.magenta(`v${state.version}`)}     ${color.cyan('No cron:')} ${color.brightGreen('yes')}`,
    `${color.cyan('Readiness:')} ${statusColor(boundary.readinessStatus.toUpperCase())}     ${color.cyan('Data:')} ${color.yellow(state.dataMode)}     ${color.cyan('Source:')} ${boundary.sourceSummary}`,
    color.yellow(state.warning),
    `${color.green('Boundary:')} terminal UI owns rendering/keys only; runtime adapter owns data source and worker calls.`,
    `${color.cyan('Repo root:')} ${boundary.repoRoot}`,
    `${color.cyan('Demo DB:')} ${boundary.dbPath}`,
    `${color.cyan('Demo media:')} ${boundary.downloadDir}`,
    `${color.cyan('Demo truth:')} ${boundary.workerTruthDir}`
  ], width);
}
