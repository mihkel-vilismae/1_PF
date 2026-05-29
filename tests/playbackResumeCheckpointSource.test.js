/*
 * Guards the playback resume checkpoint contract in backend and frontend source.
 * These static checks protect stale/invalid fallback and user-triggered fullscreen
 * restore without adding another long-running integration server fixture.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serverSource = readFileSync('server/index.ts', 'utf8');
const appSource = readFileSync('dashboard/app.ts', 'utf8');
const viewSource = readFileSync('dashboard/views/osPlaybackView.ts', 'utf8');
const specSource = readFileSync('docs/20_architecture_and_specs/playback_resume_checkpoint_spec.md', 'utf8');
const runbookSource = readFileSync('docs/10_runbooks/POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md', 'utf8');

test('backend checkpoint contract reports stale and invalid media safely', () => {
  assert.match(serverSource, /PLAYBACK_RESUME_CHECKPOINT_STALE_MS = 10 \* 60 \* 1000/);
  assert.match(serverSource, /status: 'stale'/);
  assert.match(serverSource, /invalid_playback_resume_checkpoint/);
  assert.match(serverSource, /mediaFoundInContract/);
});

test('frontend restore stays user-triggered for fullscreen recovery', () => {
  assert.match(appSource, /loadOsPlaybackResumeCheckpoint/);
  assert.match(appSource, /applyOsPlaybackResumeCheckpoint/);
  assert.match(viewSource, /Restore fullscreen playback/);
  assert.doesNotMatch(appSource, /requestFullscreen\(\).*loadOsPlaybackResumeCheckpoint/s);
});

test('docs cover power-outage recovery evidence and fullscreen limitation', () => {
  assert.match(specSource, /Browsers normally require a user gesture before entering fullscreen/);
  assert.match(runbookSource, /Simulated outage test/);
  assert.match(runbookSource, /Subjective assessment table/);
});
