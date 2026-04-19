import { STATUS_LABELS } from '../shared/constants.js';

export function statusBadge(status) {
  return `<span class="status-badge status-badge--${status}">${STATUS_LABELS[status] ?? status}</span>`;
}

export function renderLogEntries(entries = []) {
  return entries
    .map(
      (entry) => `
        <article class="log-entry">
          <div class="log-entry__meta"><span>${entry.at}</span><span>${entry.type.toUpperCase()}</span></div>
          <div class="log-entry__message">${entry.message}</div>
        </article>
      `,
    )
    .join('');
}

export function renderDefinitionList(data = {}) {
  const rows = Object.entries(data)
    .map(([label, value]) => `<div class="definition-row"><dt>${label}</dt><dd>${value}</dd></div>`)
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
  const payloadLabel = result.outcome === 'success' ? 'Response payload' : 'Error payload';

  return `
    <section class="result-surface result-surface--${result.outcome}">
      <div class="result-surface__header">
        <h4>Latest backend result</h4>
        <span class="mini-badge">${result.outcome === 'success' ? 'Success' : 'Error'}</span>
      </div>
      ${renderDefinitionList(meta)}
      ${result.message ? `<p class="result-message">${escapeHtml(result.message)}</p>` : ''}
      ${payload !== undefined && payload !== null ? `
        <div class="result-json-block">
          <p class="result-json-label">${payloadLabel}</p>
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
        <article class="history-item history-item--${entry.type}">
          <div class="history-item__meta"><span>${entry.at}</span><span>${entry.source}</span></div>
          <div class="history-item__message">${entry.message}</div>
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
            <li class="step-list__item step-list__item--${step.status}">
              <span class="step-list__dot"></span>
              <span>${step.label}</span>
            </li>
          `,
        )
      .join('')}
    </ol>
  `;
}

function formatPayload(payload) {
  if (typeof payload === 'string') {
    return payload;
  }
  return JSON.stringify(payload, null, 2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
