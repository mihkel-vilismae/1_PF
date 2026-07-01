// Defines or implements terminal Demo Mode runtime adapter behavior.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { buildQStoryboardFrame, buildQStoryboardFrames, qStoryboardStepIds } from '../scenarios/qGeocodeStoryboard.js';
import { createInitialMockState } from '../state/createInitialMockState.js';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { handleStartStageModalKey, openStartStageModal, type ManualStageKey } from '../startStageModal/StartStageModalState.js';
import { cloneDemoTerminalState } from '../state/cloneDemoTerminalState.js';
import type { DemoRuntimeAdapter } from './DemoRuntimeAdapter.js';
import { canSwitchTerminalView, withActiveTerminalView } from '../views/TerminalViewState.js';
import { applyScreenOnOffState, recordScreenOnOffActivity, toggleScreenOnOffState, type ScreenMonitorActivityInput } from '../screenOnOff/terminalScreenMonitorState.js';

export class MockDemoRuntimeAdapter implements DemoRuntimeAdapter {
  readonly modeName = 'mock-demo';
  private state: DemoTerminalState = createInitialMockState();
  private qStoryboardIndex = -1;

  getState(): DemoTerminalState {
    return cloneDemoTerminalState(this.state);
  }

  reset(): DemoTerminalState {
    this.state = createInitialMockState();
    this.qStoryboardIndex = -1;
    return this.getState();
  }

  refresh(): DemoTerminalState {
    return this.getState();
  }

  // Handles mock-demo keyboard input while preserving modal and view-switch priority.
  async handleKey(key: string): Promise<DemoTerminalState[]> {
    const normalized = key.toUpperCase();
    if (normalized === 'F') {
      this.state = applyScreenOnOffState(this.state, toggleScreenOnOffState(this.state.screenOnOff));
      return [this.getState()];
    }
    if (normalized === 'Q') {
      return this.runQStoryboard();
    }
    if (normalized === 'ARROWRIGHT') {
      return [this.stepQStoryboard('right')];
    }
    if (normalized === 'ARROWLEFT') {
      return [this.stepQStoryboard('left')];
    }
    if (normalized === 'H') {
      this.state = { ...this.state, sectionHeaderIdsVisible: !this.state.sectionHeaderIdsVisible };
      return [this.getState()];
    }
    if (normalized === 'S') {
      this.state = { ...this.state, startStageModal: openStartStageModal(this.state.startStageModal) };
      return [this.getState()];
    }
    if (isManualStageKey(normalized) && this.state.startStageModal.isOpen) {
      const result = handleStartStageModalKey(this.state.startStageModal, normalized);
      this.state = { ...this.state, startStageModal: result.state };
      return [this.getState()];
    }
    if (canSwitchTerminalView(normalized, this.state.startStageModal.isOpen)) {
      this.state = withActiveTerminalView(this.state, normalized);
      return [this.getState()];
    }
    if (normalized === 'R') {
      return [this.refresh()];
    }
    return [this.getState()];
  }

  // Records one local screen-monitor input without touching real hardware or backend state.
  async handleScreenMonitorActivity(input: ScreenMonitorActivityInput): Promise<DemoTerminalState> {
    this.state = applyScreenOnOffState(this.state, recordScreenOnOffActivity(this.state.screenOnOff, input));
    return this.getState();
  }

  async runQStoryboard(): Promise<DemoTerminalState[]> {
    const frames = buildQStoryboardFrames();
    this.qStoryboardIndex = qStoryboardStepIds.length - 1;
    this.state = cloneDemoTerminalState(frames[frames.length - 1] ?? createInitialMockState());
    return frames.map((frame) => cloneDemoTerminalState(frame));
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

function isManualStageKey(key: string): key is ManualStageKey {
  return /^[1-5]$/.test(key);
}
