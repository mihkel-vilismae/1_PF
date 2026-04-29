import {
  getNewAuthSessionFiles,
  getNewAuthStatus,
  verifyNewAuthIcloudpd,
  type NewAuthContext,
} from './newAuthService.ts';

interface NewAuthRouteRequest {
  context: NewAuthContext;
}

interface NewAuthRouteResponse<TPayload extends Record<string, unknown>> {
  statusCode: number;
  payload: TPayload;
}

interface NewAuthRoutes {
  statusHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  verifyIcloudpdHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  sessionFilesHandler(request: NewAuthRouteRequest): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  loginPendingHandler(): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  submitTwoFactorPendingHandler(): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
  logoutPendingHandler(): Promise<NewAuthRouteResponse<Record<string, unknown>>>;
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

    loginPendingHandler: async () => ({
      statusCode: 501,
      payload: buildPendingSlice3Payload('POST /api/auth/new/login'),
    }),

    submitTwoFactorPendingHandler: async () => ({
      statusCode: 501,
      payload: buildPendingSlice3Payload('POST /api/auth/new/submit-2fa'),
    }),

    logoutPendingHandler: async () => ({
      statusCode: 501,
      payload: buildPendingSlice3Payload('POST /api/auth/new/logout'),
    }),
  };
}

function buildPendingSlice3Payload(endpoint: string): Record<string, unknown> {
  return {
    ok: false,
    state: 'failed',
    errorCode: 'NEW_AUTH_SLICE_3_REQUIRED',
    message: `${endpoint} is reserved for NEW AUTH Slice 3. Slice 2 registers a safe non-secret placeholder only.`,
    details: {
      endpoint,
      provider: 'icloudpd',
      implementedInCurrentSlice: false,
      secretsShown: false,
    },
  };
}
