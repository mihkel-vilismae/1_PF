import {
  getPublicAuthState,
  logoutAuth,
  resetAuthState,
  resumeAuthSession,
  runAuthPreflight,
  submitAuthTwoFactor,
} from './authService.js';

const ERROR_AUTH_STATUSES = new Set(['preflight_failed', 'provider_failed']);

export function createAuthRoutes({ getAuthReadinessChecks, resumeAuthSessionFn = resumeAuthSession }) {
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
