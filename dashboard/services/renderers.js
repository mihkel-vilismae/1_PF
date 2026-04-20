import { STATUS_LABELS } from '../shared/constants.js';

export function statusBadge(status) {
  return `<span class="status-badge status-badge--${escapeHtml(status)}">${escapeHtml(STATUS_LABELS[status] ?? status)}</span>`;
}

export function renderLogEntries(entries = []) {
  if (!entries.length) {
    return '<div class="log-entry log-entry--empty"><p class="log-entry__message">No log entries yet.</p></div>';
  }

  return entries
    .map(
      (entry) => `
        <details class="log-entry log-entry--${escapeHtml(entry.type ?? 'info')}">
          <summary class="log-entry__summary">
            <div class="log-entry__meta">
              <span>${escapeHtml(entry.at ?? '')}</span>
              <span class="log-entry__status-chip">
                <span>${escapeHtml((entry.type ?? 'info').toUpperCase())}</span>
                <span class="log-entry__toggle" aria-hidden="true"></span>
              </span>
            </div>
            <div class="log-entry__message">${escapeHtml(entry.message ?? '')}</div>
          </summary>
          <div class="log-entry__details">
            ${renderLogDetails(entry)}
          </div>
        </details>
      `,
    )
    .join('');
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
  return entries
    .map(
      (entry) => `
        <article class="history-item history-item--${escapeHtml(entry.type ?? 'info')}">
          <div class="history-item__meta"><span>${escapeHtml(entry.at ?? '')}</span><span>${escapeHtml(entry.source ?? '')}</span></div>
          <div class="history-item__message">${escapeHtml(entry.message ?? '')}</div>
        </article>
      `,
    )
    .join('');
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

function renderLogDetails(entry) {
  const parts = [];
  const timeline = {
    'Local time': entry.at ?? 'Unavailable',
    'Tallinn time': entry.atTallinn ?? 'Unavailable',
    'ISO time': entry.atIso ?? 'Unavailable',
  };

  parts.push(`
    <div class="log-entry__detail-group">
      <p class="log-entry__detail-label">Timeline</p>
      ${renderDefinitionList(timeline)}
    </div>
  `);

  if (entry.details?.operation || entry.details?.endpoint || entry.details?.outcome) {
    parts.push(`
      <div class="log-entry__detail-group">
        <p class="log-entry__detail-label">Action</p>
        ${renderDefinitionList({
          Operation: entry.details.operation ?? 'Unavailable',
          Endpoint: entry.details.endpoint ?? 'Unavailable',
          Outcome: entry.details.outcome ?? 'Unavailable',
        })}
      </div>
    `);
  }

  if (entry.details?.request) {
    parts.push(renderRequestOrResponseDetails('Request', entry.details.request));
  }

  if (entry.details?.response) {
    parts.push(renderRequestOrResponseDetails('Response', entry.details.response));
  }

  if (!entry.details?.request && !entry.details?.response && !entry.details?.operation && !entry.details?.endpoint) {
    parts.push('<p class="log-entry__detail-empty">No additional request metadata recorded for this event.</p>');
  }

  return parts.join('');
}

function renderRequestOrResponseDetails(label, data) {
  const headerRows = data.headers ? `<pre class="log-entry__json">${escapeHtml(formatPayload(data.headers))}</pre>` : '<p class="log-entry__detail-empty">No headers captured.</p>';
  const bodyRows = data.body !== null && data.body !== undefined ? `<pre class="log-entry__json">${escapeHtml(formatPayload(data.body))}</pre>` : '<p class="log-entry__detail-empty">No body captured.</p>';

  return `
    <div class="log-entry__detail-group">
      <p class="log-entry__detail-label">${escapeHtml(label)}</p>
      ${renderDefinitionList(
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
            },
      )}
      <div class="log-entry__detail-column">
        <p class="log-entry__detail-label">${escapeHtml(label)} headers</p>
        ${headerRows}
      </div>
      <div class="log-entry__detail-column">
        <p class="log-entry__detail-label">${escapeHtml(label)} body</p>
        ${bodyRows}
      </div>
    </div>
  `;
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
