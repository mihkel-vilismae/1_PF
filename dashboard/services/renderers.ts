import { STATUS_LABELS } from '../shared/constants.ts';

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

type DefinitionListData = Record<string, unknown>;

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

type ModalKind = 'log' | 'history' | 'new-auth-login' | string;

type ModalData = {
  title?: string;
  subtitle?: string;
  kind?: ModalKind;
  entry?: LogEntry | HistoryEntry;
  stage?: string;
  message?: string;
  requestedInput?: string | null;
  twoFactorPromptKind?: string | null;
};

type StepListItem = {
  status?: string;
  label?: string;
};

type TransportDetails = {
  operation?: unknown;
  endpoint?: unknown;
  outcome?: unknown;
  request?: TransportData;
  response?: TransportData;
  [key: string]: unknown;
};

type TransportData = {
  method?: unknown;
  path?: unknown;
  status?: unknown;
  statusText?: unknown;
  ok?: unknown;
  url?: unknown;
  headers?: unknown;
  body?: unknown;
};

export function statusBadge(status: StatusLabel): string {
  const label = (STATUS_LABELS as Record<string, string>)[status] ?? status;
  return `<span class="status-badge status-badge--${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

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

export function renderSourceBadge(mode: SourceBadgeMode, label: string | null = null): string {
  const normalizedMode = ['real', 'hybrid', 'mock'].includes(mode) ? mode : 'hybrid';
  const text = label ?? normalizedMode.toUpperCase();
  return `<span class="source-badge source-badge--${escapeHtml(normalizedMode)}">${escapeHtml(text)}</span>`;
}

export function renderDefinitionList(data: DefinitionListData = {}): string {
  const rows = Object.entries(data)
    .map(([label, value]) => `<div class="definition-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(formatInlineValue(value))}</dd></div>`)
    .join('');
  return `<dl class="definition-list">${rows}</dl>`;
}

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

  return `
    <section class="result-surface result-surface--${escapeHtml(result.outcome)}">
      <div class="result-surface__header">
        <h4>Latest backend result</h4>
        <span class="mini-badge mini-badge--${escapeHtml(result.outcome)}">${escapeHtml(result.outcome === 'success' ? 'Success' : result.outcome === 'error' ? 'Error' : 'Running')}</span>
      </div>
      ${renderDefinitionList(meta)}
      ${result.message ? `<p class="result-message">${escapeHtml(result.message)}</p>` : ''}
      ${payload !== undefined && payload !== null ? `
        <div class="result-json-block">
          <p class="result-json-label">${escapeHtml(payloadLabel)}</p>
          <pre class="result-json">${escapeHtml(formatPayload(payload))}</pre>
        </div>
      ` : ''}
    </section>
  `;
}

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

export function renderModal(modal: ModalData | null | undefined): string {
  if (!modal) {
    return '';
  }

  const title = modal.title ?? 'Details';
  const subtitle = modal.subtitle ?? '';
  const kindLabel = modal.kind === 'log' ? 'Log entry' : modal.kind === 'new-auth-login' ? 'New auth login' : 'Event history';
  const content = modal.kind === 'log'
    ? renderLogModalContent(modal.entry ?? {})
    : modal.kind === 'new-auth-login'
      ? renderNewAuthLoginModalContent(modal)
      : renderHistoryModalContent(modal.entry ?? {});
  const describedBy = subtitle ? ' aria-describedby="modal-subtitle"' : '';

  return `
    <div class="modal-backdrop" data-modal-backdrop="1">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"${describedBy}>
        <div class="modal-panel__header">
          <div class="modal-panel__header-copy">
            <p class="modal-panel__eyebrow">${escapeHtml(kindLabel)}</p>
            <h3 id="modal-title">${escapeHtml(title)}</h3>
            ${subtitle ? `<p id="modal-subtitle" class="modal-panel__subtitle">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <button type="button" class="button button--ghost modal-panel__close" data-modal-close="1">Close</button>
        </div>
        ${content}
      </section>
    </div>
  `;
}

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


function renderNewAuthLoginModalContent(modal: ModalData): string {
  const stage = modal.stage ?? 'opening';
  const message = modal.message ?? modal.subtitle ?? 'New auth login modal is ready.';
  const requestedInput = requestedInputLabelForPromptKind(modal.twoFactorPromptKind) ?? modal.requestedInput;
  return `
    ${renderModalSection(
      'Login progress',
      renderDefinitionList({
        Card: '1A-STASH-OFF',
        Stage: stage,
        Endpoint: 'POST /api/auth/new/login',
        '2FA endpoint': 'POST /api/auth/new/submit-2fa',
        ...(requestedInput ? { 'Requested input': requestedInput } : {}),
      }) + `<p class="modal-panel__empty">${escapeHtml(message)}</p>`,
    )}
    ${renderModalSection(
      'Two-factor authentication',
      `<label class="field-label" for="new-auth-2fa-code">2FA code or device index</label>
       <input id="new-auth-2fa-code" class="input" type="text" autocomplete="one-time-code" data-new-auth-2fa-code aria-label="New auth 2FA code or device index" />
       <div class="button-row"><button class="button button--primary" data-action="new-auth-submit-2fa">Submit 2FA</button></div>
       <p class="modal-panel__empty">Submit the trusted-device index first if iCloudPD asks for one, then submit the verification code when prompted. The response is sent only to the new auth endpoint and is cleared from the input after submission.</p>`,
    )}
  `;
}

function requestedInputLabelForPromptKind(kind: string | null | undefined): string | null {
  switch (kind) {
    case 'device_index':
      return 'Enter device index, for example a';
    case 'verification_code':
      return 'Enter SMS six-digit code';
    case 'device_index_or_code':
      return 'Enter device index, for example a';
    case 'apple_hsa2_challenge':
      return 'Apple HSA2 challenge; exact prompt not visible';
    case 'unknown':
      return 'Two-factor response';
    default:
      return null;
  }
}

function renderLogModalContent(entry: LogEntry): string {
  const parts: string[] = [];
  const details = asTransportDetails(entry.details);
  const timeline: DefinitionListData = {
    'Local time': entry.at ?? 'Unavailable',
    'Tallinn time': entry.atTallinn ?? 'Unavailable',
    'ISO time': entry.atIso ?? 'Unavailable',
  };

  parts.push(renderModalSection('Timeline', renderDefinitionList(timeline)));

  if (details?.operation || details?.endpoint || details?.outcome) {
    parts.push(
      renderModalSection(
        'Action',
        renderDefinitionList({
          Operation: details.operation ?? 'Unavailable',
          Endpoint: details.endpoint ?? 'Unavailable',
          Outcome: details.outcome ?? 'Unavailable',
        }),
      ),
    );
  }

  if (details?.request) {
    parts.push(renderTransportSection('Request', details.request));
  }

  if (details?.response) {
    parts.push(renderTransportSection('Response', details.response));
  }

  if (!details?.request && !details?.response && !details?.operation && !details?.endpoint) {
    parts.push(renderModalSection('Notes', '<p class="modal-panel__empty">No additional request metadata was captured for this log entry.</p>'));
  }

  return parts.join('');
}

function renderHistoryModalContent(entry: LogEntry | HistoryEntry): string {
  const parts: string[] = [];
  const historyEntry = entry as HistoryEntry;
  const details = asTransportDetails(entry.details);
  const timeline: DefinitionListData = {
    'Local time': entry.at ?? 'Unavailable',
    'Tallinn time': entry.atTallinn ?? 'Unavailable',
    'ISO time': entry.atIso ?? 'Unavailable',
  };

  parts.push(
    renderModalSection(
      'Event summary',
      renderDefinitionList({
        Source: historyEntry.source ?? 'Unavailable',
        Type: entry.type ?? 'Unavailable',
        Message: entry.message ?? 'Unavailable',
      }),
    ),
  );
  parts.push(renderModalSection('Timeline', renderDefinitionList(timeline)));

  if (details?.request || details?.response) {
    if (details.request) {
      parts.push(renderTransportSection('Request', details.request));
    }
    if (details.response) {
      parts.push(renderTransportSection('Response', details.response));
    }
  } else if (entry.details) {
    parts.push(renderModalSection('Context', renderDefinitionList(flattenContext(entry.details))));
  } else {
    parts.push(
      renderModalSection(
        'Context',
        '<p class="modal-panel__empty">This history event is a dashboard-level event. It does not carry request/response headers, but it still records the source, status, and message that produced it.</p>',
      ),
    );
  }

  return parts.join('');
}

function renderTransportSection(label: 'Request' | 'Response', data: TransportData): string {
  const summaryRows: DefinitionListData =
    label === 'Request'
      ? {
          Method: data.method ?? 'Unavailable',
          Endpoint: data.path ?? 'Unavailable',
        }
      : {
          Status: data.status ?? 'Unavailable',
          'Status text': data.statusText ?? 'Unavailable',
          Success: data.ok === undefined ? 'Unavailable' : String(data.ok),
          URL: data.url ?? 'Unavailable',
        };

  const headerRows = data.headers ? `<pre class="modal-panel__json">${escapeHtml(formatPayload(data.headers))}</pre>` : '<p class="modal-panel__empty">No headers captured.</p>';
  const bodyRows = data.body !== null && data.body !== undefined ? `<pre class="modal-panel__json">${escapeHtml(formatPayload(data.body))}</pre>` : '<p class="modal-panel__empty">No body captured.</p>';

  return renderModalSection(
    label,
    `
      ${renderDefinitionList(summaryRows)}
      <div class="modal-panel__stack">
        <p class="modal-panel__subheading">${escapeHtml(label)} headers</p>
        ${headerRows}
      </div>
      <div class="modal-panel__stack">
        <p class="modal-panel__subheading">${escapeHtml(label)} body</p>
        ${bodyRows}
      </div>
    `,
  );
}

function renderModalSection(title: string, body: string): string {
  return `
    <section class="modal-panel__section">
      <p class="modal-panel__section-title">${escapeHtml(title)}</p>
      ${body}
    </section>
  `;
}

function flattenContext(details: unknown): DefinitionListData {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {};
  }
  return Object.entries(details).reduce<DefinitionListData>((acc, [key, value]) => {
    acc[key] = typeof value === 'object' && value !== null ? formatPayload(value) : value;
    return acc;
  }, {});
}

function formatPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }
  return JSON.stringify(payload, null, 2);
}

function formatInlineValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return formatPayload(value);
  }
  return String(value);
}

function asTransportDetails(details: unknown): TransportDetails | null {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return null;
  }
  return details as TransportDetails;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
