import { STATUS_LABELS } from '../shared/constants.js';

export function statusBadge(status) {
  return `<span class="status-badge status-badge--${escapeHtml(status)}">${escapeHtml(STATUS_LABELS[status] ?? status)}</span>`;
}

export function renderLogEntries(entries = [], options = {}) {
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

export function renderSourceBadge(mode, label = null) {
  const normalizedMode = ['real', 'hybrid', 'mock'].includes(mode) ? mode : 'hybrid';
  const text = label ?? normalizedMode.toUpperCase();
  return `<span class="source-badge source-badge--${escapeHtml(normalizedMode)}">${escapeHtml(text)}</span>`;
}

export function renderDefinitionList(data = {}) {

  const rows = Object.entries(data)
    .map(([label, value]) => `<div class="definition-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(formatInlineValue(value))}</dd></div>`)
    .join('');
  return `<dl class="definition-list">${rows}</dl>`;
}

export function renderResultSurface(result) {
  if (!result) {
    return `
      <div class="result-surface result-surface--empty">
        <p class="result-empty">No backend result yet. This card will call the documented API endpoint when triggered.</p>
      </div>
    `;
  }

  const meta = {
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

export function renderHistory(entries = []) {
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

export function renderModal(modal) {
  if (!modal) {
    return '';
  }

  const title = modal.title ?? 'Details';
  const subtitle = modal.subtitle ?? '';
  const kindLabel = modal.kind === 'log' ? 'Log entry' : 'Event history';
  const content = modal.kind === 'log' ? renderLogModalContent(modal.entry) : renderHistoryModalContent(modal.entry);
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

export function renderStepList(steps = []) {
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

function renderLogModalContent(entry) {
  const parts = [];
  const timeline = {
    'Local time': entry.at ?? 'Unavailable',
    'Tallinn time': entry.atTallinn ?? 'Unavailable',
    'ISO time': entry.atIso ?? 'Unavailable',
  };

  parts.push(renderModalSection('Timeline', renderDefinitionList(timeline)));

  if (entry.details?.operation || entry.details?.endpoint || entry.details?.outcome) {
    parts.push(
      renderModalSection(
        'Action',
        renderDefinitionList({
          Operation: entry.details.operation ?? 'Unavailable',
          Endpoint: entry.details.endpoint ?? 'Unavailable',
          Outcome: entry.details.outcome ?? 'Unavailable',
        }),
      ),
    );
  }

  if (entry.details?.request) {
    parts.push(renderTransportSection('Request', entry.details.request));
  }

  if (entry.details?.response) {
    parts.push(renderTransportSection('Response', entry.details.response));
  }

  if (!entry.details?.request && !entry.details?.response && !entry.details?.operation && !entry.details?.endpoint) {
    parts.push(renderModalSection('Notes', '<p class="modal-panel__empty">No additional request metadata was captured for this log entry.</p>'));
  }

  return parts.join('');
}

function renderHistoryModalContent(entry) {
  const parts = [];
  const timeline = {
    'Local time': entry.at ?? 'Unavailable',
    'Tallinn time': entry.atTallinn ?? 'Unavailable',
    'ISO time': entry.atIso ?? 'Unavailable',
  };

  parts.push(
    renderModalSection(
      'Event summary',
      renderDefinitionList({
        Source: entry.source ?? 'Unavailable',
        Type: entry.type ?? 'Unavailable',
        Message: entry.message ?? 'Unavailable',
      }),
    ),
  );
  parts.push(renderModalSection('Timeline', renderDefinitionList(timeline)));

  if (entry.details?.request || entry.details?.response) {
    if (entry.details.request) {
      parts.push(renderTransportSection('Request', entry.details.request));
    }
    if (entry.details.response) {
      parts.push(renderTransportSection('Response', entry.details.response));
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

function renderTransportSection(label, data) {
  const summaryRows =
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

function renderModalSection(title, body) {
  return `
    <section class="modal-panel__section">
      <p class="modal-panel__section-title">${escapeHtml(title)}</p>
      ${body}
    </section>
  `;
}

function flattenContext(details) {
  return Object.entries(details).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'object' && value !== null ? formatPayload(value) : value;
    return acc;
  }, {});
}

function formatPayload(payload) {
  if (typeof payload === 'string') {
    return payload;
  }
  return JSON.stringify(payload, null, 2);
}

function formatInlineValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return formatPayload(value);
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
