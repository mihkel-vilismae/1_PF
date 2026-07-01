// Executes start_stage_modal DB effects through the same sqlite stage helpers used by the worker path.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { PlannedManifestRow } from '../orchestration/DemoBatchManifestPlan.js';
import type { DemoStageIntent } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { ManualStageBatchSize } from '../startStageModal/StartStageModalState.js';

export interface ManualStageDbEffectResult {
  status: 'passed' | 'blocked' | 'failed';
  stage: DemoStageIntent;
  batchSize: ManualStageBatchSize;
  selectedRows: number;
  dbPath: string;
  operation: string;
  counts: Record<string, number>;
  messages: string[];
}

const sqliteAdminRelativePath = path.join('server', 'scripts', 'sqlite_admin.py');
const schemaRelativePath = path.join('database', 'schema.sql');

export function executeManualStageDbEffect(input: {
  boundary: RuntimeBoundaryState;
  stage: DemoStageIntent;
  batchSize: ManualStageBatchSize;
  rows: PlannedManifestRow[];
  executedAt: string;
}): ManualStageDbEffectResult {
  if (input.boundary.readinessStatus === 'blocked') return base(input, 'blocked', 'path_safety_blocked', {}, ['blocked: DEMO runtime path safety did not pass.']);
  const args = argsForStage(input);
  const result = runPythonJson(input.boundary.repoRoot, args);
  if (result.status !== 'ok') return base(input, 'failed', args[1] ?? input.stage, {}, [`${input.stage} DB effect failed: ${result.message}`, ...result.attempts]);

  const payload = result.output as Record<string, unknown>;
  const counts = countsForStage(input.stage, payload);
  const status = statusForStage(input.stage, counts);
  return base(input, status, args[1] ?? input.stage, counts, [
    `manual DB effect stage=${input.stage} status=${status}`,
    `sqlite helper=${args[1] ?? 'unknown'} db=${input.boundary.dbPath}`,
    `batch_size=${input.batchSize} selected_rows=${input.rows.length}`,
    ...Object.entries(counts).map(([key, value]) => `${key}=${value}`)
  ]);
}

function argsForStage(input: { boundary: RuntimeBoundaryState; stage: DemoStageIntent; executedAt: string }): string[] {
  const script = path.join(input.boundary.repoRoot, sqliteAdminRelativePath);
  const schema = path.join(input.boundary.repoRoot, schemaRelativePath);
  switch (input.stage) {
    case 'index':
      return [script, 'stage2_index_register', input.boundary.dbPath, input.boundary.downloadDir, input.executedAt, schema];
    case 'gps':
      return [script, 'stage3_process_gps_queue', input.boundary.dbPath, input.executedAt, schema];
    case 'geocode':
      return [script, 'stage4_process_geocode_queue', input.boundary.dbPath, input.executedAt, schema];
    case 'queue_prepare':
      return [script, 'stage5_prepare_queue', input.boundary.dbPath, input.executedAt, schema];
  }
}

function base(
  input: { boundary: RuntimeBoundaryState; stage: DemoStageIntent; batchSize: ManualStageBatchSize; rows: PlannedManifestRow[] },
  status: ManualStageDbEffectResult['status'],
  operation: string,
  counts: Record<string, number>,
  messages: string[]
): ManualStageDbEffectResult {
  return { status, stage: input.stage, batchSize: input.batchSize, selectedRows: input.rows.length, dbPath: input.boundary.dbPath, operation, counts, messages };
}

function runPythonJson(repoRoot: string, args: string[]): { status: 'ok' | 'error'; output?: unknown; message?: string; attempts: string[] } {
  const attempts: string[] = [];
  for (const command of ['python3', 'py', 'python']) {
    const finalArgs = command === 'py' ? ['-3', ...args] : args;
    const result = spawnSync(command, finalArgs, { cwd: repoRoot, encoding: 'utf8', timeout: 45000, env: safeStageEnv() });
    attempts.push(`${command} ${finalArgs.slice(0, 3).join(' ')} => ${result.status ?? 'null'}`);
    if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') continue;
    if (result.status !== 0) return { status: 'error', message: result.stderr || result.stdout || String(result.error), attempts };
    try { return { status: 'ok', output: JSON.parse(result.stdout), attempts }; }
    catch { return { status: 'error', message: `non-JSON Python output: ${result.stdout}`, attempts }; }
  }
  return { status: 'error', message: 'No Python command available.', attempts };
}

function safeStageEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PF_RUNTIME_MODE: 'demo',
    RUNTIME_MODE: 'demo',
    GEOCODE_ALLOW_NETWORK_PROVIDERS: '0',
    GEOCODE_NETWORK_PROVIDERS_ENABLED: '0',
    GEOCODE_PROVIDER_ORDER: 'deterministic_placeholder'
  };
}

function countsForStage(stage: DemoStageIntent, payload: Record<string, unknown>): Record<string, number> {
  if (stage === 'index') return pickCounts(payload, ['scannedMediaCount', 'insertedCanonicalCount', 'updatedCanonicalCount', 'insertedVariantCount', 'insertedGpsQueueCount']);
  if (stage === 'gps') return pickCounts(payload, ['processedCount', 'successCount', 'failureCount', 'insertedGeocodeQueueCount']);
  if (stage === 'geocode') return pickCounts(payload, ['processedCount', 'successCount', 'failureCount']);
  return pickCounts(payload, ['insertedCount', 'skippedCount']);
}

function statusForStage(stage: DemoStageIntent, counts: Record<string, number>): ManualStageDbEffectResult['status'] {
  if (stage === 'index') return counts.scannedMediaCount > 0 ? 'passed' : 'blocked';
  if (stage === 'queue_prepare') return counts.insertedCount > 0 || counts.skippedCount > 0 ? 'passed' : 'blocked';
  return counts.processedCount > 0 ? 'passed' : 'blocked';
}

function pickCounts(payload: Record<string, unknown>, keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, numberValue(payload[key])]));
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
