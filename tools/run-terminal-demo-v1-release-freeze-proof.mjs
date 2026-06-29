#!/usr/bin/env node
/*
 * PhotoFrame Terminal Demo v1.0 release-freeze proof.
 * Collects final go/no-go evidence only; it does not add or run new Demo Mode behavior.
 * Evidence written here contains logs/status only, never source repository files.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceRoot = path.join(repoRoot, 'terminal', 'demo', 'runtime_logs', 'v1_release_freeze', timestamp);
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

function runCommand(label, command, args, timeout = 240000) {
  const logPath = path.join(evidenceRoot, `${slug(label)}.log`);
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout,
    maxBuffer: 16 * 1024 * 1024,
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

check('VERSION and package.json match', packageJson.version === version, `VERSION=${version}; package=${packageJson.version}`);
check('package-lock root version matches VERSION', packageLock?.version === version, `package-lock=${packageLock?.version ?? 'missing'}`);
check('package-lock package version matches VERSION', packageLock?.packages?.['']?.version === version, `package-lock.packages[""]=${packageLock?.packages?.['']?.version ?? 'missing'}`);
check('version is a pre-v1 release-freeze milestone', /^0\.18\.0$/.test(version), `VERSION=${version}`);

for (const script of [
  'build',
  'typecheck',
  'proof:terminal-demo-final',
  'proof:terminal-demo-operator-rehearsal',
  'proof:terminal-demo-evidence-diagnosis',
  'proof:dashboard-runtime-mode-boundary',
  'proof:terminal-demo-transferable-package',
  'proof:terminal-demo-rc-readiness',
  'proof:terminal-demo-v1-release-freeze'
]) {
  check(`npm script is discoverable: ${script}`, hasScript(script), packageJson.scripts?.[script] ?? 'missing');
}

check('root v1 release-freeze launcher exists', existsSync(path.join(repoRoot, 'VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD')), 'VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD');
check('terminal README documents v1 release-freeze proof', textContains('terminal/demo/README.md', 'proof:terminal-demo-v1-release-freeze'), 'terminal/demo/README.md');
check('OpenSpec documents v1 release-freeze gate', textContains('docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md', 'V1_READY_TO_RELEASE'), 'terminal demo OpenSpec');
check('v1 release checklist exists', existsSync(path.join(repoRoot, 'docs/20_architecture_and_specs/openspec/terminal_demo_v1_release_freeze_checklist.md')), 'terminal_demo_v1_release_freeze_checklist.md');
check('v1 checklist declares no new runtime behavior', textContains('docs/20_architecture_and_specs/openspec/terminal_demo_v1_release_freeze_checklist.md', 'No new terminal-demo runtime behavior'), 'v1 release checklist');

const build = runCommand('build', 'npm', ['run', 'build']);
check('build passes', build.exitCode === 0, `exit=${build.exitCode}`);

const typecheck = runCommand('typecheck', 'npm', ['run', 'typecheck']);
check('typecheck passes', typecheck.exitCode === 0, `exit=${typecheck.exitCode}`);

const finalProof = runCommand('terminal-demo-final-proof', process.execPath, ['tools/run-terminal-demo-final-guard-proof.mjs', 'final']);
check('terminal demo final proof passes', finalProof.exitCode === 0 && finalProof.stdout.includes('"status": "PASSED"'), `exit=${finalProof.exitCode}`);

const packageProof = runCommand('terminal-demo-transferable-package-proof', process.execPath, ['tools/run-terminal-demo-transferable-package-proof.mjs']);
const packageJsonOut = parseJsonFromOutput(packageProof.stdout);
check('transferable package proof passes', packageProof.exitCode === 0 && packageJsonOut?.status === 'PASSED', `exit=${packageProof.exitCode}; status=${packageJsonOut?.status ?? 'unparsed'}`);
check('transferable package decision stays ready', packageJsonOut?.packageDecision === 'TRANSFERABLE_RC_PACKAGE_READY', packageJsonOut?.packageDecision ?? 'missing');

const boundaryProof = runCommand('dashboard-runtime-mode-boundary-proof', process.execPath, ['tools/run-dashboard-runtime-mode-boundary-proof.mjs']);
const boundaryJson = parseJsonFromOutput(boundaryProof.stdout);
check('dashboard runtime mode boundary proof passes', boundaryProof.exitCode === 0 && boundaryJson?.status === 'PASSED', `exit=${boundaryProof.exitCode}; status=${boundaryJson?.status ?? 'unparsed'}`);
check('demo boundary decision stays explicit', boundaryJson?.decision === 'DEMO_BOUNDARY_EXPLICIT', boundaryJson?.decision ?? 'missing');

const rcProof = runCommand('terminal-demo-rc-readiness', process.execPath, ['tools/run-terminal-demo-rc-readiness-audit.mjs']);
const rcJson = parseJsonFromOutput(rcProof.stdout);
check('RC readiness proof passes', rcProof.exitCode === 0 && rcJson?.status === 'PASSED', `exit=${rcProof.exitCode}; status=${rcJson?.status ?? 'unparsed'}`);
check('RC decision remains ready for operator rehearsal', rcJson?.rcDecision === 'RC1_READY_FOR_OPERATOR_REHEARSAL', rcJson?.rcDecision ?? 'missing');

const evidenceFiles = collectFiles(evidenceRoot).map((file) => relative(file));
check('v1 release-freeze evidence excludes source files',
  !evidenceFiles.some((file) => /(?:^|\/)(?:src|tools|server|dashboard|terminal\/demo\/src)\//.test(file)),
  'Only command logs and release-freeze status files are written.');

const failed = checks.filter((entry) => !entry.passed);
const result = {
  proof: 'terminal-demo-v1-release-freeze',
  status: failed.length ? 'BLOCKED' : 'PASSED',
  checkedAt: new Date().toISOString(),
  version,
  packageVersion: packageJson.version,
  evidenceRoot: relative(evidenceRoot),
  commands,
  checks,
  releaseDecision: failed.length ? 'NOT_READY_FOR_V1' : 'V1_READY_TO_RELEASE'
};

writeFileSync(path.join(evidenceRoot, 'terminal_demo_v1_release_freeze.json'), JSON.stringify(result, null, 2));
writeFileSync(path.join(evidenceRoot, 'terminal_demo_v1_release_freeze.md'), [
  `# Terminal Demo v1.0 Release Freeze — ${result.status}`,
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
