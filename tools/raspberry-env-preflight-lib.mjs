/** Raspberry env bootstrap/preflight proof. */
import { constants as fsConstants } from 'node:fs';
import { access, copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';

export const RASPBERRY_ENV_MINIMUM_KEYS = Object.freeze([
  'DOWNLOAD_DIR',
  'DB_PATH',
  'LOG_DIR',
  'FULL_LOG',
  'PLAYBACK_LEASE_SECONDS',
  'NATIVE_PLAYBACK_ENABLED',
]);

export function parseEnvText(text) {
  const values = {};
  const malformedLines = [];
  const lines = String(text ?? '').split(/\r?\n/u);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      malformedLines.push({ line: index + 1, text: trimmed });
      return;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    if (!key) malformedLines.push({ line: index + 1, text: trimmed });
    else values[key] = value;
  });
  return { values, malformedLines };
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function inspectRaspberryEnv({ repoRoot = process.cwd(), createFromExample = false } = {}) {
  const envPath = join(repoRoot, '.env');
  const examplePath = join(repoRoot, 'example.env');
  const beforeExists = await fileExists(envPath);
  const exampleExists = await fileExists(examplePath);
  let createdFromExample = false;
  let createError = null;
  if (!beforeExists && createFromExample) {
    if (!exampleExists) {
      createError = 'example.env is missing; cannot create .env';
    } else {
      try {
        await mkdir(dirname(envPath), { recursive: true });
        await copyFile(examplePath, envPath);
        createdFromExample = true;
      } catch (error) {
        createError = error instanceof Error ? error.message : String(error);
      }
    }
  }
  const afterExists = await fileExists(envPath);
  let sizeBytes = 0;
  let parse = { values: {}, malformedLines: [] };
  let readError = null;
  if (afterExists) {
    try {
      const info = await stat(envPath);
      sizeBytes = info.size;
      parse = parseEnvText(await readFile(envPath, 'utf8'));
    } catch (error) {
      readError = error instanceof Error ? error.message : String(error);
    }
  }
  const presentKeys = Object.keys(parse.values).sort();
  const missingMinimumKeys = RASPBERRY_ENV_MINIMUM_KEYS.filter((key) => !presentKeys.includes(key));
  return {
    env_path: '.env',
    example_path: 'example.env',
    before_exists: beforeExists,
    after_exists: afterExists,
    example_exists: exampleExists,
    create_requested: createFromExample,
    created_from_example: createdFromExample,
    create_error: createError,
    read_error: readError,
    size_bytes: sizeBytes,
    present_key_count: presentKeys.length,
    minimum_keys: RASPBERRY_ENV_MINIMUM_KEYS,
    missing_minimum_keys: missingMinimumKeys,
    malformed_line_count: parse.malformedLines.length,
    malformed_lines: parse.malformedLines.slice(0, 10),
  };
}

export function evaluateRaspberryEnvPreflight(envInspection) {
  const blockReasons = [];
  if (!envInspection.after_exists) blockReasons.push('.env is missing');
  if (envInspection.create_error) blockReasons.push(envInspection.create_error);
  if (envInspection.read_error) blockReasons.push(`failed to read .env: ${envInspection.read_error}`);
  if (envInspection.missing_minimum_keys.length) blockReasons.push(`.env missing minimum runtime keys: ${envInspection.missing_minimum_keys.join(', ')}`);
  if (envInspection.malformed_line_count) blockReasons.push(`.env contains malformed lines: ${envInspection.malformed_line_count}`);
  return { proofStatus: blockReasons.length ? 'BLOCKED' : 'PASSED', blockReasons };
}

export async function buildRaspberryEnvPreflightProof({ metadata, repoRoot = process.cwd(), createFromExample = false } = {}) {
  const envInspection = await inspectRaspberryEnv({ repoRoot, createFromExample });
  const evaluation = evaluateRaspberryEnvPreflight(envInspection);
  return createProofEnvelope({
    proofKind: 'raspberry_env_preflight',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: createFromExample ? 'raspberry_env_preflight_create' : 'raspberry_env_preflight_check',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      repo_root: repoRoot,
      env: envInspection,
      evaluation,
      next_steps: evaluation.proofStatus === 'PASSED'
        ? ['Run npm run api -- --scheduler playback-worker and app-running proofs.']
        : ['Run npm run proof:raspberry-env-preflight -- --create from the repo root, then edit .env for real provider credentials if needed.'],
      non_claims: [
        'does not validate iCloud credentials',
        'does not enable real network geocode providers',
        'does not prove playback_worker product work',
        'does not prove app-running by itself',
      ],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['A parseable .env exists with minimum runtime keys. Provider credentials may still need real operator configuration.']
      : ['Playback worker and real runtime commands require .env before they can run.'],
  });
}
