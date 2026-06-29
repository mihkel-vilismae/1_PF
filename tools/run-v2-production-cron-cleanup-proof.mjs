#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check, emitProof, parseArgs, proofResult } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const proofsDir = path.join(process.cwd(), 'runtime_data', 'proofs');
mkdirSync(proofsDir, { recursive: true });
const blockStart = '# BEGIN PHOTOFRAME_V2_PRODUCTION_CRON';
const blockEnd = '# END PHOTOFRAME_V2_PRODUCTION_CRON';

const beforeResult = runCrontab(['-l']);
const before = beforeResult.status === 0 ? beforeResult.stdout : '';
writeFileSync(path.join(proofsDir, 'production_crontab_before_cleanup.txt'), before || '# no crontab before cleanup\n', 'utf8');
const cleaned = stripProductionBlock(before).trimEnd();
const installInput = cleaned ? `${cleaned}\n` : '';
const installResult = runCrontab(['-'], installInput);
const afterResult = runCrontab(['-l']);
const after = afterResult.status === 0 ? afterResult.stdout : '';
writeFileSync(path.join(proofsDir, 'production_crontab_after_cleanup.txt'), after || '# no crontab after cleanup\n', 'utf8');

const checks = [];
check(checks, 'cleanup-crontab-readable-before', 'Crontab was readable before production cleanup.', beforeResult.status === 0 || beforeResult.status === 1, { status: beforeResult.status, stderr: beforeResult.stderr });
check(checks, 'cleanup-install-exit-zero', 'Production managed block cleanup exited zero.', installResult.status === 0, { status: installResult.status, stderr: installResult.stderr });
check(checks, 'cleanup-crontab-readable-after', 'Crontab was readable after production cleanup.', afterResult.status === 0 || afterResult.status === 1, { status: afterResult.status, stderr: afterResult.stderr });
check(checks, 'production-block-removed', 'Production managed block is absent after cleanup.', !after.includes(blockStart) && !after.includes(blockEnd));

const result = proofResult({
  proof: 'v2_production_cron_cleanup',
  checks,
  evidenceMode: true,
  note: 'Optional cleanup proof for removing only the PhotoFrame V2 production managed crontab block. Not run by default by prooflauncher.',
});
emitProof(result, { write: args.write || args.evidence });

function runCrontab(argv, input) {
  const result = spawnSync('crontab', argv, { input, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? (result.error ? String(result.error.message ?? result.error) : '') };
}
function stripProductionBlock(text) {
  return String(text ?? '').replace(new RegExp(`${escapeRegex(blockStart)}[\\s\\S]*?${escapeRegex(blockEnd)}\\n?`, 'g'), '').trimEnd();
}
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
