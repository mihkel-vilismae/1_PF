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

export function createTransitTerminal() {
  const transitLines = [];
  let hasLiveTraffic = false;

  return {
    consumeRecord(record) {
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
    hasLiveTraffic() {
      return hasLiveTraffic;
    },
    renderLines() {
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

function formatTransitRecord(record) {
  if (!record || typeof record !== 'object') {
    return '';
  }

  const atIso = typeof record.atIso === 'string' ? record.atIso : '';
  const time = atIso
    ? new Date(atIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const direction = record.direction === 'inbound' ? 'IN ' : record.direction === 'outbound' ? 'OUT' : 'IO ';
  const method = typeof record.method === 'string' ? record.method : 'GET';
  const path = typeof record.path === 'string' ? record.path : '';

  if (!path) {
    return '';
  }

  const operation = typeof record.operation === 'string' ? record.operation : `${method} ${path}`;
  const hasBody = record.hasBody === true ? 'body=yes' : record.hasBody === false ? 'body=no' : 'body=?';

  if (record.direction === 'outbound') {
    return `${time} ${direction} ${method} ${path} ${hasBody} :: ${operation}`;
  }

  const status = record.status === null || record.status === undefined ? '---' : String(record.status);
  const ok = record.ok === true ? 'OK ' : record.ok === false ? 'ERR' : '---';
  const error = typeof record.error === 'string' && record.error.trim() ? ` :: ${record.error.trim()}` : '';
  return `${time} ${direction} ${status} ${ok} ${method} ${path}${error} :: ${operation}`;
}
