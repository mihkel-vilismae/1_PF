/** Proofrunner handoff runtime helpers for final stats/output-root contracts. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') { current += '"'; i += 1; continue; }
      if (char === '"') { quoted = false; continue; }
      current += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === ',') { cells.push(current); current = ''; continue; }
    current += char;
  }
  cells.push(current);
  return cells;
}

export function parseDelimitedRows(text, format = 'auto') {
  const normalized = String(text ?? '').replace(/^\uFEFF/, '');
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];
  const resolvedFormat = format === 'auto' ? (lines[0].includes('\t') ? 'tsv' : 'csv') : format;
  const split = resolvedFormat === 'tsv' ? (line) => line.split('\t') : parseCsvLine;
  const header = split(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((value, index) => [header[index] ?? `column_${index}`, value])));
}

export function parseJsonLines(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildLastRunStats({
  project = 'PF_login', version, head, runId, platformRunner, startedAt, endedAt,
  passedExitZero, failedExitNonzero, discovered, summaryRows = [], timingRows = [],
  summaryFile, timingHistoryFile = 'logs/proof_timing_history.jsonl', queuePlanFile = 'logs/proof_queue_plan.json',
}) {
  const proofTimings = timingRows.filter((row) => row?.category === 'proof' && Number.isFinite(Number(row.duration_seconds)));
  const durations = proofTimings.map((row) => Number(row.duration_seconds));
  const started = parseDate(startedAt);
  const ended = parseDate(endedAt);
  const wallDuration = started && ended ? Math.max(0, Math.round((ended.getTime() - started.getTime()) / 1000)) : null;
  const totalProofSeconds = durations.reduce((sum, value) => sum + value, 0);
  return {
    project,
    version,
    head,
    run_id: runId,
    platform_runner: platformRunner,
    started_at: startedAt,
    ended_at: endedAt,
    wall_duration_seconds: wallDuration,
    proof_scripts_discovered: Number(discovered),
    proof_scripts_passed_exit_zero: Number(passedExitZero),
    proof_scripts_failed_exit_nonzero: Number(failedExitNonzero),
    summary_file: summaryFile,
    timing_history_file: timingHistoryFile,
    queue_plan_file: queuePlanFile,
    duration_stats: {
      proof_count_with_duration: durations.length,
      total_proof_seconds: totalProofSeconds,
      average_proof_seconds: durations.length ? Number((totalProofSeconds / durations.length).toFixed(3)) : null,
      median_proof_seconds: median(durations),
      max_proof_seconds: durations.length ? Math.max(...durations) : null,
      min_proof_seconds: durations.length ? Math.min(...durations) : null,
    },
    per_command: timingRows,
    summary_rows: summaryRows,
    eta_seed: {
      source: 'last_run_stats.json',
      recommended_use: 'Use per_command proof durations by command name for future remaining-time estimation.',
    },
  };
}

export async function buildLastRunStatsFromFiles(options) {
  const summaryText = await readFile(options.summaryPath, 'utf8').catch(() => '');
  const timingText = await readFile(options.timingPath, 'utf8').catch(() => '');
  const summaryRows = parseDelimitedRows(summaryText, options.summaryFormat ?? 'auto');
  const timingRows = parseJsonLines(timingText);
  return buildLastRunStats({ ...options, summaryRows, timingRows });
}

export async function writeLastRunStats(options) {
  const stats = await buildLastRunStatsFromFiles(options);
  await writeFile(options.outPath, `${JSON.stringify(stats, null, 2)}\n`, 'utf8');
  return stats;
}

export function resolveProofResultsZipPath({ handoffRoot, platformRunner, version, runId }) {
  const root = String(handoffRoot ?? '').replace(/[\\/]+$/, '');
  if (!root) throw new Error('handoffRoot is required');
  const separator = root.includes('\\') ? '\\' : '/';
  const parent = root.split(/[\\/]/).slice(0, -1).join(separator) || root;
  const suffix = platformRunner === 'windows_powershell' ? 'win' : 'raspberryos';
  return `${parent}${separator}PF_login_v${version}_${suffix}_proof_results_${runId}.zip`;
}

export function analyzeLauncherRuntimeContract({ bashSource = '', powershellSource = '' }) {
  const bash = String(bashSource);
  const ps = String(powershellSource);
  const checks = [
    {
      name: 'bash_uses_node_stats_builder_not_inline_python',
      passed: bash.includes('tools/build-proofrunner-last-run-stats.mjs') && !bash.includes('PY_LAST_STATS') && !/rstrip\('\s*$/.test(bash),
      detail: 'Raspberry launcher must call repo-owned Node stats builder and avoid escape-sensitive inline Python string literals.',
    },
    {
      name: 'bash_outputs_to_extract_root_parent',
      passed: /OUTPUT_ROOT=.*dirname/.test(bash) && /EVIDENCE_ZIP=.*OUTPUT_ROOT/.test(bash),
      detail: 'Raspberry proof-results ZIP should be written to the parent extraction root, not inside the handoff folder.',
    },
    {
      name: 'powershell_uses_node_stats_builder',
      passed: ps.includes('tools\\build-proofrunner-last-run-stats.mjs') || ps.includes('tools/build-proofrunner-last-run-stats.mjs'),
      detail: 'Windows launcher should use the same repo-owned stats builder.',
    },
    {
      name: 'powershell_outputs_to_extract_root_parent',
      passed: /\$OutputRoot\s*=\s*Split-Path\s+-Parent\s+\$RootDir/.test(ps) && /\$EvidenceZip\s*=\s*Join-Path\s+\$OutputRoot/.test(ps),
      detail: 'Windows proof-results ZIP should be written to the parent extraction root, not inside the handoff folder.',
    },
  ];
  return { checks, passed: checks.every((check) => check.passed) };
}

export function readTextIfExists(path) {
  try { return readFileSync(path, 'utf8'); } catch { return ''; }
}

export function ensureParentDir(path) {
  mkdirSync(dirname(path), { recursive: true });
}
