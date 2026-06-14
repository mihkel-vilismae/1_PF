/** Raspberry install/extraction executable-bit repair proof. */
import { chmod, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';

export const RASPBERRY_EXECUTABLE_PERMISSION_FILES = Object.freeze([
  'start_raspberry_full.sh',
  'start_scripts/start_raspberry_full.sh',
  'tools/collect-endpoint-contract-inventory.mjs',
  'tools/run-raspberry-tool-checker-proof.mjs',
  'tools/run-raspberry-native-image-playback-proof.mjs',
  'tools/run-raspberry-native-video-playback-proof.mjs',
]);

export function isExecutableMode(mode) {
  return Boolean(mode & 0o111);
}

async function inspectExecutableFile({ repoRoot, relativePath, repair }) {
  const absolutePath = join(repoRoot, relativePath);
  const entry = {
    relative_path: relativePath,
    exists: false,
    before_mode_octal: null,
    after_mode_octal: null,
    executable_before: false,
    executable_after: false,
    repaired: false,
    error: null,
  };
  try {
    const before = await stat(absolutePath);
    entry.exists = before.isFile();
    entry.before_mode_octal = `0${(before.mode & 0o777).toString(8)}`;
    entry.executable_before = entry.exists && isExecutableMode(before.mode);
    if (entry.exists && repair && !entry.executable_before && process.platform !== 'win32') {
      await chmod(absolutePath, (before.mode & 0o777) | 0o755);
      entry.repaired = true;
    }
    const after = await stat(absolutePath);
    entry.after_mode_octal = `0${(after.mode & 0o777).toString(8)}`;
    entry.executable_after = after.isFile() && isExecutableMode(after.mode);
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
  }
  return entry;
}

export async function inspectRaspberryExecutablePermissions({ repoRoot = process.cwd(), repair = false, files = RASPBERRY_EXECUTABLE_PERMISSION_FILES } = {}) {
  const inspected = [];
  for (const relativePath of files) inspected.push(await inspectExecutableFile({ repoRoot, relativePath, repair }));
  return inspected;
}

export function evaluateExecutablePermissionRows(rows) {
  const missing = rows.filter((row) => !row.exists).map((row) => row.relative_path);
  const notExecutable = rows.filter((row) => row.exists && !row.executable_after).map((row) => row.relative_path);
  const blockReasons = [];
  if (missing.length) blockReasons.push(`missing executable-boundary files: ${missing.join(', ')}`);
  if (notExecutable.length) blockReasons.push(`files are not executable after repair/check: ${notExecutable.join(', ')}`);
  return {
    proofStatus: blockReasons.length ? 'BLOCKED' : 'PASSED',
    missing,
    notExecutable,
    blockReasons,
  };
}

export async function buildRaspberryExecutablePermissionsProof({ metadata, repoRoot = process.cwd(), repair = false } = {}) {
  const inspected = await inspectRaspberryExecutablePermissions({ repoRoot, repair });
  const evaluation = evaluateExecutablePermissionRows(inspected);
  return createProofEnvelope({
    proofKind: 'raspberry_executable_permissions',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: repair ? 'raspberry_executable_permissions_repair' : 'raspberry_executable_permissions_check',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      repo_root: repoRoot,
      repair_requested: repair,
      executable_files: inspected.map((row) => ({ ...row, absolute_path: undefined, relative_path_from_repo: relative(repoRoot, join(repoRoot, row.relative_path)) })),
      evaluation,
      next_steps: evaluation.proofStatus === 'PASSED'
        ? ['Run npm run proof:raspberry-native-image-playback and npm run proof:raspberry-native-video-playback.']
        : ['Run npm run proof:raspberry-executable-permissions -- --repair from the repo root after extracting the ZIP.'],
      non_claims: ['does not prove native playback by itself', 'does not run the dashboard', 'does not install cron', 'does not reboot or power-cycle the Raspberry'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['Executable boundary files are present and executable after this check/repair.']
      : ['Extraction may have lost POSIX executable bits; repair before native playback proof.'],
  });
}
