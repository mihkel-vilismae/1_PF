import {
  getNewAuthSessionFiles,
  getNewAuthStatus,
  logoutNewAuthSession,
  startNewAuthLogin,
  submitNewAuthTwoFactor,
  verifyNewAuthIcloudpd,
  testNewAuthDownload,
  type NewAuthContext,
} from './newAuthService.ts';

interface NewAuthRouteRequest {
  context: NewAuthContext;
  body?: Record<string, unknown>;
}

interface NewAuthRouteResponse<TPayload extends Record<string, unknown>> {
  statusCode: number;
  payload: TPayload;
}

interface NewAuthRoutes {
  statusHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  verifyIcloudpdHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  sessionFilesHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  loginHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  submitTwoFactorHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  logoutHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  testDownloadHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
}

export function createNewAuthRoutes(): NewAuthRoutes {
  return {
    statusHandler: async ({ context }) => {
      const payload = await getNewAuthStatus(context);
      return {
        statusCode: 200,
        payload,
      };
    },

    verifyIcloudpdHandler: async ({ context }) => {
      const payload = await verifyNewAuthIcloudpd(context);
      return {
        statusCode: payload.ok === true ? 200 : 400,
        payload,
      };
    },

    sessionFilesHandler: async ({ context }) => {
      const payload = await getNewAuthSessionFiles(context);
      return {
        statusCode: 200,
        payload,
      };
    },

    loginHandler: async ({ context }) => {
      const payload = await startNewAuthLogin(context);
      return {
        statusCode: statusCodeForPayload(payload),
        payload,
      };
    },

    submitTwoFactorHandler: async ({ context, body }) => {
      const payload = await submitNewAuthTwoFactor(context, { code: body?.code });
      return {
        statusCode: statusCodeForPayload(payload),
        payload,
      };
    },

    logoutHandler: async ({ context }) => {
      const payload = await logoutNewAuthSession(context);
      return {
        statusCode: statusCodeForPayload(payload),
        payload,
      };
    },

    testDownloadHandler: async ({ context }) => {
      const payload = await testNewAuthDownload(context);
      return {
        statusCode: statusCodeForPayload(payload),
        payload,
      };
    },
  };
}

function statusCodeForPayload(payload: Record<string, unknown>): number {
  if (payload.ok === true || payload.state === 'pending_2fa') {
    return 200;
  }
  if (
    payload.errorCode === 'NEW_AUTH_MISSING_CONFIG' ||
    payload.errorCode === 'NEW_AUTH_2FA_CODE_MISSING' ||
    payload.errorCode === 'NEW_AUTH_INVALID_2FA_CODE' ||
    payload.errorCode === 'NEW_AUTH_INVALID_2FA_DEVICE_INDEX' ||
    payload.errorCode === 'NEW_AUTH_NO_ACTIVE_2FA_CHALLENGE' ||
    payload.errorCode === 'NEW_AUTH_UNSAFE_SESSION_PATH'
  ) {
    // Treat configuration problems and invalid 2FA submissions as bad requests (400).
    return 400;
  }
  if (payload.errorCode === 'ICLOUDPD_NOT_FOUND') {
    return 404;
  }
  return 409;
}
