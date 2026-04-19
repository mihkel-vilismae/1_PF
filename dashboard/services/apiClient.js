export class ApiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options.status ?? null;
    this.payload = options.payload;
    this.cause = options.cause;
  }
}

export async function requestJson(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
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

  let response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    throw new ApiRequestError(`Network request failed for ${method} ${path}.`, { cause: error });
  }

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    const message = extractMessage(payload) ?? `Request failed with status ${response.status}.`;
    throw new ApiRequestError(message, {
      status: response.status,
      payload,
    });
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
