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
} from '../initService.ts';
import {
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
} from '../../../shared/schedulerPlatformCapabilities.ts';
import { buildTimelineDetails } from './runtimeTruthActionUtils.ts';
import {
  RUNTIME_EXECUTION_ENDPOINTS,
  runRuntimeDownload,
  runRuntimeGeocode,
  runRuntimeGps,
  runRuntimeIndex,
} from '../runtimeExecutionService.ts';
import { createRuntimeTruthDatabaseActions } from './runtimeTruthDatabaseActions.ts';
import { createRuntimeTruthAuthActions } from './runtimeTruthAuthActions.ts';
import { createRuntimeTruthNewAuthActions } from './runtimeTruthNewAuthActions.ts';
import { createRuntimeTruthDemoActions } from './runtimeTruthDemoActions.ts';
import { createRuntimeTruthGuards } from './runtimeTruthGuards.ts';
import {
  buildInitialSchedulerCapability,
  getSchedulerSupportForAction,
  supportsSchedulerAction,
} from './runtimeTruthState.ts';

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

  const authActions = createRuntimeTruthAuthActions({
    patchState,
    pushHistory,
    pushLog,
    setStatus,
    stamp,
    guards,
  });

  const newAuthActions = createRuntimeTruthNewAuthActions({
    patchState,
    pushHistory,
    pushLog,
    setStatus,
    openModal: (modal) => patchState((draft) => { draft.modal = modal ? structuredClone(modal) : null; }),
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
      // Legacy B1 action IDs are compatibility adapters for the View A 1A-AUTH card.
      // Keep them stable until downstream tests/docs are migrated, but do not add new B1 aliases.
      'refresh-b1-auth-status': () => void authActions.refreshAuthStatus(),
      'verify-icloudpd': () => void authActions.verifyIcloudpdPreflightAction(),
      'check-login': () => void authActions.checkAuthLoginAction(),
      'login-using-env': () => void authActions.runAuthPreflightAction(),
      'run-b1': () => void authActions.runAuthPreflightAction(),
      'test-b1-login-download-one': () => void authActions.testLoginByDownloadingSingleFileAction(),
      'reset-b1-auth': () => void authActions.resetAuthPreflightAction(),
      'submit-b1-2fa': (detail) => void authActions.submitAuthTwoFactorAction(detail?.code ?? ''),
      'logout-b1-auth': () => void authActions.logoutAuthPreflightAction(),
      'new-auth-verify-icloudpd': () => void newAuthActions.verifyIcloudpdAction(),
      'new-auth-login-using-env': () => void newAuthActions.loginUsingEnvAction(),
      'new-auth-check-login': () => void newAuthActions.checkLoginAction(),
      'new-auth-logout-session': () => void newAuthActions.logoutAction(),
      'new-auth-session-files': () => void newAuthActions.sessionFilesAction(),
      'new-auth-submit-2fa': (detail) => void newAuthActions.submitTwoFactorAction(detail?.code ?? ''),
      'run-b2': () => void demoActions.runBackendAction({ key: 'B2', source: 'TEST', operation: 'Run download test action', endpoint: RUNTIME_EXECUTION_ENDPOINTS.downloadRun, execute: runRuntimeDownload }),
      'run-b3-1': () => demoActions.runBackendPipelineStage({ key: 'B3.1', operation: 'Run download stage', endpoint: RUNTIME_EXECUTION_ENDPOINTS.downloadRun, execute: runRuntimeDownload }),
      'run-b3-2': () => demoActions.runBackendPipelineStage({ key: 'B3.2', operation: 'Run index stage', endpoint: RUNTIME_EXECUTION_ENDPOINTS.indexRun, execute: runRuntimeIndex }),
      'run-b3-3': () => demoActions.runBackendPipelineStage({ key: 'B3.3', operation: 'Run GPS stage', endpoint: RUNTIME_EXECUTION_ENDPOINTS.gpsRun, execute: runRuntimeGps }),
      'run-b3-4': () => demoActions.runBackendPipelineStage({ key: 'B3.4', operation: 'Run geocode stage', endpoint: RUNTIME_EXECUTION_ENDPOINTS.geocodeRun, execute: runRuntimeGeocode }),
      'run-b3-5': () => demoActions.runEnqueueStage(),
      'run-b3-auto': () => demoActions.runAutoPipeline(),
      'run-b4': () => demoActions.runPlaybackEmulation(),
      'resume-last-run': () => demoActions.genericAction('C', 'RECOVERY', 'Restore placeholder activated from the current last-run demo state.'),
      'start-real-run': () => demoActions.startRealRun(),
    };

    const handler = actionMap[action];
    if (handler) {
      handler(payload);
    }
  }

  return {
    runAction,
    runDatabaseViewerRowsAction: databaseActions.runDatabaseViewerRowsAction,
    applyScreenSimulationState: demoActions.applyScreenSimulationState,
  };
}
