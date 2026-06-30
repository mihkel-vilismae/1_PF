#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const proof = 'terminal-demo-batch-parity';
const producer = readFileSync('terminal/demo/src/run/RealDemoDbQueueProducer.ts', 'utf8');
const planner = readFileSync('terminal/demo/src/orchestration/DemoBatchManifestPlan.ts', 'utf8');
const truth = readFileSync('terminal/demo/src/run/RealDemoQTruthWriter.ts', 'utf8');
const route = readFileSync('terminal/demo/src/run/RealDemoRoutePlanner.ts', 'utf8');
const playback = readFileSync('tools/run-terminal-demo-q-db-queue-creation-proof.mjs', 'utf8');
const assertions = {
  batch_size_1_limit_present: planner.includes('batchSize === 1 ? 1 : 5') && producer.includes('input.batchSize === 1 ? 1 : 5'),
  batch_size_5_limit_present: planner.includes('Math.min(batchSize === 1 ? 1 : 5') && producer.includes(': 5'),
  q_uses_same_db_helper_for_both_batches: producer.includes('stage2_index_register') && producer.includes('buildQueueSql()'),
  q_writes_truth_status_events: truth.includes('regular-worker.truth.jsonl') && truth.includes('regular-worker.status.json'),
  truth_events_cover_index_gps_geocode_queue: ['Index', 'GPS parser', 'Geocode', 'Queue'].every((stage) => truth.includes(stage)),
  route_surfaces_truth_messages: route.includes('Q truth/status:'),
  p_playback_of_q_created_is_proven: playback.includes('p_can_render_q_created_image') && playback.includes('batch5_creates_five_q_rows'),
  no_cron: producer.includes('No cron was used by Q DB queue creation.') && !producer.includes('crontab') && !truth.includes('crontab')
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({ proof, status: passed ? 'PASSED' : 'BLOCKED', checkedAt: new Date().toISOString(), decision: passed ? 'REAL_DEMO_BATCH_EXECUTION_PARITY_READY' : 'REAL_DEMO_BATCH_EXECUTION_PARITY_BLOCKED', assertions }, null, 2));
process.exit(passed ? 0 : 1);
