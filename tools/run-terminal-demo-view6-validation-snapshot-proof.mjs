#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const snapshotDir = path.join(
  root,
  'docs/30_status_snapshots/2026-07-02/view6_validation_preflight_hardening',
);

const files = [
  'README.md',
  'PF_login_v2.0.19_view6_validation_slice_by_slice_report.md',
  'PF_login_v2.0.19_view6_validation_proof_artifacts.zip',
  'PF_login_v2.0.19_view6_validation_proof_artifacts.zip.sha256',
  'PF_login_v2.0.19_view6_validation_preflight_hardening_full_git.zip.sha256',
];

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

for (const file of files) {
  assert(existsSync(path.join(snapshotDir, file)), `missing snapshot file: ${file}`);
}

const proofZip = path.join(snapshotDir, 'PF_login_v2.0.19_view6_validation_proof_artifacts.zip');
const proofShaFile = path.join(snapshotDir, 'PF_login_v2.0.19_view6_validation_proof_artifacts.zip.sha256');
const expectedProofSha = readFileSync(proofShaFile, 'utf8').match(/[a-f0-9]{64}/)?.[0];
assert(Boolean(expectedProofSha), 'proof artifacts sha file must contain a sha256');
assert(sha256(proofZip) === expectedProofSha, 'proof artifacts zip sha256 must match sha file');

const report = readFileSync(
  path.join(snapshotDir, 'PF_login_v2.0.19_view6_validation_slice_by_slice_report.md'),
  'utf8',
);
for (const marker of [
  'PF_login v2.0.19',
  'View 6 validation/hardening',
  'npm run proof:terminal-demo-view6-real-fixture-playback',
  'No queue-backed playback, DB writes, cron behavior, auth execution, worker execution, or View 1 file-copy behavior was added.',
]) {
  assert(report.includes(marker), `slice report must include marker: ${marker}`);
}

const toc = readText('docs/table_of_contents.md');
const docIndex = readText('docs/DOC_INDEX.md');
const snapshotsReadme = readText('docs/30_status_snapshots/README.md');
const snapshotPath = 'docs/30_status_snapshots/2026-07-02/view6_validation_preflight_hardening';

assert(toc.includes(snapshotPath), 'table_of_contents must reference snapshot folder');
assert(docIndex.includes(`${snapshotPath}/README.md`), 'DOC_INDEX must reference snapshot README');
assert(docIndex.includes(`${snapshotPath}/PF_login_v2.0.19_view6_validation_slice_by_slice_report.md`), 'DOC_INDEX must reference slice report');
assert(snapshotsReadme.includes('2026-07-02 View 6 validation/hardening snapshot'), 'status snapshots README must include 2026-07-02 section');
assert(snapshotsReadme.includes('2026-07-02/view6_validation_preflight_hardening/README.md'), 'status snapshots README must link snapshot README');

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('PASS terminal_demo_view6_validation_snapshot');
