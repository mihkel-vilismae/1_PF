#!/usr/bin/env node
/*
 * PhotoFrame Terminal Demo transferable RC package proof.
 * Verifies package hygiene only; it does not run or change Demo Mode behavior.
 * Evidence written here contains logs/status only, never source files.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceRoot = path.join(repoRoot, 'terminal', 'demo', 'runtime_logs', 'transferable_package', timestamp);
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

function check(label, passed, detail = '') {
  checks.push({ label, passed: Boolean(passed), detail });
}

function run(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
    shell: process.platform === 'win32'
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  commands.push({ label, command: `${command} ${args.join(' ')}`, exitCode, stdout: stdout.trim(), stderr: stderr.trim() });
  return { exitCode, stdout, stderr };
}

function git(label, args) {
  return run(label, 'git', args);
}

function hasScript(name) {
  return Object.prototype.hasOwnProperty.call(packageJson.scripts ?? {}, name);
}

function fileSha256(relativePath) {
  return createHash('sha256').update(readFileSync(path.join(repoRoot, relativePath))).digest('hex');
}

function fileContains(relativePath, needle) {
  const absolute = path.join(repoRoot, relativePath);
  return existsSync(absolute) && readFileSync(absolute, 'utf8').includes(needle);
}

function collectFiles(root) {
  const files = [];
  walk(root, files);
  return files;
}

function walk(dir, files) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walk(absolute, files);
    else if (stat.isFile()) files.push(absolute);
  }
}

check('VERSION and package.json match', packageJson.version === version, `VERSION=${version}; package=${packageJson.version}`);
check('package-lock root version matches VERSION', packageLock?.version === version, `package-lock=${packageLock?.version ?? 'missing'}`);
check('package-lock package version matches VERSION', packageLock?.packages?.['']?.version === version, `package-lock.packages[""]=${packageLock?.packages?.['']?.version ?? 'missing'}`);
check('current version is a milestone semver', /^\d+\.\d+\.\d+$/.test(version), `VERSION=${version}`);

for (const file of [
  'TRANSFERABLE_REPO_PACKAGER.cmd',
  'VERIFY_TERMINAL_DEMO.CMD',
  'VERIFY_TERMINAL_DEMO_RC.CMD',
  'ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD'
]) {
  check(`root file exists: ${file}`, existsSync(path.join(repoRoot, file)), file);
}

const trackedPackager = git('git-ls-files-packager', ['ls-files', '--error-unmatch', 'TRANSFERABLE_REPO_PACKAGER.cmd']);
check('TRANSFERABLE_REPO_PACKAGER.cmd is tracked by Git', trackedPackager.exitCode === 0, trackedPackager.stdout.trim() || trackedPackager.stderr.trim());
check('TRANSFERABLE_REPO_PACKAGER.cmd is self-contained',
  fileContains('TRANSFERABLE_REPO_PACKAGER.cmd', '# POWERSHELL_PAYLOAD_START') &&
  fileContains('TRANSFERABLE_REPO_PACKAGER.cmd', 'pack_repo_zip.py') &&
  fileContains('TRANSFERABLE_REPO_PACKAGER.cmd', 'Includes .git/ by default'),
  `sha256=${existsSync(path.join(repoRoot, 'TRANSFERABLE_REPO_PACKAGER.cmd')) ? fileSha256('TRANSFERABLE_REPO_PACKAGER.cmd') : 'missing'}`);

for (const script of [
  'proof:terminal-demo-transferable-package',
  'proof:terminal-demo-rc-readiness',
  'proof:terminal-demo-final',
  'proof:terminal-demo-operator-rehearsal',
  'terminal-demo:evidence-diagnosis'
]) {
  check(`npm script is discoverable: ${script}`, hasScript(script), packageJson.scripts?.[script] ?? 'missing');
}

check('root ZIP outputs are ignored by Git', fileContains('.gitignore', '/*.zip'), '.gitignore contains /*.zip');
check('terminal demo runtime evidence is ignored by Git', fileContains('.gitignore', 'terminal/demo/runtime_logs/'), '.gitignore contains terminal/demo/runtime_logs/');
check('terminal README documents transferable package proof', fileContains('terminal/demo/README.md', 'proof:terminal-demo-transferable-package'), 'terminal/demo/README.md');
check('OpenSpec documents transferable package proof', fileContains('docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md', 'transferable RC package'), 'terminal demo OpenSpec');

const head = git('git-rev-parse-head', ['rev-parse', '--short', 'HEAD']);
check('Git HEAD is readable', head.exitCode === 0, head.stdout.trim() || head.stderr.trim());

const fsck = git('git-fsck-no-dangling', ['fsck', '--no-dangling']);
check('git fsck --no-dangling passes', fsck.exitCode === 0, fsck.stderr.trim() || 'ok');

const status = git('git-status-short', ['status', '--short', '--untracked-files=all']);
check('Git worktree is clean after extraction', status.exitCode === 0 && status.stdout.trim() === '', status.stdout.trim() || 'clean');

const evidenceFiles = collectFiles(evidenceRoot).map((file) => relative(file));
check('transferable proof evidence excludes source files',
  !evidenceFiles.some((file) => /(?:^|\/)(?:src|tools|server|dashboard|terminal\/demo\/src)\//.test(file)),
  'Only status reports are written under terminal/demo/runtime_logs/transferable_package.');

const failed = checks.filter((entry) => !entry.passed);
const result = {
  proof: 'terminal-demo-transferable-package',
  status: failed.length ? 'BLOCKED' : 'PASSED',
  checkedAt: new Date().toISOString(),
  version,
  packageVersion: packageJson.version,
  gitHead: head.stdout.trim(),
  evidenceRoot: relative(evidenceRoot),
  commands: commands.map((entry) => ({
    label: entry.label,
    command: entry.command,
    exitCode: entry.exitCode,
    stdout: entry.stdout.slice(0, 2000),
    stderr: entry.stderr.slice(0, 2000)
  })),
  checks,
  packageDecision: failed.length ? 'NOT_TRANSFERABLE_RC' : 'TRANSFERABLE_RC_PACKAGE_READY'
};

writeFileSync(path.join(evidenceRoot, 'terminal_demo_transferable_package.json'), JSON.stringify(result, null, 2));
writeFileSync(path.join(evidenceRoot, 'terminal_demo_transferable_package.md'), [
  `# Terminal Demo Transferable Package — ${result.status}`,
  '',
  `- Version: ${version}`,
  `- Git HEAD: ${result.gitHead || 'unknown'}`,
  `- Evidence folder: ${result.evidenceRoot}`,
  `- Package decision: ${result.packageDecision}`,
  '',
  '## Checks',
  ...checks.map((entry) => `- ${entry.passed ? 'PASS' : 'BLOCKED'} — ${entry.label}${entry.detail ? ` — ${entry.detail}` : ''}`),
  ''
].join('\n'));

console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
