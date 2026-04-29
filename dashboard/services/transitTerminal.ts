import type { TransitRecord } from './apiClient.ts';

const MAX_TRANSIT_LINES = 120;
const placeholderLines = [
  '[PLACEHOLDER] boot: transit terminal is not wired yet',
  '$ tail -f dashboard-transit.log',
  '00:00:01 OUT GET /api/init/verify-env body=no',
  '00:00:01 IN  200 OK  GET /api/init/verify-env',
  '00:00:05 OUT GET /api/init/database/status body=no',
  '00:00:05 IN  404 ERR GET /api/init/database/status',
  '[PLACEHOLDER] replace this feed with live gateway traffic',
];

export type TransitTerminal = {
  consumeRecord: (record: TransitRecord | unknown) => boolean;
  hasLiveTraffic: () => boolean;
  renderLines: () => string;
};

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

  if (candidate.direction === 'outbound') {
    return `${time} ${direction} ${method} ${path} ${hasBody} :: ${operation}`;
  }

  const status = candidate.status === null || candidate.status === undefined ? '---' : String(candidate.status);
  const ok = candidate.ok === true ? 'OK ' : candidate.ok === false ? 'ERR' : '---';
  const error = typeof candidate.error === 'string' && candidate.error.trim() ? ` :: ${candidate.error.trim()}` : '';
  return `${time} ${direction} ${status} ${ok} ${method} ${path}${error} :: ${operation}`;
}
