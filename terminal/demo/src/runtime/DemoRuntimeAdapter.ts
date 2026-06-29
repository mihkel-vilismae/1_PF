// Defines or implements terminal Demo Mode runtime adapter behavior.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { TerminalMouseEvent } from '../ui/terminalMouse.js';

export interface DemoRuntimeAdapter {
  readonly modeName: string;
  getState(): DemoTerminalState;
  reset(): DemoTerminalState;
  refresh(): DemoTerminalState;
  handleKey(key: string): Promise<DemoTerminalState[]>;
  handleMouse?(event: TerminalMouseEvent): Promise<DemoTerminalState[]> | DemoTerminalState[];
  runQStoryboard(): Promise<DemoTerminalState[]>;
  stepQStoryboard(direction: 'left' | 'right'): DemoTerminalState;
}
