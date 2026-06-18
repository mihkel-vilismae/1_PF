# Raspberry iCloud-first regular worker product pipeline OpenSpec

Status: active planning contract  
Introduced: v0.8.69

## Goal

Define the v1 product path for `regular_stage_worker` after the question matrix clarified that iCloud download is the first priority.

## Required stage order

1. source discovery: real iCloudPD source or explicit safe staged source;
2. download/import into staging;
3. media indexing and canonical asset creation;
4. GPS metadata extraction;
5. geocode enqueue/run using the configured provider chain;
6. slideshow queue preparation;
7. product evidence artifact written.

## Evidence shape

A regular worker product evidence artifact must include booleans for:

- `media_source_observed`;
- `download_or_import_completed`;
- `index_completed`;
- `gps_extraction_completed`;
- `geocode_completed`;
- `queue_prepared`;
- `worker_status_product_work_claimed`.

## Safety defaults

Until R2/R3 are explicitly confirmed, real DB/queue writes should be staged or guarded by an explicit flag. Proof commands must label staged/defaulted decisions as such.

## Non-claims

- Starting the worker is not product pipeline proof.
- Local/generated-media rehearsal is not real iCloud proof.
- Product evidence cannot claim real geocode unless provider proof or cached real-provider data supports it.

## Contract refinement — v0.8.162

Before real product writes are implemented, the regular worker pipeline must keep these boundaries explicit:

- source evidence must identify whether media came from real iCloudPD, an auth-checkpoint-gated provider, or an explicit staged source;
- staged writes are the default until the proof runner confirms target/provider readiness;
- product evidence must be written before any downstream playback/product success claim;
- geocode completion may be true only when real provider proof or cache-backed real-provider evidence supports it;
- queue preparation may be true only when the queue evidence names the source media and generated queue item count;
- production database/media mutation requires an explicit implementation slice and must not be implied by this contract.

## Product contract proof

`proof:regular-worker-product-contract` validates that the required stage keys, staged-write boundaries, and non-claims stay in sync between this OpenSpec and the product-pipeline proof library.
