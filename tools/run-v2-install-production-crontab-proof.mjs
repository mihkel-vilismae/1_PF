#!/usr/bin/env node
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check, emitProof, packageScripts, parseArgs, proofResult, readText } from './v2-final-proof-utils.mjs';

const args = parseArgs();
if (args.contract) {
  const scripts = packageScripts();
  const sourceText = readText('tools/run-v2-install-production-crontab-proof.mjs');
  const checks = [];
  check(checks, 'production-install-script-registered', 'Production crontab install script is registered.', Boolean(scripts['proof:v2-install-production-crontab']));
  check(checks, 'production-contract-script-registered', 'Production crontab install contract script is registered.', Boolean(scripts['proof:v2-install-production-crontab-contract']));
  check(checks, 'production-managed-block-markers', 'Production managed crontab block markers are defined.', sourceText.includes('PHOTOFRAME_V2_PRODUCTION_CRON'));
  check(checks, 'production-short-wrapper-design', 'Production crontab design uses a short wrapper command.', sourceText.includes('production_worker.sh') && sourceText.includes('production-cron'));
  const result = proofResult({
    proof: 'v2_install_production_crontab',
    checks,
    evidenceMode: false,
    note: 'Static contract for the separate production crontab install proof. It does not mutate user crontab in contract mode.',
  });
  emitProof(result, { write: args.write });
}
const repoRoot = process.cwd();
const proofsDir = path.join(repoRoot, 'runtime_data', 'proofs');
mkdirSync(proofsDir, { recursive: true });

const productionBlockStart = '# BEGIN PHOTOFRAME_V2_PRODUCTION_CRON';
const productionBlockEnd = '# END PHOTOFRAME_V2_PRODUCTION_CRON';
const mode = process.env.PF_V2_CRON_MODE ?? 'production';
const source = process.env.PF_V2_PRODUCTION_CRON_SOURCE ?? 'production-cron';
const wrapperDir = path.resolve(process.env.PF_V2_CRON_WRAPPER_DIR ?? path.join(os.homedir(), '.photoframe_v2', 'cron'));
const wrapperPath = path.join(wrapperDir, 'production_worker.sh');
const wrapperLogDir = path.join(repoRoot, 'runtime_data', 'proofs', 'production_cron_wrapper_logs');
mkdirSync(wrapperDir, { recursive: true });
mkdirSync(wrapperLogDir, { recursive: true });

const wrapperScript = buildProductionWrapperScript({
  repoRoot,
  pathEnv: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
  source,
  wrapperLogDir,
});
writeFileSync(wrapperPath, wrapperScript, 'utf8');
chmodSync(wrapperPath, 0o755);

const cronLines = [
  `* * * * * /bin/bash ${shellSingleQuote(wrapperPath)} regular-worker`,
  `* * * * * /bin/bash ${shellSingleQuote(wrapperPath)} playback-worker`,
  `* * * * * /bin/bash ${shellSingleQuote(wrapperPath)} screen-worker`,
];
const productionBlock = [productionBlockStart, ...cronLines, productionBlockEnd].join('\n');

writeFileSync(path.join(proofsDir, 'production_cron_wrapper_path.txt'), `${wrapperPath}\n`, 'utf8');
writeFileSync(path.join(proofsDir, 'production_cron_wrapper_script_snapshot.sh'), wrapperScript, 'utf8');
writeFileSync(path.join(proofsDir, 'production_managed_cron_block.txt'), `${productionBlock}\n`, 'utf8');

const beforeResult = runCrontab(['-l']);
const before = beforeResult.status === 0 ? beforeResult.stdout : '';
writeFileSync(path.join(proofsDir, 'production_crontab_before.txt'), before || '# no existing user crontab or crontab -l returned non-zero\n', 'utf8');

const strippedBefore = stripProductionBlock(before).trimEnd();
const nextCrontab = `${strippedBefore}${strippedBefore ? '\n\n' : ''}${productionBlock}\n`;
const installResult = runCrontab(['-'], nextCrontab);
const afterResult = runCrontab(['-l']);
const after = afterResult.status === 0 ? afterResult.stdout : '';
writeFileSync(path.join(proofsDir, 'production_crontab_after_install.txt'), after || '# crontab -l returned no output after production install\n', 'utf8');

const checks = [];
check(checks, 'cron-mode-production', 'PF_V2_CRON_MODE is production for the production crontab install proof.', mode === 'production', { mode });
check(checks, 'crontab-command-available', 'crontab command is available.', beforeResult.status === 0 || /no crontab/i.test(beforeResult.stderr ?? '') || beforeResult.status === 1, { beforeStatus: beforeResult.status, stderr: beforeResult.stderr });
check(checks, 'production-wrapper-written', 'Production cron wrapper script was written.', wrapperScript.includes('PRODUCTION_WRAPPER_START') && wrapperScript.includes('proof:v2-run-'), { wrapperPath });
check(checks, 'production-wrapper-executable', 'Production cron wrapper script is executable.', isExecutable(wrapperPath), { wrapperPath });
check(checks, 'production-managed-block-built', 'Production managed cron block was built.', productionBlock.includes(productionBlockStart) && productionBlock.includes(wrapperPath) && productionBlock.includes(productionBlockEnd), { productionBlock });
check(checks, 'production-cron-lines-short', 'Production crontab lines are short and only call the wrapper.', cronLines.every((line) => line.length < 220 && !line.includes('PATH=') && !line.includes('PF_V2')), { lengths: cronLines.map((line) => line.length), cronLines });
check(checks, 'production-worker-lines-present', 'Production crontab contains regular, playback, and screen worker lines.', ['regular-worker', 'playback-worker', 'screen-worker'].every((worker) => productionBlock.includes(worker)), { cronLines });
check(checks, 'production-crontab-install-exit-zero', 'Production managed crontab block install exited zero.', installResult.status === 0, { status: installResult.status, stderr: installResult.stderr });
check(checks, 'production-after-install-readable', 'Crontab is readable after production install.', afterResult.status === 0, { status: afterResult.status, stderr: afterResult.stderr });
check(checks, 'production-managed-block-present', 'Production managed block is present after install.', after.includes(productionBlockStart) && after.includes(productionBlockEnd) && after.includes(wrapperPath));
check(checks, 'outside-lines-preserved', 'Existing crontab outside production block is preserved.', normalize(stripProductionBlock(before)) === normalize(stripProductionBlock(after)), { beforeOutside: stripProductionBlock(before), afterOutside: stripProductionBlock(after) });
check(checks, 'long-logic-lives-in-production-wrapper', 'Repo path, PATH, source marker, logging, and worker command dispatch live in wrapper instead of crontab line.', wrapperScript.includes(repoRoot) && wrapperScript.includes('export PATH=') && wrapperScript.includes('production-cron') && wrapperScript.includes(wrapperLogDir), { wrapperPath });

const result = proofResult({
  proof: 'v2_install_production_crontab',
  checks,
  evidenceMode: true,
  note: 'Installs a separate PhotoFrame V2 production crontab block. Proof cron remains separate; production cron has direct worker-specific wrapper lines and source=production-cron markers.',
});
result.evidence = { cronMode: mode, wrapperPath, productionBlock, blockStart: productionBlockStart, blockEnd: productionBlockEnd };

emitProof(result, { write: args.write || args.evidence });

function runCrontab(argv, input) {
  const result = spawnSync('crontab', argv, { input, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? (result.error ? String(result.error.message ?? result.error) : '') };
}

function buildProductionWrapperScript({ repoRoot, pathEnv, source, wrapperLogDir }) {
  return `#!/usr/bin/env bash
set -u -o pipefail

WORKER="\${1:-}"
REPO_ROOT=${shellSingleQuote(repoRoot)}
WRAPPER_LOG_DIR=${shellSingleQuote(wrapperLogDir)}
SOURCE=${shellSingleQuote(source)}
export PATH=${shellSingleQuote(pathEnv)}
export PF_V2_CRON_MODE=production
export PF_V2_WORKER_EVIDENCE_SOURCE="$SOURCE"
export PF_V2_PROOF_RUN_ID=production-cron-\${WORKER:-unknown}-$(date -u +%Y%m%dT%H%M%SZ)-$$

mkdir -p "$WRAPPER_LOG_DIR"
LOG_FILE="$WRAPPER_LOG_DIR/\${WORKER:-unknown}.log"

case "$WORKER" in
  regular-worker) SCRIPT="proof:v2-run-regular-worker-once" ;;
  playback-worker) SCRIPT="proof:v2-run-playback-worker-once" ;;
  screen-worker) SCRIPT="proof:v2-run-screen-worker-once" ;;
  *)
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PRODUCTION_WRAPPER_ERROR unknown_worker=$WORKER" | tee -a "$LOG_FILE"
    exit 2
    ;;
esac

{
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PRODUCTION_WRAPPER_START worker=$WORKER repoRoot=$REPO_ROOT source=$SOURCE runId=$PF_V2_PROOF_RUN_ID"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PRODUCTION_WRAPPER_ENV node=$(command -v node 2>/dev/null || true) npm=$(command -v npm 2>/dev/null || true) path=$PATH"
} | tee -a "$LOG_FILE"

cd "$REPO_ROOT" || {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PRODUCTION_WRAPPER_ERROR could_not_cd repoRoot=$REPO_ROOT" | tee -a "$LOG_FILE"
  exit 3
}

npm run "$SCRIPT" -- --source "$SOURCE" --proof-run-id "$PF_V2_PROOF_RUN_ID" >> "$LOG_FILE" 2>&1
CODE=$?
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PRODUCTION_WRAPPER_FINISH worker=$WORKER exit=$CODE runId=$PF_V2_PROOF_RUN_ID" | tee -a "$LOG_FILE"
exit "$CODE"
`;
}

function stripProductionBlock(text) {
  return String(text ?? '').replace(new RegExp(`${escapeRegex(productionBlockStart)}[\\s\\S]*?${escapeRegex(productionBlockEnd)}\\n?`, 'g'), '').trimEnd();
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
    return (spawnSync('test', ['-x', filePath]).status ?? 1) === 0;
  } catch {
    return false;
  }
}
