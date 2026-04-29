import {
  getPublicAuthState,
  logoutAuth,
  resetAuthState,
  resumeAuthSession,
  runAuthPreflight,
  submitAuthTwoFactor,
  verifyAuthPreflightReadiness,
  testAuthLoginByDownloadingSingleFile,
} from './authService.ts';
import type { AuthEnvValues, AuthReadinessCheck, PublicAuthState, SingleFileAuthTestResult } from './authTypes.ts';

const ERROR_AUTH_STATUSES = new Set(['preflight_failed', 'provider_failed']);

interface AuthRouteContext {
  envValues?: AuthEnvValues;
  [key: string]: unknown;
}

interface AuthRouteRequest {
  context: AuthRouteContext;
  body?: Record<string, unknown> | null;
}

interface AuthRouteResponse<TPayload extends Record<string, unknown>> {
  statusCode: number;
  payload: TPayload;
}

interface AuthReadinessProviderContext extends AuthRouteContext {}

type GetAuthReadinessChecks = (context: AuthReadinessProviderContext) => AuthReadinessCheck[];
type ResumeAuthSessionFn = (options?: { envValues?: AuthEnvValues }) => Promise<PublicAuthState>;
type TestAuthLoginByDownloadingSingleFileFn = (options: {
  checks: AuthReadinessCheck[];
  envValues?: AuthEnvValues;
  downloadDirectory?: string | null;
}) => Promise<SingleFileAuthTestResult>;

interface CreateAuthRoutesOptions {
  getAuthReadinessChecks: GetAuthReadinessChecks;
  resumeAuthSessionFn?: ResumeAuthSessionFn;
  singleFileDownloadDirectory?: string | null;
  testAuthLoginByDownloadingSingleFileFn?: TestAuthLoginByDownloadingSingleFileFn;
}

interface AuthRoutes {
  statusHandler(): Promise<AuthRouteResponse<Record<string, unknown>>>;
  verifyIcloudpdHandler(request: AuthRouteRequest): Promise<AuthRouteResponse<Record<string, unknown>>>;
  runHandler(request: AuthRouteRequest): Promise<AuthRouteResponse<Record<string, unknown>>>;
  twoFactorSubmitHandler(request: AuthRouteRequest): Promise<AuthRouteResponse<Record<string, unknown>>>;
  testLoginDownloadOneHandler(request: AuthRouteRequest): Promise<AuthRouteResponse<Record<string, unknown>>>;
  resetHandler(): Promise<AuthRouteResponse<Record<string, unknown>>>;
  logoutHandler(request: AuthRouteRequest): Promise<AuthRouteResponse<Record<string, unknown>>>;
  resumeHandler(request: AuthRouteRequest): Promise<AuthRouteResponse<Record<string, unknown>>>;
}

export function createAuthRoutes({
  getAuthReadinessChecks,
  resumeAuthSessionFn = resumeAuthSession,
  singleFileDownloadDirectory = null,
  testAuthLoginByDownloadingSingleFileFn = testAuthLoginByDownloadingSingleFile,
}: CreateAuthRoutesOptions): AuthRoutes {
  return {
    statusHandler: async () => ({
      statusCode: 200,
      payload: {
        status: 'ok',
        auth: getPublicAuthState(),
      },
    }),

    verifyIcloudpdHandler: async ({ context }) => {
      const checks = getAuthReadinessChecks(context);
      const readiness = await verifyAuthPreflightReadiness({ checks, envValues: context.envValues });
      return {
        statusCode: readiness.status === 'ok' ? 200 : 400,
        payload: {
          status: readiness.status,
          readiness,
          auth: readiness.auth,
        },
      };
    },

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

function summarizeSingleFileTest(auth: PublicAuthState, testDownload: SingleFileAuthTestResult['testDownload']): string {
  if (auth?.status === 'authenticated') {
    return `Downloaded one recent iCloud item into ${testDownload?.downloadDirectory ?? 'the configured test directory'}.`;
  }
  if (auth?.requires_2fa === true) {
    return 'icloudpd requires 2FA before the single-file download can complete.';
  }
  return auth?.error?.message || testDownload?.message || 'Single-file auth download test completed without an authenticated result.';
}

function statusCodeForAuthState(auth: PublicAuthState): number {
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

function responseStatusForAuthState(auth: PublicAuthState): string {
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
