import type { ApiRequestMeta } from '../apiClient.ts';
import type { SchedulerCapability } from '../../../shared/schedulerPlatformCapabilities.ts';

export type RuntimeTruthRequestBody = unknown;

export type RuntimeTruthHeaders = Record<string, string>;

export type RuntimeTruthEndpoint = {
  method: string;
  path: string;
};

export type RuntimeTruthTimelineDetails = {
  local: string;
  tallinn: string;
  iso: string;
};

export type RuntimeTruthActionEnvelope<TPayload = unknown> = {
  payload: TPayload;
  meta: ApiRequestMeta | null;
};

export type RuntimeTruthUiStatus = 'success' | 'info' | 'error';

export type RuntimeTruthApiPayload = Record<string, unknown>;

export type RuntimeTruthLogDetailsInput = {
  operation: string;
  endpoint: RuntimeTruthEndpoint;
  requestBody?: RuntimeTruthRequestBody;
  apiMeta?: ApiRequestMeta | null;
  responsePayload?: unknown;
  outcome: string;
};

export type RuntimeTruthLogDetails = {
  timeline: RuntimeTruthTimelineDetails;
  operation: string;
  endpoint: string;
  outcome: string;
  request: ApiRequestMeta['request'];
  response: ApiRequestMeta['response'] | null;
};

export type RuntimeTruthErrorLike = {
  status?: number | string | null;
  message?: string;
};

function isRecord(value: unknown): value is RuntimeTruthApiPayload {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readRecordField(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function readNestedRecord(value: unknown, key: string): RuntimeTruthApiPayload | null {
  const candidate = readRecordField(value, key);
  return isRecord(candidate) ? candidate : null;
}

function readStringField(value: unknown, key: string): string | null {
  const candidate = readRecordField(value, key);
  return typeof candidate === 'string' ? candidate : null;
}

function readNumberField(value: unknown, key: string): number | null {
  const candidate = readRecordField(value, key);
  return typeof candidate === 'number' ? candidate : null;
}

export function buildRequestHeaders(body: RuntimeTruthRequestBody): RuntimeTruthHeaders {
  const headers: RuntimeTruthHeaders = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export function normalizeActionResult<TPayload = unknown>(result: TPayload | RuntimeTruthActionEnvelope<TPayload>): RuntimeTruthActionEnvelope<TPayload> {
  if (isRecord(result) && 'payload' in result && 'meta' in result) {
    return result as RuntimeTruthActionEnvelope<TPayload>;
  }

  return { payload: result as TPayload, meta: null };
}

export function buildTimelineDetails(): RuntimeTruthTimelineDetails {
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

export function buildInitLogDetails({ operation, endpoint, requestBody, apiMeta, responsePayload, outcome }: RuntimeTruthLogDetailsInput): RuntimeTruthLogDetails {
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

export function mapPayloadStatusToUiStatus(payloadStatus: unknown): RuntimeTruthUiStatus {
  if (payloadStatus === 'error') {
    return 'error';
  }
  if (payloadStatus === 'warning') {
    return 'info';
  }
  return 'success';
}

export function extractSchedulerCapability(payload: unknown, fallbackCapability: SchedulerCapability | null | undefined): SchedulerCapability | null | undefined {
  const scheduler = readNestedRecord(payload, 'scheduler');
  const candidate = scheduler?.capability;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return fallbackCapability;
  }
  return {
    ...(fallbackCapability ?? {}),
    ...candidate,
  } as SchedulerCapability;
}

export function summarizeInitPayload(operation: string, payload: unknown): string {
  if (!payload) {
    return `${operation} completed with an empty response body.`;
  }
  const scheduler = readNestedRecord(payload, 'scheduler');
  const schedulerSupport = scheduler?.operationSupportLevel;
  const schedulerProfile = scheduler?.platformProfileLabel;
  if (schedulerSupport && schedulerProfile) {
    return `${operation} completed for ${schedulerProfile} with scheduler support level ${schedulerSupport}.`;
  }
  if (typeof payload === 'string') {
    return `${operation} completed: ${payload}`;
  }
  const message = readStringField(payload, 'message');
  if (message) {
    return `${operation} completed: ${message}`;
  }
  const status = readStringField(payload, 'status');
  if (status) {
    return `${operation} completed with status ${status}.`;
  }
  const topLevelKeys = typeof payload === 'object' ? Object.keys(payload as object) : [];
  return `${operation} completed and returned ${topLevelKeys.length} top-level field${topLevelKeys.length === 1 ? '' : 's'}.`;
}

export function summarizeRuntimePayload(operation: string, payload: unknown): string {
  if (!payload) {
    return `${operation} completed with an empty response body.`;
  }

  const messages = readRecordField(payload, 'messages');
  if (Array.isArray(messages) && messages.length) {
    return String(messages[0]);
  }

  const playback = readNestedRecord(payload, 'playback');
  const selected = readNestedRecord(playback, 'selected');
  const canonicalPath = readStringField(selected, 'canonicalPath');
  if (canonicalPath) {
    return `${operation} completed and selected ${canonicalPath}.`;
  }

  const queue = readNestedRecord(payload, 'queue');
  const insertedCount = readNumberField(queue, 'insertedCount');
  if (insertedCount !== null) {
    return `${operation} completed with ${insertedCount} newly queued item(s).`;
  }

  const indexing = readNestedRecord(payload, 'indexing');
  const insertedCanonicalCount = readNumberField(indexing, 'insertedCanonicalCount');
  if (insertedCanonicalCount !== null) {
    return `${operation} completed and inserted ${insertedCanonicalCount} canonical item(s).`;
  }

  const download = readNestedRecord(payload, 'download');
  const newMediaFiles = readNumberField(download, 'newMediaFiles');
  if (newMediaFiles !== null) {
    return `${operation} completed and detected ${newMediaFiles} new media file(s).`;
  }

  const message = readStringField(payload, 'message');
  if (message) {
    return `${operation} completed: ${message}`;
  }
  const status = readStringField(payload, 'status');
  if (status) {
    return `${operation} completed with status ${status}.`;
  }
  const topLevelKeys = typeof payload === 'object' ? Object.keys(payload as object) : [];
  return `${operation} completed and returned ${topLevelKeys.length} top-level field${topLevelKeys.length === 1 ? '' : 's'}.`;
}

export function formatInitError(operation: string, error: RuntimeTruthErrorLike | unknown): string {
  if (isRecord(error) && error.status) {
    return `${operation} failed with HTTP ${error.status}: ${String(error.message)}`;
  }
  if (isRecord(error) && typeof error.message === 'string') {
    return `${operation} failed: ${error.message}`;
  }
  return `${operation} failed for an unknown reason.`;
}
