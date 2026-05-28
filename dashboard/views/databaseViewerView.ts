import { renderDefinitionList, renderLogEntries, statusBadge } from '../services/renderers.ts';

export function renderDatabaseViewerView(state) {
  const databaseViewer = state.databaseViewer;
  const verification = databaseViewer.verification;
  const connected = Boolean(databaseViewer.connected);
  const verificationPassed = Boolean(verification?.verificationPassed);
  const tables = Array.isArray(databaseViewer.tables) ? databaseViewer.tables : [];
  const rows = databaseViewer.rows;
  const logging = databaseViewer.logging ?? {};

  return `
    <section class="view-page">
      <div class="view-hero">
        <div>
          <p class="eyebrow">E — Database Viewer</p>
          <h2>Inspect the configured SQLite database without pretending this repo has a global DB admin layer.</h2>
          <p class="hero-copy">Verification, table catalog reads, paginated row inspection, and DB activity logging all use repo-local backend routes. Logging is intentionally scoped to backend-mediated DB actions observed by this app while the session is active.</p>
        </div>
        <div class="hero-pill-group">
          <span class="hero-pill hero-pill--success">Backend-backed browsing</span>
          <span class="hero-pill">Repo-local activity logging only</span>
        </div>
      </div>

      <div class="section-grid section-grid--two">
        <article class="card">
          <header class="card__header">
            <div><p class="card__code">E1</p><h3>Verify and connect</h3></div>
            ${statusBadge(state.statusByKey.E1)}
          </header>
          <p class="card__copy">The verify step checks DB existence plus a documented required-table baseline. Connect is a logical gate backed by the repo-local backend, not a promise of a durable open SQL session.</p>
          <div class="button-row">
            <button class="button button--primary" data-action="verify-db-viewer">Verify Database</button>
            <button class="button button--secondary" data-action="connect-db-viewer" ${verificationPassed && !connected ? '' : 'disabled'}>Connect to Database</button>
          </div>
          ${renderVerificationPanel(databaseViewer)}
          <div class="log-surface" data-scroll-preserve="log-E1">${renderLogEntries(state.logs.E1, { sourceKey: 'E1' })}</div>
        </article>

        <article class="card">
          <header class="card__header">
            <div><p class="card__code">E2</p><h3>Table catalog</h3></div>
            ${statusBadge(state.statusByKey.E2)}
          </header>
          <p class="card__copy">Show Tables reads the current catalog from the backend helper and keeps the object list bounded to names and schema summary fields.</p>
          <div class="button-row">
            <button class="button button--primary" data-action="show-db-tables" ${connected ? '' : 'disabled'}>Show Tables</button>
          </div>
          ${renderTablesPanel(databaseViewer)}
          <div class="log-surface" data-scroll-preserve="log-E2">${renderLogEntries(state.logs.E2, { sourceKey: 'E2' })}</div>
        </article>
      </div>

      <div class="section-grid section-grid--two-uneven">
        <article class="card card--feature">
          <header class="card__header">
            <div><p class="card__code">E3</p><h3>Row viewer</h3></div>
            ${statusBadge(state.statusByKey.E3)}
          </header>
          <p class="card__copy">Rows are requested in backend-owned pages. The current UI asks for 50 rows per page, while the backend also enforces a hard maximum page size to keep requests bounded.</p>
          ${renderRowsPanel(databaseViewer)}
          <div class="log-surface" data-scroll-preserve="log-E3">${renderLogEntries(state.logs.E3, { sourceKey: 'E3' })}</div>
        </article>

        <article class="card card--feature">
          <header class="card__header">
            <div><p class="card__code">E4</p><h3>DB activity logging</h3></div>
            ${statusBadge(state.statusByKey.E4)}
          </header>
          <p class="card__copy">This is a bounded session log, not a full SQL trace. It only captures DB activity the repo-local backend sees while the session is active.</p>
          <div class="button-row">
            <button class="button button--primary" data-action="start-db-logging" ${connected && !logging.active ? '' : 'disabled'}>Start DB Logging</button>
            <button class="button button--secondary" data-action="stop-db-logging" ${connected && logging.active ? '' : 'disabled'}>Stop DB Logging</button>
          </div>
          ${renderLoggingPanel(databaseViewer)}
          <div class="log-surface" data-scroll-preserve="log-E4">${renderLogEntries(state.logs.E4, { sourceKey: 'E4' })}</div>
        </article>
      </div>
    </section>
  `;
}

function renderVerificationPanel(databaseViewer) {
  const verification = databaseViewer.verification;
  if (!verification) {
    return `
      <div class="notice notice--neutral">
        Run Verify Database to check the file path and compare the current schema against the documented required-table baseline.
      </div>
    `;
  }

  const requiredTables = verification.requiredTables ?? {};
  const expected = Array.isArray(requiredTables.expected) ? requiredTables.expected : [];
  const present = Array.isArray(requiredTables.present) ? requiredTables.present : [];
  const missing = Array.isArray(requiredTables.missing) ? requiredTables.missing : [];

  return `
    <div class="db-panel-stack">
      <div class="stat-grid">
        ${renderDefinitionList({
          'DB file': verification.database?.exists ? 'Present' : 'Missing',
          'Required tables': `${present.length}/${expected.length}`,
          'Authority': requiredTables.sourcePath ?? 'Unavailable',
          'Connect gate': verification.verificationPassed ? 'Ready' : 'Blocked',
        })}
      </div>
      <div class="notice ${verification.verificationPassed ? 'notice--neutral' : 'notice--danger'}">
        <strong>${escapeHtml((verification.messages ?? []).join(' ') || 'Verification completed.')}</strong>
        <p class="db-inline-copy">${escapeHtml(requiredTables.note ?? '')}</p>
      </div>
      ${missing.length ? `
        <div class="db-chip-list">
          ${missing.map((tableName) => `<span class="db-chip db-chip--danger">${escapeHtml(tableName)}</span>`).join('')}
        </div>
      ` : `
        <div class="db-chip-list">
          ${present.map((tableName) => `<span class="db-chip">${escapeHtml(tableName)}</span>`).join('')}
        </div>
      `}
    </div>
  `;
}

function renderTablesPanel(databaseViewer) {
  const tables = Array.isArray(databaseViewer.tables) ? databaseViewer.tables : [];
  if (!databaseViewer.connected) {
    return '<div class="notice notice--neutral">Connect to Database first to unlock the table catalog.</div>';
  }
  if (!tables.length) {
    return '<div class="notice notice--neutral">No table catalog loaded yet. Press Show Tables to fetch the current SQLite objects. An empty database is allowed and will simply show zero objects.</div>';
  }

  return `
    <div class="db-panel-stack">
      <div class="stat-grid">
        ${renderDefinitionList({
          Objects: String(tables.length),
          'SQLite page count': String(databaseViewer.sqlite?.pageCount ?? 'Unavailable'),
          'SQLite page size': String(databaseViewer.sqlite?.pageSize ?? 'Unavailable'),
          'SQLite user_version': String(databaseViewer.sqlite?.userVersion ?? 'Unavailable'),
        })}
      </div>
      <div class="db-object-grid" data-scroll-preserve="database-object-grid">
        ${tables.map((table) => `
          <button
            type="button"
            class="db-object-button ${databaseViewer.selectedTableName === table.name ? 'db-object-button--active' : ''}"
            data-db-table="${escapeHtml(table.name)}"
          >
            <span class="db-object-button__name">${escapeHtml(table.name)}</span>
            <span class="db-object-button__meta">${escapeHtml(table.kind)} • ${escapeHtml(String(table.columnCount ?? 0))} columns</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRowsPanel(databaseViewer) {
  const rows = databaseViewer.rows;
  if (!databaseViewer.connected) {
    return '<div class="notice notice--neutral">Row browsing unlocks after the logical connect step succeeds.</div>';
  }
  if (!databaseViewer.tables.length) {
    return '<div class="notice notice--neutral">Load the table catalog first, then choose a table to inspect.</div>';
  }
  if (!rows) {
    return '<div class="notice notice--neutral">Choose a table in E2 to load a bounded backend page. Empty tables are valid and will return zero rows.</div>';
  }

  const orderingDescription = rows.ordering?.description ?? 'Ordering metadata unavailable.';
  const pageLabel = rows.pageCount ? `${rows.page + 1} / ${rows.pageCount}` : `${rows.page + 1}`;

  return `
    <div class="db-panel-stack">
      <div class="stat-grid">
        ${renderDefinitionList({
          Object: rows.name,
          Kind: rows.kind,
          'Rows in page': String(rows.rowCount),
          'Total rows': String(rows.totalRows),
          Page: pageLabel,
        })}
      </div>
      <div class="notice notice--neutral">
        <strong>${escapeHtml(orderingDescription)}</strong>
        <p class="db-inline-copy">${escapeHtml(rows.querySummary ?? '')}</p>
      </div>
      <div class="button-row">
        <button class="button button--secondary" data-db-page-delta="-1" ${rows.hasPreviousPage ? '' : 'disabled'}>Previous 50</button>
        <button class="button button--secondary" data-db-page-delta="1" ${rows.hasNextPage ? '' : 'disabled'}>Next 50</button>
      </div>
      ${rows.rowCount ? renderRowsTable(rows) : '<div class="notice notice--neutral">This object returned no rows for the current page.</div>'}
    </div>
  `;
}

function renderRowsTable(rows) {
  const columns = Array.isArray(rows.columns) ? rows.columns : [];
  return `
    <div class="db-table-shell" data-scroll-preserve="database-table-shell">
      <table class="db-table">
        <thead>
          <tr>
            ${columns.map((columnName) => `<th>${escapeHtml(columnName)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.rows.map((row) => `
            <tr>
              ${columns.map((columnName) => `<td>${escapeHtml(formatCell(row[columnName]))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderLoggingPanel(databaseViewer) {
  const logging = databaseViewer.logging ?? {};
  const entries = Array.isArray(logging.entries) ? logging.entries : [];

  return `
    <div class="db-panel-stack">
      <div class="stat-grid">
        ${renderDefinitionList({
          Session: logging.sessionId ?? 'Inactive',
          Active: logging.active ? 'Yes' : 'No',
          'Started at': logging.startedAt ?? 'Not started',
          'Stopped at': logging.endedAt ?? 'Not stopped',
          'Captured events': String(logging.entryCount ?? entries.length ?? 0),
        })}
      </div>
      <div class="notice notice--neutral">
        <strong>${escapeHtml(logging.coverage ?? 'No logging coverage summary available.')}</strong>
      </div>
      ${entries.length ? `
        <div class="db-activity-list" data-scroll-preserve="database-activity-list">
          ${entries.map((entry) => `
            <article class="db-activity-entry">
              <div class="db-activity-entry__meta">
                <span>${escapeHtml(entry.at ?? '')}</span>
                <span>${escapeHtml((entry.status ?? 'info').toUpperCase())}</span>
              </div>
              <strong>${escapeHtml(entry.operation ?? 'unknown')}</strong>
              <p>${escapeHtml(entry.message ?? '')}</p>
              ${entry.details ? `<pre>${escapeHtml(JSON.stringify(entry.details, null, 2))}</pre>` : ''}
            </article>
          `).join('')}
        </div>
      ` : '<div class="notice notice--neutral">No DB activity has been captured for this session yet.</div>'}
    </div>
  `;
}

function formatCell(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
