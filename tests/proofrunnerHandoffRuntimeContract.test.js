import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildLastRunStatsFromFiles, resolveProofResultsZipPath, analyzeLauncherRuntimeContract } from '../tools/proofrunner-handoff-runtime-lib.mjs';

test('buildLastRunStatsFromFiles parses TSV without inline Python newline hazards', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-stats-tsv-'));
  const summary = join(dir, 'proof_summary.tsv');
  const timing = join(dir, 'proof_timing_history.jsonl');
  await writeFile(summary, 'name\tstatus\texit_code\tlog_file\nproof:a\tPASS\t0\t/tmp/a.log\nproof:b\tFAIL\t1\t/tmp/b.log\n', 'utf8');
  await writeFile(timing, '{"command":"proof:a","category":"proof","duration_milliseconds":2500,"duration_seconds":2.5,"exit_code":0}\n{"command":"proof:b","category":"proof","duration_milliseconds":4750,"duration_seconds":4.75,"exit_code":1}\n', 'utf8');
  const stats = await buildLastRunStatsFromFiles({ summaryPath: summary, timingPath: timing, version: '0.9.7', head: 'abc', runId: 'run', platformRunner: 'raspberryos_bash', startedAt: '2026-06-21T17:00:00+03:00', endedAt: '2026-06-21T17:00:06+03:00', passedExitZero: 1, failedExitNonzero: 1, discovered: 2, summaryFile: 'logs/proof_summary.tsv' });
  assert.equal(stats.summary_rows.length, 2);
  assert.equal(stats.duration_stats.average_proof_milliseconds, 3625);
  assert.equal(stats.duration_stats.total_proof_milliseconds, 7250);
  assert.equal(stats.duration_stats.average_proof_seconds, 3.625);
  assert.equal(stats.wall_duration_milliseconds, 6000);
  assert.equal(stats.wall_duration_seconds, 6);
});

test('buildLastRunStatsFromFiles parses quoted Windows CSV paths', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-stats-csv-'));
  const summary = join(dir, 'proof_summary.csv');
  const timing = join(dir, 'proof_timing_history.jsonl');
  await writeFile(summary, 'name,status,exit_code,log_file\n"proof:a","PASS","0","F:\\CODEX-F-FORMAT\\PhotoFrame\\a.log"\n', 'utf8');
  await writeFile(timing, '{"command":"proof:a","category":"proof","duration_milliseconds":5234,"duration_seconds":5.234,"exit_code":0}\n', 'utf8');
  const stats = await buildLastRunStatsFromFiles({ summaryPath: summary, timingPath: timing, version: '0.9.7', head: 'abc', runId: 'run', platformRunner: 'windows_powershell', startedAt: '2026-06-21T17:00:00+03:00', endedAt: '2026-06-21T17:00:05+03:00', passedExitZero: 1, failedExitNonzero: 0, discovered: 1, summaryFile: 'logs/proof_summary.csv' });
  assert.equal(stats.summary_rows[0].log_file, 'F:\\CODEX-F-FORMAT\\PhotoFrame\\a.log');
});

test('proof results zip path resolves to extract root parent', () => {
  assert.equal(resolveProofResultsZipPath({ handoffRoot: '/home/mihkel/_0123_PF/PF_login_v0.9.7_handoff', platformRunner: 'raspberryos_bash', version: '0.9.7', runId: 'RID' }), '/home/mihkel/_0123_PF/PF_login_v0.9.7_raspberryos_proof_results_RID.zip');
  assert.equal(resolveProofResultsZipPath({ handoffRoot: 'F:\\CODEX-F-FORMAT\\PhotoFrame\\PF_login_v0.9.7_handoff', platformRunner: 'windows_powershell', version: '0.9.7', runId: 'RID' }), 'F:\\CODEX-F-FORMAT\\PhotoFrame\\PF_login_v0.9.7_win_proof_results_RID.zip');
});

test('launcher contract rejects inline Python stats and accepts Node stats builder/output root', () => {
  const good = analyzeLauncherRuntimeContract({
    bashSource: 'OUTPUT_ROOT="$(dirname "$ROOT_DIR")"\nnode "$REPO_ROOT/tools/build-proofrunner-last-run-stats.mjs"\nEVIDENCE_ZIP="$OUTPUT_ROOT/PF_login_v${EXPECTED_VERSION}_raspberryos_proof_results_${RUN_ID}.zip"',
    powershellSource: '$OutputRoot = Split-Path -Parent $RootDir\n$StatsBuilder = Join-Path $RepoRoot \'tools\\build-proofrunner-last-run-stats.mjs\'\n$EvidenceZip = Join-Path $OutputRoot "PF_login_v${ExpectedVersion}_win_proof_results_${RunId}.zip"',
  });
  assert.equal(good.passed, true);
  const bad = analyzeLauncherRuntimeContract({ bashSource: "python3 - <<'PY_LAST_STATS'\nheader=f.readline().rstrip('\n')\nPY_LAST_STATS", powershellSource: '$EvidenceZip = Join-Path $RootDir "bad.zip"' });
  assert.equal(bad.passed, false);
});
