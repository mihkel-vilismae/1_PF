#!/usr/bin/env node
import { buildGeocodeDryRunPlan } from './geocode-dry-run-from-sample-lib.mjs';
const result = buildGeocodeDryRunPlan({ providerId: process.env.PF_GEOCODE_DRY_RUN_PROVIDER ?? 'nominatim_osm' });
console.log(JSON.stringify(result, null, 2));
process.exit(result.proof_status === 'FAILED' ? 1 : 0);
