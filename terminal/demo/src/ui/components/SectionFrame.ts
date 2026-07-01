// Reusable terminal section frame primitive for view-shell pages.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { panel } from '../terminalBox.js';

export interface SectionFrameInput {
  title: string;
  lines: readonly string[];
  width?: number;
}

export function renderSectionFrame(input: SectionFrameInput): string {
  return panel(input.title, [...input.lines], input.width);
}
