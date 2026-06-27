#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { check, emitProof, parseArgs, proofResult } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const checks = [];
const read = (file) => readFileSync(file, 'utf8');
const index = read('server/index.ts');
const screenRoutes = read('server/routes/screenSimulationRoutes.ts');
const playbackWorker = read('server/workers/playbackWorker.ts');
const recovery = read('server/recovery/v2RecoveryStateService.ts');
const truth = read('server/v2WorkerTruthService.ts');

check(checks, 'screen-activity-endpoint', 'Screen activity endpoint exists.', screenRoutes.includes('POST /api/runtime/screen-simulation/activity'));
check(checks, 'screen-truth-events', 'Screen activity writes screen-worker truth events.', screenRoutes.includes("worker: 'screen-worker'") && screenRoutes.includes('screen_off') && screenRoutes.includes('screen_on'));
check(checks, 'source-filtering', 'Mouse/keyboard/PIR disabled-source filtering is present.', screenRoutes.includes('activity_ignored_') && screenRoutes.includes('isScreenActivitySourceEnabled'));
check(checks, 'fake-real-screen-boundary', 'Fake and guarded real screen-off flags are present.', screenRoutes.includes('fakeScreenOffMode') && screenRoutes.includes('realScreenOffGuarded'));
check(checks, 'playback-truth-events', 'Playback worker writes autonomous playback truth events.', playbackWorker.includes('media_started') && playbackWorker.includes('media_finished') && playbackWorker.includes('queue_advanced'));
check(checks, 'recovery-emulate-power-off', 'Recovery emulate power-off endpoint exists.', index.includes('POST /api/runtime/recovery/emulate-power-off'));
check(checks, 'recovery-unclean-flag', 'Recovery service writes and reads unclean shutdown flag.', recovery.includes('v2-unclean-shutdown.flag.json') && recovery.includes('readUncleanShutdownFlag'));
check(checks, 'worker-truth-api', 'Unified worker truth service supports screen/playback/regular workers.', truth.includes("'screen-worker'") && truth.includes("'playback-worker'") && truth.includes("'regular-worker'"));

const result = proofResult({
  proof: 'v2_autonomous_proof_contract',
  checks,
  evidenceMode: args.evidence,
  note: 'Static autonomous contract proof. It does not prove real Raspberry display hardware, real cron scheduling, or real iCloud media download.',
});

emitProof(result, { write: args.write || args.evidence });
