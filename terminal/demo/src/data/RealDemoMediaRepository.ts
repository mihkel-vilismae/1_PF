// Provides terminal Demo Mode media rows from mock or real-demo sources.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type { DemoRuntimePaths } from '../config/runtimeTypes.js';
import type { DemoMediaDiscoveryResult, DemoMediaRepository } from './DemoMediaRepository.js';
import type { GeocodeStatus, GpsStatus, MediaRow, MediaType, QueueStatus } from '../state/DemoTerminalState.js';

const mediaExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.mov', '.mp4', '.m4v']);

interface ClassifiedFixture {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  type: MediaType;
  gps: GpsStatus;
  geocode: GeocodeStatus;
  queue: QueueStatus;
  bucket: 'valid' | 'problem';
}

export class RealDemoMediaRepository implements DemoMediaRepository {
  constructor(private readonly paths: DemoRuntimePaths) {}

  listDemoMediaRows(): DemoMediaDiscoveryResult {
    const sourceDir = this.paths.downloadDir;
    if (!existsSync(sourceDir)) {
      return {
        sourceDir,
        rows: [],
        messages: [`Generated demo media directory does not exist: ${sourceDir}`]
      };
    }

    const allFiles = discoverMediaFiles(sourceDir);
    const classified = allFiles.map((file) => classifyFixture(sourceDir, file));
    const validRows = selectFirstByPriority(classified, 'valid', [
      'gps_valid/gps_valid_01.jpg',
      'gps_valid/gps_valid_02.jpg',
      'videos_with_gps/apple_like_h264_mov_gps_tallinn.mov',
      'videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4',
      'gps_same_location/same_gps_01.jpg'
    ], 3);
    const problemRows = selectFirstByPriority(classified, 'problem', [
      'no_gps/no_gps_01.jpg',
      'invalid_gps/invalid_gps_01.jpg',
      'corrupted/corrupted_random_01.jpg',
      'corrupted/corrupted_fake_video_02.mp4',
      'mixed_batch/no_gps_01.jpg',
      'mixed_batch/invalid_gps_01.jpg'
    ], 3);

    const selected = interleaveRows(validRows, problemRows).slice(0, 6);
    const rows = selected.map((fixture, index): MediaRow => ({
      rowNumber: index + 1,
      fileName: fixture.fileName,
      relativePath: fixture.relativePath,
      type: fixture.type,
      indexed: 'no',
      gps: fixture.gps,
      geocode: fixture.geocode,
      queue: fixture.queue,
      address: ''
    }));

    const messages = [
      `Generated media source: ${sourceDir}`,
      `Discovered media files: ${allFiles.length}`,
      `Selected real-demo fixture rows: ${rows.length} (${validRows.length} valid, ${problemRows.length} problem)`,
      'v1.5.0: Q can create q-created DEMO DB slideshow_queue rows; media/truth reads and command planning remain DEMO-scoped.'
    ];
    if (validRows.length < 3) messages.push(`Warning: expected 3 valid fixtures, found ${validRows.length}.`);
    if (problemRows.length < 3) messages.push(`Warning: expected 3 problem fixtures, found ${problemRows.length}.`);

    return { sourceDir, rows, messages };
  }
}

function discoverMediaFiles(root: string): string[] {
  const output: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current).sort()) {
      const absolutePath = path.join(current, entry);
      const stat = statSync(absolutePath);
      if (stat.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (stat.isFile() && mediaExtensions.has(path.extname(entry).toLowerCase())) {
        output.push(absolutePath);
      }
    }
  }
  return output.sort((left, right) => toPosix(left).localeCompare(toPosix(right)));
}

function classifyFixture(root: string, absolutePath: string): ClassifiedFixture {
  const relativePath = toPosix(path.relative(root, absolutePath));
  const lower = relativePath.toLowerCase();
  const type = isVideo(relativePath) ? 'video' : 'image';

  if (lower.includes('/gps_valid') || lower.includes('videos_with_gps/') || lower.includes('gps_same_location/') || lower.includes('mixed_video_gps')) {
    return makeFixture(absolutePath, relativePath, type, 'valid', 'valid', 'not run', 'not queued');
  }
  if (lower.includes('/no_gps') || lower.includes('videos_no_gps/') || lower.includes('missing_gps')) {
    return makeFixture(absolutePath, relativePath, type, 'problem', 'missing', 'not run', 'not queued');
  }
  if (lower.includes('/invalid_gps') || lower.includes('corrupted/') || lower.includes('invalid_')) {
    return makeFixture(absolutePath, relativePath, type, 'problem', 'invalid', 'not run', 'not queued');
  }

  return makeFixture(absolutePath, relativePath, type, 'problem', 'not parsed', 'not run', 'not queued');
}

function makeFixture(
  absolutePath: string,
  relativePath: string,
  type: MediaType,
  bucket: 'valid' | 'problem',
  gps: GpsStatus,
  geocode: GeocodeStatus,
  queue: QueueStatus
): ClassifiedFixture {
  return {
    absolutePath,
    relativePath,
    fileName: path.basename(relativePath),
    type,
    bucket,
    gps,
    geocode,
    queue
  };
}

function selectFirstByPriority(
  fixtures: ClassifiedFixture[],
  bucket: 'valid' | 'problem',
  priorityRelativePaths: string[],
  count: number
): ClassifiedFixture[] {
  const bucketRows = fixtures.filter((fixture) => fixture.bucket === bucket);
  const selected: ClassifiedFixture[] = [];
  const used = new Set<string>();

  for (const preferred of priorityRelativePaths) {
    const match = bucketRows.find((fixture) => fixture.relativePath === preferred);
    if (match && !used.has(match.relativePath)) {
      selected.push(match);
      used.add(match.relativePath);
    }
    if (selected.length >= count) return selected;
  }

  for (const fixture of bucketRows) {
    if (!used.has(fixture.relativePath)) {
      selected.push(fixture);
      used.add(fixture.relativePath);
    }
    if (selected.length >= count) return selected;
  }

  return selected;
}

function interleaveRows(validRows: ClassifiedFixture[], problemRows: ClassifiedFixture[]): ClassifiedFixture[] {
  const output: ClassifiedFixture[] = [];
  const max = Math.max(validRows.length, problemRows.length);
  for (let index = 0; index < max; index += 1) {
    if (validRows[index]) output.push(validRows[index]!);
    if (problemRows[index]) output.push(problemRows[index]!);
  }
  return output;
}

function isVideo(value: string): boolean {
  return ['.mov', '.mp4', '.m4v'].includes(path.extname(value).toLowerCase());
}

function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}
