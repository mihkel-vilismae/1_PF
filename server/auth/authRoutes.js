import {
  getPublicAuthState,
  logoutAuth,
  resetAuthState,
  resumeAuthSession,
  runAuthPreflight,
  submitAuthTwoFactor,
  testAuthLoginByDownloadingSingleFile,
} from './authService.js';

const ERROR_AUTH_STATUSES = new Set(['preflight_failed', 'provider_failed']);

export function createAuthRoutes({
  getAuthReadinessChecks,
  resumeAuthSessionFn = resumeAuthSession,
  singleFileDownloadDirectory = null,
  testAuthLoginByDownloadingSingleFileFn = testAuthLoginByDownloadingSingleFile,
}) {
  return {
    statusHandler: async () => ({
      statusCode: 200,
      payload: {
        status: 'ok',
        auth: getPublicAuthState(),
      },
    }),

    runHandler: async ({ context }) => {
      const checks = getAuthReadinessChecks(context);
      const auth = await runAuthPreflight({ checks, envValues: context.envValues });
      return {
        statusCode: statusCodeForAuthState(auth),
        payload: {
          status: responseStatusForAuthState(auth),
          auth,
        },
      };
    },

    twoFactorSubmitHandler: async ({ body, context }) => {
      const auth = await submitAuthTwoFactor({ code: body?.code, envValues: context.envValues });
      return {
        statusCode: statusCodeForAuthState(auth),
        payload: {
          status: responseStatusForAuthState(auth),
          auth,
        },
      };
    },

    testLoginDownloadOneHandler: async ({ context }) => {
      const checks = getAuthReadinessChecks(context);
      const result = await testAuthLoginByDownloadingSingleFileFn({
        checks,
        envValues: context.envValues,
        downloadDirectory: singleFileDownloadDirectory,
      });
      return {
        statusCode: statusCodeForAuthState(result.auth),
        payload: {
          status: responseStatusForAuthState(result.auth),
          message: summarizeSingleFileTest(result.auth, result.testDownload),
          auth: result.auth,
          testDownload: result.testDownload,
        },
      };
    },

    resetHandler: async () => ({
      statusCode: 200,
      payload: {
        status: 'ok',
        resetType: 'local_auth_attempt_state_only',
        logoutPerformed: false,
        message: 'Cleared local auth attempt state. Provider sessions are not invalidated by reset.',
        auth: resetAuthState(),
      },
    }),

    logoutHandler: async ({ context }) => {
      const result = await logoutAuth({ envValues: context.envValues });
      return {
        statusCode: 200,
        payload: {
          status: 'ok',
          resetType: 'provider_logout_or_local_cleanup',
          logoutPerformed: true,
          providerLogoutPerformed: result.providerLogoutPerformed,
          providerLogoutStatus: result.providerLogoutStatus,
          message: result.message,
          auth: result.auth,
        },
      };
    },

    resumeHandler: async ({ context }) => {
      const auth = await resumeAuthSessionFn({ envValues: context.envValues });
      return {
        statusCode: statusCodeForAuthState(auth),
        payload: {
          status: responseStatusForAuthState(auth),
          auth,
        },
      };
    },
  };
}

function summarizeSingleFileTest(auth, testDownload) {
  if (auth?.status === 'authenticated') {
    return `Downloaded one recent iCloud item into ${testDownload?.downloadDirectory ?? 'the configured test directory'}.`;
  }
  if (auth?.requires_2fa === true) {
    return 'icloudpd requires 2FA before the single-file download can complete.';
  }
  return auth?.error?.message || testDownload?.message || 'Single-file auth download test completed without an authenticated result.';
}

function statusCodeForAuthState(auth) {
  if (auth?.error?.code === 'auth_operation_in_progress') {
    return 409;
  }
  if (auth.status === 'preflight_failed') {
    return 400;
  }
  if (auth.status === 'provider_failed') {
    return 502;
  }
  return 200;
}

function responseStatusForAuthState(auth) {
  if (auth?.error?.code === 'auth_operation_in_progress') {
    return 'blocked';
  }
  if (ERROR_AUTH_STATUSES.has(auth.status)) {
    return 'error';
  }
  if (auth.status === 'blocked') {
    return 'blocked';
  }
  return 'ok';
}
