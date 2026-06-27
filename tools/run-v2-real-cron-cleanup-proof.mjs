#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check, emitProof, parseArgs, proofResult } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const proofsDir = path.resolve('runtime_data', 'proofs');
mkdirSync(proofsDir, { recursive: true });
const blockStart = '# BEGIN PHOTOFRAME_V2_MANAGED_CRON';
const blockEnd = '# END PHOTOFRAME_V2_MANAGED_CRON';

const beforeResult = runCrontab(['-l']);
const before = beforeResult.status === 0 ? beforeResult.stdout : '';
writeFileSync(path.join(proofsDir, 'crontab_before_cleanup.txt'), before || '# no crontab before cleanup\n', 'utf8');
const cleaned = `${stripManagedBlock(before).trimEnd()}${stripManagedBlock(before).trimEnd() ? '\n' : ''}`;
const cleanupResult = runCrontab(['-'], cleaned);
const afterResult = runCrontab(['-l']);
const after = afterResult.status === 0 ? afterResult.stdout : '';
writeFileSync(path.join(proofsDir, 'crontab_after_cleanup.txt'), after || '# no crontab after cleanup\n', 'utf8');

const checks = [];
check(checks, 'cleanup-crontab-command', 'crontab command responded during cleanup.', beforeResult.status === 0 || beforeResult.status === 1, { beforeStatus: beforeResult.status, stderr: beforeResult.stderr });
check(checks, 'cleanup-exit-zero', 'Managed crontab cleanup exited zero.', cleanupResult.status === 0, { status: cleanupResult.status, stderr: cleanupResult.stderr });
check(checks, 'managed-block-removed', 'Managed PhotoFrame cron block is absent after cleanup.', !after.includes(blockStart) && !after.includes(blockEnd));

const result = proofResult({
  proof: 'v2_real_cron_cleanup',
  checks,
  evidenceMode: true,
  note: 'Optional cleanup proof that removes only the managed PhotoFrame V2 crontab block. Not run by default because autonomous operation may intentionally leave cron installed.',
});

emitProof(result, { write: args.write || args.evidence });

function runCrontab(argv, input) {
  const result = spawnSync('crontab', argv, { input, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? (result.error ? String(result.error.message ?? result.error) : ''),
  };
}

function stripManagedBlock(text) {
  return String(text ?? '').replace(new RegExp(`${escapeRegex(blockStart)}[\\s\\S]*?${escapeRegex(blockEnd)}\\n?`, 'g'), '').trimEnd();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
