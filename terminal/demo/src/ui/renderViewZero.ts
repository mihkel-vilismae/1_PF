// Renders View 0: Table of Contents and Debug.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { renderSectionFrame } from './components/SectionFrame.js';
import { renderViewMapSection } from './components/ViewMapSection.js';
import { color } from './ansi.js';
import { blank, stackBlocks } from './terminalBox.js';

// Renders the View 0 map, selector, or reached test page.
export function renderViewZero(state: DemoTerminalState, width?: number): string {
  if (state.activeTestPageCode) return renderTestPage(state, width);
  return stackBlocks([
    renderSectionFrame({
      title: 'MAP AND TESTING - VIEW 0',
      lines: [
        'Map page for terminal view navigation and testing routes.',
        'Press one of the listed view keys to navigate to that page.',
        'Press Enter to open the test-page selector.'
      ],
      width
    }),
    blank(),
    renderViewMapSection(width),
    blank(),
    renderTestingSection(state, width)
  ]);
}

// Renders the View 0 selector instructions and current modal state.
function renderTestingSection(state: DemoTerminalState, width?: number): string {
  const selector = state.view0TestSelector;
  const lines = [
    'Default test route: 0A.',
    'Beeline sequence: 0 -> Enter -> Enter -> Enter -> 0A.',
    'Custom route example: 0 -> Enter -> 7 -> Enter -> D -> Enter -> 7D.',
    ...selector.messages
  ];
  if (selector.step === 'integer') lines.push(color.yellow('MODAL: Enter test page integer. Default: 0. Press Enter to accept.'));
  if (selector.step === 'character') lines.push(color.yellow('MODAL: Enter test page character. Default: A. Press Enter to accept.'));
  return renderSectionFrame({ title: 'TESTING', lines, width });
}

// Renders a placeholder test page reached from the View 0 selector.
function renderTestPage(state: DemoTerminalState, width?: number): string {
  return renderSectionFrame({
    title: `TEST PAGE ${state.activeTestPageCode}`,
    lines: [
      'Placeholder test page reached from map and testing - view 0.',
      state.activeTestPageCode === '0A' ? 'Route proof target: 0 -> Enter -> Enter -> Enter -> 0A.' : 'Custom route proof target: 0 -> Enter -> 7 -> Enter -> D -> Enter -> 7D.',
      ...state.view0TestSelector.messages,
      color.muted('Press 0 to return to map and testing - view 0, or D for the default operator view.')
    ],
    width
  });
}
