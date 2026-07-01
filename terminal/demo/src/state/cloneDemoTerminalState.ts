// Clones terminal Demo Mode state for adapters without mutating shared references.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { cloneStartStageModalState } from '../startStageModal/StartStageModalState.js';
import { cloneView0TestSelectorState } from '../view0/View0TestSelectorState.js';
import type { DemoTerminalState } from './DemoTerminalState.js';

// Clones the full terminal state so adapters cannot leak mutable references.
export function cloneDemoTerminalState(state: DemoTerminalState): DemoTerminalState {
  return {
    ...state,
    runtimeBoundary: { ...state.runtimeBoundary, pathMessages: [...state.runtimeBoundary.pathMessages] },
    mediaRows: state.mediaRows.map((row) => ({ ...row })),
    playbackQueueRows: state.playbackQueueRows.map((row) => ({ ...row })),
    startStageModal: cloneStartStageModalState(state.startStageModal),
    view0TestSelector: cloneView0TestSelectorState(state.view0TestSelector),
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
