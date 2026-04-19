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
