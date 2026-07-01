// Renders the default-view iCloudPD authorization shell.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { color } from './ansi.js';
import { renderSectionFrame } from './components/SectionFrame.js';
import { renderStatusRow } from './components/StatusRow.js';

export function renderIcloudAuthorization(title: string, width?: number): string {
  return renderSectionFrame({
    title: color.magenta(title),
    lines: [
      renderStatusRow({
        label: 'Authorization status',
        value: 'planned shell only',
        tone: 'planned',
        detail: 'No iCloudPD command runs from this section yet.'
      }),
      '',
      `${color.brightCyan('[I]')} Go to login view`,
      color.muted('Navigation shell only: press I to open the iCloudPD login view. No auth action runs here.')
    ],
    width
  });
}
