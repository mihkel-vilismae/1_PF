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
import type { TerminalMouseEvent } from '../ui/terminalMouse.js';
import { cloneStartStageModalState, createStartStageModalState, handleStartStageModalKey, markStartStageModalRowStatus, openStartStageModal, type ManualStageKey } from '../startStageModal/StartStageModalState.js';
import { cloneDemoTerminalState } from '../state/cloneDemoTerminalState.js';
import { findHitbox } from '../ui/terminalMouse.js';
import { runManualStageFromModal } from '../run/ManualStageRunController.js';
import { canSwitchTerminalView, withActiveTerminalView } from '../views/TerminalViewState.js';
import type { TerminalViewKey } from '../views/TerminalViewRegistry.js';
import { isView6FixtureButtonKey, runView6FixturePlayback } from '../playback/View6FixturePlayback.js';
import { createView0TestSelectorState, type View0TestSelectorState } from '../view0/View0TestSelectorState.js';
import { handleView0DefaultEnter, handleView0SelectorInput, writeView0Opened } from '../view0/View0DefaultTestRouteController.js';
import { applyScreenOnOffState, createInitialScreenOnOffState, recordScreenOnOffActivity, toggleScreenOnOffState, type ScreenMonitorActivityInput } from '../screenOnOff/terminalScreenMonitorState.js';

export class RealDemoRuntimeAdapterPlaceholder implements DemoRuntimeAdapter {
  readonly modeName = 'real-demo';
  private state: DemoTerminalState;
  private selectedBatchSize: SupportedBatchSize = 1;
  private snapshots = new RunSnapshotStore();
  private logCollapsed = false;
  private logFocused = false;
  private logScrollOffset = 0;
  private uiLogLines: string[] = [];
  private lastActivityAt = Date.now();
  private latestScreenStatus = 'waiting for keyboard/mouse activity';
  private startStageModal = createStartStageModalState(false);
  private sectionHeaderIdsVisible = false;
  private activeViewKey: TerminalViewKey = 'D';
  private view0TestSelector: View0TestSelectorState = createView0TestSelectorState();
  private activeTestPageCode: string | null = null;
  private screenMonitor = createInitialScreenOnOffState();

  constructor(private readonly boundary: RuntimeBoundaryState) {
    this.state = this.buildState();
  }

  getState(): DemoTerminalState {
    return cloneDemoTerminalState(this.state);
  }

  // Restores the real-demo adapter to the initial default view and local state.
  reset(): DemoTerminalState {
    this.selectedBatchSize = 1;
    this.snapshots.setSnapshots([]);
    this.logCollapsed = false;
    this.logFocused = false;
    this.logScrollOffset = 0;
    this.uiLogLines = [];
    this.lastActivityAt = Date.now();
    this.latestScreenStatus = 'waiting for keyboard/mouse activity';
    this.startStageModal = createStartStageModalState(false);
    this.sectionHeaderIdsVisible = false;
    this.activeViewKey = 'D';
    this.view0TestSelector = createView0TestSelectorState();
    this.activeTestPageCode = null;
    this.screenMonitor = createInitialScreenOnOffState();
    this.state = this.buildState();
    return this.getState();
  }

  // Rebuilds state from current demo sources without changing view-local state.
  refresh(): DemoTerminalState {
    this.state = this.buildState();
    return this.getState();
  }

  // Handles keyboard input while preserving modal priority and active-view ownership.
  async handleKey(key: string): Promise<DemoTerminalState[]> {
    this.noteInputActivity(`keyboard ${key.toUpperCase() || 'input'}`);
    const normalized = key.toUpperCase();
    if (normalized === 'F') return [this.toggleScreenMonitor()];
    if (normalized === 'S') return [this.openStartStageModal()];
    if (normalized === 'H') return [this.toggleSectionHeaderIds()];
    if (isManualStageKey(normalized) && this.startStageModal.isOpen) return [this.handleStartStageModalKey(normalized)];
    if (normalized === 'ENTER' && this.activeViewKey === '0') return [this.handleView0Enter()];
    if (this.activeViewKey === '0' && this.view0TestSelector.step !== 'closed' && this.view0TestSelector.step !== 'routed' && /^[0-9A-Z]$/.test(normalized)) {
      const result = handleView0SelectorInput({ selector: this.view0TestSelector, key: normalized });
      this.view0TestSelector = result.selector;
      this.state = this.buildState(result.messages);
      return [this.getState()];
    }
    if (this.activeViewKey === '6' && isView6FixtureButtonKey(normalized)) return [this.runView6FixturePlayback(normalized)];
    if (canSwitchTerminalView(normalized, this.startStageModal.isOpen)) return [this.switchView(normalized)];
    if (normalized === 'W') return [this.toggleBatchSize()];
    if (normalized === 'Q') return this.runQStoryboard();
    if (normalized === 'P') return [this.runPlaybackSelection()];
    if (normalized === 'ARROWRIGHT') return [this.stepQStoryboard('right')];
    if (normalized === 'ARROWLEFT') return [this.stepQStoryboard('left')];
    if (normalized === 'R') return [this.refresh()];
    return [this.getState()];
  }

  // Records one local screen-monitor input without running real screen power actions.
  async handleScreenMonitorActivity(input: ScreenMonitorActivityInput): Promise<DemoTerminalState> {
    this.screenMonitor = recordScreenOnOffActivity(this.screenMonitor, input);
    this.state = this.buildState([`${input.detail}: screen-worker monitor recorded local ${input.source} activity.`]);
    return this.getState();
  }

  // Handles terminal mouse events for existing log-panel hitboxes.
  handleMouse(event: TerminalMouseEvent): DemoTerminalState[] {
    if (event.kind === 'release') return [this.getState()];
    this.noteInputActivity(`mouse ${event.kind}`);
    const hit = findHitbox(this.state.realTimeLog.hitboxes, event);
    if (event.kind === 'wheel-up' || event.kind === 'wheel-down') {
      if (hit.hitboxId === 'area-a-log-panel' || hit.hitboxId === 'area-a-collapse-toggle') {
        const delta = event.kind === 'wheel-up' ? 1 : -1;
        this.logScrollOffset = Math.max(0, this.logScrollOffset + delta);
        this.logFocused = true;
        this.appendUiLog(`Mouse wheel: ${event.kind} over Area A; scroll_offset=${this.logScrollOffset}`);
        this.state = this.buildState();
      } else {
        this.appendUiLog(`Mouse wheel: ${event.kind} ignored; hitbox=${hit.hitboxId}`);
        this.state = this.buildState();
      }
      return [this.getState()];
    }

    if (hit.hitboxId === 'area-a-collapse-toggle') {
      this.logCollapsed = !this.logCollapsed;
      this.logFocused = true;
      this.appendUiLog(`Mouse hitbox: area-a-collapse-toggle clicked; log_panel=${this.logCollapsed ? 'collapsed' : 'expanded'}`);
    } else if (hit.hitboxId === 'area-a-log-panel') {
      this.logFocused = true;
      this.appendUiLog(`Mouse hitbox: area-a-log-panel clicked at x=${event.x} y=${event.y}`);
    } else {
      this.logFocused = false;
      this.appendUiLog(`Mouse hitbox: ${hit.hitboxId} clicked at x=${event.x} y=${event.y}`);
    }
    this.state = this.buildState();
    return [this.getState()];
  }

  // Runs the existing Q storyboard path and stores frames for left/right stepping.
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
    this.state = cloneDemoTerminalState(frames[frames.length - 1] ?? this.buildState());
    return frames.map(cloneDemoTerminalState);
  }

  // Moves through stored Q storyboard frames without rerunning workers.
  stepQStoryboard(direction: 'left' | 'right'): DemoTerminalState {
    this.state = this.snapshots.step(direction, this.state);
    return this.getState();
  }

  // Opens the existing manual start-stage modal.
  private openStartStageModal(): DemoTerminalState {
    this.startStageModal = openStartStageModal(this.startStageModal);
    this.state = this.buildState(['S pressed: start_stage_modal opened.']);
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  // Routes number keys to the start-stage modal while it owns input.
  private handleStartStageModalKey(key: ManualStageKey): DemoTerminalState {
    const result = handleStartStageModalKey(this.startStageModal, key);
    this.startStageModal = result.state;
    const row = this.startStageModal.rows.find((candidate) => candidate.key === key);
    const sourceRows = row?.enabled ? this.state.mediaRows : null;
    const execution = row && sourceRows ? runManualStageFromModal({ boundary: this.boundary, row, mediaRows: sourceRows }) : null;
    const messages = execution?.messages ?? result.messages;
    if (execution) this.startStageModal = markStartStageModalRowStatus(this.startStageModal, key, execution.status, messages[0] ?? result.state.lastMessage);
    this.state = { ...this.state, startStageModal: cloneStartStageModalState(this.startStageModal), currentRun: { title: 'CURRENT RUN', lines: messages.slice(0, 36) } };
    this.snapshots.setSnapshots([]);
    return this.getState();
  }


  // Switches active terminal views and resets view-local route state.
  private switchView(key: TerminalViewKey): DemoTerminalState {
    this.activeViewKey = key;
    this.activeTestPageCode = null;
    if (key === '0') {
      this.view0TestSelector = createView0TestSelectorState();
      this.appendUiLog(writeView0Opened(this.boundary));
    }
    this.state = withActiveTerminalView(this.buildState(), key);
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  // Advances the View 0 selector when Enter is pressed.
  private handleView0Enter(): DemoTerminalState {
    const result = handleView0DefaultEnter({ boundary: this.boundary, selector: this.view0TestSelector });
    this.view0TestSelector = result.selector;
    this.activeTestPageCode = result.activeTestPageCode;
    this.state = this.buildState(result.messages);
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  // Runs real fixture-backed View 6 playback artifact generation.
  private runView6FixturePlayback(key: '1' | '2' | '3' | '4' | '5' | '6'): DemoTerminalState {
    const result = runView6FixturePlayback({ boundary: this.boundary, key });
    this.state = { ...this.buildState(result.lines), currentRun: { title: 'VIEW 6 REAL FIXTURE PLAYBACK', lines: result.lines } };
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  // Toggles the local screen-worker monitor and keeps it simulation-only.
  private toggleScreenMonitor(): DemoTerminalState {
    this.screenMonitor = toggleScreenOnOffState(this.screenMonitor);
    this.state = this.buildState([
      `F pressed: screen-worker monitor ${this.screenMonitor.monitorEnabled ? 'enabled' : 'disabled'}.`,
      'Screen-worker monitor is local terminal state only; no real screen power action ran.'
    ]);
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  // Toggles stable section IDs in the rendered terminal panels.
  private toggleSectionHeaderIds(): DemoTerminalState {
    this.sectionHeaderIdsVisible = !this.sectionHeaderIdsVisible;
    this.state = this.buildState([
      `H pressed: section header IDs ${this.sectionHeaderIdsVisible ? 'shown' : 'hidden'}.`,
      'Section IDs identify pane and top-to-bottom section order, for example L-3, C-2, R-1.'
    ]);
    this.snapshots.setSnapshots([]);
    return this.getState();
  }

  // Toggles the selected Q batch size without running workers.
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

  // Runs the existing P playback-selection path.
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

  // Runs the DB-backed image playback selection when queue rows exist.
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

  // Rebuilds the rendered state from live demo sources and local UI state.
  private buildState(extraLines: string[] = []): DemoTerminalState {
    const source = this.readSources();
    const dryRunPlanLines = formatDryRunPlanLines(buildDryRunCommandPlans(this.boundary, source.mediaRows));
    const baseState = createInitialRealDemoState(
      this.boundary,
      source.mediaRows,
      source.mediaMessages,
      source.truth,
      [...extraLines, ...dryRunPlanLines],
      this.selectedBatchSize,
      source.queueRows,
      source.queueMessages,
      source.playbackStatus,
      {
        collapsed: this.logCollapsed,
        focused: this.logFocused,
        scrollOffset: this.logScrollOffset,
        extraLogLines: this.uiLogLines
      },
      {
        idleSeconds: Math.max(0, Math.floor((Date.now() - this.lastActivityAt) / 1000)),
        powerState: 'guarded',
        latestStatus: this.latestScreenStatus,
        actionGuard: 'No real screen power command runs unless explicitly enabled and platform-safe.'
      },
      this.startStageModal,
      this.sectionHeaderIdsVisible,
      this.activeViewKey,
      this.view0TestSelector,
      this.activeTestPageCode
    );
    return this.applyScreenMonitor(baseState);
  }

  // Projects local monitor state onto freshly rebuilt real-demo state.
  private applyScreenMonitor(state: DemoTerminalState): DemoTerminalState {
    return applyScreenOnOffState(state, {
      ...state.screenOnOff,
      monitorEnabled: this.screenMonitor.monitorEnabled,
      monitorActive: this.screenMonitor.monitorActive,
      keyboardEnabled: state.screenOnOff.keyboardEnabled || this.screenMonitor.keyboardEnabled,
      mouseEnabled: state.screenOnOff.mouseEnabled || this.screenMonitor.mouseEnabled,
      pirSensorEnabled: state.screenOnOff.pirSensorEnabled || this.screenMonitor.pirSensorEnabled,
      lastActivitySource: this.screenMonitor.lastActivitySource,
      lastActivityAt: this.screenMonitor.lastActivityAt,
      activityLog: [...this.screenMonitor.activityLog],
      info: this.screenMonitor.monitorEnabled ? this.screenMonitor.info : state.screenOnOff.info
    });
  }

  // Tracks keyboard/mouse activity for the screen-on/off panel.
  private noteInputActivity(source: string): void {
    this.lastActivityAt = Date.now();
    this.latestScreenStatus = `last input: ${source}`;
  }

  // Adds one UI-local diagnostic line to the bounded log buffer.
  private appendUiLog(message: string): void {
    this.uiLogLines = [...this.uiLogLines, message].slice(-80);
  }

  // Reads current demo media, truth, queue, and playback status sources.
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

// Checks whether a key belongs to the start-stage modal rows.
function isManualStageKey(key: string): key is ManualStageKey { return /^[1-5]$/.test(key); }
