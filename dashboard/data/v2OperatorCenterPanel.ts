import { type V2OperatorSidebarRoute } from './v2OperatorSidebar.ts';

export type V2OperatorBlockType =
  | 'infoPanel'
  | 'statusCard'
  | 'actionList'
  | 'sectionGroup'
  | 'toggleGroup'
  | 'multiComboRow'
  | 'stageTable'
  | 'snapshotViewer'
  | 'snapshotList'
  | 'futurePlaceholder'
  | 'exampleList';

export type V2OperatorRisk = 'safe' | 'guarded' | 'destructive' | 'future' | 'localSecretSensitive';

export type V2OperatorActionItem = {
  id: string;
  label: string;
  status?: string;
  description?: string;
  risk?: V2OperatorRisk;
  interaction?: 'visualOnly' | 'guardedAction' | 'disabledPlaceholder';
};

export type V2OperatorToggleItem = {
  id: string;
  label: string;
  status?: string;
  description?: string;
};

export type V2OperatorStageItem = {
  id: string;
  label: string;
  status: string;
  batchSizeLabel: string;
  statisticsStatus: string;
};

export type V2OperatorSectionItem = V2OperatorActionItem | V2OperatorToggleItem;

export type V2OperatorCenterPanelBlock =
  | {
      type: 'infoPanel' | 'statusCard' | 'snapshotViewer' | 'snapshotList' | 'futurePlaceholder';
      id: string;
      title: string;
      body?: string;
      status?: string;
      risk?: V2OperatorRisk;
      fields?: readonly { label: string; value: string }[];
    }
  | {
      type: 'actionList' | 'exampleList';
      id: string;
      title: string;
      body?: string;
      items: readonly V2OperatorActionItem[];
    }
  | {
      type: 'sectionGroup';
      id: string;
      title: string;
      body?: string;
      sections: readonly {
        id: string;
        title: string;
        body?: string;
        items: readonly V2OperatorSectionItem[];
      }[];
    }
  | {
      type: 'toggleGroup';
      id: string;
      title: string;
      body?: string;
      status?: string;
      toggles: readonly V2OperatorToggleItem[];
      actions?: readonly V2OperatorActionItem[];
    }
  | {
      type: 'multiComboRow';
      id: string;
      title: string;
      body?: string;
      status?: string;
      risk?: V2OperatorRisk;
      workerOptions: readonly string[];
      scheduleOptions: readonly string[];
      previewLabel: string;
    }
  | {
      type: 'stageTable';
      id: string;
      title: string;
      body?: string;
      status?: string;
      actions?: readonly V2OperatorActionItem[];
      stages: readonly V2OperatorStageItem[];
    };

export type V2OperatorCenterPanelPage = {
  route: V2OperatorSidebarRoute;
  title: string;
  summary: string;
  blocks: readonly V2OperatorCenterPanelBlock[];
};

const visualOnly = 'Visual-only in this slice. No backend action is wired from V2.';

export const V2_OPERATOR_CENTER_PANEL_PAGES: Record<V2OperatorSidebarRoute, V2OperatorCenterPanelPage> = {
  setup: {
    route: 'setup',
    title: 'setup.sh',
    summary: 'Small v2 preflight/orchestration page only. Full dependency installation stays a v3 milestone.',
    blocks: [
      {
        type: 'infoPanel',
        id: '01.info',
        title: 'Setup scope',
        body: 'v2 setup is preflight/orchestration only. It may check and report readiness, but it does not install full dependencies in this slice.',
        status: 'planned-safe',
        risk: 'safe',
      },
      {
        type: 'actionList',
        id: '01.actions',
        title: 'Preflight actions',
        body: visualOnly,
        items: [
          { id: '01.01', label: 'setup.sh', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly', description: 'Run safe setup/preflight orchestration later when a backend contract exists.' },
        ],
      },
    ],
  },
  authentication: {
    route: 'authentication',
    title: 'authentication.sh',
    summary: 'Local iCloudPD login/session page. Credentials, 2FA, cookies, and session secrets must stay local and redacted.',
    blocks: [
      {
        type: 'infoPanel',
        id: '02.info',
        title: 'Local-only authentication boundary',
        body: 'This page owns only local iCloudPD login/session flow. It must not display raw credentials, 2FA codes, cookies, session files, or secret paths without an existing redaction contract.',
        status: 'planned-safe',
        risk: 'localSecretSensitive',
      },
      {
        type: 'statusCard',
        id: '02.status',
        title: 'iCloudPD session status',
        body: 'Session status placeholder. No session read/write action is executed from V2 in this slice.',
        status: 'visual-only',
        risk: 'localSecretSensitive',
        fields: [
          { label: 'Credential output', value: 'redacted / not rendered' },
          { label: 'Session action state', value: 'not wired' },
        ],
      },
      {
        type: 'actionList',
        id: '02.actions',
        title: 'Authentication actions',
        body: visualOnly,
        items: [
          { id: '02.01', label: 'authentication.sh', status: 'planned-safe', risk: 'localSecretSensitive', interaction: 'visualOnly', description: 'Local iCloudPD login/session workflow placeholder.' },
        ],
      },
    ],
  },
  startup: {
    route: 'startup',
    title: 'startup.sh',
    summary: 'Startup prerequisites grouped into environment, database, and crontab sections.',
    blocks: [
      {
        type: 'sectionGroup',
        id: '03.sections',
        title: 'Startup sections',
        body: 'These are grouped center-panel sections, not nested sidebar routes.',
        sections: [
          {
            id: '03.01',
            title: '.env / environment variables',
            body: 'If .env does not exist, a later guarded implementation may create it from defaults/example values. Missing defaults must be a non-crashing error.',
            items: [
              { id: '03.01.01', label: 'verify.env', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
              { id: '03.01.02', label: 'open .env in text editor', status: 'planned-safe', risk: 'guarded', interaction: 'guardedAction' },
            ],
          },
          {
            id: '03.02',
            title: 'database',
            body: 'Database inspection and maintenance actions. Destructive operations must stay guarded.',
            items: [
              { id: '03.02.01', label: 'verify DB', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
              { id: '03.02.02', label: 'recreate DB', status: 'planned-safe', risk: 'destructive', interaction: 'guardedAction' },
              { id: '03.02.03', label: 'backup DB', status: 'v2 enabled', risk: 'safe', interaction: 'visualOnly', description: 'Initial format can be a simple SQL dump.' },
            ],
          },
          {
            id: '03.03',
            title: 'crontab',
            body: 'Crontab reads are safe to expose visually; writes must be previewed and guarded.',
            items: [
              { id: '03.03.01', label: 'verify crontab', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
              { id: '03.03.02', label: 'print/output current crontab', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
              { id: '03.03.03', label: 'install default crontab', status: 'planned-safe', risk: 'guarded', interaction: 'guardedAction' },
              { id: '03.03.04', label: 'go to crontab page / show additional options', status: '*DEV', risk: 'future', interaction: 'disabledPlaceholder' },
              { id: '03.03.05', label: 'current system time', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
              { id: '03.03.06', label: 'installed crontab', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
            ],
          },
        ],
      },
      {
        type: 'multiComboRow',
        id: '03.03.07',
        title: 'install custom worker',
        body: 'Linked worker type + schedule selector row. Installation must remain previewable and guarded because it writes crontab.',
        status: 'planned-safe • *MK1',
        risk: 'guarded',
        workerOptions: ['regular worker', 'playback worker', 'screen on-off worker'],
        scheduleOptions: ['every 1 minute', 'every 5 minutes', 'at the start of each hour', 'every day at 13:00:00 Estonian time'],
        previewLabel: 'Preview crontab write before install',
      },
    ],
  },
  workers: {
    route: 'workers',
    title: 'workers',
    summary: 'Live worker status and controls as visual V2 blocks: regular worker, playback worker, screen on-off worker, and v3 statistics placeholder.',
    blocks: [
      {
        type: 'statusCard',
        id: '04.01',
        title: 'current status',
        body: 'Summary placeholder for regular worker, playback worker, and screen on-off worker status.',
        status: 'visual-only',
        fields: [
          { label: 'Regular worker', value: 'not wired from V2' },
          { label: 'Playback worker', value: 'not wired from V2' },
          { label: 'Screen on-off worker', value: 'not wired from V2' },
        ],
      },
      {
        type: 'stageTable',
        id: '04.02',
        title: 'regular worker',
        body: 'Repeated stage rows. Batch size is a stage setting/display, not a navigation item. Rich statistics are v3 placeholders.',
        status: 'visual-only',
        actions: [
          { id: '04.02.02', label: 'enable all', status: 'visual-only', risk: 'guarded', interaction: 'guardedAction' },
          { id: '04.02.03', label: 'disable all', status: 'visual-only', risk: 'guarded', interaction: 'guardedAction' },
        ],
        stages: [
          { id: '04.02.04', label: 'download', status: 'current status placeholder', batchSizeLabel: 'batch size', statisticsStatus: 'v3 placeholder' },
          { id: '04.02.05', label: 'index', status: 'current status placeholder', batchSizeLabel: 'batch size', statisticsStatus: 'v3 placeholder' },
          { id: '04.02.06', label: 'parse files for GPS', status: 'current status placeholder', batchSizeLabel: 'batch size', statisticsStatus: 'v3 placeholder' },
          { id: '04.02.07', label: 'geocode', status: 'current status placeholder', batchSizeLabel: 'batch size', statisticsStatus: 'v3 placeholder' },
          { id: '04.02.08', label: 'enqueue playback', status: 'current status placeholder', batchSizeLabel: 'batch size', statisticsStatus: 'v3 placeholder' },
        ],
      },
      {
        type: 'statusCard',
        id: '04.03',
        title: 'playback worker',
        body: 'Current status and current image/video placeholder. Later hover/enter details may show full filename, GPS coordinates, and parsed address.',
        status: 'visual-only',
        fields: [
          { label: '04.03.01', value: 'current status' },
          { label: '04.03.02', value: 'current image / video' },
        ],
      },
      {
        type: 'toggleGroup',
        id: '04.04',
        title: 'screen on-off worker',
        body: 'Toggle rows are visual-only until backend contracts exist.',
        status: 'visual-only',
        actions: [
          { id: '04.04.02', label: 'enable all', status: 'visual-only', risk: 'guarded', interaction: 'guardedAction' },
          { id: '04.04.03', label: 'disable all', status: 'visual-only', risk: 'guarded', interaction: 'guardedAction' },
        ],
        toggles: [
          { id: '04.04.04', label: 'mouse', status: 'enabled/disabled placeholder', description: 'Hover shows enabled/disabled; Enter enables/disables later.' },
          { id: '04.04.05', label: 'keyboard', status: 'enabled/disabled placeholder', description: 'Hover shows enabled/disabled; Enter enables/disables later.' },
          { id: '04.04.06', label: 'PIR sensor', status: 'enabled/disabled placeholder', description: 'Hover shows enabled/disabled; Enter enables/disables later.' },
        ],
      },
      {
        type: 'futurePlaceholder',
        id: '04.05',
        title: 'statistics page',
        body: 'v2 may collect runtime statistics; the rich statistics page remains v3.0.',
        status: 'v3',
        risk: 'future',
      },
    ],
  },
  troubleshooting: {
    route: 'troubleshooting',
    title: 'troubleshooting',
    summary: 'Manual diagnostics, log/error model notes, and *EX examples that are not actions yet.',
    blocks: [
      {
        type: 'actionList',
        id: '05.01',
        title: 'manual troubleshooting actions',
        body: 'Visual-only actions. Clear/delete operations are guarded placeholders.',
        items: [
          { id: '05.01.01', label: 'open default logging folder', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.02', label: 'mark this point in logs with a very distinct entry', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.03', label: 'export logs between marked points', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.04', label: 'find stale locks', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.05', label: 'clear stale locks', status: 'planned-safe', risk: 'guarded', interaction: 'guardedAction' },
          { id: '05.01.06', label: 'show latest worker status files', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.07', label: 'test log write permissions', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.08', label: 'export troubleshooting bundle', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.09', label: 'show system health snapshot', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.10', label: 'check cron/service status', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.11', label: 'backup current logs', status: 'planned-safe', risk: 'safe', interaction: 'visualOnly' },
          { id: '05.01.12', label: 'clear current logs', status: 'planned-safe', risk: 'destructive', interaction: 'guardedAction' },
        ],
      },
      {
        type: 'infoPanel',
        id: '05.logging',
        title: 'logging / log handling',
        body: 'Page-specific logs, global log, full verbose log, high-importance regular log, and conditional actions from measurable rules.',
        status: 'documentation seed',
      },
      {
        type: 'infoPanel',
        id: '05.errors',
        title: 'error logging / error handling',
        body: 'Page-specific error logs, combined/global error log, global high-priority error log, and final outer-layer catch/log handling before exit when possible.',
        status: 'documentation seed',
      },
      {
        type: 'exampleList',
        id: '05.06',
        title: 'examples (*EX)',
        body: 'Examples are scenario/rule seeds, not executable actions. Promotion requires measurable condition, threshold, duration, handling, log output, proof/evidence output, and operator explanation.',
        items: [
          { id: '05.06.01', label: 'less than 1 GB of storage left', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.02', label: 'less than 100 MB of storage left', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.03', label: 'less than 10 MB of storage left', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.04', label: 'RAM usage 95%+ for 1 minute', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.05', label: 'RAM usage 95%+ for 5 minutes', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.06', label: 'RAM usage 95%+ for 10 minutes', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.07', label: 'CPU usage/load 95%+ for 1 minute', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.08', label: 'CPU usage/load 95%+ for 5 minutes', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.09', label: 'CPU usage/load 95%+ for 10 minutes', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.10', label: 'network usage is consistently high', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.11', label: 'network usage is high normally and becomes very high when data-transfer stages run', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.12', label: 'network usage suggests something else may be running in the background outside this app', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.13', label: 'system temperature above threshold for 1 minute', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.14', label: 'system temperature above threshold for 5 minutes', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '05.06.15', label: 'system temperature above threshold for 10 minutes', status: '*EX', risk: 'future', interaction: 'disabledPlaceholder' },
        ],
      },
    ],
  },
  recovery: {
    route: 'recovery',
    title: 'recovery',
    summary: 'Snapshot inspection, backup policy, guarded save/restore placeholders, and stored backup snapshot list.',
    blocks: [
      {
        type: 'statusCard',
        id: '06.01',
        title: 'snapshot metadata',
        body: 'Shows latest snapshot time and other snapshot-level metadata later. No state read/write happens from V2 in this slice.',
        status: 'visual-only',
        fields: [
          { label: 'Latest snapshot time', value: 'not wired' },
          { label: 'Compatibility', value: 'not evaluated' },
        ],
      },
      {
        type: 'infoPanel',
        id: '06.02',
        title: 'current backup snapshot generation policy',
        body: 'Human-readable policy text placeholder. Changing policy may involve AI later and is not wired now.',
        status: 'visual-only',
      },
      {
        type: 'snapshotViewer',
        id: '06.03',
        title: 'current snapshot',
        body: 'Human-readable structure, raw item/field list, and JSON-like values placeholder.',
        status: 'visual-only',
      },
      {
        type: 'snapshotViewer',
        id: '06.04',
        title: 'current backup snapshot',
        body: 'Latest saved backup snapshot inspection placeholder before restore.',
        status: 'visual-only',
      },
      {
        type: 'actionList',
        id: '06.actions',
        title: 'snapshot actions',
        body: 'Save/restore are visual-only. Restore must require selection, confirmation, compatibility check, and before/after summary when implemented for real.',
        items: [
          { id: '06.05', label: 'save state snapshot', status: 'v2 visual', risk: 'guarded', interaction: 'guardedAction' },
          { id: '06.06', label: 'restore state snapshot', status: 'v2 visual', risk: 'destructive', interaction: 'guardedAction' },
        ],
      },
      {
        type: 'snapshotList',
        id: '06.07',
        title: 'currently stored backup snapshots',
        body: 'Navigable stored-snapshot list placeholder with protocol version and compatibility status later.',
        status: 'visual-only',
      },
    ],
  },
  pir: {
    route: 'pir',
    title: 'PIR',
    summary: 'Shell for isolated PIR, mouse, keyboard, and screen on-off testing. Real B5 controls arrive in later batches.',
    blocks: [
      {
        type: 'infoPanel',
        id: '07.shell',
        title: '07 PIR shell',
        body: 'This page is the future isolated proving area for activity detection and screen on-off behavior. B1 adds only the route/page shell so later B7 can reuse or extract the visible B5 subset and add a PIR signal emulator button.',
        status: 'shell-only',
        risk: 'future',
      },
      {
        type: 'statusCard',
        id: '07.boundary',
        title: 'PIR implementation boundary',
        body: 'Mouse and keyboard activity can be tested directly later. Real PIR hardware integration remains future; initial V2 behavior should use an emulator button.',
        status: 'not wired',
        risk: 'future',
        fields: [
          { label: 'Real PIR hardware', value: 'future' },
          { label: 'PIR emulator button', value: 'planned for B7' },
          { label: 'Screen on/off logic', value: 'not wired in B1' },
        ],
      },
    ],
  },
  playback: {
    route: 'playback',
    title: 'PLAYBACK',
    summary: 'Shell for isolated playback queue, rendering target, and fullscreen testing. Real queue controls arrive in later batches.',
    blocks: [
      {
        type: 'infoPanel',
        id: '08.shell',
        title: '08 PLAYBACK shell',
        body: 'This page is the future isolated proving area for playback selection, drag/drop queue classification, rendering target/mode, fullscreen playback, and address overlay behavior. B1 adds only the route/page shell.',
        status: 'shell-only',
        risk: 'future',
      },
      {
        type: 'statusCard',
        id: '08.boundary',
        title: 'Playback implementation boundary',
        body: 'The drag/drop queue, metadata table, non-media handling, rendering controls, and address-missing toggle are planned but not implemented in this route-shell batch.',
        status: 'not wired',
        risk: 'future',
        fields: [
          { label: 'Drag/drop queue', value: 'planned for B8' },
          { label: 'Non-media handling', value: 'planned graceful skip/report' },
          { label: 'Address overlay', value: 'future toggle decision' },
        ],
      },
    ],
  },
  'real-playback': {
    route: 'real-playback',
    title: 'REAL PLAYBACK',
    summary: 'Final integrated endpoint page. It remains explanation-only until isolated setup, auth, startup, worker, PIR, playback, troubleshooting, and recovery pieces are proven.',
    blocks: [
      {
        type: 'infoPanel',
        id: '09.goal',
        title: '09 REAL PLAYBACK goal',
        body: 'This page is the final endpoint for autonomous playback and autonomous recovery. It will later compose proven pieces from 03 STARTUP, 04 WORKERS, 06 RECOVERY, 07 PIR, and 08 PLAYBACK. B1 intentionally keeps it explanation-only.',
        status: 'explanation-only',
        risk: 'future',
      },
      {
        type: 'actionList',
        id: '09.sources',
        title: 'Future source pages',
        body: 'These entries document the planned composition sources. They are disabled explanation items, not functional controls.',
        items: [
          { id: '09.01', label: '03 STARTUP — Raspberry scheduler/crontab readiness', status: 'future source', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '09.02', label: '04 WORKERS — media pipeline and worker status', status: 'future source', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '09.03', label: '06 RECOVERY — saved state and power-loss recovery', status: 'future source', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '09.04', label: '07 PIR — activity and screen on-off behavior', status: 'future source', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '09.05', label: '08 PLAYBACK — queue, fullscreen rendering, and address overlay', status: 'future source', risk: 'future', interaction: 'disabledPlaceholder' },
        ],
      },
    ],
  },
};

export const V2_OPERATOR_ALLOWED_BLOCK_TYPES: readonly V2OperatorBlockType[] = [
  'infoPanel',
  'statusCard',
  'actionList',
  'sectionGroup',
  'toggleGroup',
  'multiComboRow',
  'stageTable',
  'snapshotViewer',
  'snapshotList',
  'futurePlaceholder',
  'exampleList',
] as const;
