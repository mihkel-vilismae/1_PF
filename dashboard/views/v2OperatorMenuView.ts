/*
 * Visual-only PhotoFrame v2 operator menu prototype.
 * This view renders the Structure V1 menu described in the v2 planning chat.
 * It does not call backend routes, mutate .env/DB/crontab/recovery state, or claim
 * that the operator scripts are implemented. Buttons/cards are presentation only.
 */

type V2Status = 'v2-visual' | 'v2-enabled' | 'v3' | 'planned-safe' | 'disabled';

type V2MenuNode = {
  id: string;
  label: string;
  status?: V2Status;
  explanation?: string;
  marker?: string;
  children?: V2MenuNode[];
};

const v2MenuTree: V2MenuNode[] = [
  {
    id: 'setup',
    label: 'setup.sh',
    status: 'planned-safe',
    explanation: 'v2 preflight/orchestration only. Full dependency installation is a v3.0 milestone.',
  },
  {
    id: 'authentication',
    label: 'authentication.sh',
    status: 'planned-safe',
    explanation: 'Local operator authentication flow for iCloudPD. Credentials, 2FA, cookies, and session secrets stay local.',
  },
  {
    id: 'startup',
    label: 'startup.sh',
    status: 'v2-visual',
    children: [
      {
        id: 'startup.env',
        label: '.env / environment variables',
        children: [
          { id: 'startup.env.verify', label: 'verify.env', status: 'planned-safe' },
          {
            id: 'startup.env.open',
            label: 'open .env in text editor',
            status: 'planned-safe',
            explanation: 'If .env does not exist, create it from default/example values. If defaults are missing, show a non-crashing error.',
          },
        ],
      },
      {
        id: 'startup.database',
        label: 'database',
        children: [
          { id: 'startup.database.verify', label: 'verify DB', status: 'planned-safe' },
          { id: 'startup.database.recreate', label: 'recreate DB', status: 'planned-safe' },
          {
            id: 'startup.database.backup',
            label: 'backup DB',
            status: 'v2-enabled',
            explanation: 'Resolved v2 decision: backup DB is a main v2 action. Initial format can be a simple SQL dump.',
          },
        ],
      },
      {
        id: 'startup.crontab',
        label: 'crontab',
        children: [
          {
            id: 'startup.crontab.verify',
            label: 'verify crontab',
            status: 'planned-safe',
            explanation: 'The system can read the crontab and can also write to it.',
          },
          { id: 'startup.crontab.print', label: 'print/output current crontab', status: 'planned-safe' },
          { id: 'startup.crontab.installDefault', label: 'install default crontab', status: 'planned-safe' },
          {
            id: 'startup.crontab.dev',
            label: 'go to crontab page / show additional options',
            marker: '*DEV',
            children: [
              { id: 'startup.crontab.dev.time', label: 'current system time', status: 'planned-safe' },
              { id: 'startup.crontab.dev.installed', label: 'installed crontab', status: 'planned-safe' },
              {
                id: 'startup.crontab.dev.customWorker',
                label: 'install custom worker',
                marker: '*MK1, MultiComboRow',
                status: 'planned-safe',
                explanation: 'Choose worker type, then choose the time value. Visual-only multi-combo row.',
                children: [
                  { id: 'startup.crontab.dev.customWorker.regular', label: 'regular worker' },
                  { id: 'startup.crontab.dev.customWorker.playback', label: 'playback worker' },
                  { id: 'startup.crontab.dev.customWorker.screen', label: 'screen on-off worker' },
                  { id: 'startup.crontab.dev.customWorker.time1', label: 'time value: every 1 minute' },
                  { id: 'startup.crontab.dev.customWorker.time5', label: 'time value: every 5 minutes' },
                  { id: 'startup.crontab.dev.customWorker.hour', label: 'time value: at the start of each hour' },
                  { id: 'startup.crontab.dev.customWorker.day', label: 'time value: every day at 13:00:00 Estonian time' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'workers',
    label: 'workers',
    status: 'v2-visual',
    children: [
      {
        id: 'workers.currentStatus',
        label: 'current status',
        explanation: 'Shows regular worker status, playback worker status, and screen on-off worker status.',
      },
      {
        id: 'workers.regular',
        label: 'regular worker',
        children: [
          { id: 'workers.regular.status', label: 'current status', explanation: 'Shows active stage, Estonia datetime, and automatic/manual call type.' },
          { id: 'workers.regular.enableAll', label: 'enable all' },
          { id: 'workers.regular.disableAll', label: 'disable all' },
          regularStage('download'),
          regularStage('index'),
          regularStage('parse files for GPS'),
          regularStage('geocode'),
          regularStage('enqueue playback'),
        ],
      },
      {
        id: 'workers.playback',
        label: 'playback worker',
        children: [
          { id: 'workers.playback.status', label: 'current status', explanation: 'Hover/enter should show current file, full filename, GPS coordinates, and parsed address.' },
          { id: 'workers.playback.current', label: 'current image / video' },
        ],
      },
      {
        id: 'workers.screen',
        label: 'screen on-off worker',
        children: [
          { id: 'workers.screen.status', label: 'current status' },
          { id: 'workers.screen.enableAll', label: 'enable all' },
          { id: 'workers.screen.disableAll', label: 'disable all' },
          { id: 'workers.screen.mouse', label: 'mouse', explanation: 'Hover: current status enabled/disabled. Press Enter here to enable/disable.' },
          { id: 'workers.screen.keyboard', label: 'keyboard', explanation: 'Hover: current status enabled/disabled. Press Enter here to enable/disable.' },
          { id: 'workers.screen.pir', label: 'PIR sensor', explanation: 'Hover: current status enabled/disabled. Press Enter here to enable/disable.' },
        ],
      },
    ],
  },
  {
    id: 'statistics',
    label: 'statistics page',
    status: 'v3',
    explanation: 'v2 should collect runtime statistics; the rich statistics page remains v3.0.',
  },
  {
    id: 'troubleshooting',
    label: 'troubleshooting',
    status: 'v2-visual',
    children: [
      {
        id: 'troubleshooting.manual',
        label: 'manual troubleshooting actions',
        children: [
          'open default logging folder',
          'mark this point in logs with a very distinct entry',
          'export logs between marked points',
          'find stale locks',
          'clear stale locks',
          'show latest worker status files',
          'test log write permissions',
          'export troubleshooting bundle',
          'show system health snapshot',
          'check cron/service status',
          'backup current logs',
          'clear current logs',
        ].map((label, index) => ({ id: `troubleshooting.manual.${index + 1}`, label, status: 'planned-safe' as const })),
      },
      {
        id: 'troubleshooting.logging',
        label: 'logging',
        explanation: 'Page-specific logs, global log, full verbose log, and high-importance regular log.',
      },
      {
        id: 'troubleshooting.logHandling',
        label: 'log handling',
        explanation: 'Conditional actions from measurable rules, not only thrown errors.',
      },
      {
        id: 'troubleshooting.errorLogging',
        label: 'error logging',
        explanation: 'Page-specific error logs, combined/global error log, and global high-priority error log.',
      },
      {
        id: 'troubleshooting.errorHandling',
        label: 'error handling',
        explanation: 'Final outer layer should catch/log unhandled errors before exit when possible.',
      },
      {
        id: 'troubleshooting.examples',
        label: 'examples',
        marker: '*EX',
        children: [
          'less than 1 GB of storage left',
          'less than 100 MB of storage left',
          'less than 10 MB of storage left',
          'RAM usage 95%+ for 1 minute',
          'RAM usage 95%+ for 5 minutes',
          'RAM usage 95%+ for 10 minutes',
          'CPU usage/load 95%+ for 1 minute',
          'CPU usage/load 95%+ for 5 minutes',
          'CPU usage/load 95%+ for 10 minutes',
          'network usage is consistently high',
          'network usage is high normally and becomes very high when data-transfer stages run',
          'network usage suggests something else may be running in the background outside this app',
          'system temperature above threshold for 1 minute',
          'system temperature above threshold for 5 minutes',
          'system temperature above threshold for 10 minutes',
        ].map((label, index) => ({ id: `troubleshooting.examples.${index + 1}`, label })),
      },
    ],
  },
  {
    id: 'recovery',
    label: 'recovery',
    status: 'v2-visual',
    children: [
      { id: 'recovery.metadata', label: 'snapshot metadata', explanation: 'Shows latest snapshot time and other snapshot-level metadata.' },
      { id: 'recovery.policy', label: 'current backup snapshot generation policy', explanation: 'Human-readable policy text; changing policy may involve AI later.' },
      { id: 'recovery.current', label: 'current snapshot', explanation: 'Shows human-readable structure, raw item/field list, and current JSON-like snapshot values.' },
      { id: 'recovery.currentBackup', label: 'current backup snapshot', explanation: 'Shows latest saved backup snapshot for inspection before restore.' },
      { id: 'recovery.save', label: 'save state snapshot', explanation: 'Creates a persistent snapshot. Visual-only in this slice.' },
      { id: 'recovery.restore', label: 'restore state snapshot', explanation: 'Restores from selected snapshot later. Visual-only in this slice.' },
      { id: 'recovery.stored', label: 'currently stored backup snapshots', explanation: 'Navigable snapshot list with protocol version and compatibility status later.' },
    ],
  },
  {
    id: 'pir',
    label: 'PIR',
    status: 'v2-visual',
    explanation: 'Route shell for isolated activity detection and screen on-off testing. Real B5 controls and PIR emulator arrive later.',
  },
  {
    id: 'playback',
    label: 'PLAYBACK',
    status: 'v2-visual',
    explanation: 'Route shell for isolated playback queue, rendering mode, fullscreen, and address overlay testing.',
  },
  {
    id: 'realPlayback',
    label: 'REAL PLAYBACK',
    status: 'v2-visual',
    explanation: 'Explanation-only final endpoint shell. It will compose proven startup, workers, recovery, PIR, and playback pieces later.',
  },
];

function regularStage(label: string): V2MenuNode {
  const key = label.toLowerCase().replaceAll(' ', '-');
  return {
    id: `workers.regular.${key}`,
    label,
    children: [
      { id: `workers.regular.${key}.batchSize`, label: 'batch size' },
      { id: `workers.regular.${key}.statistics`, label: 'show statistics for this stage', status: 'v3', explanation: 'v2 collects stats; rich statistics page is v3.' },
    ],
  };
}

const rootSummary = [
  { label: 'setup.sh', value: 'preflight only', tone: 'planned-safe' },
  { label: 'authentication.sh', value: 'local iCloudPD login', tone: 'planned-safe' },
  { label: 'startup.sh', value: 'env / DB / crontab', tone: 'v2-visual' },
  { label: 'workers', value: 'status + controls', tone: 'v2-visual' },
  { label: 'troubleshooting', value: 'logs + stale locks', tone: 'v2-visual' },
  { label: 'recovery', value: 'snapshot + restore plan', tone: 'v2-visual' },
  { label: 'PIR', value: 'activity test shell', tone: 'v2-visual' },
  { label: 'PLAYBACK', value: 'queue/rendering shell', tone: 'v2-visual' },
  { label: 'REAL PLAYBACK', value: 'final endpoint plan', tone: 'v2-visual' },
];

export function renderV2OperatorMenuView(): string {
  return `
    <section class="v2-menu-page" data-v2-operator-menu="true" data-ui-element-id="pf.v2_operator_menu.page">
      <article class="card card--feature v2-menu-hero" data-ui-element-id="pf.v2_operator_menu.hero">
        <header class="card__header">
          <div>
            <p class="card__code">V2</p>
            <h2>PhotoFrame v2 Operator Menu</h2>
          </div>
          <div class="v2-menu-badges">
            <span class="pill">visual-only</span>
            <span class="pill">Structure V1</span>
            <span class="pill">no backend mutation</span>
          </div>
        </header>
        <p class="card__copy">Visual prototype for the post-v1.0 _v2 operator workflow. This page renders the menu map only; buttons and rows do not write crontab, edit .env, authenticate, mutate DB, or run recovery.</p>
      </article>

      <div class="v2-menu-grid">
        <aside class="card v2-menu-root-card" data-ui-element-id="pf.v2_operator_menu.root_sections">
          <p class="card__code">ROOT</p>
          <h3>_v2/</h3>
          <div class="v2-root-list">
            ${rootSummary.map((item, index) => `
              <div class="v2-root-item v2-root-item--${escapeHtml(item.tone)}">
                <span class="v2-root-item__index">${String(index + 1).padStart(2, '0')}</span>
                <strong>${escapeHtml(item.label)}</strong>
                <small>${escapeHtml(item.value)}</small>
              </div>
            `).join('')}
          </div>
        </aside>

        <article class="card v2-menu-tree-card" data-ui-element-id="pf.v2_operator_menu.structure_tree">
          <header class="v2-card-header-inline">
            <div>
              <p class="card__code">STRUCTURE V1</p>
              <h3>Visible menu tree</h3>
            </div>
            <span class="pill">numbering: off</span>
          </header>
          <div class="v2-tree" role="tree" aria-label="PhotoFrame v2 visual menu tree">
            ${v2MenuTree.map((node) => renderNode(node, 0)).join('')}
          </div>
        </article>

        <aside class="card v2-menu-inspector" data-ui-element-id="pf.v2_operator_menu.inspector">
          <p class="card__code">BOUNDARY</p>
          <h3>Visual-only implementation</h3>
          <dl class="definition-list">
            <div><dt>Runtime claim</dt><dd>No real backend behavior yet</dd></div>
            <div><dt>Safe behavior</dt><dd>No secrets, no crontab writes, no DB mutation</dd></div>
            <div><dt>v2 target</dt><dd>operator-safe menu shell</dd></div>
            <div><dt>v3 target</dt><dd>full installer + richer statistics UI</dd></div>
          </dl>

          <div class="v2-legend" data-ui-element-id="pf.v2_operator_menu.legend">
            <h4>Legend</h4>
            <p><strong>*DEV</strong> — deeper/developer option area.</p>
            <p><strong>*MK1, MultiComboRow</strong> — multi-combo row: choose worker, then choose time.</p>
            <p><strong>*EX</strong> — examples that must later be documented and resolved where needed.</p>
            <p><strong>v3</strong> — visible or planned item belongs to v3.0, not the main v2.0 target.</p>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderNode(node: V2MenuNode, depth: number): string {
  const hasChildren = Boolean(node.children?.length);
  const status = node.status ?? 'planned-safe';
  return `
    <div class="v2-tree-node v2-tree-node--depth-${depth} v2-tree-node--${status}" role="treeitem" aria-expanded="${hasChildren ? 'true' : 'false'}" data-v2-menu-node="${escapeHtml(node.id)}" data-ui-element-id="pf.v2_operator_menu.node.${escapeHtml(node.id)}">
      <div class="v2-tree-node__row">
        <span class="v2-tree-node__connector" aria-hidden="true">${depth === 0 ? '├' : '└'}</span>
        <span class="v2-tree-node__label">${escapeHtml(node.label)}</span>
        ${node.marker ? `<span class="v2-marker">${escapeHtml(node.marker)}</span>` : ''}
        ${node.status ? `<span class="v2-status v2-status--${escapeHtml(node.status)}">${statusLabel(node.status)}</span>` : ''}
      </div>
      ${node.explanation ? `<p class="v2-tree-node__explanation">${escapeHtml(node.explanation)}</p>` : ''}
      ${hasChildren ? `<div class="v2-tree-node__children">${node.children?.map((child) => renderNode(child, depth + 1)).join('')}</div>` : ''}
    </div>
  `;
}

function statusLabel(status: V2Status): string {
  return {
    'v2-visual': 'v2 visual',
    'v2-enabled': 'v2 enabled',
    v3: 'v3',
    'planned-safe': 'planned-safe',
    disabled: 'disabled',
  }[status];
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
