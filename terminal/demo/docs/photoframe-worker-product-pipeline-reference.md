# PhotoFrame worker product pipeline quick reference

Generated: 2026-06-29
Status: reference/cache note for terminal Demo Mode merge work.
Authority: code/tests/current evidence are stronger than this summary.

## Purpose

This file preserves the small product-worker reference that was attached during the terminal Demo Mode merge.
Use it as a quick index so agents do not repeatedly open several larger worker/proof files unless the task actually touches that area.

## Historical reference point

| Field | Value |
|---|---|
| Historical version | `0.10.20` |
| Historical commit | `5a859f9` |
| Commit label | `feat(worker): add product-capable regular stage pipeline` |
| Current merge context | Terminal Demo Mode merge on top of PhotoFrame `0.10.93+` |

## Product-capable regular worker behavior summary

The product-capable regular worker path was introduced to consume a configured safe manifest, or derive a readiness-approved manifest from passed real-download continuation proof evidence, then select display-eligible media and write display queue output.

The durable runtime status is the preferred authority for product-work confirmation.
The attached reference specifically called out these fields:

```text
implementationStatus = product_manifest_to_display_queue_v1
productWork.claimed = true
```

## Files to open only when needed

Open these files when the task directly touches regular worker product output, display queue output, product evidence, or related proof contracts:

```text
server/workers/regularStageProductWorker.ts
tools/regular-worker-product-evidence-producer-lib.mjs
tools/regular-worker-product-evidence-lib.mjs
docs/proofs/*
tests/regularStageProductWorker.test.ts
tests/regularWorkerProductContract.test.js
tests/regularWorkerProductEvidenceTemplate.test.js
```

Do not read these files by default during unrelated terminal UI, layout, mock-adapter, or read-only media/truth discovery work.

## Validation remembered from the attached reference

```text
tests/regularStageProductWorker.test.ts: 2/2 passed
proof:regular-worker-product-contract: 2/2 passed
proof:regular-worker-product-evidence-template: 4/4 passed
regular_worker_product_evidence_producer: PASSED
raspberry_regular_stage_worker_product_pipeline: PASSED
```

These results are historical context, not proof of a newer release unless rerun against the current version and HEAD.

## Relevance to terminal Demo Mode

For terminal Demo Mode, this reference matters when implementing real Q/W execution and queue preparation.
Until then, Groups 1, 2, 4, and 3A remain read-only or dry-run only:

```text
no worker execution
no manifest writes
no DB writes
no truth JSONL writes
no queue writes
no cron
```

When Group 3B begins real worker execution, use this reference as a pointer to the regular worker product path, then inspect the current files directly before implementing.
