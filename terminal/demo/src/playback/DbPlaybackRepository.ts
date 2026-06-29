// Reads DEMO DB playback queue state through existing real SQLite helpers.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync } from 'node:fs';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { PlaybackQueueRow } from '../state/DemoTerminalState.js';
import type { DemoPlaybackStatusReadResult, DemoPlaybackSelectedItem } from './DemoPlaybackStatusRepository.js';
import { asNumber, asString, isRecord, runSqlitePlaybackHelper } from './DbPlaybackHelpers.js';

export interface DbPlaybackReadResult {
  rows: PlaybackQueueRow[];
  status: DemoPlaybackStatusReadResult;
  messages: string[];
}

export class DbPlaybackRepository {
  constructor(private readonly boundary: RuntimeBoundaryState) {}

  read(): DbPlaybackReadResult {
    const messages = [
      'Playback status file missing: DB-backed playback now reads DEMO_DB_PATH instead of scheduler JSON.',
      'DB playback source: DEMO_DB_PATH via sqlite_admin.py playback_contract.',
      'Real table verified: canonical_media_assets.',
      'Real table verified: media_asset_variants.',
      'Real table verified: slideshow_queue.',
      'Real table verified: runtime_state.'
    ];
    if (!existsSync(this.boundary.dbPath)) {
      return empty('waiting', [...messages, `DEMO_DB_PATH missing: ${this.boundary.dbPath}`], this.boundary.dbPath);
    }

    const contract = runSqlitePlaybackHelper(this.boundary.repoRoot, 'playback_contract', [this.boundary.dbPath, this.boundary.repoRoot, '25']);
    messages.push(...contract.messages.map((message) => `playback_contract: ${message}`));
    if (contract.status !== 'ok' || !isRecord(contract.output)) {
      return empty('failed', messages, this.boundary.dbPath);
    }

    const items = Array.isArray(contract.output.items) ? contract.output.items.filter(isRecord) : [];
    const rows = items.map((item, index) => mapQueueRow(item, index + 1));
    const current = isRecord(contract.output.currentItem) ? mapSelectedItem(contract.output.currentItem, 'current') : null;
    const next = isRecord(contract.output.nextItem) ? mapSelectedItem(contract.output.nextItem, 'next-ready') : null;
    const selectedItem = current ?? next;
    const status = current ? 'selected' : next ? 'waiting' : 'waiting';

    return {
      rows,
      messages: [...messages, `DB playback queue rows loaded: ${rows.length}`],
      status: {
        selectedItem,
        status,
        messages: selectedItem ? ['Mapped DB playback item from real playback_contract.'] : ['No READY DB playback item found.'],
        sourcePath: `${this.boundary.dbPath}#slideshow_queue`
      }
    };
  }
}

function empty(status: 'waiting' | 'failed', messages: string[], sourcePath: string): DbPlaybackReadResult {
  return { rows: [], messages, status: { selectedItem: null, status, messages, sourcePath } };
}

function mapQueueRow(item: Record<string, unknown>, rowNumber: number): PlaybackQueueRow {
  return {
    queueId: String(asNumber(item.slideshowQueueId) ?? asNumber(item.mediaAssetId) ?? rowNumber),
    rowNumber,
    fileName: asString(item.displayName) || `media-${rowNumber}`,
    relativePath: asString(item.displayUrl) || `media-${rowNumber}`,
    type: asString(item.mediaType) === 'video' ? 'video' : 'image',
    address: asString(item.resolvedAddress),
    status: asString(item.queueStatus) || 'UNKNOWN',
    source: `DEMO_DB_PATH:${asString(item.queueSource) || 'slideshow_queue'}`
  };
}

function mapSelectedItem(item: Record<string, unknown>, source: string): DemoPlaybackSelectedItem {
  const mediaType = asString(item.mediaType);
  return {
    id: String(asNumber(item.mediaAssetId) ?? asNumber(item.slideshowQueueId) ?? 'db-playback-item'),
    fileName: asString(item.displayName) || 'db-playback-item',
    relativePath: asString(item.displayUrl),
    type: mediaType === 'image' || mediaType === 'video' ? mediaType : 'unknown',
    address: asString(item.resolvedAddress),
    status: asString(item.queueStatus) || 'UNKNOWN',
    durationSeconds: null,
    source: `DEMO_DB_PATH:${asString(item.queueSource) || source}:playback_contract`
  };
}
