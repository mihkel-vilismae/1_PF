export class ApiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status ?? null;
    this.payload = options.payload;
    this.meta = options.meta ?? null;
    this.cause = options.cause;
  }
}

export async function requestJson(path, options = {}) {
  const { method = 'GET', body, headers = {}, captureMeta = false } = options;
  const requestHeaders = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    ...headers,
  };

  const init = {
    method,
    headers: requestHeaders,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const requestMeta = {
    method,
    path,
    headers: normalizeHeaders(requestHeaders),
    body: body === undefined ? null : body,
  };

  let response;
  try {
    response = await fetch(path, init);
  } catch (error) {
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
    throw new ApiRequestError(message, {
      status: response.status,
      payload,
      meta: {
        request: requestMeta,
        response: responseMeta,
      },
    });
  }

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
