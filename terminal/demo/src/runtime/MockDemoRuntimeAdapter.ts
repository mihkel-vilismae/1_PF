// Defines or implements terminal Demo Mode runtime adapter behavior.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { buildQStoryboardFrame, buildQStoryboardFrames, qStoryboardStepIds } from '../scenarios/qGeocodeStoryboard.js';
import { createInitialMockState } from '../state/createInitialMockState.js';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { DemoRuntimeAdapter } from './DemoRuntimeAdapter.js';

export class MockDemoRuntimeAdapter implements DemoRuntimeAdapter {
  readonly modeName = 'mock-demo';
  private state: DemoTerminalState = createInitialMockState();
  private qStoryboardIndex = -1;

  getState(): DemoTerminalState {
    return cloneState(this.state);
  }

  reset(): DemoTerminalState {
    this.state = createInitialMockState();
    this.qStoryboardIndex = -1;
    return this.getState();
  }

  refresh(): DemoTerminalState {
    return this.getState();
  }

  async handleKey(key: string): Promise<DemoTerminalState[]> {
    const normalized = key.toUpperCase();
    if (normalized === 'Q') {
      return this.runQStoryboard();
    }
    if (normalized === 'ARROWRIGHT') {
      return [this.stepQStoryboard('right')];
    }
    if (normalized === 'ARROWLEFT') {
      return [this.stepQStoryboard('left')];
    }
    if (normalized === 'R') {
      return [this.refresh()];
    }
    return [this.getState()];
  }

  async runQStoryboard(): Promise<DemoTerminalState[]> {
    const frames = buildQStoryboardFrames();
    this.qStoryboardIndex = qStoryboardStepIds.length - 1;
    this.state = cloneState(frames[frames.length - 1] ?? createInitialMockState());
    return frames.map((frame) => cloneState(frame));
  }

  stepQStoryboard(direction: 'left' | 'right'): DemoTerminalState {
    if (direction === 'right') {
      this.qStoryboardIndex = Math.min(this.qStoryboardIndex + 1, qStoryboardStepIds.length - 1);
    } else {
      this.qStoryboardIndex = this.qStoryboardIndex < 0 ? 0 : Math.max(this.qStoryboardIndex - 1, 0);
    }

    this.state = buildQStoryboardFrame(this.qStoryboardIndex, true);
    return this.getState();
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
