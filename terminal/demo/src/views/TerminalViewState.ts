// Small helpers for terminal view switching state.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { getTerminalViewDefinition, isTerminalViewKey, type TerminalViewKey } from './TerminalViewRegistry.js';

// Checks whether a key can switch views without stealing modal-owned inputs.
export function canSwitchTerminalView(key: string, modalOpen: boolean): key is TerminalViewKey {
  if (!isTerminalViewKey(key)) return false;
  return !(modalOpen && /^[1-5]$/.test(key));
}

// Returns a copy of terminal state focused on the requested active view.
export function withActiveTerminalView(state: DemoTerminalState, key: TerminalViewKey): DemoTerminalState {
  const view = getTerminalViewDefinition(key);
  const sliceLine = view.shellStatus === 'implemented_terminal_slice'
    ? 'Implemented terminal-demo slice: scoped controls are local to this view and keep existing real-demo behavior unchanged.'
    : 'Empty view shell only: no buttons or real actions are implemented in this slice.';
  return {
    ...state,
    activeViewKey: key,
    currentRun: {
      title: 'CURRENT RUN',
      lines: [
        `View ${view.key} selected: ${view.label}.`,
        sliceLine
      ]
    }
  };
}
