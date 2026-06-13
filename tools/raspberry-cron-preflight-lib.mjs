/** Raspberry managed cron preflight/installer. */
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import { evaluateCronRows, parseCrontabRows, RASPBERRY_CRON_WORKER_LANES } from './raspberry-cron-worker-runtime-proof-lib.mjs';

export const MANAGED_CRON_BEGIN = '# >>> PF_LOGIN_RASPBERRY_WORKERS >>>';
export const MANAGED_CRON_END = '# <<< PF_LOGIN_RASPBERRY_WORKERS <<<';

export function buildManagedCronRows({ repoRoot }) {
  return [
    MANAGED_CRON_BEGIN,
    '# Managed by PF_login proof tooling. Do not edit inside this block manually.',
    'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    `*/10 * * * * cd "${repoRoot}" && npm run api -- --scheduler regular-stage-worker >>"${repoRoot}/runtime_data/cron/regular-stage-worker.log" 2>&1`,
    `* * * * * cd "${repoRoot}" && npm run api -- --scheduler playback-worker >>"${repoRoot}/runtime_data/cron/playback-worker.log" 2>&1`,
    `*/3 * * * * cd "${repoRoot}" && npm run api -- --scheduler screen-on-off-worker >>"${repoRoot}/runtime_data/cron/screen-on-off-worker.log" 2>&1`,
    MANAGED_CRON_END,
  ];
}

export function replaceManagedCronBlock(existingCrontab, managedRows) {
  const existing = String(existingCrontab || '').replace(/\s+$/u, '');
  const block = managedRows.join('\n');
  const pattern = new RegExp(`${escapeRegExp(MANAGED_CRON_BEGIN)}[\\s\\S]*?${escapeRegExp(MANAGED_CRON_END)}`, 'u');
  if (pattern.test(existing)) return `${existing.replace(pattern, block)}\n`;
  return `${existing ? `${existing}\n\n` : ''}${block}\n`;
}

export async function readCrontab() {
  const result = await runCommand('crontab', ['-l'], { timeoutMs: 10000, detached: false });
  return { available: result.exitCode === 0, text: result.exitCode === 0 ? result.stdout : '', result };
}

export async function installCrontab(text) {
  return runCommand('crontab', ['-'], { timeoutMs: 10000, detached: false, input: text });
}

export function evaluateManagedCronPreflight({ target, crontabText, installRequested = false }) {
  const rows = parseCrontabRows(crontabText);
  const rowEvidence = evaluateCronRows(rows);
  const missingRows = rowEvidence.filter((row) => !row.present).map((row) => row.name);
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (missingRows.length) blockReasons.push(`missing managed cron rows for: ${missingRows.join(', ')}`);
  if (blockReasons.length) return { proofStatus: installRequested ? 'BLOCKED' : 'BLOCKED', blockReasons, missingRows, rowEvidence };
  return { proofStatus: 'PASSED', blockReasons, missingRows, rowEvidence };
}

export async function buildRaspberryCronPreflightProof({ metadata, env = process.env, repoRoot = process.cwd(), install = false, currentCrontab = null } = {}) {
  const target = detectRaspberryTarget({ env });
  const managedRows = buildManagedCronRows({ repoRoot });
  const current = currentCrontab === null ? await readCrontab() : { available: true, text: currentCrontab, result: null };
  const before = evaluateManagedCronPreflight({ target, crontabText: current.text, installRequested: install });
  let installResult = null;
  let finalText = current.text;
  let after = before;
  if (install && target.raspberry_like) {
    finalText = replaceManagedCronBlock(current.text, managedRows);
    installResult = await installCrontab(finalText);
    const reread = await readCrontab();
    after = evaluateManagedCronPreflight({ target, crontabText: reread.text, installRequested: install });
  }
  const status = install ? after : before;
  return createProofEnvelope({
    proofKind: 'raspberry_cron_preflight',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: status.proofStatus,
    runtimeMode: install ? 'raspberry_cron_preflight_install' : 'raspberry_cron_preflight_check',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      repo_root: repoRoot,
      expected_worker_lanes: RASPBERRY_CRON_WORKER_LANES,
      managed_cron_block: managedRows,
      current_crontab_available: current.available,
      before,
      after,
      install_requested: install,
      install_result: installResult,
      next_steps: status.proofStatus === 'PASSED' ? ['Run npm run proof:raspberry-app-running-pass'] : ['Run npm run proof:raspberry-cron-preflight -- --install on Raspberry, then rerun app-running proofs.'],
      non_claims: ['does not run workers by itself', 'does not reboot the Raspberry', 'does not prove power-loss recovery'],
    }),
    knownLimitations: status.proofStatus === 'PASSED' ? ['Managed cron rows are present for the observed crontab.'] : ['Managed cron rows are missing or target is not Raspberry.'],
  });
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
