export class ApiRequestError extends Error {
  declare status;
  declare payload;
  declare meta;
  declare cause;

  constructor(message, options: any = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status ?? null;
    this.payload = options.payload;
    this.meta = options.meta ?? null;
    this.cause = options.cause;
  }
}

const transitSubscribers = new Set<Function>();
let nextTransitId = 1;

export function subscribeTransit(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('subscribeTransit(listener) requires a function.');
  }
  transitSubscribers.add(listener);
  return () => transitSubscribers.delete(listener);
}

function emitTransit(record) {
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

export async function requestJson(path, options: any = {}) {
  const { method = 'GET', body, headers = {}, captureMeta = false, operation } = options;
  const requestHeaders = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    ...headers,
  };

  const init: any = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const transitId = nextTransitId++;
  const transitOperation = typeof operation === 'string' && operation.trim()
    ? operation.trim()
    : `${method} ${path}`;

  const requestMeta = {
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

  let response;
  try {
    response = await fetch(path, init);
  } catch (error) {
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
      error: error?.message ?? String(error),
    });
    throw new ApiRequestError(`Network request failed for ${method} ${path}.`, {
      cause: error,
      meta: {
        request: requestMeta,
        response: null,
      },
    });
  }

  const payload = await readResponsePayload(response);
  const responseMeta = {
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

async function readResponsePayload(response) {
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
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractMessage(payload) {
  if (!payload) {
    return null;
  }
  if (typeof payload === 'string') {
    return payload;
  }
  if (typeof payload.message === 'string') {
    return payload.message;
  }
  if (typeof payload.error === 'string') {
    return payload.error;
  }
  return null;
}

function normalizeHeaders(headers) {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, value == null ? '' : String(value)]),
  );
}
