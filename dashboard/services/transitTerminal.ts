/*
 * Formats live dashboard API transit records for the on-screen terminal.
 * The terminal mirrors outbound requests and inbound responses from apiClient.
 * Request ids make paired request/response lines easy to correlate.
 */
import type { TransitRecord } from './apiClient.ts';

const MAX_TRANSIT_LINES = 120;
const placeholderLines = [
  '[PLACEHOLDER] boot: transit terminal is not wired yet',
  '$ tail -f dashboard-transit.log',
  '00:00:01 OUT #1 GET /api/init/verify-env body=no',
  '00:00:01 IN  #1 200 OK  GET /api/init/verify-env',
  '00:00:05 OUT #2 GET /api/init/database/status body=no',
  '00:00:05 IN  #2 404 ERR GET /api/init/database/status',
  '[PLACEHOLDER] replace this feed with live gateway traffic',
];

export type TransitTerminal = {
  consumeRecord: (record: TransitRecord | unknown) => boolean;
  hasLiveTraffic: () => boolean;
  renderLines: () => string;
};

// Creates a bounded in-memory terminal buffer for live transit records.
export function createTransitTerminal(): TransitTerminal {
  const transitLines: string[] = [];
  let hasLiveTraffic = false;

  return {
    consumeRecord(record: TransitRecord | unknown): boolean {
      const line = formatTransitRecord(record);
      if (!line) {
        return false;
      }

      hasLiveTraffic = true;
      transitLines.push(line);
      if (transitLines.length > MAX_TRANSIT_LINES) {
        transitLines.splice(0, transitLines.length - MAX_TRANSIT_LINES);
      }
      return true;
    },
    hasLiveTraffic(): boolean {
      return hasLiveTraffic;
    },
    renderLines(): string {
      if (!hasLiveTraffic) {
        return placeholderLines.join('\n');
      }
      if (!transitLines.length) {
        return '[transit] waiting for gateway traffic...';
      }
      return transitLines.join('\n');
    },
  };
}

// Converts one transit record into a stable single-line terminal entry.
function formatTransitRecord(record: TransitRecord | unknown): string {
  if (!record || typeof record !== 'object') {
    return '';
  }

  const candidate = record as Partial<TransitRecord>;
  const atIso = typeof candidate.atIso === 'string' ? candidate.atIso : '';
  const time = atIso
    ? new Date(atIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const direction = candidate.direction === 'inbound' ? 'IN ' : candidate.direction === 'outbound' ? 'OUT' : 'IO ';
  const method = typeof candidate.method === 'string' ? candidate.method : 'GET';
  const path = typeof candidate.path === 'string' ? candidate.path : '';

  if (!path) {
    return '';
  }

  const operation = typeof candidate.operation === 'string' ? candidate.operation : `${method} ${path}`;
  const hasBody = candidate.hasBody === true ? 'body=yes' : candidate.hasBody === false ? 'body=no' : 'body=?';
  const requestId = typeof candidate.id === 'number' && Number.isFinite(candidate.id)
    ? `#${candidate.id}`
    : '#?';

  if (candidate.direction === 'outbound') {
    return `${time} ${direction} ${requestId} ${method} ${path} ${hasBody} :: ${operation}`;
  }

  const status = candidate.status === null || candidate.status === undefined ? '---' : String(candidate.status);
  const ok = candidate.ok === true ? 'OK ' : candidate.ok === false ? 'ERR' : '---';
  const error = typeof candidate.error === 'string' && candidate.error.trim() ? ` :: ${candidate.error.trim()}` : '';
  return `${time} ${direction} ${requestId} ${status} ${ok} ${method} ${path}${error} :: ${operation}`;
}
