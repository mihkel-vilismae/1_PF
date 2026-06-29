// Maps playback-worker status JSON into a terminal selected-item row.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoPlaybackSelectedItem, DemoPlaybackStatusReadResult } from './DemoPlaybackStatusRepository.js';

type JsonRecord = Record<string, unknown>;

export function mapPlaybackStatusJson(data: unknown, sourcePath: string): DemoPlaybackStatusReadResult {
  const root = isJsonRecord(data) ? data : null;
  if (!root) return waiting(sourcePath, ['No playback status object found.']);

  const selectedSource = findSelectedSource(root);
  const status = normalizeStatus(firstString(root.status, root.outcome, selectedSource?.status, selectedSource?.state));
  if (!selectedSource) {
    return {
      selectedItem: null,
      status,
      sourcePath,
      messages: [status === 'waiting' ? 'Playback worker has not selected an item yet.' : `Playback status has no selected item: ${status}`]
    };
  }

  return {
    selectedItem: mapSelectedItem(selectedSource, sourcePath, status),
    status: status === 'waiting' || status === 'unknown' ? 'selected' : status,
    sourcePath,
    messages: ['Mapped selected playback item from playback-worker status.']
  };
}

function findSelectedSource(root: JsonRecord): JsonRecord | null {
  for (const value of [root.selectedItemSummary, root.selected, root.currentItem, root.nextItem]) {
    if (isJsonRecord(value)) return value;
  }
  for (const parent of [root.selection, root.playback]) {
    if (!isJsonRecord(parent)) continue;
    for (const value of [parent.selectedItemSummary, parent.selected, parent.currentItem, parent.nextItem]) {
      if (isJsonRecord(value)) return value;
    }
  }
  return null;
}

function mapSelectedItem(item: JsonRecord, sourcePath: string, status: DemoPlaybackStatusReadResult['status']): DemoPlaybackSelectedItem {
  const fileName = firstString(item.fileName, item.filename, item.displayName, item.name, item.title, item.file);
  const relativePath = firstString(item.relativePath, item.mediaRelativePath, item.path, item.filePath, item.sourcePath, item.url, fileName);
  const id = firstString(item.mediaAssetId, item.id, item.queueId, item.assetId, relativePath, fileName) ?? 'selected-playback-item';
  return {
    id,
    fileName: fileName ?? basename(relativePath ?? id),
    relativePath: relativePath ?? fileName ?? id,
    type: normalizeMediaType(firstString(item.mediaKind, item.mediaType, item.type, item.kind, item.fileExtension, relativePath, fileName)),
    address: firstString(item.address, item.resolvedAddress, item.overlayText, item.location, item.displayAddress) ?? '',
    status: firstString(item.status, item.state) ?? status,
    durationSeconds: firstNumber(item.durationSeconds, item.displayDurationSeconds, item.imageDurationSeconds),
    source: sourcePath
  };
}

function waiting(sourcePath: string, messages: string[]): DemoPlaybackStatusReadResult {
  return { selectedItem: null, status: 'waiting', messages, sourcePath };
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

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

function normalizeStatus(value: string | null): DemoPlaybackStatusReadResult['status'] {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('fail') || normalized.includes('error')) return 'failed';
  if (normalized.includes('skip') || normalized.includes('no_ready') || normalized.includes('no_playable')) return 'skipped';
  if (normalized.includes('select') || normalized.includes('success') || normalized.includes('succeed') || normalized === 'ok') return 'selected';
  if (!normalized) return 'waiting';
  return 'unknown';
}

function normalizeMediaType(value: string | null): DemoPlaybackSelectedItem['type'] {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('video') || /\.(mp4|mov|webm|mkv|avi)$/i.test(normalized)) return 'video';
  if (normalized.includes('image') || /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(normalized)) return 'image';
  return 'unknown';
}

function basename(value: string): string {
  return value.split(/[\\/]/).filter(Boolean).pop() ?? value;
}
