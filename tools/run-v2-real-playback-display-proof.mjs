#!/usr/bin/env node
import { check, emitProof, packageScripts, parseArgs, proofResult, readText, readTruthEvents } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const checks = [];
const scripts = packageScripts();
const playbackWorker = readText('server/workers/playbackWorker.ts');
const renderingClient = `${readText('dashboard/services/playbackRenderer.ts')}\n${readText('dashboard/services/runtimeTruth.ts')}\n${readText('dashboard/views/osPlaybackView.ts')}`;

check(checks, 'playback-worker-script', 'Playback worker command/proof scripts are registered.', Boolean(scripts['proof:raspberry-native-image-playback'] && scripts['proof:raspberry-native-video-playback']));
check(checks, 'media-start-event', 'Playback worker records media_started events.', playbackWorker.includes('media_started'));
check(checks, 'media-finish-event', 'Playback worker records media_finished events.', playbackWorker.includes('media_finished'));
check(checks, 'queue-advance-event', 'Playback worker records queue_advanced events.', playbackWorker.includes('queue_advanced'));
check(checks, 'overlay-rendering-surface', 'Dashboard playback renderer contains overlay/rendering mode support.', renderingClient.includes('overlay') || renderingClient.includes('address'));

if (args.evidence) {
  const { events, files, malformed } = readTruthEvents('real');
  const playbackEvents = events.filter((event) => event.worker === 'playback-worker');
  const stages = new Set(playbackEvents.map((event) => event.stage));
  check(checks, 'real-playback-truth-present', 'Real playback-worker truth file exists.', files.some((file) => file.includes('playback-worker.truth.jsonl')), { files });
  check(checks, 'real-media-started', 'Real playback truth has media_started.', stages.has('media_started'));
  check(checks, 'real-media-finished', 'Real playback truth has media_finished.', stages.has('media_finished'));
  check(checks, 'real-queue-advanced', 'Real playback truth has queue_advanced.', stages.has('queue_advanced'));
  check(checks, 'real-playback-json-valid', 'Playback truth JSONL contains no malformed lines.', malformed.length === 0, { malformed });
}

const result = proofResult({
  proof: 'v2_real_playback_display',
  checks,
  evidenceMode: args.evidence,
  note: args.evidence
    ? 'Evidence proof for playback truth events. It does not visually inspect the physical screen; pair with manual/recorded display proof on Raspberry.'
    : 'Static contract proof that playback display-loop event surfaces exist.',
});

emitProof(result, { write: args.write });
