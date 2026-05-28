/*
 * Renders reusable dashboard HTML fragments for cards, logs, and result surfaces.
 * This compatibility entrypoint preserves existing imports while renderer groups move out.
 * Modal rendering is delegated to the dedicated modal renderer module.
 */
import { STATUS_LABELS } from '../shared/constants.ts';
import { renderModal, type ModalData } from './renderers/modalRenderer.ts';
import {
  escapeHtml,
  formatPayload,
  renderDefinitionList,
  type DefinitionListData,
  type TransportDetails,
} from './renderers/sharedRendererUtils.ts';

export { renderDefinitionList, renderModal };
export type { ModalData };

type StatusLabelKey = keyof typeof STATUS_LABELS;
type StatusLabel = StatusLabelKey | string;

type LogEntry = {
  at?: string;
  atIso?: string;
  atTallinn?: string;
  type?: string;
  message?: string;
  details?: TransportDetails | Record<string, unknown> | null;
};

type HistoryEntry = LogEntry & {
  source?: string;
};

type RenderLogEntriesOptions = {
  sourceKey?: string;
};

type SourceBadgeMode = 'real' | 'hybrid' | 'mock' | string;

type ResultSurfaceData = {
  outcome: string;
  operation?: string;
  method?: string;
  endpoint?: string;
  receivedAt?: string;
  status?: string | number | null;
  message?: string;
  payload?: unknown;
  errorPayload?: unknown;
};

type StepListItem = {
  status?: string;
  label?: string;
};

// Renders a status badge using the shared status-label map and escaped status key.
export function statusBadge(status: StatusLabel): string {
  const label = (STATUS_LABELS as Record<string, string>)[status] ?? status;
  return `<span class="status-badge status-badge--${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

// Renders compact clickable log-entry rows for the dashboard event surfaces.
export function renderLogEntries(entries: LogEntry[] = [], options: RenderLogEntriesOptions = {}): string {
  const sourceKey = options.sourceKey ?? 'LOG';
  if (!entries.length) {
    return '<div class="log-entry log-entry--empty"><p class="log-entry__message">No log entries yet.</p></div>';
  }

  return entries
    .map(
      (entry, index) => `
        <article
          class="log-entry log-entry--${escapeHtml(entry.type ?? 'info')}"
          data-log-entry-open="1"
          data-log-source-key="${escapeHtml(sourceKey)}"
          data-log-entry-index="${index}"
          role="button"
          tabindex="0"
          aria-label="Open log entry details"
        >
          <div class="log-entry__meta">
            <span>${escapeHtml(entry.at ?? '')}</span>
            <span class="log-entry__status-chip">
              <span>${escapeHtml((entry.type ?? 'info').toUpperCase())}</span>
              <button class="log-entry__toggle" type="button" tabindex="-1" aria-hidden="true">+</button>
            </span>
          </div>
          <div class="log-entry__message">${escapeHtml(entry.message ?? '')}</div>
        </article>
      `,
    )
    .join('');
}

// Renders a real, hybrid, or mock source badge while normalizing unexpected modes.
export function renderSourceBadge(mode: SourceBadgeMode, label: string | null = null): string {
  const normalizedMode = ['real', 'hybrid', 'mock'].includes(mode) ? mode : 'hybrid';
  const text = label ?? normalizedMode.toUpperCase();
  return `<span class="source-badge source-badge--${escapeHtml(normalizedMode)}">${escapeHtml(text)}</span>`;
}

// Renders the latest backend result surface with metadata, prompt hints, and JSON payload.
export function renderResultSurface(result: ResultSurfaceData | null | undefined): string {
  if (!result) {
    return `
      <div class="result-surface result-surface--empty">
        <p class="result-empty">No backend result yet. This card will call the documented API endpoint when triggered.</p>
      </div>
    `;
  }

  const meta: DefinitionListData = {
    Operation: result.operation,
    Endpoint: `${result.method} ${result.endpoint}`,
    Updated: result.receivedAt,
  };

  if (result.status) {
    meta['HTTP status'] = String(result.status);
  }

  const payload = result.payload ?? result.errorPayload;
  const payloadLabel =
    result.outcome === 'success'
      ? 'Response payload'
      : result.outcome === 'error'
        ? 'Error payload'
        : 'Pending request payload';

  const userPrompts = extractUserPrompts(payload);
  const payloadScrollKey = buildResultPayloadScrollKey(result, payloadLabel);

  return `
    <section class="result-surface result-surface--${escapeHtml(result.outcome)}">
      <div class="result-surface__header">
        <h4>Latest backend result</h4>
        <span class="mini-badge mini-badge--${escapeHtml(result.outcome)}">${escapeHtml(result.outcome === 'success' ? 'Success' : result.outcome === 'error' ? 'Error' : 'Running')}</span>
      </div>
      ${renderDefinitionList(meta)}
      ${result.message ? `<p class="result-message">${escapeHtml(result.message)}</p>` : ''}
      ${userPrompts.length ? renderUserPromptList(userPrompts) : ''}
      ${payload !== undefined && payload !== null ? `
        <div class="result-json-block" data-scroll-preserve="${escapeHtml(`${payloadScrollKey}-block`)}">
          <p class="result-json-label">${escapeHtml(payloadLabel)}</p>
          <pre class="result-json" data-scroll-preserve="${escapeHtml(payloadScrollKey)}">${escapeHtml(formatPayload(payload))}</pre>
        </div>
      ` : ''}
    </section>
  `;
}

// Builds a stable scroll key for nested result payload surfaces that are rebuilt on state changes.
function buildResultPayloadScrollKey(result: ResultSurfaceData, payloadLabel: string): string {
  const rawKey = [
    'result-payload',
    result.operation,
    result.method,
    result.endpoint,
    payloadLabel,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('-');

  return rawKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'result-payload-generic';
}

// Extracts safe user-action prompt text from backend result payload details.
function extractUserPrompts(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const details = root.details && typeof root.details === 'object' ? root.details as Record<string, unknown> : null;
  const proof = details?.providerProof && typeof details.providerProof === 'object' ? details.providerProof as Record<string, unknown> : null;
  const directPrompts = Array.isArray(details?.userPrompts) ? details?.userPrompts : [];
  const proofPrompts = Array.isArray(proof?.userPrompts) ? proof?.userPrompts : [];
  return [...directPrompts, ...proofPrompts]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .filter((value, index, values) => values.indexOf(value) === index);
}

// Renders highlighted backend prompts above a result JSON payload.
function renderUserPromptList(prompts: string[]): string {
  return `
    <div class="result-user-prompts" aria-label="User action prompts">
      ${prompts.map((prompt) => `<strong class="result-user-prompt">${escapeHtml(prompt)}</strong>`).join('')}
    </div>
  `;
}

// Renders clickable event-history rows for dashboard-level events.
export function renderHistory(entries: HistoryEntry[] = []): string {
  if (!entries.length) {
    return '<article class="history-item history-item--empty"><div class="history-item__message">No history yet.</div></article>';
  }

  return entries
    .map(
      (entry, index) => `
        <article
          class="history-item history-item--${escapeHtml(entry.type ?? 'info')}"
          data-history-entry-open="1"
          data-history-entry-index="${index}"
          role="button"
          tabindex="0"
          aria-label="Open history entry details"
        >
          <div class="history-item__meta">
            <span>${escapeHtml(entry.at ?? '')}</span>
            <span class="history-item__status-chip">
              <span>${escapeHtml((entry.type ?? 'info').toUpperCase())}</span>
              <button class="history-item__toggle" type="button" tabindex="-1" aria-hidden="true">+</button>
            </span>
          </div>
          <div class="history-item__message">${escapeHtml(entry.message ?? '')}</div>
        </article>
      `,
    )
    .join('');
}

// Renders ordered step status rows for login and workflow progress displays.
export function renderStepList(steps: StepListItem[] = []): string {
  return `
    <ol class="step-list">
      ${steps
        .map(
          (step) => `
            <li class="step-list__item step-list__item--${escapeHtml(step.status ?? 'waiting')}">
              <span class="step-list__dot"></span>
              <span>${escapeHtml(step.label ?? '')}</span>
            </li>
          `,
        )
        .join('')}
    </ol>
  `;
}
