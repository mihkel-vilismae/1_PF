#!/usr/bin/env node
import { buildRuntimeStateCheckpoint, buildCheckpointSchemaSummary, validateRuntimeStateCheckpoint } from './runtime-state-durable-checkpoint-lib.mjs';
const checkpoint = buildRuntimeStateCheckpoint({ stage: 'geocode', cursor: 'media_asset_id:[REDACTED]', lastSuccessfulStage: 'gps_extract', queuePosition: 3, dbIntegritySummary: { status: 'counts_only', canonical_media_assets: 1 } });
const validation = validateRuntimeStateCheckpoint(checkpoint);
const result = { status: validation.status, schema: buildCheckpointSchemaSummary(), checkpoint, validation };
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASSED' ? 0 : 1);
