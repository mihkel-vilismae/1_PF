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
import { RealDemoPlaybackStatusRepository } from '../playback/RealDemoPlaybackStatusRepository.js';
import { runOrPlanPlaybackWorker } from '../playback/PhotoFramePlaybackCommandAdapter.js';
import { DbPlaybackRepository } from '../playback/DbPlaybackRepository.js';
import { runDbImagePlaybackButton } from '../playback/DbImagePlaybackButton.js';

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
    if (normalized === 'P') return [this.runPlaybackSelection()];
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


  private runPlaybackSelection(): DemoTerminalState {
    const dbPlayback = new DbPlaybackRepository(this.boundary).read();
    if (dbPlayback.rows.length > 0) return this.runDbImagePlaybackSelection();

    const result = runOrPlanPlaybackWorker(this.boundary);
    this.state = this.buildState([
      'P pressed: playback selected-item display refresh.',
      `Playback command: ${result.command}`,
      `Playback execution: ${result.status}${result.exitCode === null ? '' : ` exit_code=${result.exitCode}`}`,
      ...result.messages.map((message) => `Playback command: ${message}`)
    ]);
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  private runDbImagePlaybackSelection(): DemoTerminalState {
    const result = runDbImagePlaybackButton(this.boundary);
    this.state = this.buildState([
      'P pressed: DB-backed windowed image playback.',
      `DB image playback status: ${result.status}`,
      result.viewerPath ? `Windowed playback viewer: ${result.viewerPath}` : 'Windowed playback viewer: not written',
      result.filePath ? `Selected image file: ${result.filePath}` : 'Selected image file: none',
      result.address ? `Address overlay: ${result.address}` : 'Address overlay: none',
      ...result.messages.map((message) => `DB image playback: ${message}`)
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
      source.queueMessages,
      source.playbackStatus
    );
  }

  private readSources(): {
    mediaRows: ReturnType<RealDemoMediaRepository['listDemoMediaRows']>['rows'];
    mediaMessages: string[];
    truth: ReturnType<RealDemoTruthRepository['readDemoTruth']>;
    queueRows: ReturnType<DbPlaybackRepository['read']>['rows'];
    queueMessages: string[];
    playbackStatus: ReturnType<DbPlaybackRepository['read']>['status'];
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
    const dbPlayback = new DbPlaybackRepository(this.boundary).read();
    const queue = new RealDemoQueueRepository(paths).readDemoQueue();
    const playbackStatus = new RealDemoPlaybackStatusRepository(paths).readPlaybackStatus();
    const useDbPlayback = dbPlayback.rows.length > 0;
    return {
      mediaRows: mediaDiscovery.rows,
      mediaMessages: mediaDiscovery.messages,
      truth,
      queueRows: useDbPlayback ? dbPlayback.rows : queue.rows,
      queueMessages: useDbPlayback ? dbPlayback.messages : queue.messages,
      playbackStatus: useDbPlayback ? dbPlayback.status : playbackStatus
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
    realTimeLog: {
      ...state.realTimeLog,
      lines: [...state.realTimeLog.lines],
      hitboxes: state.realTimeLog.hitboxes.map((hitbox) => ({ ...hitbox }))
    },
    rpiStages: state.rpiStages.map((stage) => ({ ...stage })),
    rpiWorkers: state.rpiWorkers.map((worker) => ({ ...worker })),
    playback: {
      ...state.playback,
      selectedItem: state.playback.selectedItem ? { ...state.playback.selectedItem } : null,
      selectedMessages: [...state.playback.selectedMessages]
    },
    screenOnOff: { ...state.screenOnOff }
  };
}
