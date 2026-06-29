// Stores terminal run snapshots for LEFT/RIGHT replay after real-demo runs.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';

export class RunSnapshotStore {
  private snapshots: DemoTerminalState[] = [];
  private index = -1;

  setSnapshots(values: DemoTerminalState[]): void {
    this.snapshots = values.map(cloneState);
    this.index = this.snapshots.length ? this.snapshots.length - 1 : -1;
  }

  step(direction: 'left' | 'right', fallback: DemoTerminalState): DemoTerminalState {
    if (!this.snapshots.length) return cloneState(fallback);
    this.index = direction === 'right'
      ? Math.min(this.index + 1, this.snapshots.length - 1)
      : Math.max(this.index - 1, 0);
    return cloneState(this.snapshots[this.index] ?? fallback);
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
