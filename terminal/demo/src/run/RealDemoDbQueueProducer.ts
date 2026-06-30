// Creates real-shape DEMO DB queue rows for manual terminal Q runs.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { PlannedManifestRow } from '../orchestration/DemoBatchManifestPlan.js';
import type { SupportedBatchSize } from './SupportedBatchSize.js';
import { runQMetadataAddressStages, type QMetadataAddressResult } from './RealDemoQMetadataAddressProcessor.js';

export interface QCreatedQueueResult {
  status: 'passed' | 'blocked' | 'failed';
  batchSize: SupportedBatchSize;
  selectedRows: number;
  insertedQueueRows: number;
  updatedQueueRows: number;
  readyQueueRows: number;
  dbPath: string;
  sourceLabel: 'q-created';
  metadataAddress: QMetadataAddressResult;
  messages: string[];
}

const sqliteAdminRelativePath = path.join('server', 'scripts', 'sqlite_admin.py');
const schemaRelativePath = path.join('database', 'schema.sql');

export function createQDemoDbQueueRows(input: {
  boundary: RuntimeBoundaryState;
  rows: PlannedManifestRow[];
  batchSize: SupportedBatchSize;
  executedAt?: string;
}): QCreatedQueueResult {
  const rows = input.rows.slice(0, input.batchSize === 1 ? 1 : 5);
  const base = baseResult(input, rows.length);
  if (rows.length === 0) return { ...base, status: 'blocked', messages: ['blocked: no selected DEMO media rows for Q DB queue creation'] };

  const pathSafety = verifySelectedRows(input.boundary.downloadDir, rows);
  if (!pathSafety.safe) return { ...base, status: 'blocked', messages: [pathSafety.reason] };

  mkdirSync(path.dirname(input.boundary.dbPath), { recursive: true });
  const codeRoot = process.cwd();
  const executedAt = input.executedAt ?? new Date().toISOString();
  const stage2 = runPythonJson(codeRoot, [
    path.join(codeRoot, sqliteAdminRelativePath),
    'stage2_index_register',
    input.boundary.dbPath,
    input.boundary.downloadDir,
    executedAt,
    path.join(codeRoot, schemaRelativePath)
  ]);
  if (stage2.status !== 'ok') {
    return { ...base, status: 'failed', messages: [`stage2_index_register failed: ${stage2.message}`, ...stage2.attempts] };
  }

  const metadataAddress = runQMetadataAddressStages({ boundary: input.boundary, executedAt });
  const queue = runPythonJson(codeRoot, ['-c', buildQueueSql(), input.boundary.dbPath, input.boundary.downloadDir, JSON.stringify(rows), executedAt]);
  if (queue.status !== 'ok') return { ...base, status: 'failed', messages: [`q-created queue SQL failed: ${queue.message}`, ...queue.attempts] };

  const output = queue.output as Record<string, unknown>;
  return {
    ...base,
    status: 'passed',
    insertedQueueRows: numberValue(output.insertedQueueRows),
    updatedQueueRows: numberValue(output.updatedQueueRows),
    readyQueueRows: numberValue(output.readyQueueRows),
    metadataAddress,
    messages: [
      'Q-created DEMO DB queue source: DEMO_DB_PATH + real slideshow_queue tables.',
      `Q-created selected rows: ${rows.map((row) => `#${row.rowNumber} ${row.relativePath}`).join(' | ')}`,
      `stage2 scanned=${numberValue((stage2.output as Record<string, unknown>).scannedMediaCount)} inserted_assets=${numberValue((stage2.output as Record<string, unknown>).insertedCanonicalCount)} updated_assets=${numberValue((stage2.output as Record<string, unknown>).updatedCanonicalCount)}`,
      `Q-created slideshow_queue rows: inserted=${numberValue(output.insertedQueueRows)} updated=${numberValue(output.updatedQueueRows)} ready=${numberValue(output.readyQueueRows)}`,
      ...metadataAddress.messages,
      'Queue row source label: q-created',
      'No cron was used by Q DB queue creation.',
      'No JSON queue file was used as source of truth.'
    ]
  };
}

function baseResult(input: { boundary: RuntimeBoundaryState; batchSize: SupportedBatchSize }, selectedRows: number): QCreatedQueueResult {
  return {
    status: 'blocked',
    batchSize: input.batchSize,
    selectedRows,
    insertedQueueRows: 0,
    updatedQueueRows: 0,
    readyQueueRows: 0,
    dbPath: input.boundary.dbPath,
    sourceLabel: 'q-created',
    metadataAddress: { status: 'blocked', gpsProcessed: 0, gpsSuccess: 0, gpsFailure: 0, geocodeProcessed: 0, geocodeSuccess: 0, geocodeFailure: 0, addressTextRows: 0, providerNames: [], messages: [] },
    messages: []
  };
}

function verifySelectedRows(downloadDir: string, rows: PlannedManifestRow[]): { safe: boolean; reason: string } {
  const root = path.resolve(downloadDir);
  for (const row of rows) {
    if (path.isAbsolute(row.relativePath) || row.relativePath.includes('..')) {
      return { safe: false, reason: `blocked: unsafe Q row relative path: ${row.relativePath}` };
    }
    const resolved = path.resolve(root, row.relativePath);
    if (!(resolved === root || resolved.startsWith(root + path.sep))) {
      return { safe: false, reason: `blocked: Q row escapes DEMO_DOWNLOAD_DIR: ${row.relativePath}` };
    }
    if (!existsSync(resolved)) return { safe: false, reason: `blocked: selected DEMO media file missing: ${resolved}` };
  }
  return { safe: true, reason: 'selected rows are under DEMO_DOWNLOAD_DIR' };
}

function runPythonJson(repoRoot: string, args: string[]): { status: 'ok' | 'error'; output?: unknown; message?: string; attempts: string[] } {
  const attempts: string[] = [];
  for (const command of ['python3', 'py', 'python']) {
    const finalArgs = command === 'py' ? ['-3', ...args] : args;
    const result = spawnSync(command, finalArgs, { cwd: repoRoot, encoding: 'utf8', timeout: 120000 });
    attempts.push(`${command} ${finalArgs.slice(0, 3).join(' ')} => ${result.status ?? 'null'}`);
    if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') continue;
    if (result.status !== 0) return { status: 'error', message: result.stderr || result.stdout || String(result.error), attempts };
    try { return { status: 'ok', output: JSON.parse(result.stdout), attempts }; }
    catch { return { status: 'error', message: `non-JSON Python output: ${result.stdout}`, attempts }; }
  }
  return { status: 'error', message: 'No Python command available.', attempts };
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function buildQueueSql(): string {
  return String.raw`
import json, os, sqlite3, sys
path, download_dir, rows_json, now = sys.argv[1], os.path.abspath(sys.argv[2]), sys.argv[3], sys.argv[4]
rows = json.loads(rows_json)
conn = sqlite3.connect(path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
inserted = 0
updated = 0
selected_ids = []
for row in rows:
    rel = str(row.get('relativePath') or '').replace('\\', '/').lstrip('/')
    if rel == '' or os.path.isabs(rel) or '..' in rel.split('/'):
        raise RuntimeError('unsafe relativePath in Q row: ' + rel)
    media_path = os.path.abspath(os.path.join(download_dir, rel))
    if not (media_path == download_dir or media_path.startswith(download_dir + os.sep)):
        raise RuntimeError('Q row escapes DEMO_DOWNLOAD_DIR: ' + rel)
    asset = cur.execute('SELECT media_asset_id FROM canonical_media_assets WHERE canonical_path = ?', (media_path,)).fetchone()
    if asset is None:
        raise RuntimeError('selected Q row was not indexed into canonical_media_assets: ' + media_path)
    media_id = int(asset['media_asset_id'])
    before = conn.total_changes
    cur.execute('''
    INSERT INTO slideshow_queue (media_asset_id, status, failure_reason, sort_bucket, eligible_since, last_shown_datetime, view_count, created_at, updated_at)
    VALUES (?, 'READY', NULL, 'terminal-demo-q-created', ?, NULL, 0, ?, ?)
    ON CONFLICT(media_asset_id) DO UPDATE SET
      status = 'READY',
      failure_reason = NULL,
      sort_bucket = 'terminal-demo-q-created',
      eligible_since = excluded.eligible_since,
      last_shown_datetime = NULL,
      updated_at = excluded.updated_at
    ''', (media_id, now, now, now))
    if conn.total_changes - before == 1:
        existing = cur.execute('SELECT created_at FROM slideshow_queue WHERE media_asset_id = ?', (media_id,)).fetchone()
        if existing and str(existing['created_at']) == now:
            inserted += 1
        else:
            updated += 1
    else:
        updated += 1
    selected_ids.append(media_id)
if selected_ids:
    cur.execute('''
    INSERT INTO runtime_state (state_key, state_value, value_type, updated_at, updated_by)
    VALUES ('current_media_asset_id', ?, 'text', ?, 'terminal_demo_q_created_queue')
    ON CONFLICT(state_key) DO UPDATE SET
      state_value = excluded.state_value,
      value_type = excluded.value_type,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
    ''', (str(selected_ids[0]), now))
ready = cur.execute("SELECT COUNT(*) AS count FROM slideshow_queue WHERE status = 'READY' AND sort_bucket = 'terminal-demo-q-created'").fetchone()['count']
conn.commit()
print(json.dumps({'insertedQueueRows': inserted, 'updatedQueueRows': updated, 'readyQueueRows': int(ready), 'mediaAssetIds': selected_ids, 'sourceLabel': 'q-created'}))
conn.close()
`;
}
