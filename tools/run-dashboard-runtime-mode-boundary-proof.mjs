#!/usr/bin/env node
/*
 * Verifies that dashboard demo mode remains a dashboard/terminal-demo mode and
 * cannot be passed directly into legacy database, playback, or native playback
 * services that are still explicitly real/test-only.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const checkedAt = new Date().toISOString();
const evidenceDir = path.join(repoRoot, 'terminal', 'demo', 'runtime_logs', 'mode_boundary', checkedAt.replace(/[:.]/g, '-'));
mkdirSync(evidenceDir, { recursive: true });

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function check(label, passed, detail = '') {
  checks.push({ label, passed: Boolean(passed), detail });
}

const checks = [];
const indexSource = read('server/index.ts');
const runtimeModeSource = read('server/runtimeModeEnv.ts');
const packageJson = JSON.parse(read('package.json'));

check(
  'dashboard runtime mode explicitly includes demo',
  /export type DashboardRuntimeMode\s*=\s*'real'\s*\|\s*'test'\s*\|\s*'demo'/.test(runtimeModeSource),
  'server/runtimeModeEnv.ts',
);
check(
  'real/test request context boundary helper exists',
  /function requireRealOrTestRequestContext\(context: RequestContext, operation: string\): RealOrTestRequestContext/.test(indexSource),
  'server/index.ts',
);
check(
  'demo mode is blocked from legacy real/test-only surfaces',
  indexSource.includes("context.runtimeMode === 'demo'")
    && indexSource.includes('demo_mode_requires_terminal_demo_surface')
    && indexSource.includes('Use terminal Demo Mode DEMO-owned surfaces instead.'),
  'server/index.ts',
);
check(
  'test-only proof route keeps an explicit Test Mode guard',
  /function requireTestRequestContext\(context: RequestContext, operation: string\): TestRequestContext/.test(indexSource)
    && indexSource.includes("context.runtimeMode !== 'test'"),
  'server/index.ts',
);

for (const [label, relativePath] of [
  ['database service context remains real/test-only', 'server/database/databaseService.ts'],
  ['native playback context remains real/test-only', 'server/nativePlayback/nativePlaybackController.ts'],
  ['playback contract context remains real/test-only', 'server/playback/playbackContractService.ts'],
]) {
  const source = read(relativePath);
  check(label, /runtimeMode\?: 'real' \| 'test'/.test(source) || /runtimeMode: 'real' \| 'test'/.test(source), relativePath);
  check(`${label} does not accept demo`, !/runtimeMode\??: 'real' \| 'test' \| 'demo'/.test(source), relativePath);
}

const directLegacyContextPatterns = [
  /buildPlaybackContract\(\{\s*\n\s*context,/,
  /resolvePlaybackAssetMediaPath\(\{\s*\n\s*context,/,
  /getNativePlaybackStatus\(\{\s*context: \{ \.\.\.context,/,
  /detectNativePlayback\(\{\s*context: \{ \.\.\.context,/,
  /startCurrentNativePlayback\(\{\s*context,/,
  /stopNativePlayback\(\{\s*context: \{ \.\.\.context,/,
  /getDatabaseService\(\)\.buildDatabaseStatus\(context\)/,
  /getDatabaseService\(\)\.recreateEmptyDatabase\(context\)/,
  /getDatabaseService\(\)\.inspectDatabase\(context\)/,
  /getDatabaseService\(\)\.deleteDatabaseArtifacts\(context\)/,
  /getDatabaseService\(\)\.listDatabaseViewerTables\(context\)/,
  /getDatabaseService\(\)\.loadDatabaseViewerRows\(context,/,
];
const directMatches = directLegacyContextPatterns.filter((pattern) => pattern.test(indexSource)).map(String);
check('server routes do not pass demo-capable context directly into real/test-only services', directMatches.length === 0, directMatches.join('\n'));

const boundaryUseCount = (indexSource.match(/requireRealOrTestRequestContext\(/g) ?? []).length - 1;
check('real/test boundary helper is used by legacy runtime surfaces', boundaryUseCount >= 15, `${boundaryUseCount} guarded call sites`);
check(
  'proof script is registered',
  packageJson.scripts?.['proof:dashboard-runtime-mode-boundary'] === 'node tools/run-dashboard-runtime-mode-boundary-proof.mjs',
  'package.json scripts',
);

const failed = checks.filter((entry) => !entry.passed);
const result = {
  proof: 'dashboard-runtime-mode-boundary',
  status: failed.length ? 'BLOCKED' : 'PASSED',
  checkedAt,
  evidenceRoot: path.relative(repoRoot, evidenceDir).replace(/\\/g, '/'),
  checks,
  decision: failed.length ? 'DEMO_BOUNDARY_BLOCKED' : 'DEMO_BOUNDARY_EXPLICIT',
};

writeFileSync(path.join(evidenceDir, 'dashboard_runtime_mode_boundary.json'), JSON.stringify(result, null, 2));
writeFileSync(path.join(evidenceDir, 'dashboard_runtime_mode_boundary.md'), [
  `# Dashboard Runtime Mode Boundary — ${result.status}`,
  '',
  `- Decision: ${result.decision}`,
  `- Checked at: ${checkedAt}`,
  '',
  '## Checks',
  ...checks.map((entry) => `- ${entry.passed ? 'PASS' : 'BLOCKED'} — ${entry.label}${entry.detail ? ` — ${entry.detail}` : ''}`),
  '',
].join('\n'));

console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
