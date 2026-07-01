// Reusable terminal View Map renderer.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { terminalViewRegistry } from '../../views/TerminalViewRegistry.js';
import { renderSectionFrame } from './SectionFrame.js';

const MAIN_VIEW_KEYS = new Set(['D', 'L', 'I', '1', '2', '3', '4', '5', '6']);

export function renderViewMapSection(width?: number): string {
  const lines = terminalViewRegistry
    .filter((view) => MAIN_VIEW_KEYS.has(view.key))
    .map((view) => `  [${view.key}] ${view.label}`);

  return renderSectionFrame({
    title: 'VIEW MAP',
    lines,
    width
  });
}
