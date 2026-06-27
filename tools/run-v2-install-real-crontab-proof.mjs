#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check, emitProof, parseArgs, proofResult } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const repoRoot = process.cwd();
const proofsDir = path.join(repoRoot, 'runtime_data', 'proofs');
mkdirSync(proofsDir, { recursive: true });

const blockStart = '# BEGIN PHOTOFRAME_V2_MANAGED_CRON';
const blockEnd = '# END PHOTOFRAME_V2_MANAGED_CRON';
const durationSeconds = Number.parseInt(process.env.PF_V2_CRON_PROOF_SECONDS ?? '45', 10);
const intervalSeconds = Number.parseInt(process.env.PF_V2_CRON_PROOF_INTERVAL_SECONDS ?? '5', 10);
const source = process.env.PF_V2_CRON_PROOF_SOURCE ?? 'cron-proof-loop';
const safeRepoRoot = shellSingleQuote(repoRoot);
const safePath = shellSingleQuote(process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin');
const safeDuration = shellSingleQuote(String(durationSeconds));
const safeInterval = shellSingleQuote(String(intervalSeconds));
const safeSource = shellSingleQuote(source);
const cronLog = shellSingleQuote(path.join(repoRoot, 'runtime_data', 'proofs', 'cron_proof_loop_logs', 'cron-entry.log'));

const managedBlock = [
  blockStart,
  `* * * * * cd ${safeRepoRoot} && PATH=${safePath} PF_V2_CRON_PROOF_SECONDS=${safeDuration} PF_V2_CRON_PROOF_INTERVAL_SECONDS=${safeInterval} PF_V2_CRON_PROOF_SOURCE=${safeSource} bash tools/v2-cron-proof-loop.sh >> ${cronLog} 2>&1`,
  blockEnd,
].join('\n');

const beforeResult = runCrontab(['-l']);
const before = beforeResult.status === 0 ? beforeResult.stdout : '';
writeFileSync(path.join(proofsDir, 'crontab_before.txt'), before || '# no existing user crontab or crontab -l returned non-zero\n', 'utf8');
writeFileSync(path.join(proofsDir, 'managed_cron_block.txt'), `${managedBlock}\n`, 'utf8');

const nextCrontab = `${stripManagedBlock(before).trimEnd()}${stripManagedBlock(before).trimEnd() ? '\n\n' : ''}${managedBlock}\n`;
const installResult = runCrontab(['-'], nextCrontab);
const afterResult = runCrontab(['-l']);
const after = afterResult.status === 0 ? afterResult.stdout : '';
writeFileSync(path.join(proofsDir, 'crontab_after_install.txt'), after || '# crontab -l returned no output after install\n', 'utf8');

const checks = [];
check(checks, 'crontab-command-available', 'crontab command is available.', beforeResult.status === 0 || /no crontab/i.test(beforeResult.stderr ?? '') || beforeResult.status === 1, { beforeStatus: beforeResult.status, stderr: beforeResult.stderr });
check(checks, 'managed-block-built', 'Managed PhotoFrame cron block was built.', managedBlock.includes(blockStart) && managedBlock.includes('v2-cron-proof-loop.sh') && managedBlock.includes(blockEnd), { managedBlock });
check(checks, 'crontab-install-exit-zero', 'Managed crontab block install exited zero.', installResult.status === 0, { status: installResult.status, stderr: installResult.stderr });
check(checks, 'after-install-readable', 'Crontab is readable after install.', afterResult.status === 0, { status: afterResult.status, stderr: afterResult.stderr });
check(checks, 'managed-block-present', 'Managed block is present after install.', after.includes(blockStart) && after.includes(blockEnd) && after.includes('v2-cron-proof-loop.sh'));
check(checks, 'outside-lines-preserved', 'Existing crontab outside managed block is preserved.', normalize(stripManagedBlock(before)) === normalize(stripManagedBlock(after)), {
  beforeOutside: stripManagedBlock(before),
  afterOutside: stripManagedBlock(after),
});
check(checks, 'seconds-configured', 'Cron proof loop uses seconds-based configuration.', durationSeconds > 0 && intervalSeconds > 0 && managedBlock.includes('PF_V2_CRON_PROOF_SECONDS'), { durationSeconds, intervalSeconds });

const result = proofResult({
  proof: 'v2_install_real_crontab',
  checks,
  evidenceMode: true,
  note: 'Installs a managed PhotoFrame V2 crontab block. Cron itself is minute-based; the managed block launches a seconds-based proof loop.',
});

emitProof(result, { write: args.write || args.evidence });

function runCrontab(argv, input) {
  const result = spawnSync('crontab', argv, {
    input,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? (result.error ? String(result.error.message ?? result.error) : ''),
  };
}

function stripManagedBlock(text) {
  return String(text ?? '').replace(new RegExp(`${escapeRegex(blockStart)}[\\s\\S]*?${escapeRegex(blockEnd)}\\n?`, 'g'), '').trimEnd();
}

function normalize(text) {
  return String(text ?? '').trim().replace(/\r\n/g, '\n');
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shellSingleQuote(text) {
  return `'${String(text).replace(/'/g, `'"'"'`)}'`;
}
