#!/usr/bin/env node
/*
 * Operator release-candidate rehearsal pack for PhotoFrame Terminal Demo Mode.
 * Produces a terminal-demo-only evidence folder and ZIP bundle. The ZIP contains
 * status/log/proof outputs only; it never includes the source repository.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = process.cwd();
const version = readText('VERSION').trim();
const packageJson = JSON.parse(readText('package.json'));
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceRoot = path.join(repoRoot, 'terminal', 'demo', 'runtime_logs', 'operator_rehearsal', timestamp);
mkdirSync(evidenceRoot, { recursive: true });

const commands = [];
const checks = [];

function readText(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function check(label, passed, detail = '') {
  checks.push({ label, passed: Boolean(passed), detail });
}

function childEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.toLowerCase().startsWith('npm_')) env[key] = value;
  }
  env.TERMINAL_DEMO_COLUMNS = process.env.TERMINAL_DEMO_COLUMNS ?? '420';
  return env;
}

function runCommand(label, command, args) {
  const logPath = path.join(evidenceRoot, `${slug(label)}.log`);
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 10 * 1024 * 1024,
    env: childEnv(),
    shell: process.platform === 'win32'
  });
  const finishedAt = new Date().toISOString();
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const output = [
    `# ${label}`,
    `startedAt=${startedAt}`,
    `finishedAt=${finishedAt}`,
    `command=${command} ${args.join(' ')}`,
    `exitCode=${exitCode}`,
    '',
    '## stdout',
    result.stdout ?? '',
    '',
    '## stderr',
    result.stderr ?? '',
    ''
  ].join('\n');
  writeFileSync(logPath, output);
  commands.push({ label, command: `${command} ${args.join(' ')}`, exitCode, logPath: relative(logPath) });
  return { exitCode, stdout: result.stdout ?? '', stderr: result.stderr ?? '', logPath };
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'command';
}

function relative(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

function containsFile(relativePath, needle) {
  return readText(relativePath).includes(needle);
}

function collectFiles(dir) {
  const files = [];
  walk(dir, files);
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

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = (year - 1980) << 9 | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function u16(value) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(value & 0xffff, 0);
  return b;
}

function u32(value) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value >>> 0, 0);
  return b;
}

function writeStoredZip(sourceDir, zipPath) {
  const files = collectFiles(sourceDir).sort();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = dosDateTime(new Date());

  for (const file of files) {
    const relName = path.relative(sourceDir, file).replace(/\\/g, '/');
    const name = Buffer.from(relName, 'utf8');
    const content = readFileSync(file);
    const crc = crc32(content);
    const localHeader = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(now.time), u16(now.day),
      u32(crc), u32(content.length), u32(content.length), u16(name.length), u16(0), name
    ]);
    localParts.push(localHeader, content);
    centralParts.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(now.time), u16(now.day),
      u32(crc), u32(content.length), u32(content.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name
    ]));
    offset += localHeader.length + content.length;
  }

  const central = Buffer.concat(centralParts);
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(central.length), u32(offset), u16(0)
  ]);
  writeFileSync(zipPath, Buffer.concat([...localParts, central, end]));
}

const repoFolderName = path.basename(repoRoot);
const allowWorkFolderName = process.env.TERMINAL_DEMO_ALLOW_WORK_FOLDER_NAME === '1';
check('VERSION is 0.14.0', version === '0.14.0', `VERSION=${version}`);
check('package.json version matches VERSION', packageJson.version === version, `package.json=${packageJson.version}`);
check('repo folder name matches version', allowWorkFolderName || repoFolderName.includes(`v${version}`), `folder=${repoFolderName}`);
check('Windows terminal runner exists', existsSync(path.join(repoRoot, 'terminal/demo/windows_runner.cmd')), 'terminal/demo/windows_runner.cmd');
check('root verification launcher exists', existsSync(path.join(repoRoot, 'VERIFY_TERMINAL_DEMO.CMD')), 'VERIFY_TERMINAL_DEMO.CMD');
check('terminal verification launcher exists', existsSync(path.join(repoRoot, 'terminal/demo/windows_verify_terminal_demo.cmd')), 'terminal/demo/windows_verify_terminal_demo.cmd');
check('operator rehearsal script is registered', containsFile('package.json', 'proof:terminal-demo-operator-rehearsal'), 'package.json script');
check('evidence diagnosis launcher exists', existsSync(path.join(repoRoot, 'ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD')), 'ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD');
check('evidence diagnosis script is registered', containsFile('package.json', 'terminal-demo:evidence-diagnosis'), 'package.json script');
check('runner diagnostics mention PhotoFrame repo and final proof',
  containsFile('terminal/demo/scripts/windows/run_terminal_demo.ps1', 'PhotoFrame repo:')
    && containsFile('terminal/demo/scripts/windows/run_terminal_demo.ps1', 'proof:terminal-demo-operator-rehearsal'),
  'Windows runner prints repo root and verification command.');

console.error('[terminal-demo-operator-rehearsal] running final proof...');
const finalProof = runCommand('terminal-demo-final-proof', process.execPath, ['tools/run-terminal-demo-final-guard-proof.mjs', 'final']);
console.error('[terminal-demo-operator-rehearsal] final proof finished with exit ' + finalProof.exitCode);
check('terminal demo final proof passes', finalProof.exitCode === 0 && finalProof.stdout.includes('"status": "PASSED"'), `exit=${finalProof.exitCode}`);

check('terminal demo merge smoke is covered by final proof', finalProof.stdout.includes('smoke command passes'), 'Group 6B final proof invokes terminal/demo/scripts/verify-smoke.mjs.');

const resultBeforeBundle = () => ({
  proof: 'terminal-demo-operator-rehearsal',
  status: checks.some((entry) => !entry.passed) ? 'BLOCKED' : 'PASSED',
  checkedAt: new Date().toISOString(),
  repoRoot,
  repoFolderName,
  version,
  packageVersion: packageJson.version,
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  evidenceRoot: relative(evidenceRoot),
  commands,
  checks
});

const statusPath = path.join(evidenceRoot, 'terminal_demo_status.json');
writeFileSync(statusPath, JSON.stringify(resultBeforeBundle(), null, 2));

const markdownPath = path.join(evidenceRoot, 'terminal_demo_status.md');
const statusForMd = resultBeforeBundle();
writeFileSync(markdownPath, [
  `# Terminal Demo Operator Rehearsal — ${statusForMd.status}`,
  '',
  `- Version: ${version}`,
  `- Repo folder: ${repoFolderName}`,
  `- Evidence folder: ${relative(evidenceRoot)}`,
  '',
  '## Commands',
  ...commands.map((entry) => `- ${entry.exitCode === 0 ? 'PASS' : 'BLOCKED'} — ${entry.label}: \`${entry.command}\` → ${entry.logPath}`),
  '',
  '## Checks',
  ...checks.map((entry) => `- ${entry.passed ? 'PASS' : 'BLOCKED'} — ${entry.label}${entry.detail ? ` — ${entry.detail}` : ''}`),
  ''
].join('\n'));

const zipPath = path.join(evidenceRoot, `terminal_demo_operator_rehearsal_${version}_${timestamp}.zip`);
console.error('[terminal-demo-operator-rehearsal] writing evidence zip...');
writeStoredZip(evidenceRoot, zipPath);
console.error('[terminal-demo-operator-rehearsal] evidence zip written.');
check('terminal-demo-only evidence ZIP exists', existsSync(zipPath), relative(zipPath));
check('evidence ZIP is inside terminal/demo/runtime_logs/operator_rehearsal', relative(zipPath).startsWith('terminal/demo/runtime_logs/operator_rehearsal/'), relative(zipPath));
check('evidence ZIP does not include source repo files', !collectFiles(evidenceRoot).some((file) => /(?:^|[\\/])src[\\/].*\.(?:ts|js)$/.test(path.relative(evidenceRoot, file))), 'Bundle source is evidence folder only.');

const finalResult = resultBeforeBundle();
finalResult.evidenceZip = relative(zipPath);
writeFileSync(statusPath, JSON.stringify(finalResult, null, 2));
writeFileSync(markdownPath, [
  `# Terminal Demo Operator Rehearsal — ${finalResult.status}`,
  '',
  `- Version: ${version}`,
  `- Repo folder: ${repoFolderName}`,
  `- Evidence folder: ${relative(evidenceRoot)}`,
  `- Evidence ZIP: ${relative(zipPath)}`,
  '',
  '## Commands',
  ...commands.map((entry) => `- ${entry.exitCode === 0 ? 'PASS' : 'BLOCKED'} — ${entry.label}: \`${entry.command}\` → ${entry.logPath}`),
  '',
  '## Checks',
  ...checks.map((entry) => `- ${entry.passed ? 'PASS' : 'BLOCKED'} — ${entry.label}${entry.detail ? ` — ${entry.detail}` : ''}`),
  ''
].join('\n'));

console.log(JSON.stringify(finalResult, null, 2));
if (finalResult.status !== 'PASSED') process.exitCode = 1;
