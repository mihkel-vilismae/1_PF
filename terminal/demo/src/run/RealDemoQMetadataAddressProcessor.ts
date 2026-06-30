// Runs real DEMO metadata/GPS and reverse-geocode stages for manual Q.
// This uses existing sqlite_admin stage3/stage4 helpers; it does not invent GPS/address data.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';

export interface QMetadataAddressResult {
  status: 'passed' | 'blocked' | 'failed';
  gpsProcessed: number;
  gpsSuccess: number;
  gpsFailure: number;
  geocodeProcessed: number;
  geocodeSuccess: number;
  geocodeFailure: number;
  addressTextRows: number;
  providerNames: string[];
  messages: string[];
}

const sqliteAdminRelativePath = path.join('server', 'scripts', 'sqlite_admin.py');
const schemaRelativePath = path.join('database', 'schema.sql');

export function runQMetadataAddressStages(input: { boundary: RuntimeBoundaryState; executedAt: string }): QMetadataAddressResult {
  const codeRoot = process.cwd();
  const schemaPath = path.join(codeRoot, schemaRelativePath);
  const gps = runPythonJson(codeRoot, [path.join(codeRoot, sqliteAdminRelativePath), 'stage3_process_gps_queue', input.boundary.dbPath, input.executedAt, schemaPath]);
  if (gps.status !== 'ok') return failed(`stage3_process_gps_queue failed: ${gps.message}`, gps.attempts);

  const geocode = runPythonJson(codeRoot, [path.join(codeRoot, sqliteAdminRelativePath), 'stage4_process_geocode_queue', input.boundary.dbPath, input.executedAt, schemaPath]);
  if (geocode.status !== 'ok') return failed(`stage4_process_geocode_queue failed: ${geocode.message}`, geocode.attempts);

  const inspect = runPythonJson(codeRoot, ['-c', inspectAddressSql(), input.boundary.dbPath]);
  if (inspect.status !== 'ok') return failed(`address inspection failed: ${inspect.message}`, inspect.attempts);

  const gpsOut = gps.output as Record<string, unknown>;
  const geocodeOut = geocode.output as Record<string, unknown>;
  const inspected = inspect.output as Record<string, unknown>;
  const providers = stringList(inspected.providerNames);
  const addressRows = numberValue(inspected.addressTextRows);
  const gpsSuccess = numberValue(gpsOut.successCount);
  const geocodeSuccess = numberValue(geocodeOut.successCount);
  const status = gpsSuccess > 0 && geocodeSuccess > 0 && addressRows > 0 ? 'passed' : 'blocked';
  return {
    status,
    gpsProcessed: numberValue(gpsOut.processedCount),
    gpsSuccess,
    gpsFailure: numberValue(gpsOut.failureCount),
    geocodeProcessed: numberValue(geocodeOut.processedCount),
    geocodeSuccess,
    geocodeFailure: numberValue(geocodeOut.failureCount),
    addressTextRows: addressRows,
    providerNames: providers,
    messages: [
      `Metadata GPS stage: processed=${numberValue(gpsOut.processedCount)} success=${gpsSuccess} failed_or_missing=${numberValue(gpsOut.failureCount)}`,
      `Geocode provider stage: processed=${numberValue(geocodeOut.processedCount)} success=${geocodeSuccess} failed=${numberValue(geocodeOut.failureCount)}`,
      `Address rows with address_text: ${addressRows}`,
      `Geocode providers observed: ${providers.join(', ') || 'none'}`,
      status === 'passed' ? 'address_text was written by the configured provider chain.' : 'address_text not available yet; provider/GPS result is BLOCKED or degraded, not faked.'
    ]
  };
}

function failed(message: string, attempts: string[]): QMetadataAddressResult {
  return { status: 'failed', gpsProcessed: 0, gpsSuccess: 0, gpsFailure: 0, geocodeProcessed: 0, geocodeSuccess: 0, geocodeFailure: 0, addressTextRows: 0, providerNames: [], messages: [message, ...attempts] };
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

function numberValue(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function stringList(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }

function inspectAddressSql(): string {
  return String.raw`
import json, sqlite3, sys
conn = sqlite3.connect(sys.argv[1])
conn.row_factory = sqlite3.Row
cur = conn.cursor()
providers = [row['geocode_provider'] for row in cur.execute("SELECT DISTINCT geocode_provider FROM geocode_queue WHERE geocode_provider IS NOT NULL ORDER BY geocode_provider")]
address_rows = cur.execute("SELECT COUNT(*) AS count FROM canonical_media_assets WHERE address_text IS NOT NULL AND address_text <> ''").fetchone()['count']
print(json.dumps({'providerNames': providers, 'addressTextRows': int(address_rows)}))
conn.close()
`;
}
