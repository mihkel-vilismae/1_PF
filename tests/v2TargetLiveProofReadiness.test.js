import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('target live proof readiness manifest keeps B12 victory claim blocked until hardware evidence exists', () => {
  const output = execFileSync(process.execPath, ['tools/run-v2-target-live-proof-readiness.mjs'], {
    encoding: 'utf8',
  });
  const manifest = JSON.parse(output);
  const version = readFileSync('VERSION', 'utf8').trim();

  assert.equal(manifest.checkpointVersion, version);
  assert.equal(manifest.status, 'target_proof_pending');
  assert.equal(manifest.liveVictoryClaimAllowed, false);
  assert.ok(manifest.note.includes('does not claim live proof passed'));

  const groups = Object.fromEntries(manifest.groups.map((group) => [group.id, group]));
  for (const id of ['autonomous_playback', 'autonomous_recovery', 'pir_hardware']) {
    assert.equal(groups[id].status, 'target_run_required');
    assert.equal(groups[id].livePassed, false);
    assert.ok(groups[id].requiredEvidence.length >= 4);
  }

  assert.ok(groups.autonomous_playback.scriptsStatus.every((item) => item.present));
  assert.ok(groups.autonomous_recovery.scriptsStatus.every((item) => item.present));
  assert.ok(groups.pir_hardware.scriptsStatus.every((item) => item.present));
  assert.ok(manifest.blockers.some((blocker) => blocker.includes('target-machine evidence not attached')));
});
