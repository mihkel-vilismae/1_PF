// Locates clickable terminal-demo controls inside the already-rendered terminal screen.
// This avoids duplicating layout math and keeps hit testing tied to visible output.

import { stripAnsi } from '../ui/ansi.js';
import { PIR_BUTTON_LABEL } from '../ui/renderScreenOnOff.js';

// Returns true when the given mouse coordinates hit the visible PIR button in the rendered screen.
export function isPirButtonHit(renderedOutput: string, x: number, y: number): boolean {
  const lines = renderedOutput.split('\n');
  const line = lines[y - 1];
  if (!line) return false;

  const plainLine = stripAnsi(line);
  const buttonStart = plainLine.indexOf(PIR_BUTTON_LABEL);
  if (buttonStart < 0) return false;

  const column = x - 1;
  return column >= buttonStart && column < buttonStart + PIR_BUTTON_LABEL.length;
}
