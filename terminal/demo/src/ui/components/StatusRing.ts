// Reusable display-only terminal status ring primitive.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { color } from '../ansi.js';

export type StatusRingTone = 'ready' | 'planned' | 'disabled' | 'blocked' | 'unknown';

export function renderStatusRing(tone: StatusRingTone): string {
  switch (tone) {
    case 'ready':
      return color.brightGreen('◉');
    case 'planned':
      return color.yellow('◌');
    case 'disabled':
      return color.muted('○');
    case 'blocked':
      return color.danger('●');
    case 'unknown':
      return color.cyan('◇');
  }
}
