import {
  INIT_ENDPOINTS,
  verifyEnv,
  checkDatabaseStatus,
  inspectDatabase,
  deleteDatabase,
  recreateEmptyDatabase,
  installCron,
  checkCronStatus,
  printCron,
} from '../initService.js';
import {
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
} from '../../../shared/schedulerPlatformCapabilities.js';
import { buildTimelineDetails } from './runtimeTruthActionUtils.js';
import { createRuntimeTruthDatabaseActions } from './runtimeTruthDatabaseActions.js';
import { createRuntimeTruthDemoActions } from './runtimeTruthDemoActions.js';
import { createRuntimeTruthGuards } from './runtimeTruthGuards.js';
import {
  buildInitialSchedulerCapability,
  getSchedulerSupportForAction,
  supportsSchedulerAction,
} from './runtimeTruthState.js';

const SCHEDULER_ACTION_TO_OPERATION = Object.freeze({
  'install-cron': SCHEDULER_OPERATION_SUPPORT.install,
  'check-cron': SCHEDULER_OPERATION_SUPPORT.status,
  'print-cron': SCHEDULER_OPERATION_SUPPORT.print,
});

export function createRuntimeTruthBehavior({
  getState,
  patchState,
  pushHistory,
  pushLog,
  setStatus,
  stamp,
}) {
  const guards = createRuntimeTruthGuards({
    getState,
    patchState,
    pushHistory,
    pushLog,
    setStatus,
  });

  const databaseActions = createRuntimeTruthDatabaseActions({
    getState,
    patchState,
    pushHistory,
    pushLog,
    setStatus,
    stamp,
    guards,
  });

  const demoActions = createRuntimeTruthDemoActions({
    getState,
    patchState,
    pushHistory,
    pushLog,
    setStatus,
    stamp,
    guards,
  });

  function runAction(action, payload = {}) {
    const schedulerOperation = SCHEDULER_ACTION_TO_OPERATION[action];
    if (schedulerOperation) {
      const schedulerCapability = getState().initCapabilities?.scheduler ?? buildInitialSchedulerCapability();
      if (!supportsSchedulerAction(schedulerCapability, action)) {
        const support = getSchedulerSupportForAction(schedulerCapability, action);
        const profileLabel = schedulerCapability.profileLabel ?? 'current platform';
        const message = `Scheduler action blocked: ${schedulerOperation.toUpperCase()} is ${support} on ${profileLabel}.`;
        const statusType = support === SCHEDULER_SUPPORT_LEVELS.unsupported ? 'error' : 'warning';
        setStatus('3A', support === SCHEDULER_SUPPORT_LEVELS.unsupported ? 'error' : 'info');
        pushLog('3A', statusType, message, {
          timeline: buildTimelineDetails(),
          action,
          schedulerOperation,
          supportLevel: support,
          profile: profileLabel,
        });
        pushHistory('SCHEDULER', statusType, message, {
          action,
          schedulerOperation,
          supportLevel: support,
          profile: profileLabel,
        });
        return;
      }
    }

    const actionMap = {
      'verify-env': () => databaseActions.runInitAction('1A', 'INIT', 'Verify .env', INIT_ENDPOINTS.verifyEnv, verifyEnv),
      'check-db': () => databaseActions.runInitAction('2A', 'DB', 'Check DB', INIT_ENDPOINTS.checkDatabaseStatus, checkDatabaseStatus),
      'inspect-db': () => databaseActions.runInitAction('2A', 'DB', 'Inspect DB', INIT_ENDPOINTS.inspectDatabase, inspectDatabase),
      'delete-db': () => databaseActions.runInitAction('2A', 'DB', 'Delete DB', INIT_ENDPOINTS.deleteDatabase, deleteDatabase, payload),
      'recreate-db': () => databaseActions.runInitAction('2A', 'DB', 'Recreate DB', INIT_ENDPOINTS.recreateEmptyDatabase, recreateEmptyDatabase, payload),
      'install-cron': () => databaseActions.runInitAction('3A', 'SCHEDULER', 'Install scheduler', INIT_ENDPOINTS.installCron, installCron),
      'check-cron': () => databaseActions.runInitAction('3A', 'SCHEDULER', 'Check scheduler', INIT_ENDPOINTS.checkCronStatus, checkCronStatus),
      'print-cron': () => databaseActions.runInitAction('3A', 'SCHEDULER', 'Print scheduler', INIT_ENDPOINTS.printCron, printCron),
      'verify-db-viewer': () => void databaseActions.runDatabaseViewerVerifyAction(),
      'connect-db-viewer': () => void databaseActions.runDatabaseViewerConnectAction(),
      'show-db-tables': () => void databaseActions.runDatabaseViewerTablesAction(),
      'start-db-logging': () => void databaseActions.runDatabaseViewerLoggingAction('start'),
      'stop-db-logging': () => void databaseActions.runDatabaseViewerLoggingAction('stop'),
      'run-b1': () => demoActions.runLoginFlow(),
      'run-b2': () => demoActions.genericAction('B2', 'TEST', 'Mock batch download finished with 5 files.'),
      'run-b3-1': () => demoActions.runPipelineStage('B3.1', 'Mock download copied 1 file from /generated_test_data.'),
      'run-b3-2': () => demoActions.runPipelineStage('B3.2', 'Index stage produced 1 indexed asset.'),
      'run-b3-3': () => demoActions.runPipelineStage('B3.3', 'GPS parser extracted location metadata.'),
      'run-b3-4': () => demoActions.runPipelineStage('B3.4', 'Geocode stage resolved coordinates to address text.'),
      'run-b3-5': () => demoActions.runEnqueueStage(),
      'run-b3-auto': () => demoActions.runAutoPipeline(),
      'run-b4': () => demoActions.runPlaybackEmulation(),
      'resume-last-run': () => demoActions.genericAction('C', 'RECOVERY', 'Restore placeholder activated from the current last-run demo state.'),
      'start-real-run': () => demoActions.startRealRun(),
    };

    const handler = actionMap[action];
    if (handler) {
      handler();
    }
  }

  return {
    runAction,
    runDatabaseViewerRowsAction: databaseActions.runDatabaseViewerRowsAction,
    applyScreenSimulationState: demoActions.applyScreenSimulationState,
  };
}
