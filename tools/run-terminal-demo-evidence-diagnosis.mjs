#!/usr/bin/env node
/*
 * Terminal Demo operator evidence diagnosis.
 * Reads a v0.13+ operator rehearsal evidence folder/ZIP, classifies common
 * Windows/Raspberry run blockers, and writes a small diagnosis report. The
 * report is logs/status only; it never copies source code.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const selfTest = args.includes('--self-test');
const positional = args.filter((arg) => !arg.startsWith('--'));

function readText(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function findLatestEvidenceFolder() {
  const base = path.join(repoRoot, 'terminal/demo/runtime_logs/operator_rehearsal');
  if (!existsSync(base)) return null;
  const dirs = readdirSync(base)
    .map((entry) => path.join(base, entry))
    .filter((entry) => statSync(entry).isDirectory())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return dirs.find((dir) => existsSync(path.join(dir, 'terminal_demo_status.json'))) ?? null;
}

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walkFiles(absolute, out);
    else if (stat.isFile()) out.push(absolute);
  }
  return out;
}

function loadFolder(folder) {
  const files = new Map();
  for (const file of walkFiles(folder)) {
    const rel = path.relative(folder, file).replace(/\\/g, '/');
    if (/\.(json|md|log|txt)$/i.test(rel) && statSync(file).size <= 2_000_000) {
      files.set(rel, readFileSync(file, 'utf8'));
    }
  }
  return { sourceType: 'folder', sourcePath: folder, files };
}

function readZipEntries(zipPath) {
  const buffer = readFileSync(zipPath);
  const files = new Map();
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 66000); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`ZIP central directory not found: ${zipPath}`);
  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  for (let index = 0; index < count; index++) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid ZIP central directory entry.');
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    cursor += 46 + nameLength + extraLength + commentLength;
    if (!/\.(json|md|log|txt)$/i.test(name)) continue;
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('Invalid ZIP local header.');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
    if (data && data.length <= 2_000_000) files.set(name, data.toString('utf8'));
  }
  return { sourceType: 'zip', sourcePath: zipPath, files };
}

function loadEvidence(inputPath) {
  const target = inputPath ? path.resolve(repoRoot, inputPath) : findLatestEvidenceFolder();
  if (!target) return { sourceType: 'missing', sourcePath: null, files: new Map() };
  if (!existsSync(target)) return { sourceType: 'missing', sourcePath: target, files: new Map() };
  return statSync(target).isDirectory() ? loadFolder(target) : readZipEntries(target);
}

function findStatus(files) {
  for (const [name, text] of files) {
    if (name.endsWith('terminal_demo_status.json')) {
      try { return { path: name, json: JSON.parse(text) }; } catch { return { path: name, json: null }; }
    }
  }
  return { path: null, json: null };
}

function addIssue(issues, id, severity, title, evidence, nextAction) {
  if (issues.some((issue) => issue.id === id)) return;
  issues.push({ id, severity, title, evidence, nextAction });
}

function diagnose(loaded) {
  const version = existsSync(path.join(repoRoot, 'VERSION')) ? readText('VERSION').trim() : 'unknown';
  const { path: statusPath, json: status } = findStatus(loaded.files);
  const corpus = [...loaded.files.values()].join('\n').toLowerCase();
  const issues = [];
  const failedChecks = Array.isArray(status?.checks) ? status.checks.filter((check) => !check.passed) : [];

  if (loaded.sourceType === 'missing') {
    addIssue(issues, 'NO_EVIDENCE_FOUND', 'BLOCKED', 'No operator rehearsal evidence was found.', loaded.sourcePath ?? 'No latest evidence folder exists.', 'Run VERIFY_TERMINAL_DEMO.CMD, then rerun ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD.');
  }
  if (!status && loaded.sourceType !== 'missing') {
    addIssue(issues, 'MISSING_STATUS_JSON', 'BLOCKED', 'Evidence did not contain terminal_demo_status.json.', loaded.sourcePath, 'Use the v0.13+ operator rehearsal ZIP/folder, not the source ZIP.');
  }
  if (corpus.includes('package.json not found at repo root')) {
    addIssue(issues, 'WINDOWS_RUNNER_REPO_ROOT', 'BLOCKED', 'Windows runner treated terminal/demo as the repo root.', 'package.json not found at repo root', 'Use v0.10.100+ or newer, and launch terminal/demo/windows_runner.cmd from an extracted latest repo.');
  }
  if (corpus.includes('vite: not found') || corpus.includes('cannot find package') || corpus.includes('cannot find module') || corpus.includes('tsx')) {
    addIssue(issues, 'NODE_DEPENDENCIES_MISSING', 'BLOCKED', 'Node dependencies appear missing or incomplete.', 'vite/tsx/module resolution error found in evidence.', 'Run npm install from the PhotoFrame repo root, then rerun VERIFY_TERMINAL_DEMO.CMD.');
  }
  if (corpus.includes('node.js was not found') || corpus.includes('npm was not found') || corpus.includes('enoent')) {
    addIssue(issues, 'NODE_OR_NPM_NOT_ON_PATH', 'BLOCKED', 'Node.js or npm was not available on PATH.', 'Node/npm/ENOENT error found in evidence.', 'Install Node.js/npm or fix PATH, then rerun the verifier.');
  }
  if (failedChecks.some((check) => /folder name matches version/i.test(check.label ?? ''))) {
    addIssue(issues, 'ZIP_ROOT_VERSION_MISMATCH', 'BLOCKED', 'Extracted folder name does not match VERSION.', failedChecks.map((check) => check.detail).join('; '), 'Extract the latest generated ZIP without renaming its root folder, or set TERMINAL_DEMO_ALLOW_WORK_FOLDER_NAME=1 only for local worktrees.');
  }
  if (corpus.includes('photoFrame_terminal_demo_execute=1'.toLowerCase()) || corpus.includes('scheduler safety acknowledgement')) {
    addIssue(issues, 'EXECUTION_GUARD_EXPECTED', 'INFO', 'Worker execution is guarded by explicit safe flags.', 'Execution guard wording found in evidence.', 'This is expected unless you are intentionally testing guarded worker execution.');
  }
  if (corpus.includes('crontab')) {
    addIssue(issues, 'CHECK_NO_CRON_CONTEXT', 'INFO', 'Evidence mentions cron/no-cron checks.', 'cron/crontab text found in evidence.', 'Confirm any cron mention is a no-cron assertion, not an attempted crontab call.');
  }
  for (const check of failedChecks) {
    addIssue(issues, `FAILED_CHECK_${slug(check.label)}`, 'BLOCKED', `Failed check: ${check.label}`, check.detail ?? '', 'Open terminal_demo_status.md and the referenced command log, then rerun this diagnosis after fixing the blocker.');
  }

  const blockedIssues = issues.filter((issue) => issue.severity === 'BLOCKED');
  const evidenceStatus = status?.status ?? 'UNKNOWN';
  const finalStatus = blockedIssues.length ? 'BLOCKED' : evidenceStatus === 'PASSED' ? 'PASSED' : loaded.sourceType === 'missing' ? 'BLOCKED' : 'NEEDS_REVIEW';
  return {
    proof: 'terminal-demo-evidence-diagnosis',
    status: finalStatus,
    checkedAt: new Date().toISOString(),
    repoVersion: version,
    sourceType: loaded.sourceType,
    sourcePath: loaded.sourcePath,
    evidenceStatus,
    statusPath,
    failedCheckCount: failedChecks.length,
    issueCount: issues.length,
    issues,
    nextAction: blockedIssues[0]?.nextAction ?? (finalStatus === 'PASSED' ? 'Evidence is clean for this milestone; continue toward v1.0 RC planning.' : 'Review the evidence status/logs and rerun the operator rehearsal proof.')
  };
}

function slug(value) {
  return String(value ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'unknown';
}

function writeReports(result) {
  const outDir = path.join(repoRoot, 'terminal/demo/runtime_logs/evidence_diagnosis', timestamp());
  mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'terminal_demo_evidence_diagnosis.json');
  const mdPath = path.join(outDir, 'terminal_demo_evidence_diagnosis.md');
  writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  writeFileSync(mdPath, [
    `# Terminal Demo Evidence Diagnosis — ${result.status}`,
    '',
    `- Repo version: ${result.repoVersion}`,
    `- Evidence source: ${result.sourcePath ?? 'not found'}`,
    `- Evidence status: ${result.evidenceStatus}`,
    `- Failed checks: ${result.failedCheckCount}`,
    '',
    '## Issues',
    ...(result.issues.length ? result.issues.map((issue) => `- ${issue.severity} — ${issue.id}: ${issue.title}\n  - Evidence: ${issue.evidence || 'n/a'}\n  - Next: ${issue.nextAction}`) : ['- PASS — No known evidence blockers detected.']),
    '',
    `## Next action\n${result.nextAction}`,
    ''
  ].join('\n'));
  return { jsonPath: relative(jsonPath), markdownPath: relative(mdPath) };
}

function runSelfTest() {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'terminal-demo-evidence-'));
  writeFileSync(path.join(temp, 'terminal_demo_status.json'), JSON.stringify({ status: 'BLOCKED', checks: [{ label: 'runner command', passed: false, detail: 'package.json not found at repo root' }] }));
  writeFileSync(path.join(temp, 'runner.log'), 'package.json not found at repo root: C:/repo/terminal/demo\n');
  const result = diagnose(loadFolder(temp));
  if (result.status !== 'BLOCKED' || !result.issues.some((issue) => issue.id === 'WINDOWS_RUNNER_REPO_ROOT')) {
    throw new Error('Self-test failed to classify Windows runner repo-root evidence.');
  }
  return {
    proof: 'terminal-demo-evidence-diagnosis-self-test',
    status: 'PASSED',
    checkedAt: new Date().toISOString(),
    repoVersion: result.repoVersion,
    checks: [{ label: 'classifies Windows runner repo-root evidence', passed: true, detail: 'WINDOWS_RUNNER_REPO_ROOT' }]
  };
}

const loaded = selfTest ? null : loadEvidence(positional[0]);
const result = selfTest ? runSelfTest() : diagnose(loaded);
const reports = selfTest ? {} : writeReports(result);
const output = { ...result, reports };
console.log(JSON.stringify(output, null, 2));
if (result.status === 'BLOCKED') process.exitCode = 1;
