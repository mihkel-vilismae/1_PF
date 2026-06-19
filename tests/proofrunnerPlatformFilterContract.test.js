import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../package.json' with { type: 'json' };
import { analyzePlatformProofQueuePlan, analyzeRaspberryHandoffLauncherText, buildAcceptedRaspberryLauncherSnippet } from '../tools/proofrunner-platform-filter-contract-lib.mjs';

test('Raspberry proofrunner excludes Windows-only package-script aliases', () => {
  const analysis = analyzePlatformProofQueuePlan(pkg, { platformRunner: 'raspberryos_bash' });
  assert.equal(analysis.status, 'PASSED');
  assert.equal(analysis.plan.ordered_proofs.some((name) => name.endsWith(':windows')), false);
  assert.ok(analysis.plan.skipped_windows_aliases.includes('proof:live-windows-native-playback:windows'));
  assert.ok(analysis.plan.skipped_windows_aliases.includes('proof:live-windows-scheduler:windows'));
  assert.equal(analysis.plan.ordered_proofs.at(-1), 'proof:proof-runner-final-summary');
});

test('Windows proofrunner keeps Windows-only package-script aliases', () => {
  const analysis = analyzePlatformProofQueuePlan(pkg, { platformRunner: 'windows_powershell' });
  assert.equal(analysis.status, 'PASSED');
  assert.ok(analysis.plan.ordered_proofs.includes('proof:live-windows-native-playback:windows'));
  assert.ok(analysis.plan.ordered_proofs.includes('proof:live-windows-scheduler:windows'));
});

test('Raspberry handoff launcher contract rejects blind proof:* discovery', () => {
  const blindLauncher = "Object.keys(p.scripts).filter(k=>k.startsWith('proof:')).sort()";
  const analysis = analyzeRaspberryHandoffLauncherText(blindLauncher);
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'sets_include_windows_aliases_false').passed, false);
});

test('Raspberry handoff launcher contract accepts platform-aware helper usage', () => {
  const analysis = analyzeRaspberryHandoffLauncherText(buildAcceptedRaspberryLauncherSnippet());
  assert.equal(analysis.status, 'PASSED');
});
