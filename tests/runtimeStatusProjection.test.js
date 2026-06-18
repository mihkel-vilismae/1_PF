import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRuntimeStatusProjectionFromBackendPayload, buildRuntimeStatusProjectionFromState, projectionHasRuntimeSuccessClaim } from '../dashboard/services/runtimeStatusProjection.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('runtime status projection builds a read-only inactive state contract', () => {
  const state = createInitialState();
  const projection = buildRuntimeStatusProjectionFromState(state);
  assert.equal(projection.version, 1);
  assert.equal(projection.source, 'state-derived');
  assert.equal(projection.projectionStatus, 'inactive');
  assert.equal(projection.readOnly, true);
  assert.equal(projection.mutationAllowed, false);
  assert.match(projection.nonClaim, /does not start\/stop workers/);
  assert.equal(projectionHasRuntimeSuccessClaim(projection), true);
});

test('runtime status projection normalizes backend live projection without mutation authority', () => {
  const projection = buildRuntimeStatusProjectionFromBackendPayload({
    projection: {
      workerHealth: {
        'regular-stage-worker': { value: { status: 'running' } },
        'playback-worker': { value: { status: 'idle' } },
        'screen-on-off-worker': { value: { status: 'unknown' } },
      },
      playback: { isPlaying: { value: true }, queueSize: { value: 3 } },
      screen: { previewAvailable: { value: false }, fullscreenAvailable: { value: true } },
    },
  });
  assert.equal(projection.source, 'backend-live-projection');
  assert.equal(projection.projectionStatus, 'active');
  assert.equal(projection.workers.regular.status, 'Running');
  assert.equal(projection.workers.playback.status, 'Active');
  assert.equal(projection.workers.screen.status, 'Active');
  assert.equal(projection.mutationAllowed, false);
});

import { renderRunningProcessView } from '../dashboard/views/runningProcessView.ts';

test('View D renders status-backed projection without inactive simulated success', () => {
  const markup = renderRunningProcessView(createInitialState());
  assert.match(markup, /data-runtime-status-projection-source="state-derived"/);
  assert.match(markup, /data-runtime-status-projection-status="inactive"/);
  assert.match(markup, /Read-only projection/);
  assert.match(markup, /inactive state-derived truth instead of simulated success/);
  assert.doesNotMatch(markup, /Simulated runtime preview is now active/);
});
