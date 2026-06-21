#!/usr/bin/env node
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { buildLastRunStatsFromFiles, resolveProofResultsZipPath, analyzeLauncherRuntimeContract } from './proofrunner-handoff-runtime-lib.mjs';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const temp = await mkdtemp(join(tmpdir(), 'pf-proofrunner-handoff-runtime-'));
const tsv = join(temp, 'proof_summary.tsv');
const csv = join(temp, 'proof_summary.csv');
const timing = join(temp, 'proof_timing_history.jsonl');
await writeFile(tsv, 'name\tstatus\texit_code\tlog_file\nproof:a\tPASS\t0\t/tmp/a.log\nproof:b\tFAIL\t1\t/tmp/b.log\n', 'utf8');
await writeFile(csv, 'name,status,exit_code,log_file\n"proof:a","PASS","0","C:\\tmp\\a.log"\n"proof:b","FAIL","1","C:\\tmp\\b.log"\n', 'utf8');
await writeFile(timing, '{"command":"proof:a","category":"proof","duration_seconds":2,"exit_code":0}\n{"command":"proof:b","category":"proof","duration_seconds":4,"exit_code":1}\n', 'utf8');
const common = { timingPath: timing, version: '0.9.7', head: 'abcd123', runId: '20260621_170000', startedAt: '2026-06-21T17:00:00+03:00', endedAt: '2026-06-21T17:00:06+03:00', passedExitZero: 1, failedExitNonzero: 1, discovered: 2 };
const tsvStats = await buildLastRunStatsFromFiles({ ...common, summaryPath: tsv, platformRunner: 'raspberryos_bash', summaryFile: 'logs/proof_summary.tsv' });
const csvStats = await buildLastRunStatsFromFiles({ ...common, summaryPath: csv, platformRunner: 'windows_powershell', summaryFile: 'logs/proof_summary.csv' });
const bashExample = 'OUTPUT_ROOT="$(dirname "$ROOT_DIR")"\nnode "$REPO_ROOT/tools/build-proofrunner-last-run-stats.mjs"\nEVIDENCE_ZIP="$OUTPUT_ROOT/PF_login_v${EXPECTED_VERSION}_raspberryos_proof_results_${RUN_ID}.zip"';
const psExample = '$OutputRoot = Split-Path -Parent $RootDir\n$StatsBuilder = Join-Path $RepoRoot \'tools\\build-proofrunner-last-run-stats.mjs\'\n$EvidenceZip = Join-Path $OutputRoot "PF_login_v${ExpectedVersion}_win_proof_results_${RunId}.zip"';
const launcherContract = analyzeLauncherRuntimeContract({ bashSource: bashExample, powershellSource: psExample });
const checks = [
  { name: 'tsv_stats_rows_preserved', passed: tsvStats.summary_rows.length === 2 && tsvStats.summary_rows[1].status === 'FAIL', detail: tsvStats.summary_rows },
  { name: 'csv_stats_rows_preserved', passed: csvStats.summary_rows.length === 2 && csvStats.summary_rows[0].log_file === 'C:\\tmp\\a.log', detail: csvStats.summary_rows },
  { name: 'duration_stats_present', passed: tsvStats.duration_stats.average_proof_seconds === 3 && tsvStats.wall_duration_seconds === 6, detail: tsvStats.duration_stats },
  { name: 'raspberry_output_path_parent_extract_root', passed: resolveProofResultsZipPath({ handoffRoot: '/home/mihkel/_0123_PF/PF_login_v0.9.7_handoff', platformRunner: 'raspberryos_bash', version: '0.9.7', runId: 'RUN' }) === '/home/mihkel/_0123_PF/PF_login_v0.9.7_raspberryos_proof_results_RUN.zip', detail: 'parent extraction root path' },
  { name: 'windows_output_path_parent_extract_root', passed: resolveProofResultsZipPath({ handoffRoot: 'F:\\CODEX-F-FORMAT\\PhotoFrame\\PF_login_v0.9.7_handoff', platformRunner: 'windows_powershell', version: '0.9.7', runId: 'RUN' }) === 'F:\\CODEX-F-FORMAT\\PhotoFrame\\PF_login_v0.9.7_win_proof_results_RUN.zip', detail: 'parent extraction root path' },
  ...launcherContract.checks,
];
const meta = await metadata();
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_handoff_runtime_contract',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus,
  runtimeMode: 'local_proofrunner_handoff_runtime_contract',
  evidence: { checks },
  knownLimitations: ['This validates the handoff runtime helpers and launcher contract patterns; it does not execute the full generated handoff launcher.'],
});
const outputPath = await writeProofArtifact('proofrunner_handoff_runtime_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
