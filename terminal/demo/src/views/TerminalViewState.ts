// Small helpers for terminal view switching state.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { getTerminalViewDefinition, isTerminalViewKey, type TerminalViewKey } from './TerminalViewRegistry.js';

export function canSwitchTerminalView(key: string, modalOpen: boolean): key is TerminalViewKey {
  if (!isTerminalViewKey(key)) return false;
  return !(modalOpen && /^[1-5]$/.test(key));
}

export function withActiveTerminalView(state: DemoTerminalState, key: TerminalViewKey): DemoTerminalState {
  const view = getTerminalViewDefinition(key);
  return {
    ...state,
    activeViewKey: key,
    currentRun: {
      title: 'CURRENT RUN',
      lines: [
        `View ${view.key} selected: ${view.label}.`,
        'Empty view shell only: no buttons or real actions are implemented in this slice.'
      ]
    }
  };
}
