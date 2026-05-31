/**
 * Real download continuation proof library for PF_login.
 * Runs only when explicitly enabled against a live backend and local download dir.
 * Calls the existing real iCloudPD route twice and compares sanitized file fingerprints.
 * Proves repeated real downloads do not add duplicate media fingerprints.
 * Does not modify provider behavior, auth behavior, or download implementation.
 */
import { createHash } from 'node:crypto';
import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { requestJson } from './real-icloudpd-pipeline-proof-lib.mjs';

const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.mp4', '.mov', '.m4v']);

/** Returns true only when the operator explicitly permits live real-download proof execution. */
export function isRealDownloadContinuationProofEnabled(env = process.env) {
  return env.PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION === 'true';
}

/** Builds the live backend route plan without touching the mock download route. */
export function buildRealDownloadContinuationRoutePlan(recentCount = 10) {
  return [
    { key: 'verify_env', method: 'POST', path: '/api/init/verify-env' },
    { key: 'auth_status', method: 'GET', path: '/api/auth/new/status' },
    { key: 'real_download_first_run', method: 'POST', path: '/api/runtime/download/real-run', body: { recentCount } },
    { key: 'real_download_second_run', method: 'POST', path: '/api/runtime/download/real-run', body: { recentCount } },
  ];
}

/** Resolves the live download directory from verify-env output or explicit proof env. */
export function resolveDownloadDirectory({ verifyEnvPayload, env = process.env }) {
  const explicit = env.PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR;
  if (explicit && explicit.trim()) return explicit.trim();
  const checks = Array.isArray(verifyEnvPayload?.checks) ? verifyEnvPayload.checks : [];
  const downloadCheck = checks.find((check) => check?.key === 'DOWNLOAD_DIR');
  const absolutePath = downloadCheck?.details?.absolutePath;
  return typeof absolutePath === 'string' && absolutePath.trim() ? absolutePath.trim() : null;
}

/** Recursively lists supported media files under the proof download directory. */
export async function listMediaFingerprints(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const files = [];
  async function walk(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !MEDIA_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      const fileStat = await stat(fullPath);
      const sha1 = createHash('sha1').update(await readFile(fullPath)).digest('hex');
      files.push({
        relativePath: path.relative(root, fullPath).split(path.sep).join('/'),
        sizeBytes: fileStat.size,
        sha1,
      });
    }
  }
  await walk(root);
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

/** Builds a compact snapshot summary without exposing the local absolute path. */
export function summarizeSnapshot(files) {
  const byHash = new Map();
  for (const file of files) byHash.set(file.sha1, (byHash.get(file.sha1) ?? 0) + 1);
  const duplicateHashes = [...byHash.entries()]
    .filter(([, count]) => count > 1)
    .map(([sha1, count]) => ({ sha1, count }));
  return {
    fileCount: files.length,
    uniqueContentCount: byHash.size,
    duplicateContentCount: duplicateHashes.reduce((total, entry) => total + entry.count - 1, 0),
    duplicateHashes,
    fileSample: files.slice(0, 20),
  };
}

/** Compares before/after snapshots to detect duplicate re-download growth. */
export function compareContinuationSnapshots({ before, afterFirst, afterSecond }) {
  const afterFirstHashes = new Set(afterFirst.map((file) => file.sha1));
  const secondNewFiles = afterSecond.filter((file) => !afterFirst.some((candidate) => candidate.relativePath === file.relativePath && candidate.sha1 === file.sha1));
  const duplicateContentAddedOnSecondRun = secondNewFiles.filter((file) => afterFirstHashes.has(file.sha1));
  const uniqueContentAddedOnSecondRun = secondNewFiles.filter((file) => !afterFirstHashes.has(file.sha1));
  return {
    before: summarizeSnapshot(before),
    afterFirst: summarizeSnapshot(afterFirst),
    afterSecond: summarizeSnapshot(afterSecond),
    firstRunAddedFileCount: Math.max(0, afterFirst.length - before.length),
    secondRunAddedFileCount: Math.max(0, afterSecond.length - afterFirst.length),
    duplicateContentAddedOnSecondRun,
    uniqueContentAddedOnSecondRun,
    continuationSafe: duplicateContentAddedOnSecondRun.length === 0,
  };
}

/** Runs the opt-in real download continuation proof and returns a proof envelope. */
export async function runRealDownloadContinuationProof({ baseUrl, recentCount, metadata, env = process.env }) {
  const routePlan = buildRealDownloadContinuationRoutePlan(recentCount);
  if (!isRealDownloadContinuationProofEnabled(env)) {
    return createProofEnvelope({
      proofKind: 'real_download_continuation',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'BLOCKED',
      runtimeMode: 'real',
      evidence: {
        reason: 'Set PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION=true to run the live repeated-download proof.',
        base_url: baseUrl,
        route_plan: routePlan.map((route) => ({ key: route.key, method: route.method, path: route.path })),
        mock_download_route_used: false,
      },
      knownLimitations: ['No real provider call was attempted because the opt-in flag was not set.'],
    });
  }

  const verifyEnv = await requestJson(baseUrl, routePlan[0]);
  const downloadDirectory = resolveDownloadDirectory({ verifyEnvPayload: verifyEnv.payload, env });
  if (!downloadDirectory) {
    return createProofEnvelope({
      proofKind: 'real_download_continuation',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'BLOCKED',
      runtimeMode: 'real',
      evidence: { base_url: baseUrl, verify_env: verifyEnv, reason: 'Could not resolve DOWNLOAD_DIR from verify-env or PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR.' },
      knownLimitations: ['The proof cannot compare repeated download snapshots without a local download directory.'],
    });
  }

  const before = await listMediaFingerprints(downloadDirectory);
  const authStatus = await requestJson(baseUrl, routePlan[1]);
  const firstRun = await requestJson(baseUrl, routePlan[2]);
  const afterFirst = await listMediaFingerprints(downloadDirectory);
  const secondRun = await requestJson(baseUrl, routePlan[3]);
  const afterSecond = await listMediaFingerprints(downloadDirectory);
  const comparison = compareContinuationSnapshots({ before, afterFirst, afterSecond });
  const routeResults = [verifyEnv, authStatus, firstRun, secondRun];
  const routeFailed = routeResults.find((result) => !result.ok);

  const proofStatus = routeFailed ? 'FAILED' : comparison.continuationSafe ? 'PASSED' : 'FAILED';
  return createProofEnvelope({
    proofKind: 'real_download_continuation',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'real',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      base_url: baseUrl,
      recent_count: recentCount,
      route_results: routeResults,
      mock_download_route_used: false,
      comparison,
    }),
    knownLimitations: proofStatus === 'PASSED'
      ? ['This proof verifies local file fingerprint behavior for this live provider run; it cannot prove future iCloud library state.']
      : ['The live repeated-download proof failed or observed duplicate content added on the second run.'],
  });
}
