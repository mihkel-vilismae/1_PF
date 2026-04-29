import { VIEW_ORDER } from '../shared/constants.ts';

export type InspectMode = 'controls' | 'values' | 'reality' | 'backend';

export type InspectSummaryState = {
  inspectMode?: unknown;
  valueInspectMode?: unknown;
  realityInspectMode?: unknown;
  backendStatusInspectMode?: unknown;
  activeView?: string | null;
};

const MODE_COPY = {
  controls: {
    title: 'Explain controls',
    eyebrow: 'Control guide active',
    summary: 'Interactive controls are highlighted. Hover or focus a highlighted control to see what it does before activating it.',
    fallback: 'No explanation metadata available yet for some controls on this view; those controls remain usable and should be documented before claiming full guide coverage.',
  },
  values: {
    title: 'Explain values',
    eyebrow: 'Value guide active',
    summary: 'Rendered values are highlighted. Hover or focus a highlighted value to see where it comes from and what state updates it.',
    fallback: 'No value metadata available yet for some values on this view; unmapped values must not be guessed.',
  },
  reality: {
    title: 'Show real vs mock',
    eyebrow: 'Implementation truth active',
    summary: 'Visible controls and surfaces are highlighted by implementation truth: real, mock, mixed, or unknown.',
    fallback: 'Unknown means the dashboard does not have enough metadata to honestly classify the item yet.',
  },
  backend: {
    title: 'Show backend status',
    eyebrow: 'Backend status active',
    summary: 'Visible controls and surfaces are highlighted by backend support: real, mock, missing, or unknown.',
    fallback: 'Unknown or missing status is shown instead of inventing backend support.',
  },
};

const VIEW_MODE_NOTES = {
  A: {
    controls: 'Init actions, auth controls, DB controls, and scheduler buttons use control metadata from the existing action registry.',
    values: 'Init status badges, backend result panels, current truth values, logs, and history entries expose their state sources.',
    reality: 'View A is classified as mixed because setup cards are backend-backed while shell state and some surrounding UI remain local.',
    backend: 'View A backend status is based on real init/auth/DB/scheduler endpoint wiring and latest captured responses where available.',
  },
  B: {
    controls: 'Test controls include backend-backed runtime buttons plus simulation toggles and manual/auto selectors.',
    values: 'Pipeline, playback, screen-simulation, log, and history values explain whether they come from runtime responses or local preview state.',
    reality: 'View B is intentionally mixed: some actions call backend endpoints while simulation sections remain mock or preview-only.',
    backend: 'Backend status distinguishes real runtime endpoints from frontend-only simulation and placeholder behavior.',
  },
  C: {
    controls: 'Last-run demo mode controls and recovery buttons expose what they change in the recovery-facing preview.',
    values: 'Recovery values explain their source in seeded last-run demo state rather than pretending to read a live recovery service.',
    reality: 'View C remains mock/recovery-preview only until a real recovery data source is implemented.',
    backend: 'Backend status marks C-view runtime/recovery surfaces as missing or mock instead of claiming live support.',
  },
  D: {
    controls: 'Runtime preview controls expose what preview state they start or update.',
    values: 'Worker rows, locks, preview status, logs, and current media values point back to local runtime-preview state.',
    reality: 'View D currently renders frontend preview state and does not claim live worker telemetry.',
    backend: 'Backend status marks D-view live runtime support as missing unless a real backend/runtime source is later wired.',
  },
  E: {
    controls: 'Database viewer controls cover verify/connect, catalog loading, table selection, pagination, and logging session actions.',
    values: 'Database viewer values explain verification, catalog, row-page, and bounded logging-session sources.',
    reality: 'View E is backend-backed within the documented repo-local SQLite inspection scope.',
    backend: 'Backend status reflects real View E routes while keeping logging scope limited to repo-local backend-observed activity.',
  },
};

export function getActiveInspectMode(state: InspectSummaryState): InspectMode | null {
  if (state.inspectMode) return 'controls';
  if (state.valueInspectMode) return 'values';
  if (state.realityInspectMode) return 'reality';
  if (state.backendStatusInspectMode) return 'backend';
  return null;
}

export function renderInspectModeSummary(state: InspectSummaryState): string {
  const mode = getActiveInspectMode(state);
  if (!mode) {
    return '';
  }

  const viewId = state.activeView ?? 'A';
  const view = VIEW_ORDER.find((entry) => entry.id === viewId);
  const modeCopy = MODE_COPY[mode];
  const viewNote = VIEW_MODE_NOTES[viewId]?.[mode] ?? 'No page-specific inspect metadata summary is available yet; hover highlighted items for any mapped metadata and treat unmapped areas as unknown.';

  return `
    <aside class="inspect-summary" data-inspect-summary data-inspect-summary-mode="${escapeHtml(mode)}" data-inspect-summary-view="${escapeHtml(viewId)}">
      <div>
        <p class="inspect-summary__eyebrow">${escapeHtml(modeCopy.eyebrow)}</p>
        <h2>${escapeHtml(modeCopy.title)} — ${escapeHtml(viewId)}${view ? ` ${escapeHtml(view.name)}` : ''}</h2>
        <p>${escapeHtml(modeCopy.summary)}</p>
        <p>${escapeHtml(viewNote)}</p>
      </div>
      <p class="inspect-summary__fallback">${escapeHtml(modeCopy.fallback)}</p>
    </aside>
  `;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
