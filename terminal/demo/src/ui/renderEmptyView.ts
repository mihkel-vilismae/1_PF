// Renders empty terminal view shells before controls/actions are implemented.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { terminalViewRegistry, getTerminalViewDefinition } from '../views/TerminalViewRegistry.js';
import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { panel } from './terminalBox.js';

export function renderEmptyView(state: DemoTerminalState, width?: number): string {
  const activeView = getTerminalViewDefinition(state.activeViewKey);
  const lines = [
    `View key: ${activeView.key}`,
    `View name: ${activeView.label}`,
    `Purpose: ${activeView.purpose}`,
    '',
    'Status: EMPTY VIEW SHELL ONLY.',
    'No buttons, workers, auth, playback, DB writes, file copies, or cron calls run from this view slice.',
    '',
    'Available view keys:',
    ...terminalViewRegistry.map((view) => `  [${view.key}] ${view.label}`),
    '',
    'Press D to return to the default operator view. H still toggles section header IDs.'
  ];
  return panel(color.magenta(activeView.label.toUpperCase()), lines, width);
}
