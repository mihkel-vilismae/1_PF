/*
 * Centralizes dashboard HTTP requests and request/response transit diagnostics.
 * Browser-facing services use this gateway so backend calls share parsing,
 * errors, metadata capture, and live traffic events.
 */
export type ApiRequestPayload = unknown;

export type ApiHeaders = Record<string, string>;

export type ApiRequestMeta = {
  request: {
    requestId?: number;
    method: string;
    path: string;
    headers: ApiHeaders;
    body: ApiRequestPayload | null;
  };
  response: {
    requestId?: number;
    status: number;
    statusText: string;
    ok: boolean;
    url: string;
    headers: ApiHeaders;
    body: unknown;
  } | null;
};

export type ApiResponseWithMeta<TPayload = unknown> = {
  payload: TPayload;
  meta: ApiRequestMeta;
};

export type ApiRequestOptions = {
  method?: string;
  body?: ApiRequestPayload;
  headers?: ApiHeaders;
  captureMeta?: boolean;
  operation?: string;
};

export type ApiRequestErrorOptions = {
  status?: number | null;
  payload?: unknown;
  meta?: ApiRequestMeta | null;
  cause?: unknown;
};

export type TransitRecord = {
  id: number;
  atIso: string;
  direction: 'outbound' | 'inbound';
  operation: string;
  method: string;
  path: string;
  hasBody?: boolean;
  ok?: boolean;
  status?: number | null;
  statusText?: string | null;
  error?: string;
};

export type TransitListener = (record: TransitRecord) => void;

export class ApiRequestError extends Error {
  declare status: number | null;
  declare payload: unknown;
  declare meta: ApiRequestMeta | null;
  declare cause: unknown;

  constructor(message: string, options: ApiRequestErrorOptions = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status ?? null;
    this.payload = options.payload;
    this.meta = options.meta ?? null;
    this.cause = options.cause;
  }
}

const transitSubscribers = new Set<TransitListener>();
const REQUEST_ID_HEADER = 'X-Dashboard-Request-Id';
let nextTransitId = 1;

// Registers a listener for live request/response transit records.
export function subscribeTransit(listener: TransitListener): () => boolean {
  if (typeof listener !== 'function') {
    throw new TypeError('subscribeTransit(listener) requires a function.');
  }
  transitSubscribers.add(listener);
  return () => transitSubscribers.delete(listener);
}

// Emits transit records to subscribers and the browser event bus without blocking requests.
function emitTransit(record: TransitRecord): void {
  transitSubscribers.forEach((listener) => {
    try {
      listener(record);
    } catch {
      // Transit listeners must not break the request path.
    }
  });

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      const event = typeof CustomEvent === 'function'
        ? new CustomEvent('dashboard:transit', { detail: record })
        : null;
      if (event) {
        window.dispatchEvent(event);
      }
    } catch {
      // Best-effort browser event emission.
    }
  }
}

// Sends a JSON-oriented request and records matching request/response diagnostics.
export function requestJson<TPayload = unknown>(
  path: string,
  options: ApiRequestOptions & { captureMeta: true },
): Promise<ApiResponseWithMeta<TPayload>>;
export function requestJson<TPayload = unknown>(
  path: string,
  options?: ApiRequestOptions & { captureMeta?: false },
): Promise<TPayload>;
export async function requestJson<TPayload = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TPayload | ApiResponseWithMeta<TPayload>> {
  const { method = 'GET', body, headers = {}, captureMeta = false, operation } = options;
  const transitId = nextTransitId++;
  const requestHeaders: ApiHeaders = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    ...headers,
    [REQUEST_ID_HEADER]: String(transitId),
  };

  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const transitOperation = typeof operation === 'string' && operation.trim()
    ? operation.trim()
    : `${method} ${path}`;

  const requestMeta = {
    requestId: transitId,
    method,
    path,
    headers: normalizeHeaders(requestHeaders),
    body: body === undefined ? null : body,
  };

  emitTransit({
    id: transitId,
    atIso: new Date().toISOString(),
    direction: 'outbound',
    operation: transitOperation,
    method,
    path,
    hasBody: body !== undefined,
  });

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    emitTransit({
      id: transitId,
      atIso: new Date().toISOString(),
      direction: 'inbound',
      operation: transitOperation,
      method,
      path,
      ok: false,
      status: null,
      statusText: null,
      error: errorMessage,
    });
    throw new ApiRequestError(`Network request failed for ${method} ${path}.`, {
      cause: error,
      meta: {
        request: requestMeta,
        response: null,
      },
    });
  }

  const payload = await readResponsePayload(response) as TPayload;
  const responseMeta = {
    requestId: transitId,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url,
    headers: normalizeHeaders(response.headers),
    body: payload,
  };

  if (!response.ok) {
    const message = extractMessage(payload) ?? `Request failed with status ${response.status}.`;
    emitTransit({
      id: transitId,
      atIso: new Date().toISOString(),
      direction: 'inbound',
      operation: transitOperation,
      method,
      path,
      ok: false,
      status: response.status,
      statusText: response.statusText,
      error: message,
    });
    throw new ApiRequestError(message, {
      status: response.status,
      payload,
      meta: {
        request: requestMeta,
        response: responseMeta,
      },
    });
  }

  emitTransit({
    id: transitId,
    atIso: new Date().toISOString(),
    direction: 'inbound',
    operation: transitOperation,
    method,
    path,
    ok: true,
    status: response.status,
    statusText: response.statusText,
  });

  if (captureMeta) {
    return {
      payload,
      meta: {
        request: requestMeta,
        response: responseMeta,
      },
    };
  }

  return payload;
}

// Reads JSON/text responses while preserving empty and no-content responses as null.
async function readResponsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

// Extracts a human-readable failure message from common backend payload shapes.
function extractMessage(payload: unknown): string | null {
  if (!payload) {
    return null;
  }
  if (typeof payload === 'string') {
    return payload;
  }
  if (typeof payload !== 'object') {
    return null;
  }
  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }
  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }
  return null;
}

// Converts Fetch Headers or header-like records into plain string maps.
function normalizeHeaders(headers: Headers | Record<string, unknown>): ApiHeaders {
  if (headers instanceof Headers) {
    const normalizedHeaders: ApiHeaders = {};
    headers.forEach((value, key) => {
      normalizedHeaders[key] = value;
    });
    return normalizedHeaders;
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, value == null ? '' : String(value)]),
  );
}
