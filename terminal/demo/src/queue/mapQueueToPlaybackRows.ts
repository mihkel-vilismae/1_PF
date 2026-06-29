// Maps supported PhotoFrame/demo queue JSON shapes into terminal playback queue rows.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoQueueRecord } from './DemoQueueRepository.js';

type JsonRecord = Record<string, unknown>;

export function mapQueueJsonToRecords(data: unknown): { rows: DemoQueueRecord[]; messages: string[] } {
  const items = discoverQueueItems(data);
  if (!items.length) return { rows: [], messages: ['No queue items found in supported JSON shapes.'] };
  return {
    rows: items.map((item, index) => mapQueueItem(item, index)).filter((row): row is DemoQueueRecord => row !== null),
    messages: [`Mapped ${items.length} queue item(s).`]
  };
}

function discoverQueueItems(data: unknown): JsonRecord[] {
  if (Array.isArray(data)) return data.filter(isJsonRecord);
  if (!isJsonRecord(data)) return [];
  for (const value of [data.items, data.records, data.queueItems]) {
    if (Array.isArray(value)) return value.filter(isJsonRecord);
  }
  if (isJsonRecord(data.playback)) {
    for (const value of [data.playback.items, data.playback.queueItems]) {
      if (Array.isArray(value)) return value.filter(isJsonRecord);
    }
  }
  if (isJsonRecord(data.queue)) {
    for (const value of [data.queue.items, data.queue.records, data.queue.queueItems]) {
      if (Array.isArray(value)) return value.filter(isJsonRecord);
    }
  }
  return [];
}

function mapQueueItem(item: JsonRecord, index: number): DemoQueueRecord | null {
  const fileName = firstString(item.fileName, item.displayName, item.filename, item.name, item.file);
  const relativePath = firstString(item.relativePath, item.mediaRelativePath, item.path, item.filePath, item.sourcePath, fileName);
  if (!fileName && !relativePath) return null;
  const mediaType = normalizeMediaType(firstString(item.mediaType, item.type, item.kind, item.fileExtension));
  return {
    queueId: firstString(item.queueId, item.id, item.slideshowQueueId, item.displayQueueId) ?? `queue-${index + 1}`,
    rowNumber: toNullableNumber(item.rowNumber ?? item.row ?? item.sourceRowNumber),
    fileName: fileName ?? basename(relativePath ?? `queue-${index + 1}`),
    relativePath: relativePath ?? fileName ?? `queue-${index + 1}`,
    type: mediaType,
    address: firstString(item.address, item.resolvedAddress, item.overlayText, item.location) ?? '',
    status: firstString(item.status, item.queueStatus, item.state) ?? 'queued',
    source: 'DEMO_QUEUE_OUTPUT_PATH'
  };
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function toNullableNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMediaType(value: string | null): 'image' | 'video' {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('video') || /\.(mp4|mov|webm|mkv|avi)$/i.test(normalized)) return 'video';
  return 'image';
}

function basename(value: string): string {
  return value.split(/[\\/]/).filter(Boolean).pop() ?? value;
}
