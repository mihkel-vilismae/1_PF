// Defines or implements terminal Demo Mode runtime adapter behavior.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import { RealDemoMediaRepository } from '../data/RealDemoMediaRepository.js';
import { createInitialRealDemoState } from '../state/createInitialRealDemoState.js';
import { RealDemoTruthRepository } from '../truth/RealDemoTruthRepository.js';
import { RealDemoQueueRepository } from '../queue/RealDemoQueueRepository.js';
import { buildDryRunCommandPlans, formatDryRunPlanLines } from '../orchestration/DemoDryRunCommandPlanner.js';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { DemoRuntimeAdapter } from './DemoRuntimeAdapter.js';
import type { SupportedBatchSize } from '../run/SupportedBatchSize.js';
import { toggleBatchSize } from '../run/SupportedBatchSize.js';
import { runRealDemoQ } from '../run/RealDemoRunController.js';
import { RunSnapshotStore } from '../run/RunSnapshotStore.js';

/**
 * Group 3B real-demo adapter scaffold.
 *
 * It reads generated demo media/truth/status, lets W toggle selected batch size,
 * and lets Q use that selected size through a guarded manual/no-cron runner.
 * Real worker execution is available only behind PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1.
 */
export class RealDemoRuntimeAdapterPlaceholder implements DemoRuntimeAdapter {
  readonly modeName = 'real-demo';
  private state: DemoTerminalState;
  private selectedBatchSize: SupportedBatchSize = 1;
  private snapshots = new RunSnapshotStore();

  constructor(private readonly boundary: RuntimeBoundaryState) {
    this.state = this.buildState();
  }

  getState(): DemoTerminalState {
    return cloneState(this.state);
  }

  reset(): DemoTerminalState {
    this.selectedBatchSize = 1;
    this.snapshots.setSnapshots([]);
    this.state = this.buildState();
    return this.getState();
  }

  refresh(): DemoTerminalState {
    this.state = this.buildState();
    return this.getState();
  }

  async handleKey(key: string): Promise<DemoTerminalState[]> {
    const normalized = key.toUpperCase();
    if (normalized === 'W') return [this.toggleBatchSize()];
    if (normalized === 'Q') return this.runQStoryboard();
    if (normalized === 'ARROWRIGHT') return [this.stepQStoryboard('right')];
    if (normalized === 'ARROWLEFT') return [this.stepQStoryboard('left')];
    if (normalized === 'R') return [this.refresh()];
    return [this.getState()];
  }

  async runQStoryboard(): Promise<DemoTerminalState[]> {
    const source = this.readSources();
    const frames = runRealDemoQ({
      boundary: this.boundary,
      batchSize: this.selectedBatchSize,
      mediaRows: source.mediaRows,
      mediaMessages: source.mediaMessages,
      truth: source.truth,
      queueRows: source.queueRows,
      queueMessages: source.queueMessages,
      refresh: () => this.readSources()
    });
    this.snapshots.setSnapshots(frames);
    this.state = cloneState(frames[frames.length - 1] ?? this.buildState());
    return frames.map(cloneState);
  }

  stepQStoryboard(direction: 'left' | 'right'): DemoTerminalState {
    this.state = this.snapshots.step(direction, this.state);
    return this.getState();
  }

  private toggleBatchSize(): DemoTerminalState {
    this.selectedBatchSize = toggleBatchSize(this.selectedBatchSize);
    this.state = this.buildState([
      `W pressed: selected batch_size=${this.selectedBatchSize}`,
      'W only changes the setting; it does not run workers.',
      'Press Q to run using the selected batch size.'
    ]);
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  private buildState(extraLines: string[] = []): DemoTerminalState {
    const source = this.readSources();
    const dryRunPlanLines = formatDryRunPlanLines(buildDryRunCommandPlans(this.boundary, source.mediaRows));
    return createInitialRealDemoState(
      this.boundary,
      source.mediaRows,
      source.mediaMessages,
      source.truth,
      [...extraLines, ...dryRunPlanLines],
      this.selectedBatchSize,
      source.queueRows,
      source.queueMessages
    );
  }

  private readSources(): {
    mediaRows: ReturnType<RealDemoMediaRepository['listDemoMediaRows']>['rows'];
    mediaMessages: string[];
    truth: ReturnType<RealDemoTruthRepository['readDemoTruth']>;
    queueRows: ReturnType<RealDemoQueueRepository['readDemoQueue']>['rows'];
    queueMessages: string[];
  } {
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
    const queue = new RealDemoQueueRepository(paths).readDemoQueue();
    return {
      mediaRows: mediaDiscovery.rows,
      mediaMessages: mediaDiscovery.messages,
      truth,
      queueRows: queue.rows,
      queueMessages: queue.messages
    };
  }
}

function cloneState(state: DemoTerminalState): DemoTerminalState {
  return {
    ...state,
    runtimeBoundary: { ...state.runtimeBoundary, pathMessages: [...state.runtimeBoundary.pathMessages] },
    mediaRows: state.mediaRows.map((row) => ({ ...row })),
    playbackQueueRows: state.playbackQueueRows.map((row) => ({ ...row })),
    actions: state.actions.map((action) => ({ ...action })),
    currentRun: { ...state.currentRun, lines: [...state.currentRun.lines] },
    rpiStages: state.rpiStages.map((stage) => ({ ...stage })),
    rpiWorkers: state.rpiWorkers.map((worker) => ({ ...worker })),
    playback: { ...state.playback },
    screenOnOff: { ...state.screenOnOff }
  };
}
