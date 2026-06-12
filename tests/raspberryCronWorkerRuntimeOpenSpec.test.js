/**
 * Guards the v0.8.44 Raspberry cron worker runtime OpenSpec slice.
 * This is documentation/test coverage only; it must not imply runtime cron proof exists.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/raspberry_cron_worker_runtime_openspec.md';
const proofPlanPath = 'docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Raspberry cron worker runtime OpenSpec and proof plan exist', () => {
  assert.equal(existsSync(openSpecPath), true);
  assert.equal(existsSync(proofPlanPath), true);
});

test('Raspberry app-running definition requires cron plus all three worker lanes', () => {
  const spec = read(openSpecPath);

  assert.match(spec, /PhotoFrame may only be called “running”/);
  assert.match(spec, /cron mechanism is active/);

  for (const expected of [
    '`regular_stage_worker` | every 10 minutes',
    '`playback_worker` | every 1 minute',
    '`screen_on_off_worker` | every 3 minutes',
  ]) {
    assert.ok(spec.includes(expected), `missing worker cadence row: ${expected}`);
  }

  assert.match(spec, /API startup, Vite startup[\s\S]*are not sufficient to claim the PhotoFrame app is running/);
});

test('OpenSpec requires singleton, duplicate-skip, cross-worker independence, and stale-lock recovery', () => {
  const spec = read(openSpecPath);

  for (const required of [
    'same-worker singleton behavior',
    'Duplicate invocations of the same worker skip safely',
    'Different worker types do not block each other',
    'Stale locks from dirty shutdown, reboot, or restored power',
    'cross-worker independence evidence',
    'stale-lock reclaim',
  ]) {
    assert.match(spec, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('proof plan covers all three workers and future proof artifact fields', () => {
  const proofPlan = read(proofPlanPath);

  for (const worker of ['regular_stage_worker', 'playback_worker', 'screen_on_off_worker']) {
    assert.match(proofPlan, new RegExp(worker, 'g'));
  }

  for (const requiredField of [
    'cron_evidence',
    'worker_lanes',
    'same_worker_singleton_evidence',
    'cross_worker_independence_evidence',
    'stale_lock_reclaim_evidence',
    'reboot_recovery_evidence',
    'power_loss_recovery_evidence',
  ]) {
    assert.match(proofPlan, new RegExp(requiredField));
  }
});

test('v0.8.44 docs preserve non-claims for runtime cron, reboot, power loss, and real providers', () => {
  const combined = [
    read(openSpecPath),
    read(proofPlanPath),
    read('docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md'),
    read('docs/proofs/README.md'),
    read('docs/DOC_FRESHNESS_MATRIX.md'),
  ].join('\n---\n');

  for (const nonClaim of [
    'does not prove runtime cron behavior',
    'does not prove Raspberry cron',
    'physical power-loss recovery',
    'monitor-pixel',
    'production iCloud continuation',
    'real provider',
    'Windows Task Scheduler',
  ]) {
    assert.match(combined, new RegExp(nonClaim, 'i'));
  }
});

test('documentation indexes expose the Raspberry cron worker runtime OpenSpec and proof plan', () => {
  for (const path of [
    'README.md',
    'HOW_TO_RUN.md',
    'CHANGELOG.md',
    'docs/table_of_contents.md',
    'docs/DOC_INDEX.md',
    'docs/DOC_FRESHNESS_MATRIX.md',
    'docs/20_architecture_and_specs/README.md',
    'docs/20_architecture_and_specs/openspec/README.md',
    'docs/proofs/README.md',
  ]) {
    const text = read(path);
    assert.match(text, /raspberry_cron_worker_runtime_openspec\.md|raspberry_cron_worker_singleton_recovery_proof\.md/);
  }
});
