#!/usr/bin/env node
/*
 * PhotoFrame Terminal Demo Mode v1.0 final release proof.
 * This is release-only evidence: it verifies the frozen v1 proof surface and
 * records a final release decision without adding Demo Mode runtime behavior.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceRoot = path.join(repoRoot, 'terminal', 'demo', 'runtime_logs', 'v1_release', timestamp);
mkdirSync(evidenceRoot, { recursive: true });

const checks = [];
const commands = [];
const version = readText('VERSION').trim();
const packageJson = JSON.parse(readText('package.json'));
const packageLock = existsSync(path.join(repoRoot, 'package-lock.json'))
  ? JSON.parse(readText('package-lock.json'))
  : null;

function readText(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function relative(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'command';
}

function check(label, passed, detail = '') {
  checks.push({ label, passed: Boolean(passed), detail });
}

function hasScript(name) {
  return Object.prototype.hasOwnProperty.call(packageJson.scripts ?? {}, name);
}

function textContains(relativePath, needle) {
  const absolute = path.join(repoRoot, relativePath);
  return existsSync(absolute) && readFileSync(absolute, 'utf8').includes(needle);
}

function parseJsonFromOutput(output) {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(output.slice(start, end + 1)); } catch { return null; }
}

function runCommand(label, command, args, timeout = 360000) {
  const logPath = path.join(evidenceRoot, `${slug(label)}.log`);
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout,
    maxBuffer: 24 * 1024 * 1024,
    shell: process.platform === 'win32',
    env: { ...process.env, TERMINAL_DEMO_COLUMNS: process.env.TERMINAL_DEMO_COLUMNS ?? '420' }
  });
  const finishedAt = new Date().toISOString();
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  writeFileSync(logPath, [
    `# ${label}`,
    `startedAt=${startedAt}`,
    `finishedAt=${finishedAt}`,
    `command=${command} ${args.join(' ')}`,
    `exitCode=${exitCode}`,
    '',
    '## stdout',
    stdout,
    '',
    '## stderr',
    stderr,
    ''
  ].join('\n'));
  commands.push({ label, command: `${command} ${args.join(' ')}`, exitCode, logPath: relative(logPath) });
  return { exitCode, stdout, stderr, logPath };
}

function collectFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) collectFiles(absolute, files);
    else if (stat.isFile()) files.push(absolute);
  }
  return files;
}

check('VERSION is final v1.0.0', version === '1.0.0', `VERSION=${version}`);
check('package.json version matches VERSION', packageJson.version === version, `package=${packageJson.version}`);
check('package-lock root version matches VERSION', packageLock?.version === version, `package-lock=${packageLock?.version ?? 'missing'}`);
check('package-lock package version matches VERSION', packageLock?.packages?.['']?.version === version, `package-lock.packages[""]=${packageLock?.packages?.['']?.version ?? 'missing'}`);

for (const script of [
  'proof:terminal-demo-v1-release',
  'proof:terminal-demo-v1-release-freeze',
  'proof:terminal-demo-rc-readiness',
  'proof:terminal-demo-transferable-package',
  'proof:dashboard-runtime-mode-boundary'
]) {
  check(`npm script is discoverable: ${script}`, hasScript(script), packageJson.scripts?.[script] ?? 'missing');
}

check('root v1 final release launcher exists', existsSync(path.join(repoRoot, 'VERIFY_TERMINAL_DEMO_V1_RELEASE.CMD')), 'VERIFY_TERMINAL_DEMO_V1_RELEASE.CMD');
check('v1 release-freeze launcher remains available', existsSync(path.join(repoRoot, 'VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD')), 'VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD');
check('v1 release checklist marks final release', textContains('docs/20_architecture_and_specs/openspec/terminal_demo_v1_release_freeze_checklist.md', 'TERMINAL_DEMO_MODE_V1_RELEASED'), 'terminal_demo_v1_release_freeze_checklist.md');
check('OpenSpec documents v1 final release', textContains('docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md', 'TERMINAL_DEMO_MODE_V1_RELEASED'), 'terminal demo OpenSpec');
check('README documents v1 final proof', textContains('README.md', 'proof:terminal-demo-v1-release'), 'README.md');
check('HOW_TO_RUN documents v1 final proof', textContains('HOW_TO_RUN.md', 'VERIFY_TERMINAL_DEMO_V1_RELEASE.CMD'), 'HOW_TO_RUN.md');

const freeze = runCommand('terminal-demo-v1-release-freeze', process.execPath, ['tools/run-terminal-demo-v1-release-freeze-proof.mjs']);
const freezeJson = parseJsonFromOutput(freeze.stdout);
check('v1 release-freeze proof passes', freeze.exitCode === 0 && freezeJson?.status === 'PASSED', `exit=${freeze.exitCode}; status=${freezeJson?.status ?? 'unparsed'}`);
check('v1 release-freeze decision remains ready', freezeJson?.releaseDecision === 'V1_READY_TO_RELEASE', freezeJson?.releaseDecision ?? 'missing');

const evidenceFiles = collectFiles(evidenceRoot).map((file) => relative(file));
check('v1 final evidence excludes source files',
  !evidenceFiles.some((file) => /(?:^|\/)(?:src|tools|server|dashboard|terminal\/demo\/src)\//.test(file)),
  'Only command logs and final release status files are written.');

const failed = checks.filter((entry) => !entry.passed);
const result = {
  proof: 'terminal-demo-v1-release',
  status: failed.length ? 'BLOCKED' : 'PASSED',
  checkedAt: new Date().toISOString(),
  version,
  packageVersion: packageJson.version,
  evidenceRoot: relative(evidenceRoot),
  commands,
  checks,
  releaseDecision: failed.length ? 'NOT_RELEASED' : 'TERMINAL_DEMO_MODE_V1_RELEASED'
};

writeFileSync(path.join(evidenceRoot, 'terminal_demo_v1_release.json'), JSON.stringify(result, null, 2));
writeFileSync(path.join(evidenceRoot, 'terminal_demo_v1_release.md'), [
  `# Terminal Demo Mode v1.0 Final Release — ${result.status}`,
  '',
  `- Version: ${version}`,
  `- Evidence folder: ${result.evidenceRoot}`,
  `- Release decision: ${result.releaseDecision}`,
  '',
  '## Commands',
  ...commands.map((entry) => `- ${entry.exitCode === 0 ? 'PASS' : 'BLOCKED'} — ${entry.label}: ${entry.command} → ${entry.logPath}`),
  '',
  '## Checks',
  ...checks.map((entry) => `- ${entry.passed ? 'PASS' : 'BLOCKED'} — ${entry.label}${entry.detail ? ` — ${entry.detail}` : ''}`),
  ''
].join('\n'));

console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
