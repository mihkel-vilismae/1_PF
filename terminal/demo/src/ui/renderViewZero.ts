// Renders View 0: Table of Contents and Debug.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { renderSectionFrame } from './components/SectionFrame.js';
import { renderViewMapSection } from './components/ViewMapSection.js';
import { color } from './ansi.js';
import { blank, stackBlocks } from './terminalBox.js';

export function renderViewZero(_state: DemoTerminalState, width?: number): string {
  return stackBlocks([
    renderSectionFrame({
      title: 'VIEW 0 — TABLE OF CONTENTS AND DEBUG',
      lines: [
        'Map page shell only.',
        'Press one of the listed view keys to navigate to that page.',
        'No test-page modal, debug action, worker, auth, playback, DB write, file copy, or cron runs here.'
      ],
      width
    }),
    blank(),
    renderViewMapSection(width),
    blank(),
    renderSectionFrame({
      title: 'TESTING',
      lines: [color.muted('Empty testing section. Future terminal UI experiments can be placed here first.')],
      width
    })
  ]);
}
