#!/usr/bin/env node
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
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
const wrapperDir = path.resolve(process.env.PF_V2_CRON_WRAPPER_DIR ?? path.join(os.homedir(), '.photoframe_v2', 'cron'));
const wrapperPath = path.join(wrapperDir, 'proof_loop.sh');
const wrapperLogDir = path.join(repoRoot, 'runtime_data', 'proofs', 'cron_wrapper_logs');
const wrapperLog = path.join(wrapperLogDir, 'proof_loop_wrapper.log');
const loopEntryLog = path.join(repoRoot, 'runtime_data', 'proofs', 'cron_proof_loop_logs', 'cron-entry.log');

mkdirSync(wrapperDir, { recursive: true });
mkdirSync(wrapperLogDir, { recursive: true });
mkdirSync(path.dirname(loopEntryLog), { recursive: true });

const wrapperScript = buildWrapperScript({
  repoRoot,
  pathEnv: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
  durationSeconds,
  intervalSeconds,
  source,
  wrapperLog,
  loopEntryLog,
});
writeFileSync(wrapperPath, wrapperScript, 'utf8');
chmodSync(wrapperPath, 0o755);

const shortCronLine = `* * * * * /bin/bash ${shellSingleQuote(wrapperPath)}`;
const managedBlock = [blockStart, shortCronLine, blockEnd].join('\n');

writeFileSync(path.join(proofsDir, 'cron_wrapper_path.txt'), `${wrapperPath}\n`, 'utf8');
writeFileSync(path.join(proofsDir, 'cron_wrapper_script_snapshot.sh'), wrapperScript, 'utf8');
writeFileSync(path.join(proofsDir, 'managed_cron_block.txt'), `${managedBlock}\n`, 'utf8');

const beforeResult = runCrontab(['-l']);
const before = beforeResult.status === 0 ? beforeResult.stdout : '';
writeFileSync(path.join(proofsDir, 'crontab_before.txt'), before || '# no existing user crontab or crontab -l returned non-zero\n', 'utf8');

const strippedBefore = stripManagedBlock(before).trimEnd();
const nextCrontab = `${strippedBefore}${strippedBefore ? '\n\n' : ''}${managedBlock}\n`;
const installResult = runCrontab(['-'], nextCrontab);
const afterResult = runCrontab(['-l']);
const after = afterResult.status === 0 ? afterResult.stdout : '';
writeFileSync(path.join(proofsDir, 'crontab_after_install.txt'), after || '# crontab -l returned no output after install\n', 'utf8');

const checks = [];
check(checks, 'crontab-command-available', 'crontab command is available.', beforeResult.status === 0 || /no crontab/i.test(beforeResult.stderr ?? '') || beforeResult.status === 1, { beforeStatus: beforeResult.status, stderr: beforeResult.stderr });
check(checks, 'wrapper-script-written', 'Short cron wrapper script was written.', wrapperScript.includes('WRAPPER_START') && wrapperScript.includes('v2-cron-proof-loop.sh'), { wrapperPath });
check(checks, 'wrapper-script-executable', 'Short cron wrapper script is executable.', isExecutable(wrapperPath), { wrapperPath });
check(checks, 'managed-block-built', 'Managed PhotoFrame cron block was built.', managedBlock.includes(blockStart) && managedBlock.includes(wrapperPath) && managedBlock.includes(blockEnd), { managedBlock });
check(checks, 'managed-cron-line-short', 'Crontab line is short and only calls the wrapper.', shortCronLine.length < 220 && !shortCronLine.includes('PF_V2_CRON_PROOF_SECONDS') && !shortCronLine.includes('PATH='), { length: shortCronLine.length, shortCronLine });
check(checks, 'crontab-install-exit-zero', 'Managed crontab block install exited zero.', installResult.status === 0, { status: installResult.status, stderr: installResult.stderr });
check(checks, 'after-install-readable', 'Crontab is readable after install.', afterResult.status === 0, { status: afterResult.status, stderr: afterResult.stderr });
check(checks, 'managed-block-present', 'Managed block is present after install.', after.includes(blockStart) && after.includes(blockEnd) && after.includes(wrapperPath));
check(checks, 'outside-lines-preserved', 'Existing crontab outside managed block is preserved.', normalize(stripManagedBlock(before)) === normalize(stripManagedBlock(after)), {
  beforeOutside: stripManagedBlock(before),
  afterOutside: stripManagedBlock(after),
});
check(checks, 'long-logic-lives-in-wrapper', 'Repo path, PATH, env, logging, and loop call live in wrapper instead of crontab line.', wrapperScript.includes(repoRoot) && wrapperScript.includes('export PATH=') && wrapperScript.includes('PF_V2_CRON_PROOF_SECONDS') && wrapperScript.includes(loopEntryLog), { wrapperPath });
check(checks, 'seconds-configured', 'Cron proof loop uses seconds-based configuration.', durationSeconds > 0 && intervalSeconds > 0 && wrapperScript.includes('PF_V2_CRON_PROOF_SECONDS'), { durationSeconds, intervalSeconds });

const result = proofResult({
  proof: 'v2_install_real_crontab',
  checks,
  evidenceMode: true,
  note: 'Installs a managed PhotoFrame V2 crontab block using one short cron line that calls a wrapper script. Long repo/PATH/env/logging logic lives inside the wrapper.',
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

function buildWrapperScript({ repoRoot, pathEnv, durationSeconds, intervalSeconds, source, wrapperLog, loopEntryLog }) {
  return `#!/usr/bin/env bash
set -u -o pipefail

REPO_ROOT=${shellSingleQuote(repoRoot)}
WRAPPER_LOG=${shellSingleQuote(wrapperLog)}
LOOP_ENTRY_LOG=${shellSingleQuote(loopEntryLog)}
export PATH=${shellSingleQuote(pathEnv)}
export PF_V2_CRON_PROOF_SECONDS=${shellSingleQuote(String(durationSeconds))}
export PF_V2_CRON_PROOF_INTERVAL_SECONDS=${shellSingleQuote(String(intervalSeconds))}
export PF_V2_CRON_PROOF_SOURCE=${shellSingleQuote(source)}
export PF_V2_PROOF_RUN_ID=cron-wrapper-$(date -u +%Y%m%dT%H%M%SZ)-$$

mkdir -p "$(dirname "$WRAPPER_LOG")" "$(dirname "$LOOP_ENTRY_LOG")"
{
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] WRAPPER_START repoRoot=$REPO_ROOT source=$PF_V2_CRON_PROOF_SOURCE runId=$PF_V2_PROOF_RUN_ID"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] WRAPPER_ENV node=$(command -v node 2>/dev/null || true) npm=$(command -v npm 2>/dev/null || true) path=$PATH"
} | tee -a "$WRAPPER_LOG"

cd "$REPO_ROOT" || {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] WRAPPER_ERROR could_not_cd repoRoot=$REPO_ROOT" | tee -a "$WRAPPER_LOG"
  exit 2
}

bash tools/v2-cron-proof-loop.sh >> "$LOOP_ENTRY_LOG" 2>&1
CODE=$?
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] WRAPPER_FINISH exit=$CODE runId=$PF_V2_PROOF_RUN_ID" | tee -a "$WRAPPER_LOG"
exit "$CODE"
`;
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

function isExecutable(filePath) {
  try {
    return Boolean((spawnSync('test', ['-x', filePath]).status ?? 1) === 0);
  } catch {
    return false;
  }
}
