/*
 * Renders dashboard modal HTML, including NEW AUTH login and communication panels.
 * This module owns modal-specific copy, transport sections, and safe terminal redaction.
 * Public callers continue to import renderModal through the compatibility renderer entrypoint.
 */
import {
  asTransportDetails,
  escapeHtml,
  formatPayload,
  renderDefinitionList,
  type DefinitionListData,
  type TransportData,
} from './sharedRendererUtils.ts';
import { sanitizeNewAuthProviderText } from '../newAuthRedaction.ts';

type LogEntry = {
  at?: string;
  atIso?: string;
  atTallinn?: string;
  type?: string;
  message?: string;
  details?: Record<string, unknown> | null;
};

type HistoryEntry = LogEntry & {
  source?: string;
};

type ModalKind = 'log' | 'history' | 'new-auth-login' | 'new-auth-login-v2' | string;

export type ModalData = {
  title?: string;
  subtitle?: string;
  kind?: ModalKind;
  entry?: LogEntry | HistoryEntry;
  stage?: string;
  message?: string;
  requestedInput?: string | null;
  twoFactorPromptKind?: string | null;
  icloudpdCommunicationLines?: unknown;
  providerOutputPreview?: unknown;
};

type NewAuthTwoFactorInputCopy = {
  active: boolean;
  label: string;
  ariaLabel: string;
  placeholder: string;
  buttonLabel: string;
  help: string;
};

type NewAuthLoginModalModel = {
  stage: string;
  message: string;
  requestedInput: string | null | undefined;
  twoFactorCopy: NewAuthTwoFactorInputCopy;
};

// Renders the active modal, including the split NEW AUTH login communication view.
export function renderModal(modal: ModalData | null | undefined): string {
  if (!modal) {
    return '';
  }

  const title = modal.title ?? 'Details';
  const subtitle = modal.subtitle ?? '';
  const isNewAuthLogin = isNewAuthLoginModalKind(modal.kind);
  const isSchedulerEndpointRow = modal.kind === 'scheduler-endpoint-row';
  const kindLabel = modal.kind === 'log'
    ? 'Log entry'
    : isNewAuthLogin
      ? 'New auth login'
      : isSchedulerEndpointRow
        ? 'Scheduler terminal row'
        : 'Event history';
  const content = modal.kind === 'log'
    ? renderLogModalContent(modal.entry ?? {})
    : isNewAuthLogin
      ? renderNewAuthLoginModalContent(modal, modal.kind === 'new-auth-login-v2' ? 'v2' : 'v1')
      : isSchedulerEndpointRow
        ? renderSchedulerEndpointRowModalContent(modal.entry ?? {})
        : renderHistoryModalContent(modal.entry ?? {});
  const describedBy = subtitle ? ' aria-describedby="modal-subtitle"' : '';
  const versionAttribute = modal.kind === 'new-auth-login-v2' ? ' data-new-auth-modal-version="2"' : '';
  const panel = `
    <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"${describedBy}${versionAttribute}>
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
  `;

  if (isNewAuthLogin) {
    return `
      <div class="modal-backdrop modal-backdrop--split" data-modal-backdrop="1">
        <div class="modal-layout modal-layout--new-auth">
          ${panel}
          ${renderNewAuthCommunicationPanel(modal)}
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-backdrop" data-modal-backdrop="1">
      ${panel}
    </div>
  `;
}

// Checks whether a modal kind uses the NEW AUTH split login layout.
function isNewAuthLoginModalKind(kind: ModalKind | undefined): boolean {
  return kind === 'new-auth-login' || kind === 'new-auth-login-v2';
}

// Renders read-only sanitized iCloudPD communication beside the NEW AUTH login modal.
function renderNewAuthCommunicationPanel(modal: ModalData): string {
  const lines = extractNewAuthCommunicationLines(modal);
  const body = lines.length
    ? lines.map((line) => `<div class="terminal-panel__line">${escapeHtml(line)}</div>`).join('')
    : '<div class="terminal-panel__line terminal-panel__line--muted">Waiting for sanitized iCloudPD communication...</div>';

  return `
    <section class="modal-panel modal-panel--terminal" aria-labelledby="icloudpd-communication-title">
      <div class="modal-panel__header modal-panel__header--terminal">
        <div class="modal-panel__header-copy">
          <h3 id="icloudpd-communication-title">icloudpd communication</h3>
        </div>
      </div>
      <div class="terminal-panel" role="log" aria-live="polite" aria-label="Read-only iCloudPD communication log">${body}</div>
    </section>
  `;
}

// Extracts only frontend-safe terminal lines from modal data supplied by NEW AUTH state.
function extractNewAuthCommunicationLines(modal: ModalData): string[] {
  const explicitLines = Array.isArray(modal.icloudpdCommunicationLines) ? modal.icloudpdCommunicationLines : [];
  const previewLines = typeof modal.providerOutputPreview === 'string' ? modal.providerOutputPreview.split(/\r?\n/) : [];
  return [...explicitLines, ...previewLines]
    .filter((line): line is string => typeof line === 'string')
    .map((line) => sanitizeNewAuthProviderText(line))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// Renders the NEW AUTH login content using either the original or v2 composition.
function renderNewAuthLoginModalContent(modal: ModalData, version: 'v1' | 'v2' = 'v1'): string {
  if (version === 'v2') {
    return renderNewAuthLoginModalV2Content(modal);
  }

  const model = buildNewAuthLoginModalModel(modal);
  return `
    ${renderNewAuthLoginProgressSection(model)}
    ${renderNewAuthTwoFactorSectionFromCopy(model.twoFactorCopy)}
  `;
}

// Renders modal v2 from a small normalized model while preserving v1 visual parts.
function renderNewAuthLoginModalV2Content(modal: ModalData): string {
  const model = buildNewAuthLoginModalModel(modal);
  const sections = [
    renderNewAuthLoginProgressSection(model),
    renderNewAuthTwoFactorSectionFromCopy(model.twoFactorCopy),
  ];
  return sections.join('');
}

// Normalizes modal data once so v1 and v2 share prompt copy and progress rows.
function buildNewAuthLoginModalModel(modal: ModalData): NewAuthLoginModalModel {
  const stage = modal.stage ?? 'opening';
  const message = modal.message ?? modal.subtitle ?? 'New auth login modal is ready.';
  const requestedInput = requestedInputLabelForPromptKind(modal.twoFactorPromptKind) ?? modal.requestedInput;
  const twoFactorCopy = twoFactorInputCopyForModal(modal);
  return {
    stage,
    message,
    requestedInput,
    twoFactorCopy,
  };
}

// Renders the login-progress section from normalized NEW AUTH modal data.
function renderNewAuthLoginProgressSection(model: NewAuthLoginModalModel): string {
  return `
    ${renderModalSection(
      'Login progress',
      renderDefinitionList({
        Card: '1A-STASH-OFF',
        Stage: model.stage,
        Endpoint: 'POST /api/auth/new/login',
        '2FA endpoint': 'POST /api/auth/new/submit-2fa',
        ...(model.requestedInput ? { 'Requested input': model.requestedInput } : {}),
      }) + `<p class="modal-panel__empty">${escapeHtml(model.message)}</p>`,
    )}
  `;
}

// Renders the 2FA input section from precomputed safe copy.
function renderNewAuthTwoFactorSectionFromCopy(copy: NewAuthTwoFactorInputCopy): string {
  if (!copy.active) {
    return renderModalSection(
      'Two-factor authentication',
      `<p class="modal-panel__empty">${escapeHtml(copy.help)}</p>`,
    );
  }

  return renderModalSection(
    'Two-factor authentication',
    `<label class="field-label" for="new-auth-2fa-code">${escapeHtml(copy.label)}</label>
     <input id="new-auth-2fa-code" class="input" type="text" autocomplete="one-time-code" data-new-auth-2fa-code aria-label="${escapeHtml(copy.ariaLabel)}" placeholder="${escapeHtml(copy.placeholder)}" />
     <div class="button-row"><button class="button button--primary" data-action="new-auth-submit-2fa">${escapeHtml(copy.buttonLabel)}</button></div>
     <p class="modal-panel__empty">${escapeHtml(copy.help)}</p>`,
  );
}

// Maps backend prompt metadata to conservative operator-facing input copy.
function twoFactorInputCopyForModal(modal: ModalData): NewAuthTwoFactorInputCopy {
  if (modal.stage === 'authenticated') {
    return {
      active: false,
      label: 'No two-factor input needed',
      ariaLabel: 'No two-factor input needed',
      placeholder: '',
      buttonLabel: 'Submit',
      help: 'No two-factor input is needed. The local session is already authenticated.',
    };
  }

  switch (modal.twoFactorPromptKind) {
    case 'device_index':
      return {
        active: true,
        label: 'Device index',
        ariaLabel: 'New auth trusted-device index',
        placeholder: 'a',
        buttonLabel: 'Submit device index',
        help: 'Enter the listed trusted-device index, for example a, to ask Apple to send a verification code.',
      };
    case 'device_index_or_code':
      return {
        active: true,
        label: 'Device index',
        ariaLabel: 'New auth trusted-device index',
        placeholder: 'a',
        buttonLabel: 'Submit device index',
        help: 'iCloudPD is asking for a device index before code entry. Submit the listed device index first; submit the six-digit code only after iCloudPD asks for it.',
      };
    case 'verification_code':
      return {
        active: true,
        label: 'Six-digit verification code',
        ariaLabel: 'New auth six-digit verification code',
        placeholder: '123456',
        buttonLabel: 'Submit code',
        help: 'Enter the six-digit Apple verification code.',
      };
    case 'apple_hsa2_challenge':
    case 'unknown':
      return {
        active: false,
        label: 'Waiting for visible two-factor prompt',
        ariaLabel: 'Waiting for visible two-factor prompt',
        placeholder: '',
        buttonLabel: 'Submit',
        help: 'Waiting for iCloudPD to expose whether it needs a device index or a six-digit verification code. Do not submit the SMS code until the prompt is visible.',
      };
    default:
      return {
        active: false,
        label: 'Waiting for two-factor prompt',
        ariaLabel: 'Waiting for two-factor prompt',
        placeholder: '',
        buttonLabel: 'Submit',
        help: 'Waiting for iCloudPD to ask for a device index or a six-digit verification code.',
      };
  }
}

// Formats the login progress requested-input row without exposing secret values.
function requestedInputLabelForPromptKind(kind: string | null | undefined): string | null {
  switch (kind) {
    case 'device_index':
      return 'Enter device index, for example a';
    case 'verification_code':
      return 'Enter SMS six-digit code';
    case 'device_index_or_code':
      return 'Enter device index, for example a';
    case 'apple_hsa2_challenge':
      return 'Waiting for visible Apple HSA2 prompt';
    case 'unknown':
      return 'Waiting for visible iCloudPD prompt';
    default:
      return null;
  }
}

// Renders a scheduler terminal row as complete JSON with no compact-row truncation.
function renderSchedulerEndpointRowModalContent(entry: LogEntry | Record<string, unknown>): string {
  return renderModalSection(
    'Full row data',
    `<pre class="modal-panel__json modal-panel__json--untruncated">${escapeHtml(formatPayload(entry))}</pre>`,
  );
}

// Renders detailed request and response context for a log-entry modal.
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

// Renders source, timeline, and optional context for a history-event modal.
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

// Renders request or response transport metadata for modal diagnostics.
function renderTransportSection(label: 'Request' | 'Response', data: TransportData): string {
  const requestId = readTransportRequestId(data) ?? 'Unavailable';
  const summaryRows: DefinitionListData =
    label === 'Request'
      ? {
          'Request ID': requestId,
          Method: data.method ?? 'Unavailable',
          Endpoint: data.path ?? 'Unavailable',
        }
      : {
          'Request ID': requestId,
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

// Reads a correlation id from explicit metadata or captured HTTP headers.
function readTransportRequestId(data: TransportData): unknown {
  if (data.requestId !== null && data.requestId !== undefined) {
    return data.requestId;
  }
  if (!data.headers || typeof data.headers !== 'object' || Array.isArray(data.headers)) {
    return null;
  }

  const headers = data.headers as Record<string, unknown>;
  return headers['X-Dashboard-Request-Id'] ?? headers['x-dashboard-request-id'] ?? null;
}

// Wraps modal section content with the existing section title structure.
function renderModalSection(title: string, body: string): string {
  return `
    <section class="modal-panel__section">
      <p class="modal-panel__section-title">${escapeHtml(title)}</p>
      ${body}
    </section>
  `;
}

// Flattens generic history context into definition-list compatible rows.
function flattenContext(details: unknown): DefinitionListData {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {};
  }
  return Object.entries(details).reduce<DefinitionListData>((acc, [key, value]) => {
    acc[key] = typeof value === 'object' && value !== null ? formatPayload(value) : value;
    return acc;
  }, {});
}
