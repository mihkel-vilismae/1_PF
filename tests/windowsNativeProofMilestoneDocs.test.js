/**
 * Verifies the Windows native proof milestone documentation.
 * Keeps the v0.8.26 proof checkpoint honest and searchable.
 * Ensures passed target-machine claims and non-claims stay documented.
 * This test validates docs only; it does not run target-machine proofs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const milestonePath = 'docs/proofs/windows_native_proof_milestone_v0.8.26.md';

/** Reads the milestone document for focused documentation assertions. */
async function readMilestone() {
  return readFile(milestonePath, 'utf8');
}

test('Windows native proof milestone lists the passed target-machine proof commands', async () => {
  const text = await readMilestone();
  for (const required of [
    'start_live_windows_native_playback_proof.cmd',
    'start_live_windows_native_video_playback_proof.cmd',
    'start_live_windows_native_recovery_proof.cmd',
    'start_live_windows_scheduler_proof.cmd',
    'proof:verify-generated-test-data',
    'PASSED',
  ]) {
    assert.ok(text.includes(required), `missing milestone text: ${required}`);
  }
});

test('Windows native proof milestone keeps non-claims explicit', async () => {
  const text = await readMilestone();
  for (const nonClaim of [
    'Windows Task Scheduler',
    'Full Windows reboot recovery',
    'Raspberry playback',
    'Raspberry cron',
    'Raspberry power-loss recovery',
    'Monitor-pixel verification',
    'Production iCloud download continuation',
  ]) {
    assert.ok(text.includes(nonClaim), `missing non-claim: ${nonClaim}`);
  }
});

test('Windows native proof milestone documents local-only media tooling boundary', async () => {
  const text = await readMilestone();
  assert.match(text, /tools\/mpv\//);
  assert.match(text, /tools\/ffmpeg\//);
  assert.match(text, /local-only ignored tool bundles/);
  assert.match(text, /must not be re-added to Git/);
});
