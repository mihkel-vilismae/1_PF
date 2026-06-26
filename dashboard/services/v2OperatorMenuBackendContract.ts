/*
 * Maps the visual-only V2 Operator Menu nodes to existing backend surfaces when
 * an already-implemented endpoint exists. Planned rows stay explicitly planned
 * so the UI must not over-claim production behavior.
 */

export type V2BackendSupport = 'existing-backend' | 'planned-v2' | 'v3' | 'visual-only';

export type V2BackendEndpoint = {
  method: 'GET' | 'POST';
  path: string;
  purpose: string;
};

export type V2OperatorMenuBackendContractRow = {
  nodeId: string;
  label: string;
  support: V2BackendSupport;
  endpoints?: V2BackendEndpoint[];
  source: string;
  nonClaim: string;
};

export const V2_OPERATOR_MENU_BACKEND_CONTRACT: readonly V2OperatorMenuBackendContractRow[] = [
  {
    nodeId: 'setup',
    label: 'setup.sh',
    support: 'planned-v2',
    source: '_v2 shell script target',
    nonClaim: 'No full dependency installer in v2.0; full install remains v3.0.',
  },
  {
    nodeId: 'authentication',
    label: 'authentication.sh',
    support: 'existing-backend',
    source: 'server/index.ts new auth route registry',
    endpoints: [
      { method: 'GET', path: '/api/auth/new/status', purpose: 'Check local auth/session state without provider secrets.' },
      { method: 'POST', path: '/api/auth/new/login', purpose: 'Start local operator login using backend auth surface.' },
      { method: 'POST', path: '/api/auth/new/submit-2fa', purpose: 'Submit 2FA locally through existing auth surface.' },
      { method: 'GET', path: '/api/auth/new/session-files', purpose: 'Inspect sanitized session-file presence, not secret contents.' },
    ],
    nonClaim: 'Does not expose Apple ID/password/2FA/cookies/session secrets in the dashboard.',
  },
  {
    nodeId: 'startup.env.verify',
    label: 'verify.env',
    support: 'existing-backend',
    source: 'server/index.ts init/preflight route registry',
    endpoints: [{ method: 'POST', path: '/api/init/verify-env', purpose: 'Verify required runtime environment keys.' }],
    nonClaim: 'Does not print raw secret values.',
  },
  {
    nodeId: 'startup.env.open',
    label: 'open .env in text editor',
    support: 'planned-v2',
    source: '_v2/startup.sh terminal/operator action target',
    nonClaim: 'No backend endpoint currently opens a text editor or creates .env from example.env.',
  },
  {
    nodeId: 'startup.database.verify',
    label: 'verify DB',
    support: 'existing-backend',
    source: 'server/index.ts database init route registry',
    endpoints: [
      { method: 'GET', path: '/api/init/database/status', purpose: 'Report database existence/status.' },
      { method: 'POST', path: '/api/database-viewer/verify', purpose: 'Verify backend-backed database viewer connection.' },
    ],
    nonClaim: 'Does not create a DB backup.',
  },
  {
    nodeId: 'startup.database.recreate',
    label: 'recreate DB',
    support: 'existing-backend',
    source: 'server/index.ts database init route registry',
    endpoints: [{ method: 'POST', path: '/api/init/database/recreate-empty', purpose: 'Recreate an empty app database.' }],
    nonClaim: 'Does not preserve current DB unless a separate backup action is run first.',
  },
  {
    nodeId: 'startup.database.backup',
    label: 'backup DB',
    support: 'planned-v2',
    source: 'v2 resolved decision: SQL dump backup action needed',
    nonClaim: 'No existing endpoint in this repo snapshot proves a SQL dump backup action.',
  },
  {
    nodeId: 'startup.crontab.verify',
    label: 'verify crontab',
    support: 'existing-backend',
    source: 'server/routes/schedulerRoutes.ts via /api/init/cron/* compatibility routes',
    endpoints: [{ method: 'GET', path: '/api/init/cron/status', purpose: 'Read scheduler/crontab capability/status.' }],
    nonClaim: 'Does not write crontab.',
  },
  {
    nodeId: 'startup.crontab.print',
    label: 'print/output current crontab',
    support: 'existing-backend',
    source: 'server/routes/schedulerRoutes.ts via /api/init/cron/* compatibility routes',
    endpoints: [{ method: 'GET', path: '/api/init/cron/print', purpose: 'Print current scheduler/crontab text/status.' }],
    nonClaim: 'Read-only when used for print/output.',
  },
  {
    nodeId: 'startup.crontab.installDefault',
    label: 'install default crontab',
    support: 'existing-backend',
    source: 'server/routes/schedulerRoutes.ts via /api/init/cron/* compatibility routes',
    endpoints: [{ method: 'POST', path: '/api/init/cron/install', purpose: 'Install app-owned worker crontab entries through existing scheduler target boundary.' }],
    nonClaim: 'Must remain guarded by scheduler target and overwrite-safety checks.',
  },
  {
    nodeId: 'workers.currentStatus',
    label: 'workers current status',
    support: 'existing-backend',
    source: 'runtime projection/playback/native status routes',
    endpoints: [
      { method: 'GET', path: '/api/runtime/projection/live', purpose: 'Read current runtime projection/status.' },
      { method: 'GET', path: '/api/runtime/playback/observability', purpose: 'Read playback observability.' },
      { method: 'GET', path: '/api/native-playback/status', purpose: 'Read native playback status.' },
    ],
    nonClaim: 'Does not start or stop workers by itself.',
  },
  {
    nodeId: 'workers.regular.download',
    label: 'download',
    support: 'existing-backend',
    source: 'B3 regular worker backend action',
    endpoints: [{ method: 'POST', path: '/api/runtime/download/run', purpose: 'Run download stage.' }],
    nonClaim: 'Real iCloud download still requires auth/session readiness for real-run path.',
  },
  {
    nodeId: 'workers.regular.index',
    label: 'index',
    support: 'existing-backend',
    source: 'B3 regular worker backend action',
    endpoints: [{ method: 'POST', path: '/api/runtime/index/run', purpose: 'Run index stage.' }],
    nonClaim: 'Does not guarantee prior download validity unless pipeline safety checks pass.',
  },
  {
    nodeId: 'workers.regular.parse-files-for-gps',
    label: 'parse files for GPS',
    support: 'existing-backend',
    source: 'B3 regular worker backend action',
    endpoints: [{ method: 'POST', path: '/api/runtime/gps/run', purpose: 'Run GPS extraction stage.' }],
    nonClaim: 'Does not claim every media file has GPS data.',
  },
  {
    nodeId: 'workers.regular.geocode',
    label: 'geocode',
    support: 'existing-backend',
    source: 'B3 regular worker backend action',
    endpoints: [{ method: 'POST', path: '/api/runtime/geocode/run', purpose: 'Run geocode stage.' }],
    nonClaim: 'Real provider proof/opt-in remains separate from visual menu wiring.',
  },
  {
    nodeId: 'workers.regular.enqueue-playback',
    label: 'enqueue playback',
    support: 'existing-backend',
    source: 'B3 regular worker backend action',
    endpoints: [{ method: 'POST', path: '/api/runtime/queue/prepare', purpose: 'Prepare playback queue.' }],
    nonClaim: 'Does not start native playback by itself.',
  },
  {
    nodeId: 'workers.playback.current',
    label: 'current image / video',
    support: 'existing-backend',
    source: 'runtime playback contract routes',
    endpoints: [
      { method: 'GET', path: '/api/runtime/playback/current', purpose: 'Read current playback item.' },
      { method: 'POST', path: '/api/runtime/playback/select-current', purpose: 'Select current playback item from queue.' },
      { method: 'GET', path: '/api/runtime/playback/resume-checkpoint', purpose: 'Read saved playback resume checkpoint.' },
      { method: 'POST', path: '/api/runtime/playback/resume-checkpoint', purpose: 'Save playback resume checkpoint.' },
    ],
    nonClaim: 'Exact video timestamp resume is not a v2 requirement; same file is enough.',
  },
  {
    nodeId: 'workers.screen',
    label: 'screen on-off worker',
    support: 'visual-only',
    source: 'visual status/control target',
    nonClaim: 'No v2 screen on-off backend mutation is wired from this menu yet.',
  },
  {
    nodeId: 'troubleshooting.manual.backupLogs',
    label: 'backup current logs',
    support: 'planned-v2',
    source: 'v2 troubleshooting action target',
    nonClaim: 'No repo-local endpoint yet proves backup-current-logs with five-minute clear guard.',
  },
  {
    nodeId: 'troubleshooting.manual.clearLogs',
    label: 'clear current logs',
    support: 'planned-v2',
    source: 'v2 troubleshooting action target',
    nonClaim: 'Must be blocked unless a recent verified log backup exists.',
  },
  {
    nodeId: 'troubleshooting.errorPipeline',
    label: 'error pipeline',
    support: 'planned-v2',
    source: 'v2 error-pipeline target',
    nonClaim: 'Dedicated error table/folder/fatal bundle are not implemented by the visual menu.',
  },
  {
    nodeId: 'recovery',
    label: 'recovery',
    support: 'planned-v2',
    source: 'runtime checkpoint/recovery proof scaffolding exists; product recovery wiring still needed',
    nonClaim: 'Runtime-state checkpoint currently avoids automatic recovery claims; dedicated recovery worker still needed.',
  },
  {
    nodeId: 'statistics',
    label: 'statistics page',
    support: 'v3',
    source: 'v3 deferral decision',
    nonClaim: 'v2 should collect stats, but rich statistics UI remains v3.0.',
  },
];

export function findV2BackendContractRow(nodeId: string): V2OperatorMenuBackendContractRow | null {
  return V2_OPERATOR_MENU_BACKEND_CONTRACT.find((entry) => entry.nodeId === nodeId) ?? null;
}
