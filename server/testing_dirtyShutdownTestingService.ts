/*
 * Provides a guarded dirty-shutdown testing planner for View C.
 * It is intentionally conservative and does not terminate OS processes.
 * Process targeting is scoped to app-owned records instead of names.
 * The service supports deterministic proofs without touching live workers.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type DirtyShutdownProcessRecord = {
  pid?: unknown;
  worker?: unknown;
  workerName?: unknown;
  processName?: unknown;
  appOwned?: unknown;
  owner?: unknown;
  role?: unknown;
  sourcePath?: string;
  [key: string]: unknown;
};

export type DirtyShutdownTestingMode = 'plan' | 'simulate';

export type DirtyShutdownTestingOptions = {
  mode: DirtyShutdownTestingMode;
  envValues?: Record<string, string | undefined>;
  runtimeMode?: 'real' | 'test' | string;
  records?: DirtyShutdownProcessRecord[];
  processRecordsDir?: string;
  nowIso?: string;
};

const ENABLE_FLAG = 'PF_ENABLE_DIRTY_SHUTDOWN_TESTING';
const GENERIC_PROCESS_NAMES = new Set([
  'node',
  'node.exe',
  'python',
  'python.exe',
  'powershell',
  'powershell.exe',
  'pwsh',
  'pwsh.exe',
  'icloudpd',
  'icloudpd.exe',
  'chrome',
  'chrome.exe',
  'msedge',
  'msedge.exe',
  'firefox',
  'firefox.exe',
]);

/** Builds a non-destructive dirty-shutdown plan or guarded simulation result. */
export async function buildDirtyShutdownTestingResult(options: DirtyShutdownTestingOptions) {
  const envValues = options.envValues ?? {};
  const runtimeMode = options.runtimeMode === 'test' ? 'test' : 'real';
  const enabled = String(envValues[ENABLE_FLAG] ?? '').trim().toLowerCase() === 'true';
  const mode = options.mode === 'simulate' ? 'simulate' : 'plan';
  const records = options.records ?? await readProcessRecords(options.processRecordsDir);
  const classified = classifyProcessRecords(records);
  const blocked = mode === 'simulate' && (!enabled || runtimeMode !== 'test');
  return {
    status: blocked ? 'blocked' : 'ok',
    mode,
    runtimeMode,
    enabled,
    requiredEnvFlag: ENABLE_FLAG,
    destructiveActionAttempted: false,
    backendSelfKillIncluded: false,
    processNameMatchingUsed: false,
    generatedAt: options.nowIso ?? new Date().toISOString(),
    message: buildDirtyShutdownMessage({ mode, enabled, runtimeMode, blocked }),
    targetedProcessRecords: blocked ? [] : classified.targeted,
    skippedProcessRecords: classified.skipped,
    actions: blocked
      ? ['blocked_before_any_process_action']
      : classified.targeted.map((record) => ({
          action: mode === 'simulate' ? 'would_signal_owned_worker_first_version_no_kill' : 'would_target_owned_worker',
          pid: record.pid,
          worker: record.worker,
          reason: 'owned worker record accepted; first safe version does not terminate OS processes',
        })),
    limitations: [
      'First safe version does not terminate backend or OS processes.',
      'Only app-owned process records are considered.',
      'This is a software dirty-shutdown testing scaffold, not Raspberry hardware power-loss proof.',
    ],
  };
}

/** Classifies process records into accepted app-owned records and skipped unsafe records. */
export function classifyProcessRecords(records: DirtyShutdownProcessRecord[]) {
  const targeted = [];
  const skipped = [];
  for (const record of records) {
    const normalized = normalizeProcessRecord(record);
    const skipReason = getProcessRecordSkipReason(normalized);
    if (skipReason) {
      skipped.push({ ...normalized, skipReason });
      continue;
    }
    targeted.push(normalized);
  }
  return { targeted, skipped };
}

/** Normalizes loose JSON records into proof-safe process metadata. */
function normalizeProcessRecord(record: DirtyShutdownProcessRecord) {
  const pid = Number(record.pid);
  const worker = String(record.workerName ?? record.worker ?? record.role ?? '').trim();
  const processName = String(record.processName ?? '').trim();
  return {
    pid: Number.isFinite(pid) && pid > 0 ? pid : null,
    worker,
    processName,
    appOwned: record.appOwned === true || record.owner === 'PF_login' || record.owner === 'pf_login',
    sourcePath: record.sourcePath ?? null,
  };
}

/** Returns the first safety reason that prevents a record from being targeted. */
function getProcessRecordSkipReason(record: ReturnType<typeof normalizeProcessRecord>): string | null {
  if (!record.appOwned) return 'not_app_owned';
  if (!record.pid) return 'missing_or_invalid_pid';
  if (!record.worker) return 'missing_worker_identity';
  if (record.worker.toLowerCase() === 'backend') return 'backend_self_kill_blocked';
  if (record.processName && GENERIC_PROCESS_NAMES.has(record.processName.toLowerCase())) return 'generic_process_name_rejected';
  return null;
}

/** Reads app-owned process records from a local process registry directory when present. */
async function readProcessRecords(processRecordsDir?: string): Promise<DirtyShutdownProcessRecord[]> {
  if (!processRecordsDir) return [];
  let entries: string[];
  try {
    entries = await fs.readdir(processRecordsDir);
  } catch {
    return [];
  }
  const records: DirtyShutdownProcessRecord[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const sourcePath = path.join(processRecordsDir, entry);
    try {
      const parsed = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        records.push({ ...(parsed as DirtyShutdownProcessRecord), sourcePath });
      }
    } catch {
      records.push({ sourcePath, appOwned: false, worker: '', processName: '', pid: null, parseError: true });
    }
  }
  return records;
}

/** Builds the user-facing route message while keeping destructive actions blocked. */
function buildDirtyShutdownMessage({ mode, enabled, runtimeMode, blocked }: { mode: string; enabled: boolean; runtimeMode: string; blocked: boolean }) {
  if (mode === 'plan') return 'Dirty-shutdown test plan generated without killing processes.';
  if (blocked && runtimeMode !== 'test') return 'Dirty-shutdown simulation is blocked outside Test Mode.';
  if (blocked && !enabled) return `Dirty-shutdown simulation is blocked until ${ENABLE_FLAG}=true.`;
  return 'Dirty-shutdown simulation accepted in first safe version; no OS process termination was performed.';
}
