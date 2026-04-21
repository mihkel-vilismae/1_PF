export function buildRequestHeaders(body) {
  const headers = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export function normalizeActionResult(result) {
  if (result && typeof result === 'object' && 'payload' in result && 'meta' in result) {
    return result;
  }

  return { payload: result, meta: null };
}

export function buildTimelineDetails() {
  const now = new Date();
  return {
    local: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    tallinn: new Intl.DateTimeFormat('et-EE', {
      timeZone: 'Europe/Tallinn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now),
    iso: now.toISOString(),
  };
}

export function buildInitLogDetails({ operation, endpoint, requestBody, apiMeta, responsePayload, outcome }) {
  const request = apiMeta?.request ?? {
    method: endpoint.method,
    path: endpoint.path,
    headers: buildRequestHeaders(requestBody),
    body: requestBody === undefined ? null : requestBody,
  };
  const responseMeta = apiMeta?.response ?? null;

  return {
    timeline: buildTimelineDetails(),
    operation,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    outcome,
    request,
    response: responseMeta
      ? {
          status: responseMeta.status,
          statusText: responseMeta.statusText,
          ok: responseMeta.ok,
          url: responseMeta.url,
          headers: responseMeta.headers,
          body: responsePayload ?? responseMeta.body ?? null,
        }
      : null,
  };
}

export function mapPayloadStatusToUiStatus(payloadStatus) {
  if (payloadStatus === 'error') {
    return 'error';
  }
  if (payloadStatus === 'warning') {
    return 'info';
  }
  return 'success';
}

export function extractSchedulerCapability(payload, fallbackCapability) {
  const candidate = payload?.scheduler?.capability;
  if (!candidate || typeof candidate !== 'object') {
    return fallbackCapability;
  }
  return {
    ...(fallbackCapability ?? {}),
    ...candidate,
  };
}

export function summarizeInitPayload(operation, payload) {
  if (!payload) {
    return `${operation} completed with an empty response body.`;
  }
  const schedulerSupport = payload?.scheduler?.operationSupportLevel;
  const schedulerProfile = payload?.scheduler?.platformProfileLabel;
  if (schedulerSupport && schedulerProfile) {
    return `${operation} completed for ${schedulerProfile} with scheduler support level ${schedulerSupport}.`;
  }
  if (typeof payload === 'string') {
    return `${operation} completed: ${payload}`;
  }
  if (typeof payload.message === 'string') {
    return `${operation} completed: ${payload.message}`;
  }
  if (typeof payload.status === 'string') {
    return `${operation} completed with status ${payload.status}.`;
  }
  const topLevelKeys = Object.keys(payload);
  return `${operation} completed and returned ${topLevelKeys.length} top-level field${topLevelKeys.length === 1 ? '' : 's'}.`;
}

export function summarizeRuntimePayload(operation, payload) {
  if (!payload) {
    return `${operation} completed with an empty response body.`;
  }
  if (Array.isArray(payload.messages) && payload.messages.length) {
    return payload.messages[0];
  }
  if (payload.playback?.selected?.canonicalPath) {
    return `${operation} completed and selected ${payload.playback.selected.canonicalPath}.`;
  }
  if (payload.queue && typeof payload.queue.insertedCount === 'number') {
    return `${operation} completed with ${payload.queue.insertedCount} newly queued item(s).`;
  }
  if (payload.indexing && typeof payload.indexing.insertedCanonicalCount === 'number') {
    return `${operation} completed and inserted ${payload.indexing.insertedCanonicalCount} canonical item(s).`;
  }
  if (payload.download && typeof payload.download.newMediaFiles === 'number') {
    return `${operation} completed and detected ${payload.download.newMediaFiles} new media file(s).`;
  }
  if (typeof payload.message === 'string') {
    return `${operation} completed: ${payload.message}`;
  }
  if (typeof payload.status === 'string') {
    return `${operation} completed with status ${payload.status}.`;
  }
  const topLevelKeys = Object.keys(payload);
  return `${operation} completed and returned ${topLevelKeys.length} top-level field${topLevelKeys.length === 1 ? '' : 's'}.`;
}

export function formatInitError(operation, error) {

  if (error?.status) {
    return `${operation} failed with HTTP ${error.status}: ${error.message}`;
  }
  if (error?.message) {
    return `${operation} failed: ${error.message}`;
  }
  return `${operation} failed for an unknown reason.`;
}
