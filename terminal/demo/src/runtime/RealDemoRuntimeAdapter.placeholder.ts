// Defines or implements terminal Demo Mode runtime adapter behavior.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import { RealDemoMediaRepository } from '../data/RealDemoMediaRepository.js';
import { createInitialRealDemoState } from '../state/createInitialRealDemoState.js';
import { RealDemoTruthRepository } from '../truth/RealDemoTruthRepository.js';
import { buildDryRunCommandPlans, formatDryRunPlanLines } from '../orchestration/DemoDryRunCommandPlanner.js';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { DemoRuntimeAdapter } from './DemoRuntimeAdapter.js';

/**
 * Group 3A real-demo scaffold.
 *
 * This adapter reads generated demo media/truth/status and builds a dry-run
 * command plan for future manual worker execution. It still does not call
 * workers, mutate DB rows, write truth JSONL, or populate the real queue.
 */
export class RealDemoRuntimeAdapterPlaceholder implements DemoRuntimeAdapter {
  readonly modeName = 'real-demo';
  private state: DemoTerminalState;

  constructor(private readonly boundary: RuntimeBoundaryState) {
    this.state = this.buildState();
  }

  getState(): DemoTerminalState {
    return cloneState(this.state);
  }

  reset(): DemoTerminalState {
    this.state = this.buildState();
    return this.getState();
  }

  refresh(): DemoTerminalState {
    this.state = this.buildState();
    return this.getState();
  }

  async handleKey(key: string): Promise<DemoTerminalState[]> {
    const normalized = key.toUpperCase();
    if (normalized === 'R') return [this.refresh()];
    return [this.getState()];
  }

  async runQStoryboard(): Promise<DemoTerminalState[]> {
    return [this.getState()];
  }

  stepQStoryboard(): DemoTerminalState {
    return this.getState();
  }

  private buildState(): DemoTerminalState {
    const paths = {
      repoRoot: this.boundary.repoRoot,
      dbPath: this.boundary.dbPath,
      downloadDir: this.boundary.downloadDir,
      workerTruthDir: this.boundary.workerTruthDir,
      schedulerDir: this.boundary.schedulerDir,
      logDir: this.boundary.logDir,
      runtimeOutputDir: this.boundary.runtimeOutputDir,
      queueOutputPath: this.boundary.queueOutputPath
    };
    const mediaDiscovery = new RealDemoMediaRepository(paths).listDemoMediaRows();
    const truth = new RealDemoTruthRepository(paths).readDemoTruth();
    const dryRunPlanLines = formatDryRunPlanLines(buildDryRunCommandPlans(this.boundary, mediaDiscovery.rows));

    return createInitialRealDemoState(this.boundary, mediaDiscovery.rows, mediaDiscovery.messages, truth, dryRunPlanLines);
  }
}

function cloneState(state: DemoTerminalState): DemoTerminalState {
  return {
    ...state,
    runtimeBoundary: { ...state.runtimeBoundary, pathMessages: [...state.runtimeBoundary.pathMessages] },
    mediaRows: state.mediaRows.map((row) => ({ ...row })),
    actions: state.actions.map((action) => ({ ...action })),
    currentRun: { ...state.currentRun, lines: [...state.currentRun.lines] },
    rpiStages: state.rpiStages.map((stage) => ({ ...stage })),
    rpiWorkers: state.rpiWorkers.map((worker) => ({ ...worker })),
    playback: { ...state.playback },
    screenOnOff: { ...state.screenOnOff }
  };
}
