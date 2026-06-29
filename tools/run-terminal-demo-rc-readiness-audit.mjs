#!/usr/bin/env node
/*
 * PhotoFrame Terminal Demo v1.0 RC readiness audit.
 * Runs existing terminal-demo proofs and verifies operator command discovery.
 * Evidence written here contains logs/status only, never the source repo.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceRoot = path.join(repoRoot, 'terminal', 'demo', 'runtime_logs', 'rc_readiness', timestamp);
mkdirSync(evidenceRoot, { recursive: true });

const commands = [];
const checks = [];
const packageJson = JSON.parse(readText('package.json'));
const version = readText('VERSION').trim();

function readText(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function check(label, passed, detail = '') {
  checks.push({ label, passed: Boolean(passed), detail });
}

function relative(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'command';
}

function runCommand(label, command, args, extraEnv = {}) {
  const logPath = path.join(evidenceRoot, `${slug(label)}.log`);
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 12 * 1024 * 1024,
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv, TERMINAL_DEMO_COLUMNS: process.env.TERMINAL_DEMO_COLUMNS ?? '420' }
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

function hasScript(name) {
  return Object.prototype.hasOwnProperty.call(packageJson.scripts ?? {}, name);
}

function parseJsonFromOutput(output) {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(output.slice(start, end + 1)); } catch { return null; }
}

function latestFileUnder(root, fileName) {
  const matches = [];
  walk(root, matches, fileName);
  return matches.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

function walk(dir, matches, fileName) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walk(absolute, matches, fileName);
    else if (stat.isFile() && path.basename(absolute) === fileName) matches.push(absolute);
  }
}

function textContains(relativePath, needle) {
  return existsSync(path.join(repoRoot, relativePath)) && readText(relativePath).includes(needle);
}

check('VERSION and package.json match', packageJson.version === version, `VERSION=${version}; package=${packageJson.version}`);
check('current milestone version is active', /^\d+\.\d+\.\d+$/.test(version), `VERSION=${version}`);
check('root operator verifier exists', existsSync(path.join(repoRoot, 'VERIFY_TERMINAL_DEMO.CMD')), 'VERIFY_TERMINAL_DEMO.CMD');
check('root RC verifier exists', existsSync(path.join(repoRoot, 'VERIFY_TERMINAL_DEMO_RC.CMD')), 'VERIFY_TERMINAL_DEMO_RC.CMD');
check('evidence diagnosis launcher exists', existsSync(path.join(repoRoot, 'ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD')), 'ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD');
check('transferable package verifier exists', existsSync(path.join(repoRoot, 'VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD')), 'VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD');

for (const script of [
  'proof:terminal-demo-final',
  'proof:terminal-demo-operator-rehearsal',
  'terminal-demo:evidence-diagnosis',
  'proof:terminal-demo-evidence-diagnosis',
  'proof:terminal-demo-rc-readiness',
  'proof:terminal-demo-transferable-package',
  'proof:dashboard-runtime-mode-boundary',
  'demo:terminal:real:smoke',
  'demo:terminal:mock:smoke'
]) {
  check(`npm script is discoverable: ${script}`, hasScript(script), packageJson.scripts?.[script] ?? 'missing');
}

check('operator verifier prints PASS/BLOCKED outcomes',
  textContains('VERIFY_TERMINAL_DEMO.CMD', 'PASSED') && textContains('VERIFY_TERMINAL_DEMO.CMD', 'BLOCKED'),
  'VERIFY_TERMINAL_DEMO.CMD has clear terminal summary wording.');
check('RC verifier prints PASS/BLOCKED outcomes',
  textContains('VERIFY_TERMINAL_DEMO_RC.CMD', 'PASSED') && textContains('VERIFY_TERMINAL_DEMO_RC.CMD', 'BLOCKED'),
  'VERIFY_TERMINAL_DEMO_RC.CMD has clear terminal summary wording.');
check('transferable package verifier prints PASS/BLOCKED outcomes',
  textContains('VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD', 'PASSED') && textContains('VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD', 'BLOCKED'),
  'VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD has clear terminal summary wording.');
check('terminal README documents RC audit command',
  textContains('terminal/demo/README.md', 'proof:terminal-demo-rc-readiness'),
  'terminal/demo/README.md');
check('OpenSpec documents RC readiness gate',
  textContains('docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md', 'v1.0 RC readiness'),
  'terminal demo OpenSpec');
check('OpenSpec documents transferable package proof',
  textContains('docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md', 'transferable RC package'),
  'terminal demo OpenSpec');

const finalProof = runCommand('terminal-demo-final-proof', process.execPath, ['tools/run-terminal-demo-final-guard-proof.mjs', 'final']);
check('final guard proof passes', finalProof.exitCode === 0 && finalProof.stdout.includes('"status": "PASSED"'), `exit=${finalProof.exitCode}`);

const rehearsal = runCommand('terminal-demo-operator-rehearsal', process.execPath, ['tools/run-terminal-demo-operator-rehearsal.mjs'], { TERMINAL_DEMO_OPERATOR_REHEARSAL_ASSUME_FINAL_PASSED: '1' });
const rehearsalJson = parseJsonFromOutput(rehearsal.stdout);
check('operator rehearsal command passes', rehearsal.exitCode === 0 && rehearsalJson?.status === 'PASSED', `exit=${rehearsal.exitCode}; status=${rehearsalJson?.status ?? 'unparsed'}`);
check('operator rehearsal produced evidence ZIP', Boolean(rehearsalJson?.evidenceZip), rehearsalJson?.evidenceZip ?? 'missing');

const evidenceArg = rehearsalJson?.evidenceZip ?? relative(latestFileUnder(path.join(repoRoot, 'terminal/demo/runtime_logs/operator_rehearsal'), 'terminal_demo_status.json') ?? '');
const diagnosisArgs = ['tools/run-terminal-demo-evidence-diagnosis.mjs'];
if (evidenceArg) diagnosisArgs.push(evidenceArg);
const diagnosis = runCommand('terminal-demo-evidence-diagnosis', process.execPath, diagnosisArgs);
const diagnosisJson = parseJsonFromOutput(diagnosis.stdout);
check('evidence diagnosis command passes on rehearsal evidence', diagnosis.exitCode === 0 && diagnosisJson?.status === 'PASSED', `exit=${diagnosis.exitCode}; status=${diagnosisJson?.status ?? 'unparsed'}`);
check('evidence diagnosis writes reports', Boolean(diagnosisJson?.reports?.jsonPath && diagnosisJson?.reports?.markdownPath), JSON.stringify(diagnosisJson?.reports ?? {}));

const packageProof = runCommand('terminal-demo-transferable-package-proof', process.execPath, ['tools/run-terminal-demo-transferable-package-proof.mjs']);
const packageProofJson = parseJsonFromOutput(packageProof.stdout);
check('transferable package proof passes', packageProof.exitCode === 0 && packageProofJson?.status === 'PASSED', `exit=${packageProof.exitCode}; status=${packageProofJson?.status ?? 'unparsed'}`);
check('transferable package proof marks package ready', packageProofJson?.packageDecision === 'TRANSFERABLE_RC_PACKAGE_READY', packageProofJson?.packageDecision ?? 'missing');

const modeBoundaryProof = runCommand('dashboard-runtime-mode-boundary-proof', process.execPath, ['tools/run-dashboard-runtime-mode-boundary-proof.mjs']);
const modeBoundaryJson = parseJsonFromOutput(modeBoundaryProof.stdout);
check('dashboard runtime mode boundary proof passes', modeBoundaryProof.exitCode === 0 && modeBoundaryJson?.status === 'PASSED', `exit=${modeBoundaryProof.exitCode}; status=${modeBoundaryJson?.status ?? 'unparsed'}`);
check('dashboard demo mode stays out of real/test-only services', modeBoundaryJson?.decision === 'DEMO_BOUNDARY_EXPLICIT', modeBoundaryJson?.decision ?? 'missing');

check('RC evidence folder excludes source files', !collectEvidenceFiles().some((file) => /(?:^|[\\/])(?:src|tools)[\\/].*\.(?:ts|js|mjs)$/.test(path.relative(evidenceRoot, file))), 'Only logs/status files are written under rc_readiness.');

function collectEvidenceFiles() {
  const files = [];
  collect(evidenceRoot, files);
  return files;
}

function collect(dir, files) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) collect(absolute, files);
    else if (stat.isFile()) files.push(absolute);
  }
}

const failed = checks.filter((entry) => !entry.passed);
const result = {
  proof: 'terminal-demo-rc-readiness',
  status: failed.length ? 'BLOCKED' : 'PASSED',
  checkedAt: new Date().toISOString(),
  version,
  packageVersion: packageJson.version,
  evidenceRoot: relative(evidenceRoot),
  commands,
  checks,
  rcDecision: failed.length ? 'NOT_RC1' : 'RC1_READY_FOR_OPERATOR_REHEARSAL'
};

writeFileSync(path.join(evidenceRoot, 'terminal_demo_rc_readiness.json'), JSON.stringify(result, null, 2));
writeFileSync(path.join(evidenceRoot, 'terminal_demo_rc_readiness.md'), [
  `# Terminal Demo RC Readiness — ${result.status}`,
  '',
  `- Version: ${version}`,
  `- Evidence folder: ${relative(evidenceRoot)}`,
  `- RC decision: ${result.rcDecision}`,
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
