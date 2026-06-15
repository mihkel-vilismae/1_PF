#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence, writeProofArtifact } from './proof-utils.mjs';

async function metadata() {
  const version = readFileSync('VERSION', 'utf8').trim();
  let gitCommit = 'unknown';
  try { gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
  return { version, gitCommit };
}

const repoRoot = process.cwd();
const proofDir = join(repoRoot, 'runtime_data', 'proofs');
const exportRoot = join(repoRoot, 'runtime_data', 'proof_exports');
await mkdir(exportRoot, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const bundleDir = join(exportRoot, `linux-fedora-proof-artifacts-${timestamp}`);
await mkdir(bundleDir, { recursive: true });
let copied = [];
if (existsSync(proofDir)) {
  for (const file of await readdir(proofDir)) {
    if (!file.endsWith('.json')) continue;
    await cp(join(proofDir, file), join(bundleDir, file));
    try {
      const parsed = JSON.parse(await readFile(join(proofDir, file), 'utf8'));
      copied.push({ file, proof_kind: parsed.proof_kind ?? null, proof_status: parsed.proof_status ?? null, proof_timestamp: parsed.proof_timestamp ?? null });
    } catch { copied.push({ file, proof_kind: null, proof_status: 'UNREADABLE', proof_timestamp: null }); }
  }
}
const manifest = { created_at: new Date().toISOString(), repo_root: repoRoot, source_proof_dir: proofDir, copied_count: copied.length, copied };
await writeFile(join(bundleDir, 'manifest.json'), `${JSON.stringify(sanitizeEvidence(manifest), null, 2)}\n`, 'utf8');
let zipResult = null;
const zipPath = `${bundleDir}.zip`;
if (copied.length) {
  zipResult = await runCommand('zip', ['-qr', zipPath, '.'], { cwd: bundleDir, timeoutMs: 30000, detached: false });
}
const meta = await metadata();
const proofStatus = copied.length > 0 ? 'PASSED' : 'BLOCKED';
const envelope = createProofEnvelope({
  proofKind: 'linux_fedora_export_proof_artifacts',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus,
  runtimeMode: 'linux_fedora_export_proof_artifacts',
  evidence: sanitizeEvidence({ environment: getProofEnvironment(), repo_root: repoRoot, proof_dir: proofDir, bundle_dir: bundleDir, zip_path: existsSync(zipPath) ? zipPath : null, copied_count: copied.length, copied, zip_result: zipResult ? { exit_code: zipResult.exitCode, timed_out: zipResult.timedOut } : null, pass_criteria: 'PASSED when at least one proof JSON artifact is copied into an export bundle.', non_claims: ['exporting proof artifacts does not make failed or blocked proofs pass', 'does not prove Raspberry-native playback or display overlay'] }),
  knownLimitations: ['The export bundle is a packaging convenience only; inspect each included proof status.'],
});
const outputPath = await writeProofArtifact('linux_fedora_export_proof_artifacts', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, bundleDir, zipPath: existsSync(zipPath) ? zipPath : null, copied: copied.length }, null, 2));
process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
