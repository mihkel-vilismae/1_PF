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
  | 'exampleList'
  | 'backendActionCard'
  | 'newAuthCard'
  | 'rpiSchedulerControls'
  | 'rpiStagesRow'
  | 'rpiWorkersRow'
  | 'recoveryPlaceholderActions'
  | 'pirActivityTest'
  | 'playbackRenderingControls'
  | 'playbackDropQueue'
  | 'realPlaybackProjection';

export type V2OperatorRisk = 'safe' | 'guarded' | 'destructive' | 'future' | 'localSecretSensitive';

export type V2OperatorButtonVariant = 'primary' | 'secondary' | 'danger';

export type V2OperatorActionItem = {
  id: string;
  label: string;
  status?: string;
  description?: string;
  risk?: V2OperatorRisk;
  interaction?: 'visualOnly' | 'guardedAction' | 'disabledPlaceholder';
};

export type V2OperatorBackendActionButton = {
  action: string;
  label: string;
  variant: V2OperatorButtonVariant;
};

export type V2OperatorRecoveryPlaceholderAction = {
  id: string;
  label: 'SAVE STATE' | 'LOAD STATE' | 'EMULATE POWER OFF';
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

export type V2OperatorRpiStageItem = {
  id: string;
  label: string;
  status: string;
  batchSizeDefault: number;
};

export type V2OperatorRpiWorkerItem = {
  id: string;
  label: string;
  status: string;
  lastCalled: string;
  sinceLastCall: string;
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
      type: 'backendActionCard';
      id: string;
      title: string;
      body?: string;
      statusKey: string;
      resultKey: string;
      logKey: string;
      sourceBadge?: { mode: string; label: string };
      actions: readonly V2OperatorBackendActionButton[];
    }
  | {
      type: 'newAuthCard';
      id: string;
      title: string;
      body?: string;
      statusKey: string;
      logKey: string;
      sourceBadge?: { mode: string; label: string };
    }
  | {
      type: 'rpiSchedulerControls';
      id: string;
      title: string;
      body?: string;
      statusKey: string;
      resultKey: string;
      logKey: string;
      sourceBadge?: { mode: string; label: string };
    }
  | {
      type: 'rpiStagesRow';
      id: string;
      title: string;
      body?: string;
      status?: string;
      stages: readonly V2OperatorRpiStageItem[];
      truthMode?: 'current' | 'test' | 'real';
    }
  | {
      type: 'rpiWorkersRow';
      id: string;
      title: string;
      body?: string;
      status?: string;
      workers: readonly V2OperatorRpiWorkerItem[];
      truthMode?: 'current' | 'test' | 'real';
    }
  | {
      type: 'recoveryPlaceholderActions';
      id: string;
      title: string;
      body?: string;
      status?: string;
      actions: readonly V2OperatorRecoveryPlaceholderAction[];
    }
  | {
      type: 'pirActivityTest';
      id: string;
      title: string;
      body?: string;
      status?: string;
      risk?: V2OperatorRisk;
    }
  | {
      type: 'playbackRenderingControls';
      id: string;
      title: string;
      body?: string;
      status?: string;
      risk?: V2OperatorRisk;
    }
  | {
      type: 'playbackDropQueue';
      id: string;
      title: string;
      body?: string;
      status?: string;
      risk?: V2OperatorRisk;
    }
  | {
      type: 'realPlaybackProjection';
      id: string;
      title: string;
      body?: string;
      status?: string;
      risk?: V2OperatorRisk;
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

const RPI_PIPELINE_STAGES = Object.freeze([
  { id: 'download', label: 'Download', status: 'Idle', batchSizeDefault: 25 },
  { id: 'index', label: 'Index', status: 'Idle', batchSizeDefault: 25 },
  { id: 'gps-parser', label: 'GPS parser', status: 'Idle', batchSizeDefault: 25 },
  { id: 'geocode', label: 'Geocode', status: 'Idle', batchSizeDefault: 25 },
  { id: 'queue', label: 'Queue', status: 'Idle', batchSizeDefault: 25 },
] satisfies readonly V2OperatorRpiStageItem[]);

const RPI_WORKERS = Object.freeze([
  { id: 'regular-state-worker', label: 'Regular state worker', status: 'Waiting', lastCalled: 'Never', sinceLastCall: 'No worker call observed yet' },
  { id: 'playback-worker', label: 'Playback worker', status: 'Waiting', lastCalled: 'Never', sinceLastCall: 'No worker call observed yet' },
  { id: 'on-off-worker', label: 'On-off worker', status: 'Waiting', lastCalled: 'Never', sinceLastCall: 'No worker call observed yet' },
] satisfies readonly V2OperatorRpiWorkerItem[]);

function buildRpiStagesRow(id: string, pageLabel: string, truthMode: 'current' | 'test' | 'real' = 'current'): V2OperatorCenterPanelBlock {
  return {
    type: 'rpiStagesRow',
    id,
    title: 'RPI-STAGES / Media pipeline stage row',
    body: `${pageLabel} shared stage row. It reports the intended Raspberry media pipeline order without starting a worker in this slice.`,
    status: 'visual status row',
    truthMode,
    stages: RPI_PIPELINE_STAGES,
  };
}

function buildRpiWorkersRow(id: string, pageLabel: string, truthMode: 'current' | 'test' | 'real' = 'current'): V2OperatorCenterPanelBlock {
  return {
    type: 'rpiWorkersRow',
    id,
    title: 'RPI-WORKERS / Worker call status row',
    body: `${pageLabel} shared worker-call row. It reports the three Raspberry worker entrypoints without calling a worker in this slice.`,
    status: '3 WORKERS',
    truthMode,
    workers: RPI_WORKERS,
  };
}

const V2_WORKER_STAGE_CARDS = Object.freeze([
  {
    type: 'backendActionCard',
    id: '04.worker-b3-1-download',
    title: 'B3.1 Download',
    body: 'Run the existing download stage endpoint from the V2 Workers page. The card stays scoped to one stage and reports local status/log events.',
    statusKey: 'B3.1',
    resultKey: 'B3.1',
    logKey: 'B3.1',
    sourceBadge: { mode: 'real', label: 'REAL · POST /api/runtime/download/run' },
    actions: [{ action: 'run-b3-1', label: 'Run', variant: 'primary' }],
  },
  {
    type: 'backendActionCard',
    id: '04.worker-b3-2-index',
    title: 'B3.2 Index',
    body: 'Run the existing index stage endpoint from the V2 Workers page.',
    statusKey: 'B3.2',
    resultKey: 'B3.2',
    logKey: 'B3.2',
    sourceBadge: { mode: 'real', label: 'REAL · POST /api/runtime/index/run' },
    actions: [{ action: 'run-b3-2', label: 'Run', variant: 'primary' }],
  },
  {
    type: 'backendActionCard',
    id: '04.worker-b3-3-gps',
    title: 'B3.3 Parse GPS',
    body: 'Run the existing GPS extraction stage endpoint from the V2 Workers page.',
    statusKey: 'B3.3',
    resultKey: 'B3.3',
    logKey: 'B3.3',
    sourceBadge: { mode: 'real', label: 'REAL · POST /api/runtime/gps/run' },
    actions: [{ action: 'run-b3-3', label: 'Run', variant: 'primary' }],
  },
  {
    type: 'backendActionCard',
    id: '04.worker-b3-4-geocode',
    title: 'B3.4 Geocode',
    body: 'Run the existing deterministic placeholder geocode stage endpoint from the V2 Workers page.',
    statusKey: 'B3.4',
    resultKey: 'B3.4',
    logKey: 'B3.4',
    sourceBadge: { mode: 'real', label: 'REAL · POST /api/runtime/geocode/run' },
    actions: [{ action: 'run-b3-4', label: 'Run', variant: 'primary' }],
  },
  {
    type: 'backendActionCard',
    id: '04.worker-b3-5-queue',
    title: 'B3.5 Enqueue playback',
    body: 'Run the existing playback queue preparation endpoint from the V2 Workers page.',
    statusKey: 'B3.5',
    resultKey: 'B3.5',
    logKey: 'B3.5',
    sourceBadge: { mode: 'real', label: 'REAL · POST /api/runtime/queue/prepare' },
    actions: [{ action: 'run-b3-5', label: 'Run', variant: 'primary' }],
  },
] satisfies readonly V2OperatorCenterPanelBlock[]);


export const V2_OPERATOR_CENTER_PANEL_PAGES: Record<V2OperatorSidebarRoute, V2OperatorCenterPanelPage> = {
  setup: {
    route: 'setup',
    title: 'setup.sh',
    summary: 'Small v2 preflight/orchestration page only. Full dependency installation stays a v3 milestone.',
    blocks: [
      // removed Setup scope because it was marked and is no longer shown
      {
        type: 'backendActionCard',
        id: '01.verify-env',
        title: '1A Verify .env',
        body: 'Validate required configuration keys through the existing backend endpoint and render the latest backend result, endpoint metadata, response payload, and local log entries.',
        statusKey: '1A',
        resultKey: '1A',
        logKey: '1A',
        sourceBadge: { mode: 'real', label: 'POST /api/init/verify-env' },
        actions: [
          { action: 'verify-env', label: 'Run', variant: 'primary' },
        ],
      },
      {
        type: 'backendActionCard',
        id: '01.database-controls',
        title: '2A Database controls',
        body: 'Check, inspect, delete, or recreate the configured SQLite database through the existing init database endpoints. Destructive operations keep the existing confirmation guard in the browser action handler.',
        statusKey: '2A',
        resultKey: '2A',
        logKey: '2A',
        sourceBadge: { mode: 'real', label: 'GET /api/init/database/status' },
        actions: [
          { action: 'check-db', label: 'Check DB', variant: 'secondary' },
          { action: 'inspect-db', label: 'Inspect DB', variant: 'secondary' },
          { action: 'delete-db', label: 'Delete DB', variant: 'danger' },
          { action: 'recreate-db', label: 'Recreate DB', variant: 'secondary' },
        ],
      },
      // removed Preflight actions because it was marked and is no longer shown
    ],
  },
  authentication: {
    route: 'authentication',
    title: 'authentication.sh',
    summary: 'Local iCloudPD login/session page. Credentials, 2FA, cookies, and session secrets must stay local and redacted.',
    blocks: [
      // removed Local-only authentication boundary because it was marked and is no longer shown
      {
        type: 'newAuthCard',
        id: '02.new-auth',
        title: '1A-STASH-OFF - NEW AUTH',
        body: 'Fresh real-auth UI boundary for iCloudPD. These controls intentionally target only /api/auth/new/* endpoints and do not reuse the existing login card routes.',
        statusKey: '1A-STASH-OFF',
        logKey: '1A-STASH-OFF',
        sourceBadge: { mode: 'real', label: 'NEW ENDPOINTS' },
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
      // removed Authentication actions because it was marked and is no longer shown
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
      // removed .env / environment variables section because it was marked and is no longer shown
          // removed database section because it was marked and is no longer shown
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
        type: 'rpiSchedulerControls',
        id: '03.rpi-scheduler-controls',
        title: '3A Scheduler controls',
        body: 'Raspberry-focused scheduler control card. It keeps the existing button concepts from the scheduler panel while forcing the real Raspberry crontab target through the existing scheduler backend contract.',
        statusKey: '3A',
        resultKey: '3A',
        logKey: '3A',
        sourceBadge: { mode: 'real', label: 'Raspberry real crontab' },
      },
      buildRpiStagesRow('03.rpi-stages', 'Startup'),
      buildRpiWorkersRow('03.rpi-workers', 'Startup'),
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
      {
        type: 'backendActionCard',
        id: '03.crontab-controls',
        title: 'Crontab management',
        body: 'Safe crontab read/write controls for test and real modes. Installation will confirm before enabling real mode.',
        statusKey: '3A',
        resultKey: '3A',
        logKey: '3A',
        sourceBadge: { mode: 'real', label: 'CRONTAB CONTROLS' },
        actions: [
          { action: 'get-crontab', label: 'Get crontab', variant: 'secondary' },
          { action: 'test-crontab-writing', label: 'Test crontab writing', variant: 'secondary' },
          { action: 'print-default-crontab', label: 'Print default crontab', variant: 'secondary' },
          { action: 'install-crontab', label: 'Install crontab', variant: 'primary' },
        ],
      },
    ],
  },
  workers: {
    route: 'workers',
    title: 'workers',
    summary: 'Live worker status and controls as visual V2 blocks: regular worker, playback worker, screen on-off worker, and v3 statistics placeholder.',
    blocks: [
      // removed current status card because it was marked and is no longer shown
      buildRpiStagesRow('04.rpi-stages', 'Workers', 'test'),
      buildRpiWorkersRow('04.rpi-workers', 'Workers', 'test'),
      ...V2_WORKER_STAGE_CARDS,
      // removed regular worker stageTable because it was marked and is no longer shown
      // removed playback worker card because it was marked and is no longer shown
      // removed screen on-off worker toggleGroup because it was marked and is no longer shown
      // removed statistics page because it was marked and is no longer shown
    ],
  },
  troubleshooting: {
    route: 'troubleshooting',
    title: 'troubleshooting',
    summary: 'Manual diagnostics, log/error model notes, and *EX examples that are not actions yet.',
    blocks: [
      // removed manual troubleshooting actions because it was marked and is no longer shown
      {
        type: 'backendActionCard',
        id: '05.pipeline-maintenance',
        title: 'Pipeline maintenance',
        body: 'Detect persisted pipeline issues and clear stale locks through the existing runtime maintenance endpoints. Clearing remains scoped to stale locks and must not claim a full repair proof until B9 evidence exists.',
        statusKey: 'B3-DIAGNOSTICS',
        resultKey: 'B3-DIAGNOSTICS',
        logKey: 'B3-DIAGNOSTICS',
        sourceBadge: { mode: 'real', label: 'PIPELINE MAINTENANCE' },
        actions: [
          { action: 'detect-pipeline-issues', label: 'Detect issues in pipeline', variant: 'secondary' },
          { action: 'clear-stale-pipeline-locks', label: 'Clear stale locks', variant: 'danger' },
        ],
      },
      buildRpiStagesRow('05.rpi-stages', 'Troubleshooting'),
      buildRpiWorkersRow('05.rpi-workers', 'Troubleshooting'),
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
      // removed Lightweight recovery state schema because it was marked and is no longer shown
      // removed snapshot metadata because it was marked and is no longer shown
      // removed current backup snapshot generation policy because it was marked and is no longer shown
      // removed current snapshot because it was marked and is no longer shown
      // removed current backup snapshot because it was marked and is no longer shown
      {
        type: 'recoveryPlaceholderActions',
        id: '06.placeholder-actions',
        title: 'Recovery manual state controls',
        body: 'B11.2 wires SAVE STATE and LOAD STATE to manual recovery endpoints. EMULATE POWER OFF records a pre-shutdown snapshot without actually powering off the machine.',
        status: 'manual recovery endpoints',
        actions: [
          { id: '06.save-state', label: 'SAVE STATE' },
          { id: '06.load-state', label: 'LOAD STATE' },
          { id: '06.emulate-power-off', label: 'EMULATE POWER OFF' },
        ],
      },
      // removed snapshot actions because it was marked and is no longer shown
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
        type: 'pirActivityTest',
        id: '07.activity-detection',
        title: 'B5 Screen on-off simulation',
        body: 'Visible isolated subset for PIR, mouse, and keyboard activity detection. Mouse and keyboard can be tested directly; the PIR button is an emulator until hardware proof exists.',
        status: 'emulated PIR / direct mouse-keyboard',
        risk: 'guarded',
      },
      buildRpiWorkersRow('07.rpi-workers', 'PIR'),
      // removed PIR implementation boundary because it was marked and is no longer shown
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
        body: 'This page is the isolated proving area for playback selection, drag/drop queue classification, rendering target/mode, fullscreen playback, and address overlay behavior. B8 keeps backend selection owned by POST /api/runtime/playback/select-current.',
        status: 'isolated playback UI',
        risk: 'future',
      },
      {
        type: 'playbackRenderingControls',
        id: '08.rendering-controls',
        title: 'B4 Playback selection / rendering controls',
        body: 'Rendering tabs affect only preview/fullscreen presentation; backend selection remains POST /api/runtime/playback/select-current.',
        status: 'frontend rendering controls',
      },
      {
        type: 'playbackDropQueue',
        id: '08.drop-queue',
        title: 'Drag/drop playback queue',
        body: 'Drop images, videos, and other files into a browser-local V2 queue table. Non-media files are allowed into the table and must be reported gracefully instead of played.',
        status: 'browser-local queue table',
      },
      buildRpiWorkersRow('08.rpi-workers', 'Playback'),
      // removed Playback implementation boundary because it was marked and is no longer shown
    ],
  },
  'real-playback': {
    route: 'real-playback',
    title: 'REAL PLAYBACK',
    summary: 'Final integrated endpoint page. B10.1 composes only the already proven V2 pieces and keeps unproven recovery/PIR hardware work clearly gated.',
    blocks: [
      {
        type: 'infoPanel',
        id: '09.goal',
        title: '09 REAL PLAYBACK integrated goal',
        body: 'This page is the final endpoint for autonomous playback. B10.1 now composes the proven setup/auth/startup/workers/playback surfaces into one operator layout without claiming real recovery or PIR hardware proof yet.',
        status: 'integrated layout',
        risk: 'guarded',
      },
      {
        type: 'statusCard',
        id: '09.proven-boundary',
        title: 'Proven-piece boundary',
        body: 'Only controls already placed and covered by V2 proof tests are active here. Recovery remains schema/design work and PIR hardware remains a future proof gate.',
        status: 'B10.1 composition gate',
        risk: 'guarded',
        fields: [
          { label: 'Included active pieces', value: 'Raspberry scheduler, RPI stages/workers, worker stage cards, playback rendering controls, drag/drop queue bridge, metadata bridge' },
          { label: 'Disabled or gated pieces', value: 'real recovery save/load, PIR hardware, final autonomous proof' },
          { label: 'Backend path', value: 'Uses existing action IDs/endpoints only; no new backend route is introduced by B10.1' },
        ],
      },
      {
        type: 'realPlaybackProjection',
        id: '09.flow-status-projection',
        title: 'Real Playback action flow / status projection',
        body: 'Read-only final-page projection of scheduler, pipeline, queue, metadata, rendering, and recovery gate state. This does not start new work by itself.',
        status: 'read-only projection',
        risk: 'guarded',
      },
      {
        type: 'rpiSchedulerControls',
        id: '09.rpi-scheduler-controls',
        title: 'Real Playback scheduler controls',
        body: 'Reuses the proven Raspberry real-crontab scheduler controls from 03 STARTUP so the final page can show scheduler readiness without the Windows CronEmulator target path.',
        statusKey: '3A',
        resultKey: '3A',
        logKey: '3A',
        sourceBadge: { mode: 'real', label: 'Raspberry real crontab' },
      },
      buildRpiStagesRow('09.rpi-stages', 'Real Playback', 'real'),
      buildRpiWorkersRow('09.rpi-workers', 'Real Playback', 'real'),
      ...V2_WORKER_STAGE_CARDS.map((block) => ({
        ...block,
        id: block.id.replace('04.worker-', '09.worker-'),
        title: `Real Playback ${block.title}`,
        body: `${block.body ?? ''} Reused on 09 REAL PLAYBACK as part of the integrated proof layout.`,
      })),
      {
        type: 'playbackRenderingControls',
        id: '09.rendering-controls',
        title: 'Real Playback rendering controls',
        body: 'Reuses the 08 PLAYBACK rendering target/mode controls. Raspberry OS rendering stays disabled until Raspberry playback proof exists.',
        status: 'frontend rendering controls',
      },
      {
        type: 'playbackDropQueue',
        id: '09.drop-queue',
        title: 'Real Playback queue bridge',
        body: 'Reuses the 08 PLAYBACK drag/drop queue table, metadata bridge, non-media blocking, and media-only backend queue-prepare bridge.',
        status: 'media-only backend queue bridge',
      },
      {
        type: 'backendActionCard',
        id: '09.crontab-controls',
        title: 'Crontab management',
        body: 'Safe crontab read/write controls for real autonomous playback. Installation will confirm before enabling real mode.',
        statusKey: '3A',
        resultKey: '3A',
        logKey: '3A',
        sourceBadge: { mode: 'real', label: 'CRONTAB CONTROLS' },
        actions: [
          { action: 'get-crontab', label: 'Get crontab', variant: 'secondary' },
          { action: 'test-crontab-writing', label: 'Test crontab writing', variant: 'secondary' },
          { action: 'print-default-crontab', label: 'Print default crontab', variant: 'secondary' },
          { action: 'install-crontab', label: 'Install crontab', variant: 'primary' },
        ],
      },
      {
        type: 'actionList',
        id: '09.gated-future-controls',
        title: 'Gated future controls',
        body: 'These final-page capabilities are intentionally disabled until their own schemas/proofs exist. They are not active controls in B10.1.',
        items: [
          { id: '09.future-recovery', label: '06 RECOVERY — real save/load/autosave restart recovery', status: 'blocked until B11', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '09.future-pir-hardware', label: '07 PIR — real hardware sensor proof', status: 'hardware proof later', risk: 'future', interaction: 'disabledPlaceholder' },
          { id: '09.future-victory-proof', label: 'B12 — autonomous playback + recovery victory proof', status: 'final gate later', risk: 'future', interaction: 'disabledPlaceholder' },
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
  'backendActionCard',
  'newAuthCard',
  'rpiSchedulerControls',
  'rpiStagesRow',
  'rpiWorkersRow',
  'recoveryPlaceholderActions',
  'pirActivityTest',
  'playbackRenderingControls',
  'playbackDropQueue',
  'realPlaybackProjection',
] as const;
