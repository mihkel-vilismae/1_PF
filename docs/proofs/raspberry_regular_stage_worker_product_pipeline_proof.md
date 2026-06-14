# Raspberry regular_stage_worker product pipeline proof

Command:

```bash
npm run proof:raspberry-regular-stage-worker-product-pipeline
```

This proof is the v1.0 evidence gate that `regular_stage_worker` performed real product work instead of only runtime status/lock instrumentation.

To pass, provide `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE` containing JSON with all required stages set to `true`:

```json
{
  "media_source_observed": true,
  "download_or_import_completed": true,
  "index_completed": true,
  "gps_extraction_completed": true,
  "geocode_completed": true,
  "queue_prepared": true,
  "worker_status_product_work_claimed": true
}
```

This command does not itself download iCloud media or run geocoding. It is an honest gate for real worker evidence until the product pipeline runner is implemented.

## Evidence template helper

Generate a non-claiming template:

```bash
npm run proof:raspberry-regular-product-template
```

Edit the generated JSON only after a real regular_stage_worker product run, then pass it via `PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE`.
