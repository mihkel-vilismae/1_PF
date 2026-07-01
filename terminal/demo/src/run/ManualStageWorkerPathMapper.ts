// Maps start_stage_modal rows to the regular worker stage intents.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoStageIntent } from '../orchestration/PhotoFrameWorkerCommandContract.js';
import type { ManualStageId } from '../startStageModal/StartStageModalState.js';

export function mapManualStageToWorkerIntent(stageId: ManualStageId): DemoStageIntent | null {
  switch (stageId) {
    case 'index':
      return 'index';
    case 'gps_parser':
      return 'gps';
    case 'geocode':
      return 'geocode';
    case 'enqueue_playback':
      return 'queue_prepare';
    case 'download':
      return null;
  }
}
